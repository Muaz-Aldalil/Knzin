<?php

namespace Tests\Feature;

use App\Models\AffiliateLedgerEntry;
use App\Models\Course;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentSimulatorApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
        config(['payments.simulator_enabled' => true]);
    }

    protected function createPendingOrder(string $itemType = 'part', ?string $referralCode = null): Order
    {
        $course = Course::with('parts')->first();
        $part = $course->parts->first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'buyer_' . Str::random(5) . '@example.com',
            'course_id' => $course->id,
            'course_part_id' => $itemType === 'part' ? $part->id : null,
            'item_type' => $itemType,
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => $referralCode,
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ];

        $response = $this->postJson('/api/v1/checkout/orders', $payload);
        $response->assertStatus(201);

        return Order::where('idempotency_key', $payload['idempotency_key'])->firstOrFail();
    }

    protected function initiateSimulatorTransaction(Order $order): PaymentTransaction
    {
        $response = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);
        $response->assertStatus(200);

        return PaymentTransaction::where('order_id', $order->id)->latest('attempt_number')->firstOrFail();
    }

    public function test_simulator_inspection_returns_order_and_transaction_details(): void
    {
        $order = $this->createPendingOrder('bundle');
        $txn = $this->initiateSimulatorTransaction($order);

        $response = $this->getJson("/api/v1/payments/simulator/{$txn->gateway_transaction_id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.transaction.gateway', 'simulator')
            ->assertJsonPath('data.transaction.status', 'initiated')
            ->assertJsonPath('data.order.order_number', $order->order_number)
            ->assertJsonPath('data.item.item_type', 'bundle')
            ->assertJsonPath('data.item.promotional_tickets_granted', 15);
    }

    public function test_simulator_inspection_includes_referral_attribution_and_projected_commission(): void
    {
        $referrer = User::factory()->create([
            'learner_code' => 'TESTREF100',
            'display_name' => 'Top Marketer',
        ]);

        $order = $this->createPendingOrder('bundle', 'TESTREF100');
        $txn = $this->initiateSimulatorTransaction($order);

        $response = $this->getJson("/api/v1/payments/simulator/{$txn->gateway_transaction_id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.referral.has_attribution', true)
            ->assertJsonPath('data.referral.referrer_code', 'TESTREF100')
            ->assertJsonPath('data.referral.is_self_referral', false)
            ->assertJsonPath('data.referral.projected_commission_cents', 250); // 25% of $10.00 (1000 cents) = 250 cents
    }

    public function test_simulator_reconcile_fulfills_stuck_initiated_order(): void
    {
        $order = $this->createPendingOrder('part');
        $txn = $this->initiateSimulatorTransaction($order);

        $this->assertEquals('pending', $order->status);
        $this->assertEquals('initiated', $txn->status);

        $response = $this->postJson("/api/v1/payments/simulator/{$txn->gateway_transaction_id}/reconcile");

        $response->assertStatus(200)
            ->assertJsonPath('data.reconciled', true)
            ->assertJsonPath('data.order_status', 'completed')
            ->assertJsonPath('data.transaction_status', 'success');

        $this->assertEquals('completed', $order->fresh()->status);
        $this->assertEquals('success', $txn->fresh()->status);
    }

    public function test_simulator_refund_reverses_order_and_affiliate_commission(): void
    {
        $referrer = User::factory()->create([
            'learner_code' => 'REFUNDME',
        ]);

        $order = $this->createPendingOrder('bundle', 'REFUNDME');
        $txn = $this->initiateSimulatorTransaction($order);

        // Fulfill first via simulator webhook
        $this->postJson('/api/v1/payments/webhooks/simulator', [
            'transaction_id' => $txn->gateway_transaction_id,
            'outcome' => 'success',
            'amount_iqd' => $txn->amount_iqd,
        ])->assertStatus(200);

        $this->assertEquals('completed', $order->fresh()->status);

        // Verify sales commission created
        $commission = AffiliateLedgerEntry::where('order_id', $order->id)
            ->where('entry_type', 'sales_commission')
            ->first();
        $this->assertNotNull($commission);

        // Now trigger simulator refund
        $response = $this->postJson("/api/v1/payments/simulator/{$txn->gateway_transaction_id}/refund");

        $response->assertStatus(200)
            ->assertJsonPath('data.refunded', true)
            ->assertJsonPath('data.order_status', 'refunded');

        // Check compensating reversal debit entry
        $reversal = AffiliateLedgerEntry::where('order_id', $order->id)
            ->where('entry_type', 'reversal_debit')
            ->first();
        $this->assertNotNull($reversal);
        $this->assertEquals(-abs($commission->amount_cents), $reversal->amount_cents);
    }

    public function test_simulator_fast_forward_maturation_sweeps_pending_commissions_to_available(): void
    {
        $referrer = User::factory()->create([
            'learner_code' => 'MATUREFAST',
        ]);

        $order = $this->createPendingOrder('bundle', 'MATUREFAST');
        $txn = $this->initiateSimulatorTransaction($order);

        $this->postJson('/api/v1/payments/webhooks/simulator', [
            'transaction_id' => $txn->gateway_transaction_id,
            'outcome' => 'success',
            'amount_iqd' => $txn->amount_iqd,
        ])->assertStatus(200);

        $commission = AffiliateLedgerEntry::where('order_id', $order->id)
            ->where('entry_type', 'sales_commission')
            ->first();
        $this->assertEquals('pending', $commission->status);

        // Call fast-forward maturation
        $response = $this->postJson('/api/v1/payments/simulator/fast-forward-maturation');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertEquals('available', $commission->fresh()->status);
    }

    public function test_simulator_seed_scenario_creates_test_order_and_transaction(): void
    {
        $response = $this->postJson('/api/v1/payments/simulator/seed-scenario', [
            'scenario' => 'bundle_with_referral',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'order_number',
                    'transaction_id',
                    'checkout_url',
                    'amount_iqd',
                    'buyer_email',
                    'referral_code',
                ],
            ]);
    }

    public function test_simulator_list_transactions_returns_recent_simulator_entries(): void
    {
        $order = $this->createPendingOrder('part');
        $this->initiateSimulatorTransaction($order);

        $response = $this->getJson('/api/v1/payments/simulator/transactions');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'transactions',
                ],
            ]);
    }
}
