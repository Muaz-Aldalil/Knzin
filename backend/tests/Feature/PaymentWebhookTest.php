<?php

namespace Tests\Feature;

use App\Jobs\GenerateTicketsJob;
use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\PaymentWebhook;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
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
            'email' => 'webhook_buyer@example.com',
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

    public function test_zaincash_valid_signed_webhook_fulfills_order_and_grants_entitlements(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('bundle');
        $initUrl = config('payments.gateways.zaincash.init_url');
        Http::fake([
            $initUrl => Http::response(['id' => 'zc_webhook_op_777'], 200),
        ]);

        $payResp = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'zaincash',
            'locale' => 'ar',
        ]);
        $payResp->assertStatus(200);

        $secret = config('payments.gateways.zaincash.secret');
        $jwtPayload = [
            'status' => 'success',
            'orderid' => $order->order_number,
            'id' => 'zc_webhook_op_777',
            'operationid' => 'zc_op_verified_888',
            'msg' => 'success',
        ];
        $token = JWT::encode($jwtPayload, $secret, 'HS256');

        $response = $this->postJson('/api/v1/payments/webhooks/zaincash', [
            'token' => $token,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok');

        $order->refresh();
        $this->assertEquals('completed', $order->status);

        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $order->id,
            'gateway_transaction_id' => 'zc_webhook_op_777',
            'status' => 'success',
        ]);

        $this->assertDatabaseHas('course_entitlements', [
            'user_id' => $order->user_id,
            'course_id' => $order->items->first()->course_id,
        ]);

        Queue::assertPushed(GenerateTicketsJob::class);

        // Verify webhook audit log
        $this->assertDatabaseHas('payment_webhooks', [
            'gateway' => 'zaincash',
            'signature_verified' => true,
            'processed' => true,
        ]);
    }

    public function test_zaincash_invalid_signature_is_rejected_with_401(): void
    {
        $order = $this->createPendingOrder('part');

        $wrongSecret = 'tampered_or_invalid_secret_key_32bytes_min!';
        $jwtPayload = [
            'status' => 'success',
            'orderid' => $order->order_number,
            'id' => 'zc_invalid_signature_op',
            'operationid' => 'zc_op_fake',
        ];
        $token = JWT::encode($jwtPayload, $wrongSecret, 'HS256');

        $response = $this->postJson('/api/v1/payments/webhooks/zaincash', [
            'token' => $token,
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('error.code', 'ERR_SIGNATURE_VERIFICATION_FAILED');

        $this->assertDatabaseHas('payment_webhooks', [
            'gateway' => 'zaincash',
            'signature_verified' => false,
            'processed' => false,
        ]);
    }

    public function test_zaincash_duplicate_webhook_returns_200_without_duplicate_fulfillment(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('part');
        $initUrl = config('payments.gateways.zaincash.init_url');
        Http::fake([
            $initUrl => Http::response(['id' => 'zc_idem_op_555'], 200),
        ]);

        $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'zaincash',
        ])->assertStatus(200);

        $secret = config('payments.gateways.zaincash.secret');
        $jwtPayload = [
            'status' => 'success',
            'orderid' => $order->order_number,
            'id' => 'zc_idem_op_555',
            'msg' => 'success',
        ];
        $token = JWT::encode($jwtPayload, $secret, 'HS256');

        // First webhook
        $resp1 = $this->postJson('/api/v1/payments/webhooks/zaincash', ['token' => $token]);
        $resp1->assertStatus(200);

        // Replay webhook
        $resp2 = $this->postJson('/api/v1/payments/webhooks/zaincash', ['token' => $token]);
        $resp2->assertStatus(200);

        Queue::assertPushed(GenerateTicketsJob::class, 1);
    }

    public function test_zaincash_browser_redirect_returns_http_302(): void
    {
        $order = $this->createPendingOrder('part');
        $initUrl = config('payments.gateways.zaincash.init_url');
        Http::fake([
            $initUrl => Http::response(['id' => 'zc_redirect_op_123'], 200),
        ]);

        $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'zaincash',
        ])->assertStatus(200);

        $secret = config('payments.gateways.zaincash.secret');
        $jwtPayload = [
            'status' => 'success',
            'orderid' => $order->order_number,
            'id' => 'zc_redirect_op_123',
            'msg' => 'success',
        ];
        $token = JWT::encode($jwtPayload, $secret, 'HS256');

        $response = $this->get("/api/v1/payments/webhooks/zaincash?token={$token}", [
            'Accept' => 'text/html,application/xhtml+xml',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect("/ar/order-summary/{$order->order_number}");
    }

    public function test_cross_gateway_duplicate_payment_transitions_to_duplicate_charge_flagged(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('part');

        // First transaction via simulator succeeds
        $pay1 = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'simulator',
        ]);
        $txn1Id = $pay1->json('data.gateway_transaction_id');

        $this->postJson('/api/v1/payments/webhooks/simulator', [
            'transaction_id' => $txn1Id,
            'outcome' => 'success',
            'amount_iqd' => 2600,
        ])->assertStatus(200);

        $order->refresh();
        $this->assertEquals('completed', $order->status);

        // Later, another transaction attempt (e.g. ZainCash) arrives with success
        $initUrl = config('payments.gateways.zaincash.init_url');
        Http::fake([
            $initUrl => Http::response(['id' => 'zc_dup_op_999'], 200),
        ]);

        // Create transaction manually or simulate second initiation before order completed
        $txn2 = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'zaincash',
            'gateway_transaction_id' => 'zc_dup_op_999',
            'amount_iqd' => 2600,
            'currency' => 'IQD',
            'status' => 'initiated',
            'attempt_number' => 2,
            'expires_at' => now()->addMinutes(30),
        ]);

        $secret = config('payments.gateways.zaincash.secret');
        $token = JWT::encode([
            'status' => 'success',
            'orderid' => $order->order_number,
            'id' => 'zc_dup_op_999',
            'msg' => 'success',
        ], $secret, 'HS256');

        $response = $this->postJson('/api/v1/payments/webhooks/zaincash', [
            'token' => $token,
        ]);

        $response->assertStatus(200);

        $txn2->refresh();
        $this->assertEquals('duplicate_charge_flagged', $txn2->status);
        $this->assertNotNull($txn2->paid_at);

        // Verify only 1 ticket generation job occurred total
        Queue::assertPushed(GenerateTicketsJob::class, 1);
    }

    public function test_asiahawala_valid_hmac_signature_fulfills_order(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('bundle');
        Http::fake([
            '*asiahawala*' => Http::response([
                'transaction_ref' => 'AH-TXN-VERIFY-111',
                'checkout_url' => 'https://checkout.asiahawala.iq/pay/AH-TXN-VERIFY-111',
            ], 200),
        ]);

        $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'asiahawala',
            'locale' => 'ar',
        ])->assertStatus(200);

        $secretKey = config('payments.gateways.asiahawala.secret_key');
        $callbackPayload = [
            'transaction_ref' => 'AH-TXN-VERIFY-111',
            'order_number' => $order->order_number,
            'amount' => 13000,
            'currency' => 'IQD',
            'status' => 'PAID',
            'paid_at' => now()->toIso8601String(),
        ];
        $rawContent = json_encode($callbackPayload);
        $signature = hash_hmac('sha256', $rawContent, $secretKey);

        $response = $this->call(
            'POST',
            '/api/v1/payments/webhooks/asiahawala',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_CALLBACK_SIGNATURE' => $signature,
            ],
            $rawContent
        );

        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok');

        $order->refresh();
        $this->assertEquals('completed', $order->status);

        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $order->id,
            'gateway_transaction_id' => 'AH-TXN-VERIFY-111',
            'status' => 'success',
        ]);

        $this->assertDatabaseHas('course_entitlements', [
            'user_id' => $order->user_id,
            'course_id' => $order->items->first()->course_id,
        ]);

        Queue::assertPushed(GenerateTicketsJob::class);
    }

    public function test_asiahawala_tampered_hmac_signature_is_rejected_with_401(): void
    {
        $order = $this->createPendingOrder('part');

        $callbackPayload = [
            'transaction_ref' => 'AH-TXN-TAMPER-222',
            'order_number' => $order->order_number,
            'amount' => 2600,
            'currency' => 'IQD',
            'status' => 'PAID',
        ];
        $rawContent = json_encode($callbackPayload);
        $badSignature = 'bad_tampered_hmac_signature_value';

        $response = $this->call(
            'POST',
            '/api/v1/payments/webhooks/asiahawala',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_CALLBACK_SIGNATURE' => $badSignature,
            ],
            $rawContent
        );

        $response->assertStatus(401)
            ->assertJsonPath('error.code', 'ERR_SIGNATURE_VERIFICATION_FAILED');
    }

    public function test_asiahawala_duplicate_callback_returns_200_without_duplicate_grants(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('part');
        Http::fake([
            '*asiahawala*' => Http::response([
                'transaction_ref' => 'AH-TXN-IDEM-333',
                'checkout_url' => 'https://checkout.asiahawala.iq/pay/AH-TXN-IDEM-333',
            ], 200),
        ]);

        $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
            'gateway' => 'asiahawala',
        ])->assertStatus(200);

        $secretKey = config('payments.gateways.asiahawala.secret_key');
        $callbackPayload = [
            'transaction_ref' => 'AH-TXN-IDEM-333',
            'order_number' => $order->order_number,
            'amount' => 2600,
            'currency' => 'IQD',
            'status' => 'PAID',
        ];
        $rawContent = json_encode($callbackPayload);
        $signature = hash_hmac('sha256', $rawContent, $secretKey);

        $server = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_CALLBACK_SIGNATURE' => $signature,
        ];

        // First callback
        $resp1 = $this->call('POST', '/api/v1/payments/webhooks/asiahawala', [], [], [], $server, $rawContent);
        $resp1->assertStatus(200);

        // Replay callback
        $resp2 = $this->call('POST', '/api/v1/payments/webhooks/asiahawala', [], [], [], $server, $rawContent);
        $resp2->assertStatus(200);

        Queue::assertPushed(GenerateTicketsJob::class, 1);
    }
}
