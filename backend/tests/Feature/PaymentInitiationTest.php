<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentInitiationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    protected function createPendingOrder(string $itemType = 'part'): Order
    {
        $course = Course::with('parts')->first();
        $part = $course->parts->first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'initiation_tester@example.com',
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

    public function test_checkout_pay_validates_gateway_choice(): void
    {
        $order = $this->createPendingOrder('part');

        $response = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'unsupported_wallet',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'ERR_INVALID_GATEWAY');
    }

    public function test_checkout_pay_returns_404_when_order_not_found(): void
    {
        $response = $this->postJson('/api/v1/checkout/orders/KNZ-ORD-NON-EXISTENT/pay', [
            'gateway' => 'simulator',
        ]);

        $response->assertStatus(404)
            ->assertJsonPath('error.code', 'ERR_ORDER_NOT_FOUND');
    }

    public function test_checkout_pay_rejects_completed_order(): void
    {
        $order = $this->createPendingOrder('part');
        $order->update(['status' => 'completed']);

        $response = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'ERR_ORDER_ALREADY_COMPLETED');
    }

    public function test_checkout_pay_rejects_expired_order(): void
    {
        $order = $this->createPendingOrder('part');
        $order->update(['expires_at' => now()->subMinutes(5)]);

        $response = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'ERR_ORDER_EXPIRED');
    }

    public function test_checkout_pay_initiates_zaincash_session_and_returns_checkout_url(): void
    {
        $initUrl = config('payments.gateways.zaincash.init_url');
        Http::fake([
            $initUrl => Http::response(['id' => 'zc_test_op_12345'], 200),
        ]);

        $order = $this->createPendingOrder('bundle');

        $response = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'zaincash',
            'locale' => 'ar',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gateway', 'zaincash')
            ->assertJsonPath('data.amount_iqd', 13000)
            ->assertJsonPath('data.gateway_transaction_id', 'zc_test_op_12345');

        $checkoutUrl = $response->json('data.checkout_url');
        $this->assertStringContainsString('id=zc_test_op_12345', $checkoutUrl);

        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $order->id,
            'gateway' => 'zaincash',
            'gateway_transaction_id' => 'zc_test_op_12345',
            'amount_iqd' => 13000,
            'status' => 'initiated',
            'attempt_number' => 1,
        ]);
    }

    public function test_checkout_pay_handles_gateway_outage_gracefully(): void
    {
        $initUrl = config('payments.gateways.zaincash.init_url');
        Http::fake([
            $initUrl => Http::response(['error' => 'Gateway unavailable'], 503),
        ]);

        $order = $this->createPendingOrder('part');

        $response = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'zaincash',
            'locale' => 'ar',
        ]);

        $response->assertStatus(503)
            ->assertJsonPath('error.code', 'ERR_GATEWAY_UNAVAILABLE');
    }

    public function test_checkout_pay_supports_multi_attempt_continuity(): void
    {
        $order = $this->createPendingOrder('part');

        // First attempt via simulator
        $resp1 = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
        ]);
        $resp1->assertStatus(200);

        // Second attempt via simulator (switching or retry)
        $resp2 = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
        ]);
        $resp2->assertStatus(200);

        $this->assertEquals(2, PaymentTransaction::where('order_id', $order->id)->count());

        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $order->id,
            'attempt_number' => 1,
        ]);

        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $order->id,
            'attempt_number' => 2,
        ]);
    }
}
