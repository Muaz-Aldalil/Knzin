<?php

namespace App\Services;

use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountMergeService
{
    /**
     * Merge unverified guest accounts with the same email into a verified Google account.
     * Re-attributes all guest orders and lesson progress to the surviving Google user,
     * revokes active guest tokens, and deactivates the guest user.
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
            $guestUsers = User::where('email', $googleUser->email)
                ->where('auth_provider', 'guest')
                ->where('status', 'active')
                ->where('id', '!=', $googleUser->id)
                ->get();

            $totalMergedOrders = 0;
            $totalDeactivatedGuests = 0;

            foreach ($guestUsers as $guestUser) {
                // 1. Re-attribute all orders placed by this guest user to the verified Google account
                $mergedOrders = Order::where('user_id', $guestUser->id)
                    ->update(['user_id' => $googleUser->id]);

                $totalMergedOrders += $mergedOrders;

                // 2. Re-attribute and merge lesson progress (DEF-02D)
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

                // 3. Revoke guest session tokens to eliminate zombie sessions (DEF-02C)
                $guestUser->tokens()->delete();

                // 4. Deactivate guest user record with audit pointer
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
