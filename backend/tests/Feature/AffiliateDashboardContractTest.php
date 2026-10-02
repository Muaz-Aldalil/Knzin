<?php

namespace Tests\Feature;

use App\Models\AffiliateLedgerEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliateDashboardContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_to_dashboard_returns_401(): void
    {
        $response = $this->getJson('/api/v1/affiliate/dashboard');
        $response->assertStatus(401);
    }

    public function test_authenticated_dashboard_returns_accurate_kpis_and_active_threshold(): void
    {
        $user = User::factory()->create([
            'learner_code' => 'LRN-DASH1',
            'status' => 'active',
        ]);

        // Create mature credit entry ($50.00 = 5000 cents)
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 5000,
            'status' => 'available',
            'idempotency_key' => 'dash_test_entry_1',
        ]);

        // Create pending entry ($25.00 = 2500 cents)
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 2500,
            'status' => 'pending',
            'matures_at' => now()->addDay(),
            'idempotency_key' => 'dash_test_entry_2',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/affiliate/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'referral_info' => [
                        'learner_code' => 'LRN-DASH1',
                    ],
                    'kpis' => [
                        'unpaid_available_cents' => 5000,
                        'unpaid_pending_cents' => 2500,
                        'total_earned_cents' => 7500,
                    ],
                    'commission_policy' => [
                        'sales_commission_rate_percent' => 25,
                        'minimum_payout_cents' => 5000,
                    ],
                ],
            ]);
    }

    public function test_authenticated_ledger_returns_paginated_entries(): void
    {
        $user = User::factory()->create(['learner_code' => 'LRN-LEDG1']);

        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'status' => 'available',
            'idempotency_key' => 'ledg_test_1',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/affiliate/ledger');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'entries',
                    'meta' => [
                        'current_page',
                        'last_page',
                        'per_page',
                        'total',
                    ],
                ],
            ]);
    }
}
