<?php

namespace App\Policies;

use App\Models\AffiliatePayout;
use App\Models\User;

class AffiliatePayoutPolicy
{
    /**
     * Determine whether the user can view any payouts.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific payout.
     */
    public function view(User $user, AffiliatePayout $payout): bool
    {
        return $user->id === $payout->user_id;
    }
}
