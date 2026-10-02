<?php

namespace Tests\Feature;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\AffiliateProfile;
use App\Models\Course;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\User;
use App\Services\AffiliateAttributionService;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OneWayAccountMergeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
        config(['services.google.mock' => true]);
    }

    public function test_unverified_guest_orders_merge_into_verified_google_user_on_login(): void
    {
        $email = 'merge_student@example.com';
        $course = Course::first();

        // 1. Guest places an order before registering
        $orderService = app(OrderService::class);
        $order1 = $orderService->createOrder([
            'email' => $email,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ])['order'];

        // Guest user is initially created
        $guestUser = User::where('email', $email)->where('auth_provider', 'guest')->first();
        $this->assertNotNull($guestUser);
        $this->assertEquals('active', $guestUser->status);
        $this->assertEquals($guestUser->id, $order1->user_id);

        // 2. User logs in via Google with the exact same email
        $response = $this->get("/api/v1/auth/google/callback?mock_email={$email}&mock_name=Verified+Google+Student&mock_sub=sub_google_998877");
        $response->assertStatus(302);

        // 3. Verify Google account exists and is active & verified
        $googleUser = User::where('email', $email)->where('auth_provider', 'google')->first();
        $this->assertNotNull($googleUser);
        $this->assertNotEquals($guestUser->id, $googleUser->id);
        $this->assertEquals('active', $googleUser->status);
        $this->assertNotNull($googleUser->email_verified_at);

        // 4. Assert guest orders are now re-attributed to Google user
        $reloadedOrder1 = Order::find($order1->id);
        $this->assertEquals($googleUser->id, $reloadedOrder1->user_id);

        // 5. Assert guest user is deactivated with merged_into audit pointer and tokens revoked (DEF-02C)
        $reloadedGuestUser = User::find($guestUser->id);
        $this->assertEquals('deactivated', $reloadedGuestUser->status);
        $this->assertEquals($googleUser->id, $reloadedGuestUser->merged_into_user_id);
        $this->assertCount(0, $reloadedGuestUser->tokens);
    }

    public function test_affiliate_profile_ledger_and_payouts_merge_into_verified_google_user_on_login(): void
    {
        $email = 'affiliate_merge@example.com';

        // 1. Create a guest user acting as an affiliate
        $guestUser = User::factory()->create([
            'email' => $email,
            'auth_provider' => 'guest',
            'status' => 'active',
            'learner_code' => 'LRN-GUESTAFF',
        ]);

        $guestProfile = AffiliateProfile::create([
            'user_id' => $guestUser->id,
            'custom_slug' => 'guest-affiliate-slug',
            'default_payout_method' => 'zain_cash',
            'payout_details' => ['phone' => '07800000000'],
            'status' => 'active',
        ]);

        $ledgerEntry = AffiliateLedgerEntry::create([
            'user_id' => $guestUser->id,
            'entry_type' => 'commission',
            'amount_cents' => 500,
            'currency' => 'USD',
            'status' => 'available',
            'funding_source' => 'platform_marketing',
            'idempotency_key' => 'idem_merge_guest_comm_1',
            'metadata' => ['note' => 'guest commission'],
        ]);

        $payout = AffiliatePayout::create([
            'payout_number' => 'PO-MERGE-001',
            'user_id' => $guestUser->id,
            'amount_cents' => 500,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 650000,
            'payout_method' => 'zain_cash',
            'recipient_details' => '07800000000',
            'status' => 'requested',
        ]);

        $buyer = User::factory()->create();
        $order = Order::create([
            'order_number' => 'ORD-MERGE-TEST-01',
            'user_id' => $buyer->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1300,
            'paid_amount_gateway' => 13000,
            'display_price_label' => '$10.00',
            'promotional_tickets_granted' => 1,
            'status' => 'completed',
            'idempotency_key' => 'idem_merge_ord_1',
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => now(),
        ]);

        $attribution = ReferralAttribution::create([
            'order_id' => $order->id,
            'buyer_user_id' => $buyer->id,
            'referrer_user_id' => $guestUser->id,
            'referral_code' => $guestUser->learner_code,
            'attributed_at' => now(),
        ]);

        // 2. Google OAuth callback for same email
        $response = $this->get("/api/v1/auth/google/callback?mock_email={$email}&mock_name=Verified+Affiliate+Google&mock_sub=sub_google_affiliate_123");
        $response->assertStatus(302);

        $googleUser = User::where('email', $email)->where('auth_provider', 'google')->first();
        $this->assertNotNull($googleUser);

        // 3. Verify affiliate entities were transferred to Google user
        $this->assertDatabaseHas('affiliate_profiles', [
            'user_id' => $googleUser->id,
            'custom_slug' => 'guest-affiliate-slug',
        ]);

        $this->assertDatabaseMissing('affiliate_profiles', [
            'user_id' => $guestUser->id,
        ]);

        $this->assertEquals($googleUser->id, AffiliateLedgerEntry::find($ledgerEntry->id)->user_id);
        $this->assertEquals($googleUser->id, AffiliatePayout::find($payout->id)->user_id);
        $this->assertEquals($googleUser->id, ReferralAttribution::find($attribution->id)->referrer_user_id);

        // 4. Verify referral resolution resolves old guest's learner_code to surviving Google user
        $attributionService = app(AffiliateAttributionService::class);
        $resolved = $attributionService->resolveReferralCode('LRN-GUESTAFF');
        $this->assertNotNull($resolved);
        $this->assertEquals($googleUser->id, $resolved['referrer_id']);
    }
}

