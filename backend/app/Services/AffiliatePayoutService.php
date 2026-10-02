<?php

namespace App\Services;

use App\Exceptions\InsufficientAvailableBalanceException;
use App\Exceptions\PayoutThresholdUnmetException;
use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AffiliatePayoutService
{
    public function __construct(
        protected PlatformSettingsService $settingsService
    ) {}

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
     * Settle an accepted payout request into completed status with admin reference.
     */
    public function settlePayout(
        AffiliatePayout $payout,
        string $adminReferenceNumber,
        ?string $adminId = null
    ): AffiliatePayout {
        return DB::transaction(function () use ($payout, $adminReferenceNumber, $adminId) {
            $payout->markCompleted($adminReferenceNumber, $adminId);

            // Transition debit entry to cleared
            AffiliateLedgerEntry::where('payout_id', $payout->id)
                ->where('entry_type', 'payout_debit')
                ->update(['status' => 'cleared']);

            return $payout->fresh();
        });
    }

    /**
     * Reject an accepted payout and issue a compensating reversal credit without modifying history.
     */
    public function rejectPayout(
        AffiliatePayout $payout,
        string $reason,
        ?string $adminId = null
    ): AffiliatePayout {
        return DB::transaction(function () use ($payout, $reason, $adminId) {
            $payout->markRejected($reason, $adminId);

            // Append compensating reversal credit entry (positive amount to restore balance)
            AffiliateLedgerEntry::create([
                'user_id' => $payout->user_id,
                'payout_id' => $payout->id,
                'entry_type' => 'reversal_credit',
                'amount_cents' => $payout->amount_cents,
                'currency' => 'USD',
                'status' => 'available',
                'idempotency_key' => "payout_reversal_{$payout->payout_number}",
            ]);

            return $payout->fresh();
        });
    }
}
