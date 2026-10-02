<?php

namespace Tests\Feature;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\Course;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\User;
use App\Policies\AffiliateLedgerPolicy;
use App\Policies\AffiliatePayoutPolicy;
use App\Services\AffiliateAttributionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Tests\TestCase;

class AffiliateSecurityAndFraudTest extends TestCase
{
    use RefreshDatabase;

    public function test_idor_protection_users_only_read_their_own_ledger_and_payouts(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // User A has a ledger entry and a payout
        $entryA = AffiliateLedgerEntry::create([
            'user_id' => $userA->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'ledger_user_a',
        ]);

        $payoutA = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-2026-USERA',
            'user_id' => $userA->id,
            'amount_cents' => 5000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 65500,
            'payout_method' => 'zain_cash',
            'recipient_details' => ['phone' => '07801111111'],
            'status' => 'requested',
        ]);

        // User B has a ledger entry and a payout
        $entryB = AffiliateLedgerEntry::create([
            'user_id' => $userB->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 500,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'ledger_user_b',
        ]);

        $payoutB = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-2026-USERB',
            'user_id' => $userB->id,
            'amount_cents' => 7000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 91700,
            'payout_method' => 'asia_hawala',
            'recipient_details' => ['phone' => '07702222222'],
            'status' => 'requested',
        ]);

        // 1. User A querying /api/v1/affiliate/ledger must only see their own transactions
        $responseLedgerA = $this->actingAs($userA, 'sanctum')->getJson('/api/v1/affiliate/ledger');
        $responseLedgerA->assertStatus(200);
        $entriesA = $responseLedgerA->json('data.entries');
        $this->assertCount(1, $entriesA);
        $this->assertEquals($entryA->id, $entriesA[0]['id']);

        // 2. User A querying /api/v1/affiliate/payouts must only see their own payouts
        $responsePayoutsA = $this->actingAs($userA, 'sanctum')->getJson('/api/v1/affiliate/payouts');
        $responsePayoutsA->assertStatus(200);
        $payoutsListA = $responsePayoutsA->json('data.payouts');
        $this->assertCount(1, $payoutsListA);
        $this->assertEquals($payoutA->payout_number, $payoutsListA[0]['payout_number']);

        // 3. Authorization policies strictly reject cross-user access
        $ledgerPolicy = new AffiliateLedgerPolicy();
        $this->assertTrue($ledgerPolicy->view($userA, $entryA));
        $this->assertFalse($ledgerPolicy->view($userA, $entryB));

        $payoutPolicy = new AffiliatePayoutPolicy();
        $this->assertTrue($payoutPolicy->view($userA, $payoutA));
        $this->assertFalse($payoutPolicy->view($userA, $payoutB));
    }

    public function test_audit_logging_stores_salted_hashes_never_raw_ips_or_user_agents(): void
    {
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
        $course = Course::firstOrFail();

        $referrer = User::factory()->create(['learner_code' => 'LRN-AUDIT']);
        $buyer = User::factory()->create();

        $orderService = app(\App\Services\OrderService::class);
        $res = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'chk_audit_' . Str::random(8),
        ]);
        $order = $res['order'];

        $service = app(AffiliateAttributionService::class);
        $rawIp = '192.168.1.150';
        $rawUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148';

        $attribution = $service->recordAttribution(
            order: $order,
            codeOrSlug: $referrer->learner_code,
            campaignTag: 'spring_promo',
            ip: $rawIp,
            userAgent: $rawUa
        );

        $this->assertNotNull($attribution);
        // Hashes must be 64-character SHA256 hex strings
        $this->assertEquals(64, strlen($attribution->ip_hash));
        $this->assertEquals(64, strlen($attribution->user_agent_hash));

        // Must NEVER contain raw sensitive values
        $this->assertStringNotContainsString($rawIp, $attribution->ip_hash);
        $this->assertStringNotContainsString('Mozilla', $attribution->user_agent_hash);
    }
}
