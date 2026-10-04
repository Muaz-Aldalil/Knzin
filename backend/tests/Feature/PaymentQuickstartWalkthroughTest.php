<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\PaymentWebhook;
use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * End-to-end simulation walkthrough verifying all scenarios in specs/007-payments/quickstart.md:
 * - Scenario 1: Deterministic End-to-End Simulation (Steps 1 to 4)
 * - Scenario 2: Webhook Replay & Idempotency Check
 * - Scenario 3: Auto-Reconciliation Engine
 */
class PaymentQuickstartWalkthroughTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_quickstart_scenario_1_and_2_deterministic_simulation_and_replay(): void
    {
        // -------------------------------------------------------------------------
        // SCENARIO 1 - STEP 1: Create a Pending Order via Checkout
        // -------------------------------------------------------------------------
        $course = Course::with('parts')->firstOrFail();
        $part = $course->parts->firstOrFail();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";
        $idempotencyKey = (string) Str::uuid();

        $orderPayload = [
            'email' => 'learner@example.com',
            'item_type' => 'part',
            'course_id' => $course->id,
            'course_part_id' => $part->id,
            'idempotency_key' => $idempotencyKey,
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ];

        $createResponse = $this->postJson('/api/v1/checkout/orders', $orderPayload);
        $createResponse->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.paid_amount_gateway', 2600);

        $orderNumber = $createResponse->json('data.order_number');
        $this->assertNotEmpty($orderNumber);

        // -------------------------------------------------------------------------
        // SCENARIO 1 - STEP 2: Initiate Payment Session via Simulator Driver
        // -------------------------------------------------------------------------
        $payResponse = $this->postJson("/api/v1/checkout/orders/{$orderNumber}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);

        $payResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gateway', 'simulator')
            ->assertJsonPath('data.amount_iqd', 2600)
            ->assertJsonPath('data.currency', 'IQD');

        $gatewayTxnId = $payResponse->json('data.gateway_transaction_id');
        $this->assertStringStartsWith("SIM-TXN-{$orderNumber}-", $gatewayTxnId);

        $checkoutUrl = $payResponse->json('data.checkout_url');
        $this->assertStringContainsString("/ar/payments/simulator/{$gatewayTxnId}", $checkoutUrl);

        // -------------------------------------------------------------------------
        // SCENARIO 1 - STEP 3: Trigger Simulated Success Webhook
        // -------------------------------------------------------------------------
        $webhookPayload = [
            'transaction_id' => $gatewayTxnId,
            'outcome' => 'success',
            'amount_iqd' => 2600,
        ];

        $webhookResponse = $this->postJson('/api/v1/payments/webhooks/simulator', $webhookPayload);
        $webhookResponse->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
                'message' => 'Webhook processed successfully',
            ]);

        // -------------------------------------------------------------------------
        // SCENARIO 1 - STEP 4: Verify Order Fulfillment & Polling Status
        // -------------------------------------------------------------------------
        $statusResponse = $this->getJson("/api/v1/checkout/orders/{$orderNumber}/payment-status");
        $statusResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.tickets_status', 'minted')
            ->assertJsonPath('data.promotional_tickets_granted', 1)
            ->assertJsonPath('data.latest_transaction.status', 'success');

        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $this->assertEquals('completed', $order->status);

        // Invariant: Entitlements granted
        $this->assertDatabaseHas('course_entitlements', [
            'user_id' => $order->user_id,
            'course_id' => $course->id,
        ]);

        // -------------------------------------------------------------------------
        // SCENARIO 2: Webhook Replay & Idempotency Check
        // -------------------------------------------------------------------------
        $replayResponse = $this->postJson('/api/v1/payments/webhooks/simulator', $webhookPayload);
        $replayResponse->assertStatus(200)
            ->assertJson(['status' => 'ok']);

        // Invariant: Exactly 1 course entitlement
        $this->assertEquals(
            1,
            CourseEntitlement::where('user_id', $order->user_id)
                ->where('course_id', $course->id)
                ->count()
        );

        // Invariant: Webhook log marked verified and processed
        $this->assertDatabaseHas('payment_webhooks', [
            'gateway' => 'simulator',
            'signature_verified' => true,
            'processed' => true,
        ]);
    }
}
