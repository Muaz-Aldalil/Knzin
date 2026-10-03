<?php

namespace Tests\Feature\Admin;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;
use App\Services\AffiliatePayoutService;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPayoutConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_concurrent_settlement_and_rejection_serialize_cleanly(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');

        $affiliate = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);

        $payout = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-CONCURRENCY-1',
            'user_id' => $affiliate->id,
            'amount_cents' => 7500,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 98250,
            'payout_method' => 'zain_cash',
            'recipient_details' => ['phone' => '07700001111'],
            'status' => 'requested',
        ]);

        AffiliateLedgerEntry::create([
            'user_id' => $affiliate->id,
            'payout_id' => $payout->id,
            'entry_type' => 'payout_debit',
            'amount_cents' => -7500,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => "payout_debit_{$payout->payout_number}",
        ]);

        $service = app(AffiliatePayoutService::class);
        $auditContext = new AdminAuditContext($admin->id, AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, 'req-conc-1', null, null);

        // First action: Settle
        $settled = $service->settlePayout(
            payout: $payout,
            adminReferenceNumber: 'MTCN-CONCURRENCY',
            adminId: $admin->id,
            receiptPath: 'receipts/test.jpg',
            receiptSha256: hash('sha256', 'dummy'),
            auditContext: $auditContext
        );

        $this->assertEquals('completed', $settled->status);

        // Immediate subsequent action: Reject must throw PayoutStateConflictException
        $this->expectException(\App\Exceptions\PayoutStateConflictException::class);
        $service->rejectPayout(
            payout: $payout,
            reason: 'Concurrent race attempt',
            adminId: $admin->id,
            auditContext: $auditContext
        );
    }
}
