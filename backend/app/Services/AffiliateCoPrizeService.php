<?php

namespace App\Services;

use App\Models\AffiliateLedgerEntry;
use App\Models\ReferralAttribution;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class AffiliateCoPrizeService implements AffiliateCoPrizeServiceInterface
{
    public function __construct(
        protected CoPrizeApprovalProviderInterface $approvalProvider
    ) {}

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
        User $adminUser
    ): ?AffiliateLedgerEntry {
        if (!$adminUser->hasCapability('adjudicate_affiliate_coprize')) {
            throw new AuthorizationException("User [{$adminUser->id}] lacks required capability 'adjudicate_affiliate_coprize' to adjudicate co-prize reversals.");
        }

        return DB::transaction(function () use ($winningTicketSerial, $reason, $adminUser) {
            $idempotencyKey = "co_prize_ticket_{$winningTicketSerial}";
            $originalEntry = AffiliateLedgerEntry::where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($originalEntry === null) {
                return null;
            }

            $reversalKey = "co_prize_reversal_{$winningTicketSerial}";
            $existingReversal = AffiliateLedgerEntry::where('idempotency_key', $reversalKey)
                ->lockForUpdate()
                ->first();

            if ($existingReversal !== null) {
                return $existingReversal;
            }

            // Compensating reversal debit preserving original entry intact
            return AffiliateLedgerEntry::create([
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
        });
    }
}
