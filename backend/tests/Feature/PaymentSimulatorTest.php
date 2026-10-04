<?php

namespace Tests\Feature;

use App\Jobs\GenerateTicketsJob;
use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentSimulatorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    /**
     * Helper to create a valid pending order.
     */
    protected function createPendingOrder(string $itemType = 'part'): Order
    {
        $course = Course::with('parts')->first();
        $part = $course->parts->first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'simulator_buyer@example.com',
            'course_id' => $course->id,
            'course_part_id' => $itemType === 'part' ? $part->id : null,
            'item_type' => $itemType,
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => (string) Str::uuid(),
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

    public function test_simulation_payment_initiation_creates_transaction_and_returns_checkout_url(): void
    {
        $order = $this->createPendingOrder('part');

        $response = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gateway', 'simulator')
            ->assertJsonPath('data.amount_iqd', 2600)
            ->assertJsonPath('data.currency', 'IQD');

        $gatewayTxnId = $response->json('data.gateway_transaction_id');
        $this->assertStringStartsWith("SIM-TXN-{$order->order_number}-", $gatewayTxnId);

        $checkoutUrl = $response->json('data.checkout_url');
        $this->assertStringContainsString("/ar/payments/simulator/{$gatewayTxnId}", $checkoutUrl);

        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $order->id,
            'gateway' => 'simulator',
            'gateway_transaction_id' => $gatewayTxnId,
            'amount_iqd' => 2600,
            'status' => 'initiated',
            'attempt_number' => 1,
        ]);
    }

    public function test_simulator_webhook_fulfills_order_grants_entitlement_and_dispatches_ticket_job(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('bundle');

        $payResponse = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);
        $payResponse->assertStatus(200);
        $gatewayTxnId = $payResponse->json('data.gateway_transaction_id');

        $webhookResponse = $this->postJson('/api/v1/payments/webhooks/simulator', [
            'transaction_id' => $gatewayTxnId,
            'outcome' => 'success',
            'amount_iqd' => 13000,
        ]);

        $webhookResponse->assertStatus(200)
            ->assertJsonPath('status', 'ok');

        $order->refresh();
        $this->assertEquals('completed', $order->status);

        // Verify transaction marked success with paid_at
        $this->assertDatabaseHas('payment_transactions', [
            'gateway_transaction_id' => $gatewayTxnId,
            'status' => 'success',
        ]);

        $transaction = PaymentTransaction::where('gateway_transaction_id', $gatewayTxnId)->first();
        $this->assertNotNull($transaction->paid_at);

        // Verify synchronous course entitlement grant
        $this->assertDatabaseHas('course_entitlements', [
            'user_id' => $order->user_id,
            'course_id' => $order->items->first()->course_id,
        ]);

        // Verify asynchronous ticket generation job dispatch
        Queue::assertPushed(GenerateTicketsJob::class, function ($job) use ($order) {
            return $job->orderId === $order->id;
        });
    }

    public function test_simulator_webhook_handles_failed_outcome(): void
    {
        $order = $this->createPendingOrder('part');

        $payResponse = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);
        $gatewayTxnId = $payResponse->json('data.gateway_transaction_id');

        $webhookResponse = $this->postJson('/api/v1/payments/webhooks/simulator', [
            'transaction_id' => $gatewayTxnId,
            'outcome' => 'failed',
            'amount_iqd' => 2600,
        ]);

        $webhookResponse->assertStatus(200);

        $order->refresh();
        $this->assertEquals('pending', $order->status);

        $this->assertDatabaseHas('payment_transactions', [
            'gateway_transaction_id' => $gatewayTxnId,
            'status' => 'failed',
        ]);
    }

    public function test_simulator_webhook_replay_protection_is_idempotent(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('part');

        $payResponse = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);
        $gatewayTxnId = $payResponse->json('data.gateway_transaction_id');

        $webhookPayload = [
            'transaction_id' => $gatewayTxnId,
            'outcome' => 'success',
            'amount_iqd' => 2600,
        ];

        // First call fulfills
        $response1 = $this->postJson('/api/v1/payments/webhooks/simulator', $webhookPayload);
        $response1->assertStatus(200);

        // Second call (replay) returns 200 without duplicate job dispatch
        $response2 = $this->postJson('/api/v1/payments/webhooks/simulator', $webhookPayload);
        $response2->assertStatus(200);

        Queue::assertPushed(GenerateTicketsJob::class, 1);
    }

    public function test_payment_status_polling_returns_authoritative_state(): void
    {
        $order = $this->createPendingOrder('part');

        $payResponse = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);
        $gatewayTxnId = $payResponse->json('data.gateway_transaction_id');

        // Check pending polling status
        $statusResp1 = $this->getJson("/api/v1/checkout/orders/{$order->order_number}/payment-status");
        $statusResp1->assertStatus(200)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.latest_transaction.status', 'initiated');

        // Fulfill via simulator
        $this->postJson('/api/v1/payments/webhooks/simulator', [
            'transaction_id' => $gatewayTxnId,
            'outcome' => 'success',
            'amount_iqd' => 2600,
        ])->assertStatus(200);

        // Check completed polling status
        $statusResp2 = $this->getJson("/api/v1/checkout/orders/{$order->order_number}/payment-status");
        $statusResp2->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.tickets_status', 'minted')
            ->assertJsonPath('data.latest_transaction.status', 'success');
    }
}
