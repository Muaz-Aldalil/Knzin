<?php

namespace App\Services;

use App\Models\AffiliateLedgerEntry;
use App\Models\User;

interface AffiliateCoPrizeServiceInterface
{
    /**
     * Resolve winning ticket attribution and award 40% co-prize to referrer in pending status (Option C).
     */
    public function awardCoPrize(
        string $winningTicketSerial,
        int $prizeValuationUsdCents,
        ?string $winnerId = null,
        ?string $drawId = null
    ): ?AffiliateLedgerEntry;

    /**
     * Release pending 40% co-prize to available status strictly upon validating trusted KYC and draw audit approvals.
     */
    public function releaseCoPrize(
        string $winningTicketSerial,
        ?string $actorId = null
    ): ?AffiliateLedgerEntry;

    /**
     * Cancel pending co-prize if winner fails identity verification or is disqualified before release.
     */
    public function cancelCoPrize(
        string $winningTicketSerial,
        string $reason,
        ?string $actorId = null
    ): ?AffiliateLedgerEntry;

    /**
     * Adjudicate a post-release approval revocation with an authorized Admin creating a compensating reversal.
     */
    public function adjudicateCoPrizeRevocation(
        string $winningTicketSerial,
        string $reason,
        User $adminUser
    ): ?AffiliateLedgerEntry;
}
