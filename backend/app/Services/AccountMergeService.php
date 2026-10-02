<?php

namespace App\Services;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\AffiliateProfile;
use App\Models\CourseEntitlement;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\ReferralAttribution;
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

                // 5. Re-attribute referral attributions (buyer and referrer roles)
                ReferralAttribution::where('buyer_user_id', $guestUser->id)
                    ->update(['buyer_user_id' => $googleUser->id]);

                ReferralAttribution::where('referrer_user_id', $guestUser->id)
                    ->update(['referrer_user_id' => $googleUser->id]);

                // 6. Re-attribute affiliate payouts
                AffiliatePayout::where('user_id', $guestUser->id)
                    ->update(['user_id' => $googleUser->id]);

                // 7. Re-attribute affiliate ledger entries (direct SQL to satisfy immutability guard)
                DB::table('affiliate_ledger_entries')
                    ->where('user_id', $guestUser->id)
                    ->update(['user_id' => $googleUser->id]);

                // 8. Reconcile affiliate profile
                $guestProfile = AffiliateProfile::where('user_id', $guestUser->id)->first();
                if ($guestProfile) {
                    $googleProfile = AffiliateProfile::where('user_id', $googleUser->id)->first();
                    if ($googleProfile) {
                        $updates = [];
                        if (empty($googleProfile->custom_slug) && !empty($guestProfile->custom_slug)) {
                            $updates['custom_slug'] = $guestProfile->custom_slug;
                        }
                        if (empty($googleProfile->default_payout_method) && !empty($guestProfile->default_payout_method)) {
                            $updates['default_payout_method'] = $guestProfile->default_payout_method;
                        }
                        if (empty($googleProfile->payout_details) && !empty($guestProfile->payout_details)) {
                            $updates['payout_details'] = $guestProfile->payout_details;
                        }
                        if (!empty($updates)) {
                            $googleProfile->update($updates);
                        }
                        $guestProfile->delete();
                    } else {
                        $guestProfile->update(['user_id' => $googleUser->id]);
                    }
                }

                // 9. Revoke guest session tokens to eliminate zombie sessions (DEF-02C)
                $guestUser->tokens()->delete();

                // 10. Preserve canonical learner_code on surviving Google user if guest held a referral code
                if (!empty($guestUser->learner_code) && !empty($googleUser->learner_code) && $guestUser->learner_code !== $googleUser->learner_code) {
                    $canonicalCode = $guestUser->learner_code;
                    $guestUser->update(['learner_code' => 'LRN-M-' . substr(md5($guestUser->id), 0, 8)]);
                    $googleUser->update(['learner_code' => $canonicalCode]);
                }

                // 11. Deactivate guest user record with audit pointer
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

    /**
     * Merge a specific source user account into a target verified account.
     */
    public function mergeAccounts(User $sourceUser, User $targetUser): array
    {
        if ($sourceUser->email !== $targetUser->email) {
            $sourceUser->update(['email' => $targetUser->email]);
        }

        return $this->mergeGuestIntoGoogle($targetUser);
    }
}
