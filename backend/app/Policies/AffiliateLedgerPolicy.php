<?php

namespace App\Policies;

use App\Models\AffiliateLedgerEntry;
use App\Models\User;

class AffiliateLedgerPolicy
{
    /**
     * Determine whether the user can view any ledger entries.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific ledger entry.
     */
    public function view(User $user, AffiliateLedgerEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }
}
