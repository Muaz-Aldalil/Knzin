<?php

namespace Tests\Feature\Admin;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAffiliateReadTest extends TestCase
{
    use RefreshDatabase;

    public function test_affiliate_overview_is_read_only_and_calculates_correct_projections(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $affiliate = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);

        // Seed available commission
        AffiliateLedgerEntry::create([
            'user_id' => $affiliate->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 2500,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'comm_1',
        ]);

        // Seed pending hold commission
        AffiliateLedgerEntry::create([
            'user_id' => $affiliate->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 1500,
            'currency' => 'USD',
            'status' => 'pending',
            'matures_at' => now()->addHours(12),
            'idempotency_key' => 'comm_2',
        ]);

        // Seed pending payout
        AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-TEST-001',
            'user_id' => $affiliate->id,
            'amount_cents' => 2000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 26200,
            'payout_method' => 'zain_cash',
            'recipient_details' => ['phone' => '07700000000'],
            'status' => 'requested',
        ]);

        $ledgerCountBefore = AffiliateLedgerEntry::count();

        // Perform GET request
        $response = $this->withHeaders($headers)->getJson("/api/v1/admin/affiliates?user_id={$affiliate->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.items.0.available_cents', 2500);
        $response->assertJsonPath('data.items.0.pending_cents', 1500);
        $response->assertJsonPath('data.items.0.lifetime_earned_cents', 4000);
        $response->assertJsonPath('data.items.0.pending_payout_count', 1);

        // Assert zero database writes occurred
        $this->assertEquals($ledgerCountBefore, AffiliateLedgerEntry::count());

        // Perform GET ledger request
        $ledgerResponse = $this->withHeaders($headers)->getJson("/api/v1/admin/affiliates/{$affiliate->id}/ledger");
        $ledgerResponse->assertStatus(200);
        $ledgerResponse->assertJsonCount(2, 'data.items');
        $this->assertEquals($ledgerCountBefore, AffiliateLedgerEntry::count());
    }

    public function test_pagination_is_capped_at_fifty(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/affiliates?per_page=100');

        $response->assertStatus(200);
        $response->assertJsonPath('data.meta.per_page', 50);
    }
}
