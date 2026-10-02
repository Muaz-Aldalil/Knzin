<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\User;
use App\Services\AccountMergeService;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReferralAttributionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_per_order_attribution_with_no_lifetime_lock(): void
    {
        $referrerA = User::factory()->create(['learner_code' => 'LRN-REFA']);
        $referrerB = User::factory()->create(['learner_code' => 'LRN-REFB']);
        $buyer = User::factory()->create();
        $course = Course::first();

        $orderService = app(OrderService::class);

        // Order 1: referred by A
        $res1 = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => 'LRN-REFA',
            'campaign_tag' => 'spring_promo',
        ]);
        $order1 = $res1['order'];

        $this->assertDatabaseHas('referral_attributions', [
            'order_id' => $order1->id,
            'referrer_user_id' => $referrerA->id,
            'referral_code' => 'LRN-REFA',
            'campaign_tag' => 'spring_promo',
        ]);

        // Order 2: direct organic (no referral code) -> no attribution row
        $res2 = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
        ]);
        $order2 = $res2['order'];

        $this->assertDatabaseMissing('referral_attributions', [
            'order_id' => $order2->id,
        ]);

        // Order 3: referred by B -> attributes to B, NOT A
        $res3 = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => 'LRN-REFB',
        ]);
        $order3 = $res3['order'];

        $this->assertDatabaseHas('referral_attributions', [
            'order_id' => $order3->id,
            'referrer_user_id' => $referrerB->id,
        ]);
    }

    public function test_guest_checkout_attribution_and_account_merge_preservation(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-REF1']);
        $guestEmail = 'guest_student_' . Str::random(6) . '@example.com';
        $course = Course::first();
        $orderService = app(OrderService::class);

        // Guest purchase
        $res = $orderService->createOrder([
            'email' => $guestEmail,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => 'LRN-REF1',
        ]);
        $order = $res['order'];

        $attribution = ReferralAttribution::where('order_id', $order->id)->first();
        $this->assertNotNull($attribution);
        $this->assertEquals($referrer->id, $attribution->referrer_user_id);
        $this->assertEquals($order->user_id, $attribution->buyer_user_id);

        // Later, guest merges into Google account
        $googleUser = User::factory()->create([
            'email' => $guestEmail,
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);

        $mergeService = app(AccountMergeService::class);
        $mergeService->mergeAccounts($order->user, $googleUser);

        // Attribution record preserves referrer while updating buyer_user_id
        $attribution->refresh();
        $this->assertEquals($referrer->id, $attribution->referrer_user_id);
        $this->assertEquals($googleUser->id, $attribution->buyer_user_id);
    }

    public function test_cookie_changed_after_order_creation_preserves_original_order_attribution(): void
    {
        $referrerA = User::factory()->create(['learner_code' => 'LRN-FIRST-CLICK']);
        $referrerB = User::factory()->create(['learner_code' => 'LRN-LATER-CLICK']);
        $buyer = User::factory()->create();
        $course = Course::first();
        $orderService = app(OrderService::class);

        // 1. Order 1 created under Referrer A (locked attribution)
        $res1 = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => $referrerA->learner_code,
        ]);
        $order1 = $res1['order'];

        // 2. Later, browser cookie changes to Referrer B, and Order 2 is created
        $res2 = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => $referrerB->learner_code,
        ]);
        $order2 = $res2['order'];

        // Verify Order 1 is locked to Referrer A and Order 2 is locked to Referrer B
        $attr1 = ReferralAttribution::where('order_id', $order1->id)->first();
        $attr2 = ReferralAttribution::where('order_id', $order2->id)->first();
        $this->assertEquals($referrerA->id, $attr1->referrer_user_id);
        $this->assertEquals($referrerB->id, $attr2->referrer_user_id);

        // 3. Fulfill Order 1: Commission is minted for Referrer A, NOT Referrer B
        $orderService->fulfillOrder($order1);
        $this->assertDatabaseHas('affiliate_ledger_entries', [
            'order_id' => $order1->id,
            'user_id' => $referrerA->id,
            'amount_cents' => 250,
        ]);
        $this->assertDatabaseMissing('affiliate_ledger_entries', [
            'order_id' => $order1->id,
            'user_id' => $referrerB->id,
        ]);
    }

    public function test_direct_traffic_order_creates_zero_commission_upon_fulfillment(): void
    {
        $buyer = User::factory()->create();
        $course = Course::first();
        $orderService = app(OrderService::class);

        // Direct purchase with no referral code
        $res = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'part',
            'course_part_id' => $course->parts()->first()->id,
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
        ]);
        $order = $res['order'];

        $this->assertDatabaseMissing('referral_attributions', ['order_id' => $order->id]);

        $orderService->fulfillOrder($order);

        // Zero affiliate ledger entries generated
        $this->assertDatabaseMissing('affiliate_ledger_entries', ['order_id' => $order->id]);
    }

    public function test_financial_ledger_entries_are_append_only_and_cannot_be_mutated_or_deleted(): void
    {
        $user = User::factory()->create();
        $entry = \App\Models\AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 500,
            'currency' => 'USD',
            'status' => 'pending',
            'funding_source' => 'commercial_operations',
            'idempotency_key' => 'immutable_test_' . Str::random(8),
        ]);

        // Attempting to modify amount_cents throws ImmutableLedgerException
        try {
            $entry->amount_cents = 999;
            $entry->save();
            $this->fail('Expected ImmutableLedgerException was not thrown on modifying amount_cents.');
        } catch (\App\Exceptions\ImmutableLedgerException $e) {
            $this->assertStringContainsString('Affiliate ledger financial figures are immutable', $e->getMessage());
        }

        // Attempting to delete throws ImmutableLedgerException
        try {
            $entry->delete();
            $this->fail('Expected ImmutableLedgerException was not thrown on deleting ledger entry.');
        } catch (\App\Exceptions\ImmutableLedgerException $e) {
            $this->assertStringContainsString('strictly append-only', $e->getMessage());
        }

        // Verify entry remains intact in database
        $this->assertDatabaseHas('affiliate_ledger_entries', [
            'id' => $entry->id,
            'amount_cents' => 500,
        ]);
    }
}
