<?php

namespace App\Services;

use App\Models\AffiliateLedgerEntry;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;

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
     * Adjudicate release of pending co-prize by an authorized admin checking dual valid approvals and auditing.
     */
    public function adjudicateCoPrizeRelease(
        string $winningTicketSerial,
        User $adminUser,
        ?AdminAuditContext $auditContext = null
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
        User $adminUser,
        ?AdminAuditContext $auditContext = null
    ): ?AffiliateLedgerEntry;

    /**
     * Calculate unclamped exposure and net projection for co-prize revocation preview.
     */
    public function previewRevocation(string $winningTicketSerial): ?array;
}
