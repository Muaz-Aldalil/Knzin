<?php

namespace Tests\Feature;

use App\Jobs\GenerateTicketsJob;
use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Notifications\OrderConfirmationNotification;
use App\Notifications\TicketIssuanceNotification;
use App\Services\OrderService;
use App\Services\TicketMintingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class OrderNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Course $course;
    protected CoursePart $part;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->user = User::factory()->create([
            'email' => 'learner@example.com',
            'display_name' => 'Test Learner',
        ]);

        $this->course = Course::with('parts')->first();
        $this->part = $this->course->parts->first();
    }

    private function createPendingOrder(int $ticketsCount = 15): Order
    {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $this->user->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 13100,
            'display_price_label' => '13,000 IQD',
            'promotional_tickets_granted' => $ticketsCount,
            'status' => 'pending',
            'tickets_status' => 'pending',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $this->course->id,
            'course_part_id' => null,
            'item_type' => 'bundle',
            'price_cents' => 1000,
            'promotional_tickets_granted' => $ticketsCount,
        ]);

        return $order;
    }

    public function test_order_fulfillment_dispatches_order_confirmation_notification(): void
    {
        Notification::fake();

        $order = $this->createPendingOrder();
        $orderService = app(OrderService::class);

        $fulfilledOrder = $orderService->fulfillOrder($order);

        $this->assertEquals('completed', $fulfilledOrder->status);

        Notification::assertSentTo(
            $this->user,
            OrderConfirmationNotification::class,
            function (OrderConfirmationNotification $notification) use ($order) {
                return $notification->order->id === $order->id;
            }
        );
    }

    public function test_order_confirmation_notification_stores_valid_database_record_and_is_idempotent(): void
    {
        $order = $this->createPendingOrder();

        $notification = new OrderConfirmationNotification($order);
        $this->user->notify($notification);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->user->id,
            'notifiable_type' => User::class,
        ]);

        $dbNotification = $this->user->notifications()->first();
        $this->assertNotNull($dbNotification);
        $this->assertEquals('transactional', $dbNotification->data['category']);
        $this->assertEquals($order->order_number, $dbNotification->data['metadata']['order_number']);
        $this->assertEquals("/orders/{$order->id}", $dbNotification->data['action_url']);

        // Concurrency-safe duplicate dispatch test: deterministic UUIDv5 primary key prevents duplicates
        $expectedId = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "order_confirmed:{$order->id}:{$order->user_id}"
        )->toString();
        $this->assertEquals($expectedId, $dbNotification->id);

        // Attempting to notify again with same notification instance should not throw and produces exactly one record
        $duplicateNotification = new OrderConfirmationNotification($order);
        $this->user->notify($duplicateNotification);

        $this->assertEquals(1, $this->user->notifications()->count());

        // A different legitimate event (e.g. second order) produces a new notification
        $secondOrder = $this->createPendingOrder();
        $secondNotification = new OrderConfirmationNotification($secondOrder);
        $this->user->notify($secondNotification);

        $this->assertEquals(2, $this->user->notifications()->count());
    }

    public function test_generate_tickets_job_dispatches_ticket_issuance_notification(): void
    {
        $order = $this->createPendingOrder(5);
        $order->update(['status' => 'completed', 'tickets_status' => 'pending']);

        // Run the job synchronously
        $job = new GenerateTicketsJob($order->id);
        $job->handle(app(TicketMintingService::class));

        // Verify tickets created
        $this->assertEquals(5, $order->tickets()->count());

        // Verify notification persisted to database
        $notification = $this->user->notifications()
            ->where('data->category', 'transactional')
            ->where('data->entity_type', 'order')
            ->where('data->action_url', '/tickets')
            ->first();

        $this->assertNotNull($notification);
        $this->assertEquals(5, $notification->data['metadata']['ticket_count']);
        $this->assertCount(5, $notification->data['metadata']['serials']);
    }
}
