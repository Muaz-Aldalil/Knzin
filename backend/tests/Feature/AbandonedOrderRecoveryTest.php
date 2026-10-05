<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Notifications\AbandonedOrderRecoveryNotification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class AbandonedOrderRecoveryTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'abandoner@example.com',
            'display_name' => 'Pending Learner',
        ]);
    }

    private function createOrder(string $status, Carbon $createdAt, ?Carbon $sentAt = null): Order
    {
        Carbon::setTestNow($createdAt);

        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $this->user->id,
            'total_amount_cents' => 2500,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 32750,
            'display_price_label' => '32,750 IQD',
            'promotional_tickets_granted' => 20,
            'status' => $status,
            'tickets_status' => 'pending',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => $createdAt,
            'recovery_notification_sent_at' => $sentAt,
        ]);

        Carbon::setTestNow();

        return $order->fresh();
    }

    public function test_evaluates_and_notifies_pending_orders_older_than_two_hours(): void
    {
        Notification::fake();

        // 1. Pending order created 2.5 hours ago - SHOULD be notified
        $eligibleOrder = $this->createOrder('pending', Carbon::now()->subHours(2)->subMinutes(30));

        // 2. Pending order created 30 minutes ago - SHOULD NOT be notified (< 2h)
        $recentOrder = $this->createOrder('pending', Carbon::now()->subMinutes(30));

        // 3. Completed order created 3 hours ago - SHOULD NOT be notified
        $completedOrder = $this->createOrder('completed', Carbon::now()->subHours(3));

        // 4. Pending order created 3 hours ago but already notified - SHOULD NOT be notified
        $alreadyNotifiedOrder = $this->createOrder(
            'pending',
            Carbon::now()->subHours(3),
            Carbon::now()->subHour()
        );

        $exitCode = Artisan::call('notifications:evaluate-abandoned-orders');
        $this->assertEquals(0, $exitCode);

        // Assert notification dispatched ONLY for eligible order
        Notification::assertSentTo(
            $this->user,
            AbandonedOrderRecoveryNotification::class,
            function (AbandonedOrderRecoveryNotification $notification) use ($eligibleOrder) {
                return $notification->order->id === $eligibleOrder->id;
            }
        );

        Notification::assertSentTimes(AbandonedOrderRecoveryNotification::class, 1);

        // Assert recovery_notification_sent_at was stamped
        $eligibleOrder->refresh();
        $this->assertNotNull($eligibleOrder->recovery_notification_sent_at);

        $recentOrder->refresh();
        $this->assertNull($recentOrder->recovery_notification_sent_at);

        $completedOrder->refresh();
        $this->assertNull($completedOrder->recovery_notification_sent_at);
    }

    public function test_prevents_duplicate_notifications_on_subsequent_runs(): void
    {
        Notification::fake();

        $order = $this->createOrder('pending', Carbon::now()->subHours(4));

        // First run
        Artisan::call('notifications:evaluate-abandoned-orders');

        $order->refresh();
        $this->assertNotNull($order->recovery_notification_sent_at);

        Notification::assertSentTimes(AbandonedOrderRecoveryNotification::class, 1);

        // Second run - should be completely suppressed
        Artisan::call('notifications:evaluate-abandoned-orders');

        Notification::assertSentTimes(AbandonedOrderRecoveryNotification::class, 1);
    }
}
