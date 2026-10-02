<?php

namespace App\Services;

use App\Models\AffiliateLedgerEntry;
use App\Models\Order;
use App\Models\ReferralAttribution;
use Illuminate\Support\Facades\DB;

class AffiliateCommissionService
{
    /**
     * Pure integer cents commission arithmetic.
     */
    public function calculateCommission(int $totalAmountCents, ?int $rateBps = null): int
    {
        $rate = $rateBps ?? (int) config('knzin.affiliate.commission_rate_bps', 2500);
        return intdiv($totalAmountCents * $rate, 10000);
    }

    /**
     * Credit sales commission into the append-only ledger for an authoritative order.
     */
    public function creditSalesCommission(Order $order): ?AffiliateLedgerEntry
    {
        return DB::transaction(function () use ($order) {
            // Check if this order has an active referral attribution
            $attribution = ReferralAttribution::where('order_id', $order->id)->first();
            if ($attribution === null) {
                return null;
            }

            // Check if commission already minted (idempotency guard)
            $existing = AffiliateLedgerEntry::where('order_id', $order->id)
                ->where('entry_type', 'sales_commission')
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            $commissionCents = $this->calculateCommission(
                $order->total_amount_cents,
                $attribution->commission_rate_bps
            );

            if ($commissionCents <= 0) {
                return null;
            }

            $maturationHours = (int) config('knzin.affiliate.maturation_hours', 24);

            return AffiliateLedgerEntry::create([
                'user_id' => $attribution->referrer_user_id,
                'order_id' => $order->id,
                'payout_id' => null,
                'entry_type' => 'sales_commission',
                'amount_cents' => $commissionCents,
                'currency' => 'USD',
                'status' => 'pending',
                'matures_at' => now()->addHours($maturationHours),
                'idempotency_key' => "order_commission_{$order->id}",
            ]);
        });
    }

    /**
     * Create compensating reversal debit ledger entry for a refunded or disputed order.
     */
    public function reverseCommission(Order $order, string $reason): ?AffiliateLedgerEntry
    {
        return DB::transaction(function () use ($order) {
            $original = AffiliateLedgerEntry::where('order_id', $order->id)
                ->where('entry_type', 'sales_commission')
                ->lockForUpdate()
                ->first();

            if ($original === null) {
                return null;
            }

            // Check if already reversed
            $existingReversal = AffiliateLedgerEntry::where('order_id', $order->id)
                ->where('entry_type', 'reversal_debit')
                ->lockForUpdate()
                ->first();

            if ($existingReversal !== null) {
                return $existingReversal;
            }

            return AffiliateLedgerEntry::create([
                'user_id' => $original->user_id,
                'order_id' => $order->id,
                'payout_id' => null,
                'entry_type' => 'reversal_debit',
                'amount_cents' => -abs($original->amount_cents),
                'currency' => 'USD',
                'status' => 'cleared',
                'matures_at' => null,
                'idempotency_key' => "order_reversal_{$order->id}",
            ]);
        });
    }

    /**
     * Sweep and transition all mature pending commissions for a specific user to available.
     */
    public function sweepMaturedCommissionsForUser(string $userId): int
    {
        return DB::transaction(function () use ($userId) {
            $now = now();
            $entryIds = AffiliateLedgerEntry::where('user_id', $userId)
                ->where('entry_type', 'sales_commission')
                ->where('status', 'pending')
                ->whereNotNull('matures_at')
                ->where('matures_at', '<=', $now)
                ->pluck('id');

            if ($entryIds->isEmpty()) {
                return 0;
            }

            return AffiliateLedgerEntry::whereIn('id', $entryIds)
                ->update(['status' => 'available']);
        });
    }
}
