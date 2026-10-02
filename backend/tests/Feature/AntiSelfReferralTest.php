<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\User;
use App\Services\AffiliateAttributionService;
use App\Services\OrderService;
use Database\Seeders\CourseCatalogSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AntiSelfReferralTest extends TestCase
{
    use RefreshDatabase;

    protected Course $course;
    protected OrderService $orderService;
    protected AffiliateAttributionService $attributionService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CourseCatalogSeeder::class);
        $this->course = Course::firstOrFail();

        $this->orderService = app(OrderService::class);
        $this->attributionService = app(AffiliateAttributionService::class);
    }

    public function test_rejection_of_self_referral_when_authenticated_buyer_matches_referrer(): void
    {
        $user = User::factory()->create([
            'learner_code' => 'LRN-SELF1',
            'email' => 'selfuser@example.com',
            'status' => 'active',
        ]);

        // Authenticated user checks out using their own referral code
        $result = $this->orderService->createOrder([
            'email' => $user->email,
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'self_ref_order_1',
            'referral_code' => $user->learner_code,
        ]);

        $order = $result['order'];
        $this->assertNotNull($order);

        // Verify zero attribution was recorded
        $attribution = ReferralAttribution::where('order_id', $order->id)->first();
        $this->assertNull($attribution);

        // Fulfill order - verify purchase succeeds organically with zero affiliate commission
        $fulfilledOrder = $this->orderService->fulfillOrder($order);
        $this->assertEquals('completed', $fulfilledOrder->status);
        $this->assertDatabaseMissing('affiliate_ledger_entries', [
            'order_id' => $order->id,
        ]);
    }

    public function test_rejection_of_self_referral_when_guest_email_matches_referrer(): void
    {
        $referrer = User::factory()->create([
            'learner_code' => 'LRN-REF99',
            'email' => 'influencer99@knzin.com',
            'status' => 'active',
        ]);

        // Guest checks out with matching email (different casing/spacing) and referrer's code
        $guestEmail = '  Influencer99@Knzin.Com  ';

        $result = $this->orderService->createOrder([
            'email' => $guestEmail,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'guest_self_ref_order_1',
            'referral_code' => $referrer->learner_code,
        ]);

        $order = $result['order'];
        $this->assertNotNull($order);

        // Attribution must be rejected due to normalized email matching
        $attribution = ReferralAttribution::where('order_id', $order->id)->first();
        $this->assertNull($attribution);

        // Fulfill order - organic order completes normally without commission
        $fulfilled = $this->orderService->fulfillOrder($order);
        $this->assertEquals('completed', $fulfilled->status);
        $this->assertDatabaseMissing('affiliate_ledger_entries', [
            'order_id' => $order->id,
        ]);
    }

    public function test_database_constraint_chk_ref_attr_anti_self_referral_blocks_matching_buyer_and_referrer(): void
    {
        $user = User::factory()->create();

        $res = $this->orderService->createOrder([
            'email' => $user->email,
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'chk_self_order_' . Str::random(8),
        ]);
        $order = $res['order'];

        // Direct DB insertion where referrer_user_id == buyer_user_id must violate CHECK constraint
        $this->expectException(QueryException::class);
        ReferralAttribution::create([
            'order_id' => $order->id,
            'referrer_user_id' => $user->id,
            'buyer_user_id' => $user->id, // Identical ID
            'referral_code' => 'TEST-SELF',
            'commission_rate_bps' => 2500,
            'attribution_type' => 'cookie',
        ]);
    }
}
