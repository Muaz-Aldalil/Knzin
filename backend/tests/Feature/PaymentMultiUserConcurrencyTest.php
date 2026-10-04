<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentMultiUserConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    protected function createOrderForUser(User $user, string $itemType = 'part'): Order
    {
        $course = Course::with('parts')->firstOrFail();
        $part = $course->parts->firstOrFail();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => $user->email,
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

        $request = $this->actingAs($user, 'sanctum')->postJson('/api/v1/checkout/orders', $payload);
        $request->assertStatus(201);

        auth()->forgetGuards();

        return Order::where('idempotency_key', $payload['idempotency_key'])->firstOrFail();
    }

    protected function createGuestOrder(string $email, string $itemType = 'part'): Order
    {
        auth()->forgetGuards();

        $course = Course::with('parts')->firstOrFail();
        $part = $course->parts->firstOrFail();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => $email,
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

        $request = $this->postJson('/api/v1/checkout/orders', $payload);
        $request->assertStatus(201);

        return Order::where('idempotency_key', $payload['idempotency_key'])->firstOrFail();
    }

    public function test_authenticated_user_cannot_initiate_payment_for_another_users_order(): void
    {
        $userA = User::factory()->create(['email' => 'user_a@example.com', 'auth_provider' => 'google']);
        $userB = User::factory()->create(['email' => 'user_b@example.com', 'auth_provider' => 'google']);

        $orderA = $this->createOrderForUser($userA, 'part');

        // User B attempts to pay for User A's order
        $response = $this->actingAs($userB, 'sanctum')->postJson("/api/v1/checkout/orders/{$orderA->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'ERR_FORBIDDEN');
    }

    public function test_authenticated_user_cannot_view_payment_status_for_another_users_order(): void
    {
        $userA = User::factory()->create(['email' => 'user_a_status@example.com', 'auth_provider' => 'google']);
        $userB = User::factory()->create(['email' => 'user_b_status@example.com', 'auth_provider' => 'google']);

        $orderA = $this->createOrderForUser($userA, 'part');

        // User B attempts to query status for User A's order
        $response = $this->actingAs($userB, 'sanctum')->getJson("/api/v1/checkout/orders/{$orderA->order_number}/payment-status");

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'ERR_FORBIDDEN');
    }

    public function test_anonymous_guest_cannot_pay_for_authenticated_users_order(): void
    {
        $userA = User::factory()->create(['email' => 'auth_user@example.com', 'auth_provider' => 'google']);
        $orderA = $this->createOrderForUser($userA, 'part');

        auth()->forgetGuards();
        $this->app['auth']->forgetGuards();

        // Anonymous unauthenticated request
        $response = $this->postJson("/api/v1/checkout/orders/{$orderA->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'ERR_UNAUTHORIZED');
    }

    public function test_anonymous_guest_can_pay_and_check_status_for_guest_order(): void
    {
        $guestOrder = $this->createGuestOrder('guest_buyer@example.com', 'part');

        // Anonymous request can initiate payment on guest order
        $payResponse = $this->postJson("/api/v1/checkout/orders/{$guestOrder->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);

        $payResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // Anonymous request can poll status on guest order
        $statusResponse = $this->getJson("/api/v1/checkout/orders/{$guestOrder->order_number}/payment-status");
        $statusResponse->assertStatus(200)
            ->assertJsonPath('data.order_number', $guestOrder->order_number);
    }

    public function test_matching_email_user_can_pay_for_prior_guest_order(): void
    {
        $guestOrder = $this->createGuestOrder('returning_learner@example.com', 'part');

        // User registers/authenticates with matching email
        $user = User::factory()->create(['email' => 'returning_learner@example.com', 'auth_provider' => 'google']);

        $payResponse = $this->actingAs($user, 'sanctum')->postJson("/api/v1/checkout/orders/{$guestOrder->order_number}/pay", [
            'gateway' => 'simulator',
            'locale' => 'ar',
        ]);

        $payResponse->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_multiple_concurrent_users_checkout_pay_and_fulfill_without_conflicts(): void
    {
        $users = [];
        $orders = [];
        $gatewayTxnIds = [];

        // 1. Create 5 distinct users and orders with mixed types
        for ($i = 1; $i <= 5; $i++) {
            $isAuth = ($i % 2 === 1);
            $itemType = ($i % 2 === 0) ? 'bundle' : 'part';
            $email = "concurrent_user_{$i}@example.com";

            if ($isAuth) {
                $user = User::factory()->create(['email' => $email, 'auth_provider' => 'google']);
                $order = $this->createOrderForUser($user, $itemType);
            } else {
                $order = $this->createGuestOrder($email, $itemType);
                $user = $order->user;
            }

            $users[$i] = $user;
            $orders[$i] = $order;
        }

        // 2. Initiate payments for all 5 orders
        for ($i = 1; $i <= 5; $i++) {
            $order = $orders[$i];
            $user = $users[$i];
            $isAuth = ($i % 2 === 1);

            if ($isAuth) {
                $this->actingAs($user, 'sanctum');
            } else {
                auth()->forgetGuards();
            }

            $payResp = $this->postJson("/api/v1/checkout/orders/{$order->order_number}/pay", [
                'gateway' => 'simulator',
                'locale' => 'ar',
            ]);

            $payResp->assertStatus(200);
            $gatewayTxnIds[$i] = $payResp->json('data.gateway_transaction_id');
        }

        // Assert all 5 gateway transaction IDs are unique
        $this->assertCount(5, array_unique($gatewayTxnIds));

        // 3. Process webhooks in interleaved order (e.g., 3, 1, 5, 2, 4)
        auth()->forgetGuards();
        $interleavedIndices = [3, 1, 5, 2, 4];
        foreach ($interleavedIndices as $idx) {
            $order = $orders[$idx];
            $txnId = $gatewayTxnIds[$idx];
            $amount = $order->paid_amount_gateway;

            $webhookResp = $this->postJson('/api/v1/payments/webhooks/simulator', [
                'transaction_id' => $txnId,
                'outcome' => 'success',
                'amount_iqd' => $amount,
            ]);

            $webhookResp->assertStatus(200);
        }

        // 4. Verify all 5 orders are fulfilled with exact, isolated invariants
        $allMintedTicketSerials = [];

        for ($i = 1; $i <= 5; $i++) {
            $order = $orders[$i]->fresh();
            $user = $users[$i];

            $this->assertEquals('completed', $order->status);

            // Verify entitlement belongs strictly to this user
            $this->assertDatabaseHas('course_entitlements', [
                'user_id' => $user->id,
                'course_id' => $order->items->first()->course_id,
            ]);

            // Verify tickets
            $tickets = Ticket::where('order_id', $order->id)->get();
            $expectedTickets = (int) $order->promotional_tickets_granted;
            $this->assertCount($expectedTickets, $tickets);

            foreach ($tickets as $ticket) {
                $this->assertEquals($user->id, $ticket->user_id);
                $allMintedTicketSerials[] = $ticket->serial_number;
            }

            // Verify transaction status
            $this->assertDatabaseHas('payment_transactions', [
                'gateway_transaction_id' => $gatewayTxnIds[$i],
                'status' => 'success',
            ]);
        }

        // Invariant: All ticket serials across all users are completely unique
        $this->assertCount(count($allMintedTicketSerials), array_unique($allMintedTicketSerials));
    }
}
