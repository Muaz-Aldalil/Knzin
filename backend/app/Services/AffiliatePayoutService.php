<?php

namespace App\Services;

use App\Exceptions\InsufficientAvailableBalanceException;
use App\Exceptions\PayoutStateConflictException;
use App\Exceptions\PayoutThresholdUnmetException;
use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;
use App\Services\Admin\AdminAuditWriter;
use Illuminate\Support\Facades\DB;

class AffiliatePayoutService
{
    public function __construct(
        protected PlatformSettingsService $settingsService,
        protected ?AdminAuditWriter $auditWriter = null
    ) {
        $this->auditWriter = $auditWriter ?? app(AdminAuditWriter::class);
    }

    /**
     * Calculate current mature available balance in integer cents.
     */
    public function calculateAvailableBalance(string $userId): int
    {
        $sum = AffiliateLedgerEntry::where('user_id', $userId)
            ->matureAvailable()
            ->sum('amount_cents');

        return max(0, (int) $sum);
    }

    /**
     * Calculate current pending maturation/KYC balance in integer cents.
     */
    public function calculatePendingBalance(string $userId): int
    {
        $sum = AffiliateLedgerEntry::where('user_id', $userId)
            ->pendingHold()
            ->whereIn('entry_type', ['sales_commission', 'co_prize_credit'])
            ->sum('amount_cents');

        return max(0, (int) $sum);
    }

    /**
     * Calculate lifetime earned commissions and co-prizes in integer cents without sweeping.
     */
    public function calculateLifetimeEarned(string $userId): int
    {
        $sum = AffiliateLedgerEntry::where('user_id', $userId)
            ->whereIn('entry_type', ['sales_commission', 'co_prize_credit'])
            ->sum('amount_cents');

        return max(0, (int) $sum);
    }

    /**
     * Calculate net ledger balance across all entries in integer cents.
     */
    public function calculateLedgerNet(string $userId): int
    {
        return (int) AffiliateLedgerEntry::where('user_id', $userId)->sum('amount_cents');
    }

    /**
     * Request a payout withdrawal with atomic balance locking and dynamic threshold snapshotting.
     *
     * @throws PayoutThresholdUnmetException
     * @throws InsufficientAvailableBalanceException
     */
    public function requestPayout(
        User $user,
        int $amountCents,
        string $payoutMethod,
        array $recipientDetails
    ): AffiliatePayout {
        return DB::transaction(function () use ($user, $amountCents, $payoutMethod, $recipientDetails) {
            // 1. Lock user row to serialize concurrent payout requests and prevent double-spending
            User::where('id', $user->id)->lockForUpdate()->first();

            // 2. Compute live available and pending balances
            $availableCents = $this->calculateAvailableBalance($user->id);
            $pendingCents = $this->calculatePendingBalance($user->id);

            // 3. Resolve current active Admin threshold at this exact moment
            $activeThresholdCents = (int) $this->settingsService->get('affiliate.payout_min_cents', 5000);

            // 4. Invariant: Available balance must meet or exceed the active Admin threshold
            if ($availableCents < $activeThresholdCents) {
                throw new PayoutThresholdUnmetException(
                    requestedAmountCents: $amountCents,
                    minimumThresholdCents: $activeThresholdCents,
                    availableBalanceCents: $availableCents
                );
            }

            // 5. Invariant: Requested amount must be positive and not exceed available balance
            if ($amountCents <= 0 || $amountCents > $availableCents) {
                throw new InsufficientAvailableBalanceException(
                    requestedAmountCents: $amountCents,
                    availableBalanceCents: $availableCents,
                    pendingBalanceCents: $pendingCents
                );
            }

            // 6. Generate unique payout reference number
            $payoutNumber = 'KNZ-PAY-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));

            // 7. Calculate IQD equivalent using integer math (configurable via platform settings, default 1310 IQD per USD)
            $iqdRate = (int) $this->settingsService->get('platform.iqd_exchange_rate', 1310);
            $amountIqd = intdiv($amountCents * $iqdRate, 100);

            // 8. Create immutable AffiliatePayout record with snapshotted threshold
            $payout = AffiliatePayout::create([
                'payout_number' => $payoutNumber,
                'user_id' => $user->id,
                'amount_cents' => $amountCents,
                'threshold_cents_at_request' => $activeThresholdCents,
                'amount_iqd' => $amountIqd,
                'payout_method' => $payoutMethod,
                'recipient_details' => $recipientDetails,
                'status' => 'requested',
            ]);

            // 9. Debit ledger atomically with negative amount
            AffiliateLedgerEntry::create([
                'user_id' => $user->id,
                'payout_id' => $payout->id,
                'entry_type' => 'payout_debit',
                'amount_cents' => -$amountCents,
                'currency' => 'USD',
                'status' => 'available',
                'idempotency_key' => "payout_debit_{$payout->payout_number}",
            ]);

            return $payout;
        });
    }

    /**
     * Settle an accepted payout request into completed status with admin reference, receipt evidence, and audit.
     */
    public function settlePayout(
        AffiliatePayout $payout,
        string $adminReferenceNumber,
        ?string $adminId = null,
        ?string $adminNotes = null,
        ?string $receiptPath = null,
        ?string $receiptSha256 = null,
        ?AdminAuditContext $auditContext = null
    ): AffiliatePayout {
        return DB::transaction(function () use (
            $payout,
            $adminReferenceNumber,
            $adminId,
            $adminNotes,
            $receiptPath,
            $receiptSha256,
            $auditContext
        ) {
            $locked = AffiliatePayout::where('id', $payout->id)->lockForUpdate()->firstOrFail();

            // Anti-self-settlement guard
            if ($adminId && $locked->user_id === $adminId) {
                abort(response()->json([
                    'status' => 'fail',
                    'code' => 'ERR_SELF_SETTLEMENT_FORBIDDEN',
                    'message' => 'Administrators cannot settle their own payouts.',
                ], 403));
            }

            if ($locked->status === 'completed') {
                if ($locked->admin_reference_number === $adminReferenceNumber) {
                    return $locked; // Idempotent replay
                }
                throw new PayoutStateConflictException(
                    "Payout has already been settled with reference '{$locked->admin_reference_number}'."
                );
            }

            if ($locked->status === 'rejected') {
                throw new PayoutStateConflictException('Cannot settle an already rejected payout.');
            }

            if (!in_array($locked->status, ['requested', 'processing'], true)) {
                throw new PayoutStateConflictException("Invalid payout status for settlement: '{$locked->status}'.");
            }

            $beforeStatus = $locked->status;
            $ok = $locked->markCompleted($adminReferenceNumber, $adminId, $adminNotes, $receiptPath, $receiptSha256);
            if (!$ok) {
                throw new PayoutStateConflictException('Failed to transition payout to completed.');
            }

            // Transition debit entry to cleared (exactly 1 row)
            $rowsUpdated = AffiliateLedgerEntry::where('payout_id', $locked->id)
                ->where('entry_type', 'payout_debit')
                ->where('status', 'available')
                ->update(['status' => 'cleared']);

            if ($rowsUpdated !== 1) {
                throw new PayoutStateConflictException(
                    "Integrity violation: expected exactly 1 available payout_debit row, updated {$rowsUpdated}."
                );
            }

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'payout.settled',
                    targetType: 'payout',
                    targetId: $locked->payout_number,
                    outcome: 'success',
                    beforeState: ['status' => $beforeStatus],
                    afterState: [
                        'status' => 'completed',
                        'admin_reference_number' => $adminReferenceNumber,
                        'receipt_sha256' => $receiptSha256,
                    ]
                );
            }

            return $locked->fresh();
        });
    }

    /**
     * Reject an accepted payout and issue a compensating reversal credit without modifying history.
     */
    public function rejectPayout(
        AffiliatePayout $payout,
        string $reason,
        ?string $adminId = null,
        ?AdminAuditContext $auditContext = null
    ): AffiliatePayout {
        return DB::transaction(function () use ($payout, $reason, $adminId, $auditContext) {
            $locked = AffiliatePayout::where('id', $payout->id)->lockForUpdate()->firstOrFail();

            // Anti-self-settlement guard
            if ($adminId && $locked->user_id === $adminId) {
                abort(response()->json([
                    'status' => 'fail',
                    'code' => 'ERR_SELF_SETTLEMENT_FORBIDDEN',
                    'message' => 'Administrators cannot reject their own payouts.',
                ], 403));
            }

            if ($locked->status === 'rejected') {
                return $locked; // Idempotent replay
            }

            if ($locked->status === 'completed') {
                throw new PayoutStateConflictException('Cannot reject an already completed payout.');
            }

            if (!in_array($locked->status, ['requested', 'processing'], true)) {
                throw new PayoutStateConflictException("Invalid payout status for rejection: '{$locked->status}'.");
            }

            $beforeStatus = $locked->status;
            $ok = $locked->markRejected($reason, $adminId);
            if (!$ok) {
                throw new PayoutStateConflictException('Failed to transition payout to rejected.');
            }

            // Append compensating reversal credit entry (positive amount to restore balance)
            AffiliateLedgerEntry::create([
                'user_id' => $locked->user_id,
                'payout_id' => $locked->id,
                'entry_type' => 'reversal_credit',
                'amount_cents' => $locked->amount_cents,
                'currency' => 'USD',
                'status' => 'available',
                'idempotency_key' => "payout_reversal_{$locked->payout_number}",
            ]);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'payout.rejected',
                    targetType: 'payout',
                    targetId: $locked->payout_number,
                    outcome: 'success',
                    reasonCode: 'administrative_rejection',
                    justification: $reason,
                    beforeState: ['status' => $beforeStatus],
                    afterState: [
                        'status' => 'rejected',
                        'rejection_reason' => $reason,
                    ]
                );
            }

            return $locked->fresh();
        });
    }
}
