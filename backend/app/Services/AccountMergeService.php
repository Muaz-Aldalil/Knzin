<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountMergeService
{
    /**
     * Merge unverified guest accounts with the same email into a verified Google account.
     * Re-attributes all guest orders to the surviving Google user and deactivates the guest user.
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
                // Re-attribute all orders placed by this guest user to the verified Google account
                $mergedOrders = Order::where('user_id', $guestUser->id)
                    ->update(['user_id' => $googleUser->id]);

                $totalMergedOrders += $mergedOrders;

                // Deactivate guest user record with audit pointer
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
