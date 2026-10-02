<?php

namespace Tests\Feature;

use App\Models\AffiliateLedgerEntry;
use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use App\Services\AffiliateCommissionService;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AffiliateCommissionFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_fulfillment_synchronously_credits_sales_commission_with_24h_hold(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-EARNER']);
        $buyer = User::factory()->create();
        $course = Course::first();

        $orderService = app(OrderService::class);

        // 1. Create referred $10 bundle order
        $res = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => 'LRN-EARNER',
        ]);
        $order = $res['order'];

        // 2. Fulfill order
        $fulfilledOrder = $orderService->fulfillOrder($order);
        $this->assertEquals('completed', $fulfilledOrder->status);

        // 3. Assert commission ledger entry created
        $ledgerEntry = AffiliateLedgerEntry::where('order_id', $order->id)
            ->where('entry_type', 'sales_commission')
            ->first();

        $this->assertNotNull($ledgerEntry, 'Commission entry must be created upon order fulfillment');
        $this->assertEquals($referrer->id, $ledgerEntry->user_id);
        $this->assertEquals(250, $ledgerEntry->amount_cents, '$10 bundle must yield 250 cents commission');
        $this->assertEquals('USD', $ledgerEntry->currency);
        $this->assertEquals('pending', $ledgerEntry->status);
        $this->assertNotNull($ledgerEntry->matures_at);
        $this->assertTrue($ledgerEntry->matures_at->isFuture());
    }

    public function test_duplicate_fulfillment_replay_is_strictly_idempotent(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-EARNER2']);
        $buyer = User::factory()->create();
        $course = Course::first();

        $orderService = app(OrderService::class);
        $commissionService = app(AffiliateCommissionService::class);

        $res = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => 'LRN-EARNER2',
        ]);
        $order = $res['order'];

        // First fulfillment
        $orderService->fulfillOrder($order);

        // Second direct commission call (simulating duplicate webhook replay)
        $secondEntry = $commissionService->creditSalesCommission($order);

        $totalEntries = AffiliateLedgerEntry::where('order_id', $order->id)
            ->where('entry_type', 'sales_commission')
            ->count();

        $this->assertEquals(1, $totalEntries, 'Zero duplicate commission entries permitted on replay');
    }

    public function test_reversing_commission_creates_compensating_debit_without_erasing_history(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-REFUNDED']);
        $buyer = User::factory()->create();
        $course = Course::first();

        $orderService = app(OrderService::class);
        $commissionService = app(AffiliateCommissionService::class);

        $res = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => 'LRN-REFUNDED',
        ]);
        $order = $res['order'];
        $orderService->fulfillOrder($order);

        $originalEntry = AffiliateLedgerEntry::where('order_id', $order->id)
            ->where('entry_type', 'sales_commission')
            ->first();

        // Perform refund reversal
        $reversalEntry = $commissionService->reverseCommission($order, 'chargeback_requested');

        $this->assertNotNull($reversalEntry);
        $this->assertEquals('reversal_debit', $reversalEntry->entry_type);
        $this->assertEquals(-250, $reversalEntry->amount_cents);
        $this->assertEquals('cleared', $reversalEntry->status);

        // Original entry still exists intact
        $originalEntry->refresh();
        $this->assertEquals(250, $originalEntry->amount_cents);
    }

    public function test_commission_creation_failure_rolls_back_entire_order_fulfillment(): void
    {
        $referrer = User::factory()->create(['learner_code' => 'LRN-FAIL-COMM']);
        $buyer = User::factory()->create();
        $course = Course::first();

        $orderService = app(OrderService::class);

        $res = $orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => 'LRN-FAIL-COMM',
        ]);
        $order = $res['order'];

        // Mock AffiliateCommissionService to simulate an unrecoverable failure during commission credit
        $mockCommission = $this->createMock(AffiliateCommissionService::class);
        $mockCommission->method('creditSalesCommission')
            ->willThrowException(new \RuntimeException('Simulated failure during commission creation'));
        $this->app->instance(AffiliateCommissionService::class, $mockCommission);

        try {
            $orderService->fulfillOrder($order);
            $this->fail('Expected RuntimeException was not thrown.');
        } catch (\RuntimeException $e) {
            $this->assertEquals('Simulated failure during commission creation', $e->getMessage());
        }

        // Verify atomic rollback: Order status remains pending (not completed), zero entitlements granted
        $freshOrder = $order->fresh();
        $this->assertEquals('pending', $freshOrder->status);
        $this->assertEquals(0, \App\Models\CourseEntitlement::where('order_id', $order->id)->count());
        $this->assertEquals(0, AffiliateLedgerEntry::where('order_id', $order->id)->count());
    }
}

