<?php

namespace App\Services;

use App\Models\CourseEntitlement;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountMergeService
{
    /**
     * Merge unverified guest accounts with the same email into a verified Google account.
     * Re-attributes all guest orders, course entitlements, tickets, and lesson progress
     * to the surviving Google user, revokes active guest tokens, and deactivates the guest user.
     */
    public function mergeGuestIntoGoogle(User $googleUser): array
    {
        // Guard invariant: Surviving account must be a verified Google account
        if ($googleUser->auth_provider !== 'google') {
            return [
                'merged_orders_count' => 0,
                'deactivated_guests_count' => 0,
            ];
        }

        return DB::transaction(function () use ($googleUser) {
            $guestUserIds = User::where('email', $googleUser->email)
                ->where('auth_provider', 'guest')
                ->where('status', 'active')
                ->where('id', '!=', $googleUser->id)
                ->pluck('id')
                ->all();

            if (empty($guestUserIds)) {
                return [
                    'merged_orders_count' => 0,
                    'deactivated_guests_count' => 0,
                ];
            }

            // Acquire pessimistic locks in deterministic ascending ID order
            $allUserIds = array_merge([$googleUser->id], $guestUserIds);
            sort($allUserIds);
            $lockedUsers = User::whereIn('id', $allUserIds)->orderBy('id')->lockForUpdate()->get();

            $lockedGoogleUser = $lockedUsers->firstWhere('id', $googleUser->id);
            if (!$lockedGoogleUser || $lockedGoogleUser->auth_provider !== 'google') {
                return [
                    'merged_orders_count' => 0,
                    'deactivated_guests_count' => 0,
                ];
            }

            // Pessimistically lock orders for guest users in ascending ID order
            Order::whereIn('user_id', $guestUserIds)->orderBy('id')->lockForUpdate()->get();

            $totalMergedOrders = 0;
            $totalDeactivatedGuests = 0;

            $guestUsers = $lockedUsers->whereIn('id', $guestUserIds);

            foreach ($guestUsers as $guestUser) {
                // 1. Re-attribute all orders placed by this guest user to the verified Google account
                $mergedOrders = Order::where('user_id', $guestUser->id)
                    ->update(['user_id' => $googleUser->id]);
                $totalMergedOrders += $mergedOrders;

                // 2. Re-attribute tickets minted for this guest user
                Ticket::where('user_id', $guestUser->id)
                    ->update(['user_id' => $googleUser->id]);

                // 3. Reconcile course entitlements
                $guestEntitlements = CourseEntitlement::where('user_id', $guestUser->id)
                    ->where('status', 'active')
                    ->get();

                foreach ($guestEntitlements as $guestEntitlement) {
                    $googleEntitlement = CourseEntitlement::where('user_id', $googleUser->id)
                        ->where('course_id', $guestEntitlement->course_id)
                        ->where('scope_key', $guestEntitlement->scope_key)
                        ->where('status', 'active')
                        ->first();

                    if ($googleEntitlement) {
                        // Identical scope collision: guest's entitlement is superseded by Google's entitlement
                        $guestEntitlement->update([
                            'status' => 'superseded',
                            'superseded_by_entitlement_id' => $googleEntitlement->id,
                            'user_id' => $googleUser->id,
                        ]);
                    } else {
                        // Non-colliding scope: re-attribute guest entitlement to Google user
                        $guestEntitlement->update([
                            'user_id' => $googleUser->id,
                        ]);
                    }
                }

                // Re-attribute any non-active entitlements without active conflict
                CourseEntitlement::where('user_id', $guestUser->id)
                    ->where('status', '!=', 'active')
                    ->update(['user_id' => $googleUser->id]);

                // 4. Re-attribute and merge lesson progress (DEF-02D)
                $guestProgressRecords = LessonProgress::where('user_id', $guestUser->id)->get();
                foreach ($guestProgressRecords as $gp) {
                    $googleProgress = LessonProgress::where('user_id', $googleUser->id)
                        ->where('course_part_id', $gp->course_part_id)
                        ->first();

                    if (!$googleProgress) {
                        $gp->update(['user_id' => $googleUser->id]);
                    } else {
                        // Merge retaining highest watch time and completion
                        $maxWatch = max($googleProgress->watch_seconds, $gp->watch_seconds);
                        $maxPercent = max($googleProgress->percent_complete, $gp->percent_complete);
                        $isCompleted = $googleProgress->is_completed || $gp->is_completed;
                        $latestWatched = ($gp->last_watched_at && (!$googleProgress->last_watched_at || $gp->last_watched_at > $googleProgress->last_watched_at))
                            ? $gp->last_watched_at
                            : $googleProgress->last_watched_at;

                        $googleProgress->update([
                            'watch_seconds' => $maxWatch,
                            'percent_complete' => $maxPercent,
                            'is_completed' => $isCompleted,
                            'last_watched_at' => $latestWatched,
                        ]);

                        $gp->delete();
                    }
                }

                // 5. Revoke guest session tokens to eliminate zombie sessions (DEF-02C)
                $guestUser->tokens()->delete();

                // 6. Deactivate guest user record with audit pointer
                $guestUser->update([
                    'status' => 'deactivated',
                    'merged_into_user_id' => $googleUser->id,
                ]);

                $totalDeactivatedGuests++;
            }

            return [
                'merged_orders_count' => $totalMergedOrders,
                'deactivated_guests_count' => $totalDeactivatedGuests,
            ];
        });
    }
}
