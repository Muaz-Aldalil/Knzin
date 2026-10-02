<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientAvailableBalanceException;
use App\Exceptions\PayoutThresholdUnmetException;
use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Services\AffiliatePayoutService;
use App\Services\PlatformSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliatePayoutLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected PlatformSettingsService $settingsService;
    protected AffiliatePayoutService $payoutService;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->settingsService = app(PlatformSettingsService::class);
        $this->payoutService = app(AffiliatePayoutService::class);
        $this->admin = User::factory()->create();
        $this->admin->grantCapability('manage_platform_settings');
        $this->settingsService->set('affiliate.payout_min_cents', 5000, $this->admin); // $50 default
    }

    public function test_threshold_eligibility_vs_requested_amount_semantics(): void
    {
        $user = User::factory()->create();

        // User has $60 available (meets $50 threshold eligibility)
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 6000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_60',
        ]);

        // 1. Can request partial withdrawal (e.g. $20) because available balance ($60) >= threshold ($50)
        $payout = $this->payoutService->requestPayout(
            user: $user,
            amountCents: 2000,
            payoutMethod: 'zain_cash',
            recipientDetails: ['phone' => '07801234567']
        );

        $this->assertEquals(2000, $payout->amount_cents);
        $this->assertEquals(5000, $payout->threshold_cents_at_request);
        $this->assertEquals('requested', $payout->status);

        // Remaining balance is now $40 ($60 - $20 = $40)
        $remaining = $this->payoutService->calculateAvailableBalance($user->id);
        $this->assertEquals(4000, $remaining);

        // 2. Subsequent request fails because available balance ($40) is now below $50 threshold
        $this->expectException(PayoutThresholdUnmetException::class);
        $this->payoutService->requestPayout(
            user: $user,
            amountCents: 1000,
            payoutMethod: 'zain_cash',
            recipientDetails: ['phone' => '07801234567']
        );
    }

    public function test_active_threshold_enforcement_and_dynamic_updates(): void
    {
        $user = User::factory()->create();

        // User has $75 available
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 7500,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_75',
        ]);

        // Threshold is $50 -> allowed
        $this->assertEquals(7500, $this->payoutService->calculateAvailableBalance($user->id));

        // Admin increases threshold to $100
        $this->settingsService->set('affiliate.payout_min_cents', 10000, $this->admin);

        // Now user with $75 is rejected
        $this->expectException(PayoutThresholdUnmetException::class);
        $this->payoutService->requestPayout(
            user: $user,
            amountCents: 7500,
            payoutMethod: 'zain_cash',
            recipientDetails: ['phone' => '07801234567']
        );
    }

    public function test_pending_payout_remains_invariant_under_future_threshold_increases(): void
    {
        $user = User::factory()->create();

        // User has $60 available when threshold is $50
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 6000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_inv_60',
        ]);

        // User requests $60 payout under $50 threshold
        $payout = $this->payoutService->requestPayout(
            user: $user,
            amountCents: 6000,
            payoutMethod: 'zain_cash',
            recipientDetails: ['phone' => '07801234567']
        );

        $this->assertEquals(5000, $payout->threshold_cents_at_request);
        $this->assertEquals('requested', $payout->status);

        // Admin raises threshold to $100
        $this->settingsService->set('affiliate.payout_min_cents', 10000, $this->admin);

        // The existing pending payout is completely unaffected:
        $freshPayout = $payout->fresh();
        $this->assertEquals('requested', $freshPayout->status);
        $this->assertEquals(5000, $freshPayout->threshold_cents_at_request);

        // And can proceed to successful settlement
        $admin = User::factory()->create();
        $settled = $this->payoutService->settlePayout($freshPayout, 'ZC-REF-9921', $admin->id);
        $this->assertEquals('completed', $settled->status);
        $this->assertEquals('ZC-REF-9921', $settled->admin_reference_number);
        $this->assertEquals($admin->id, $settled->processed_by_admin_id);
    }

    public function test_lowering_threshold_generates_zero_auto_payouts(): void
    {
        $user = User::factory()->create();

        // User has $30 available
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 3000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_zero_auto',
        ]);

        // Admin lowers threshold from $50 to $20
        $this->settingsService->set('affiliate.payout_min_cents', 2000, $this->admin);

        // Zero auto-payouts should be created
        $this->assertEquals(0, AffiliatePayout::count());
        $this->assertEquals(3000, $this->payoutService->calculateAvailableBalance($user->id));
    }

    public function test_settlement_and_compensating_reversal_lifecycle(): void
    {
        $user = User::factory()->create();

        // User has $80 available
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 8000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_reversal_test',
        ]);

        // Request $50 payout
        $payout = $this->payoutService->requestPayout(
            user: $user,
            amountCents: 5000,
            payoutMethod: 'zain_cash',
            recipientDetails: ['phone' => '07801234567']
        );

        // Available balance is $30
        $this->assertEquals(3000, $this->payoutService->calculateAvailableBalance($user->id));

        // Admin rejects payout due to incorrect phone number
        $admin = User::factory()->create();
        $rejected = $this->payoutService->rejectPayout(
            payout: $payout,
            reason: 'Wallet number unregistered in ZainCash',
            adminId: $admin->id
        );

        $this->assertEquals('rejected', $rejected->status);
        $this->assertEquals('Wallet number unregistered in ZainCash', $rejected->admin_notes);
        $this->assertEquals($admin->id, $rejected->processed_by_admin_id);

        // Reversal credit entry was created, debit entry was NOT deleted
        $entries = AffiliateLedgerEntry::where('payout_id', $payout->id)->get();
        $this->assertCount(2, $entries);
        $this->assertTrue($entries->contains('entry_type', 'payout_debit'));
        $this->assertTrue($entries->contains('entry_type', 'reversal_credit'));

        // Available balance is restored back to $80 ($8000 cents)
        $this->assertEquals(8000, $this->payoutService->calculateAvailableBalance($user->id));
    }
}
