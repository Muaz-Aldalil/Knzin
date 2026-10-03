<?php

namespace App\Services;

use App\Exceptions\AdminStateConflictException;
use App\Exceptions\CoPrizeApprovalsIncompleteException;
use App\Models\AffiliateLedgerEntry;
use App\Models\ReferralAttribution;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;
use App\Services\Admin\AdminAuditWriter;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class AffiliateCoPrizeService implements AffiliateCoPrizeServiceInterface
{
    public function __construct(
        protected CoPrizeApprovalProviderInterface $approvalProvider,
        protected ?AdminAuditWriter $auditWriter = null
    ) {
        $this->auditWriter = $auditWriter ?? app(AdminAuditWriter::class);
    }

    /**
     * Resolve winning ticket attribution and award 40% co-prize to referrer in pending status (Option C).
     */
    public function awardCoPrize(
        string $winningTicketSerial,
        int $prizeValuationUsdCents,
        ?string $winnerId = null,
        ?string $drawId = null
    ): ?AffiliateLedgerEntry {
        return DB::transaction(function () use ($winningTicketSerial, $prizeValuationUsdCents) {
            $ticket = Ticket::where('serial_number', $winningTicketSerial)->first();
            if ($ticket === null) {
                return null;
            }

            // Check if originating order was referred
            $attribution = ReferralAttribution::where('order_id', $ticket->order_id)->first();
            if ($attribution === null) {
                return null;
            }

            $idempotencyKey = "co_prize_ticket_{$winningTicketSerial}";

            // Idempotency check
            $existing = AffiliateLedgerEntry::where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            $coPrizeRateBps = (int) config('knzin.affiliate.co_prize_rate_bps', 4000);
            $coPrizeCents = intdiv($prizeValuationUsdCents * $coPrizeRateBps, 10000);

            if ($coPrizeCents <= 0) {
                return null;
            }

            return AffiliateLedgerEntry::create([
                'user_id' => $attribution->referrer_user_id,
                'order_id' => $ticket->order_id,
                'payout_id' => null,
                'entry_type' => 'co_prize_credit',
                'amount_cents' => $coPrizeCents,
                'currency' => 'USD',
                'status' => 'pending',
                'funding_source' => 'marketing_pool',
                'metadata' => [
                    'winning_ticket_serial' => $winningTicketSerial,
                    'grand_prize_valuation_cents' => $prizeValuationUsdCents,
                    'co_prize_rate_bps' => $coPrizeRateBps,
                    'co_prize_cents' => $coPrizeCents,
                    'funding_source' => 'marketing_pool',
                    'winner_deduction_cents' => 0,
                ],
                'matures_at' => null, // Held under Option C until trusted KYC & Draw Audit approval
                'idempotency_key' => $idempotencyKey,
            ]);
        });
    }

    /**
     * Release pending 40% co-prize to available status strictly upon validating trusted KYC and draw audit approvals.
     */
    public function releaseCoPrize(
        string $winningTicketSerial,
        ?string $actorId = null
    ): ?AffiliateLedgerEntry {
        return DB::transaction(function () use ($winningTicketSerial) {
            $idempotencyKey = "co_prize_ticket_{$winningTicketSerial}";
            $entry = AffiliateLedgerEntry::where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($entry === null) {
                return null;
            }

            // Idempotent: already available
            if ($entry->status === 'available') {
                return $entry;
            }

            // Cannot release if already cancelled or cleared
            if ($entry->status !== 'pending') {
                return $entry;
            }

            // Retrieve trusted approval state through explicit integration contract
            $approvalState = $this->approvalProvider->getApprovalState($winningTicketSerial);

            // Invariant: KYC approval must be fresh AND Draw Integrity audit must be fresh
            if (!$approvalState->isFullyApproved()) {
                // Approval incomplete, missing, or revoked - strictly remain in pending hold
                return $entry;
            }

            // Both approvals verified through authoritative integration provider
            $entry->status = 'available';
            $entry->save();

            return $entry;
        });
    }

    /**
     * Adjudicate release of pending co-prize by an authorized admin checking dual valid approvals and auditing.
     */
    public function adjudicateCoPrizeRelease(
        string $winningTicketSerial,
        User $adminUser,
        ?AdminAuditContext $auditContext = null
    ): ?AffiliateLedgerEntry {
        if (!$adminUser->hasCapability('adjudicate_affiliate_coprize')) {
            throw new AuthorizationException("User [{$adminUser->id}] lacks required capability 'adjudicate_affiliate_coprize'.");
        }

        return DB::transaction(function () use ($winningTicketSerial, $auditContext) {
            $idempotencyKey = "co_prize_ticket_{$winningTicketSerial}";
            $entry = AffiliateLedgerEntry::where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($entry === null) {
                throw new AdminStateConflictException("Co-prize credit for ticket '{$winningTicketSerial}' not found.");
            }

            // Idempotent replay: already available
            if ($entry->status === 'available') {
                return $entry;
            }

            if ($entry->status !== 'pending') {
                throw new AdminStateConflictException("Cannot release co-prize with status '{$entry->status}'.");
            }

            $approvalState = $this->approvalProvider->getApprovalState($winningTicketSerial);

            if (!$approvalState->isFullyApproved()) {
                throw new CoPrizeApprovalsIncompleteException(
                    message: "Dual approvals incomplete for co-prize release on ticket '{$winningTicketSerial}'.",
                    data: [
                        'kyc' => [
                            'status' => $approvalState->kyc->status,
                            'approval_id' => $approvalState->kyc->approvalId,
                            'is_approved' => $approvalState->kyc->isApproved(),
                        ],
                        'draw_integrity' => [
                            'status' => $approvalState->drawIntegrity->status,
                            'approval_id' => $approvalState->drawIntegrity->approvalId,
                            'is_approved' => $approvalState->drawIntegrity->isApproved(),
                        ],
                        'draw_winner_exists' => $approvalState->drawWinnerExists,
                    ]
                );
            }

            $entry->status = 'available';
            $entry->save();

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'coprize.released',
                    targetType: 'ticket',
                    targetId: $winningTicketSerial,
                    outcome: 'success',
                    beforeState: ['status' => 'pending'],
                    afterState: [
                        'status' => 'available',
                        'kyc_approval_id' => $approvalState->kyc->approvalId,
                        'draw_integrity_approval_id' => $approvalState->drawIntegrity->approvalId,
                    ]
                );
            }

            return $entry->fresh();
        });
    }

    /**
     * Cancel pending co-prize if winner fails identity verification or is disqualified.
     */
    public function cancelCoPrize(
        string $winningTicketSerial,
        string $reason,
        ?string $actorId = null
    ): ?AffiliateLedgerEntry {
        return DB::transaction(function () use ($winningTicketSerial) {
            $idempotencyKey = "co_prize_ticket_{$winningTicketSerial}";
            $entry = AffiliateLedgerEntry::where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($entry !== null && $entry->status === 'pending') {
                $entry->status = 'cancelled';
                $entry->save();
            }

            return $entry;
        });
    }

    /**
     * Adjudicate a post-release approval revocation with an authorized Admin creating a compensating reversal.
     * Preserves original financial ledger entry untouched.
     *
     * @throws AuthorizationException if adminUser lacks capability
     */
    public function adjudicateCoPrizeRevocation(
        string $winningTicketSerial,
        string $reason,
        User $adminUser,
        ?AdminAuditContext $auditContext = null
    ): ?AffiliateLedgerEntry {
        if (!$adminUser->hasCapability('adjudicate_affiliate_coprize')) {
            throw new AuthorizationException("User [{$adminUser->id}] lacks required capability 'adjudicate_affiliate_coprize' to adjudicate co-prize reversals.");
        }

        return DB::transaction(function () use ($winningTicketSerial, $reason, $adminUser, $auditContext) {
            $idempotencyKey = "co_prize_ticket_{$winningTicketSerial}";
            $originalEntry = AffiliateLedgerEntry::where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($originalEntry === null) {
                throw new AdminStateConflictException("Co-prize credit for ticket '{$winningTicketSerial}' not found.");
            }

            if ($originalEntry->status !== 'available') {
                throw new AdminStateConflictException(
                    "Co-prize revocation is post-release only. Current status is '{$originalEntry->status}', expected 'available'."
                );
            }

            $reversalKey = "co_prize_reversal_{$winningTicketSerial}";
            $existingReversal = AffiliateLedgerEntry::where('idempotency_key', $reversalKey)
                ->lockForUpdate()
                ->first();

            if ($existingReversal !== null) {
                return $existingReversal; // Idempotent
            }

            // Compensating reversal debit preserving original entry intact
            $reversal = AffiliateLedgerEntry::create([
                'user_id' => $originalEntry->user_id,
                'order_id' => $originalEntry->order_id,
                'payout_id' => null,
                'entry_type' => 'reversal_debit',
                'amount_cents' => -abs($originalEntry->amount_cents),
                'currency' => 'USD',
                'status' => 'cleared',
                'funding_source' => 'marketing_pool',
                'metadata' => [
                    'reversal_reason' => $reason,
                    'adjudicated_by_user_id' => $adminUser->id,
                    'original_entry_id' => $originalEntry->id,
                    'funding_source' => 'marketing_pool',
                ],
                'matures_at' => null,
                'idempotency_key' => $reversalKey,
            ]);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'coprize.revoked',
                    targetType: 'ticket',
                    targetId: $winningTicketSerial,
                    outcome: 'success',
                    reasonCode: 'approval_revoked',
                    justification: $reason,
                    beforeState: ['original_entry_status' => $originalEntry->status],
                    afterState: [
                        'reversal_entry_id' => $reversal->id,
                        'reversal_amount_cents' => $reversal->amount_cents,
                    ]
                );
            }

            return $reversal;
        });
    }

    /**
     * Calculate unclamped exposure and net projection for co-prize revocation preview.
     */
    public function previewRevocation(string $winningTicketSerial): ?array
    {
        $idempotencyKey = "co_prize_ticket_{$winningTicketSerial}";
        $entry = AffiliateLedgerEntry::where('idempotency_key', $idempotencyKey)->first();

        if ($entry === null) {
            return null;
        }

        $userId = $entry->user_id;
        $originalAmountCents = abs($entry->amount_cents);

        // Compute current mature available balance (unclamped projection)
        $currentAvailableUnclamped = (int) AffiliateLedgerEntry::where('user_id', $userId)
            ->matureAvailable()
            ->sum('amount_cents');

        $netAfterReversal = $currentAvailableUnclamped - $originalAmountCents;
        $withdrawnExposure = max(0, -$netAfterReversal);

        return [
            'winning_ticket_serial' => $winningTicketSerial,
            'referrer_user_id' => $userId,
            'original_amount_cents' => $originalAmountCents,
            'current_available_cents' => max(0, $currentAvailableUnclamped),
            'net_after_reversal' => $netAfterReversal,
            'withdrawn_exposure' => $withdrawnExposure,
        ];
    }
}
