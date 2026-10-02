<?php

namespace Tests\Feature;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Services\PlatformSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliatePayoutContractTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Set default minimum threshold to 5000 cents ($50.00) under authorized admin context
        $admin = User::factory()->create();
        $admin->grantCapability('manage_platform_settings');
        app(PlatformSettingsService::class)->set('affiliate.payout_min_cents', 5000, $admin);
    }

    public function test_unauthenticated_payout_requests_return_401(): void
    {
        $response = $this->postJson('/api/v1/affiliate/payouts/request', [
            'amount_cents' => 5000,
            'payout_method' => 'zain_cash',
            'recipient_details' => ['phone' => '07801234567'],
        ]);
        $response->assertStatus(401);

        $responseHistory = $this->getJson('/api/v1/affiliate/payouts');
        $responseHistory->assertStatus(401);
    }

    public function test_request_below_active_admin_threshold_returns_422_with_contract_payload(): void
    {
        $user = User::factory()->create();

        // User has only $30 (3000 cents) available, below $50 threshold
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 3000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_below_thresh_1',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/affiliate/payouts/request', [
            'amount_cents' => 3000,
            'payout_method' => 'zain_cash',
            'recipient_details' => [
                'phone_number' => '07801234567',
                'account_name' => 'علي فرج',
                'governorate' => 'بغداد',
            ],
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'fail',
                'code' => 'ERR_PAYOUT_THRESHOLD_UNMET',
                'data' => [
                    'requested_amount_cents' => 3000,
                    'minimum_threshold_cents' => 5000,
                    'minimum_threshold_formatted' => '$50.00',
                    'minimum_threshold_iqd' => 65500,
                ],
            ]);
    }

    public function test_request_exceeding_available_balance_returns_422_insufficient_balance(): void
    {
        $user = User::factory()->create();

        // User has $60 mature available, $20 pending
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 6000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_avail_60',
        ]);
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 2000,
            'currency' => 'USD',
            'status' => 'pending',
            'matures_at' => now()->addHours(12),
            'idempotency_key' => 'comm_pend_20',
        ]);

        // Attempt to withdraw $70 (exceeds $60 available)
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/affiliate/payouts/request', [
            'amount_cents' => 7000,
            'payout_method' => 'zain_cash',
            'recipient_details' => [
                'phone_number' => '07801234567',
                'account_name' => 'علي فرج',
                'governorate' => 'بغداد',
            ],
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'fail',
                'code' => 'ERR_INSUFFICIENT_AVAILABLE_BALANCE',
                'data' => [
                    'requested_amount_cents' => 7000,
                    'available_balance_cents' => 6000,
                    'pending_balance_cents' => 2000,
                ],
            ]);
    }

    public function test_valid_payout_creates_payout_and_snapshots_active_threshold(): void
    {
        $user = User::factory()->create();

        // User has $100 available
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 10000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_avail_100',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/affiliate/payouts/request', [
            'amount_cents' => 6500,
            'payout_method' => 'zain_cash',
            'recipient_details' => [
                'phone_number' => '07801234567',
                'account_name' => 'علي فرج',
                'governorate' => 'بغداد',
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'payout_number',
                    'amount_cents',
                    'amount_formatted',
                    'amount_iqd',
                    'threshold_cents_at_request',
                    'payout_method',
                    'status',
                    'status_label_ar',
                    'status_label_en',
                    'recipient_details',
                    'remaining_available_cents',
                    'created_at',
                ],
            ]);

        $this->assertEquals(6500, $response->json('data.amount_cents'));
        $this->assertEquals(5000, $response->json('data.threshold_cents_at_request'));
        $this->assertEquals('requested', $response->json('data.status'));
        $this->assertEquals(3500, $response->json('data.remaining_available_cents')); // 10000 - 6500 = 3500

        // Verify history endpoint returns the new payout
        $historyResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/affiliate/payouts');
        $historyResponse->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'payouts' => [
                        '*' => [
                            'payout_number',
                            'amount_cents',
                            'amount_formatted',
                            'amount_iqd',
                            'threshold_cents_at_request',
                            'payout_method',
                            'status',
                            'admin_reference_number',
                            'created_at',
                            'processed_at',
                        ],
                    ],
                ],
            ]);

        $this->assertCount(1, $historyResponse->json('data.payouts'));
        $this->assertEquals(5000, $historyResponse->json('data.payouts.0.threshold_cents_at_request'));
    }
}
