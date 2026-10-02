<?php

namespace Tests\Feature;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\Ticket;
use App\Models\User;
use App\Services\AffiliateCoPrizeService;
use App\Services\AffiliatePayoutService;
use App\Services\OrderService;
use App\Services\PlatformSettingsService;
use Database\Seeders\CourseCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Tests\TestCase;

class AffiliateAcceptanceScenariosTest extends TestCase
{
    use RefreshDatabase;

    protected Course $course;
    protected CoursePart $coursePart;
    protected OrderService $orderService;
    protected AffiliateCoPrizeService $coPrizeService;
    protected AffiliatePayoutService $payoutService;
    protected PlatformSettingsService $settingsService;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CourseCatalogSeeder::class);
        $this->seed(\Database\Seeders\PromotionalDrawSeeder::class);
        $this->course = Course::firstOrFail();
        $this->coursePart = CoursePart::where('course_id', $this->course->id)->where('part_number', 1)->firstOrFail();

        $this->orderService = app(OrderService::class);
        $this->coPrizeService = app(AffiliateCoPrizeService::class);
        $this->payoutService = app(AffiliatePayoutService::class);
        $this->settingsService = app(PlatformSettingsService::class);

        $this->admin = User::factory()->create();
        $this->admin->grantCapability('manage_platform_settings');
        $this->settingsService->set('affiliate.payout_min_cents', 5000, $this->admin);
    }

    public function test_scenario_1_referred_part_purchase_yields_1_ticket_and_25pct_pending_commission(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-SCEN1']);
        $buyer = User::factory()->create();

        $res = $this->orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $this->course->id,
            'course_part_id' => $this->coursePart->id,
            'item_type' => 'part',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'scen1_part_' . Str::random(8),
            'referral_code' => $referrer->learner_code,
        ]);
        $order = $res['order'];

        $fulfilled = $this->orderService->fulfillOrder($order);
        $this->assertEquals('completed', $fulfilled->status);
        $this->assertEquals(1, $fulfilled->promotional_tickets_granted);

        // 25% of 200 cents = 50 cents
        $this->assertDatabaseHas('affiliate_ledger_entries', [
            'user_id' => $referrer->id,
            'order_id' => $order->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 50,
            'status' => 'pending',
        ]);
    }

    public function test_scenario_2_referred_bundle_purchase_yields_15_tickets_and_25pct_pending_commission(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-SCEN2']);
        $buyer = User::factory()->create();

        $res = $this->orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'scen2_bundle_' . Str::random(8),
            'referral_code' => $referrer->learner_code,
        ]);
        $order = $res['order'];

        $fulfilled = $this->orderService->fulfillOrder($order);
        $this->assertEquals('completed', $fulfilled->status);
        $this->assertEquals(15, $fulfilled->promotional_tickets_granted);

        // 25% of 1000 cents = 250 cents
        $this->assertDatabaseHas('affiliate_ledger_entries', [
            'user_id' => $referrer->id,
            'order_id' => $order->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'status' => 'pending',
        ]);
    }

    public function test_scenario_3_maturation_command_sweeps_mature_entries_to_available(): void
    {
        $referrer = User::factory()->create();

        // Create an entry that is pending but its 24h maturation time has elapsed
        $entry = AffiliateLedgerEntry::create([
            'user_id' => $referrer->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 500,
            'currency' => 'USD',
            'status' => 'pending',
            'matures_at' => now()->subMinute(),
            'idempotency_key' => 'scen3_mat_' . Str::random(8),
        ]);

        $this->assertEquals('pending', $entry->status);

        Artisan::call('knzin:mature-commissions');

        $fresh = $entry->fresh();
        $this->assertEquals('available', $fresh->status);
        $this->assertEquals(500, $this->payoutService->calculateAvailableBalance($referrer->id));
    }

    public function test_scenario_4_grand_prize_40pct_co_prize_option_c_pending_hold_and_release(): void
    {
        $referrer = User::factory()->create();
        $buyer = User::factory()->create();

        // Create order via canonical service
        $res = $this->orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'scen4_ord_1',
        ]);
        $order = $res['order'];

        ReferralAttribution::create([
            'order_id' => $order->id,
            'referrer_user_id' => $referrer->id,
            'buyer_user_id' => $buyer->id,
            'referral_code' => 'LRN-SCEN4',
            'commission_rate_bps' => 2500,
            'attribution_type' => 'cookie',
        ]);

        $ticketSerial = 'KNZ-26-SCEN4-WIN';
        Ticket::create([
            'user_id' => $buyer->id,
            'order_id' => $order->id,
            'serial_number' => $ticketSerial,
            'order_ticket_index' => 1,
            'draw_tier' => 'grand',
            'ip_hash' => 'hash1',
            'user_agent_hash' => 'hash2',
        ]);

        // Award $10,000 prize -> 40% co-prize = $4,000 (400,000 cents)
        $entry = $this->coPrizeService->awardCoPrize($ticketSerial, 1000000, $buyer->id);
        $this->assertNotNull($entry);
        $this->assertEquals(400000, $entry->amount_cents);
        $this->assertEquals('pending', $entry->status); // Option C hold

        // 1. Without approved KYC & Draw audit, releaseCoPrize keeps entry pending
        $unapprovedRelease = $this->coPrizeService->releaseCoPrize($ticketSerial);
        $this->assertEquals('pending', $unapprovedRelease->status);

        // 2. Authoritative integration: Record trusted KYC and Draw Audit approvals
        \App\Models\DrawWinner::firstOrCreate(
            ['winning_ticket_serial' => $ticketSerial],
            [
                'draw_id' => \App\Models\Draw::firstOrFail()->id,
                'prize_id' => null,
                'winner_masked_name' => 'Winner Test',
                'winner_governorate' => 'Baghdad',
                'prize_delivered' => true,
                'drawn_at' => now(),
            ]
        );
        $approvalRegistry = app(\App\Services\ApprovalRegistryService::class);
        $approvalRegistry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $buyer->id,
            status: 'approved',
            source: 'compliance_kyc_subsystem',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
        );
        $approvalRegistry->issueApproval(
            approvalType: 'draw_integrity',
            subjectType: 'draw',
            subjectId: (string) \App\Models\Draw::firstOrFail()->id,
            status: 'approved',
            source: 'draw_audit_engine',
            systemPrincipal: 'draw_audit_engine',
            systemSecret: (string) config('knzin.subsystems.draw_audit_secret')
        );

        $released = $this->coPrizeService->releaseCoPrize($ticketSerial);
        $this->assertEquals('available', $released->status);
    }

    public function test_scenario_5_anti_self_referral_rejects_attribution_and_allows_organic_checkout(): void
    {
        $user = User::factory()->create(['learner_code' => 'LRN-SCEN5']);

        $res = $this->orderService->createOrder([
            'email' => $user->email,
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'scen5_self_order',
            'referral_code' => $user->learner_code,
        ]);
        $order = $res['order'];

        $this->assertNull(ReferralAttribution::where('order_id', $order->id)->first());

        $fulfilled = $this->orderService->fulfillOrder($order);
        $this->assertEquals('completed', $fulfilled->status);
        $this->assertDatabaseMissing('affiliate_ledger_entries', ['order_id' => $order->id]);
    }

    public function test_scenario_6_duplicate_fulfillment_idempotency_prevents_duplicate_commissions(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-SCEN6']);
        $buyer = User::factory()->create();

        $res = $this->orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => 'scen6_dup_order',
            'referral_code' => $referrer->learner_code,
        ]);
        $order = $res['order'];

        // Fulfill first time
        $this->orderService->fulfillOrder($order);
        $this->assertEquals(1, AffiliateLedgerEntry::where('order_id', $order->id)->count());

        // Replay fulfillment second time (simulated webhook redelivery)
        $this->orderService->fulfillOrder($order);
        $this->assertEquals(1, AffiliateLedgerEntry::where('order_id', $order->id)->count());
    }

    public function test_scenario_7_dynamic_threshold_snapshotting_and_pending_payout_invariance(): void
    {
        $user = User::factory()->create();

        // Give user $65 mature available
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 6500,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'scen7_comm_65',
        ]);

        // Threshold is $50
        $payout = $this->payoutService->requestPayout(
            user: $user,
            amountCents: 6500,
            payoutMethod: 'zain_cash',
            recipientDetails: ['phone' => '07801234567']
        );

        $this->assertEquals(5000, $payout->threshold_cents_at_request);
        $this->assertEquals('requested', $payout->status);

        // Admin raises threshold to $100
        $this->settingsService->set('affiliate.payout_min_cents', 10000, $this->admin);

        // Pending payout remains valid in requested status
        $this->assertEquals('requested', $payout->fresh()->status);
        $this->assertEquals(5000, $payout->fresh()->threshold_cents_at_request);

        // Lower threshold to $25 -> zero auto payouts created
        $this->settingsService->set('affiliate.payout_min_cents', 2500, $this->admin);
        $this->assertEquals(1, AffiliatePayout::count());
    }

    public function test_scenario_8_payout_reversal_creates_compensating_credit_preserving_append_only_history(): void
    {
        $user = User::factory()->create();

        // Give user $80 mature available
        AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 8000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => 'scen8_comm_80',
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

        // Admin rejects payout
        $admin = User::factory()->create();
        $rejected = $this->payoutService->rejectPayout($payout, 'Invalid phone number', $admin->id);
        $this->assertEquals('rejected', $rejected->status);

        // Ledger has both debit (-5000) and compensating reversal (+5000)
        $entries = AffiliateLedgerEntry::where('payout_id', $payout->id)->get();
        $this->assertCount(2, $entries);
        $this->assertEquals(8000, $this->payoutService->calculateAvailableBalance($user->id));
    }
}
