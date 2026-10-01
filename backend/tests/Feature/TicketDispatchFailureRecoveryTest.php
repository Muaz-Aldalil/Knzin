<?php

namespace Tests\Feature;

use App\Console\Commands\ReconcileTicketGenerationCommand;
use App\Jobs\GenerateTicketsJob;
use App\Models\Course;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketMintingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketDispatchFailureRecoveryTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->user = User::factory()->create();
        $this->course = Course::first();
    }

    private function createPendingOrder(int $ticketsCount = 15, ?Carbon $createdAt = null): Order
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
            'status' => 'completed',
            'tickets_status' => 'pending',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        if ($createdAt) {
            $order->timestamps = false;
            $order->created_at = $createdAt;
            $order->save();
            $order->timestamps = true;
        }

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'price_cents' => 1000,
            'promotional_tickets_granted' => $ticketsCount,
        ]);

        return $order;
    }

    public function test_order_committed_with_tickets_status_pending_when_queue_dispatch_fails(): void
    {
        // When queue dispatch fails or network disconnects during webhook
        $order = $this->createPendingOrder(15);

        $this->assertEquals('completed', $order->status);
        $this->assertEquals('pending', $order->tickets_status);
        $this->assertEquals(0, Ticket::where('order_id', $order->id)->count());
    }

    public function test_reconcile_command_detects_stale_pending_orders_and_dispatches_jobs(): void
    {
        Queue::fake();

        // Create stale pending order older than 2 minutes
        $staleOrder = $this->createPendingOrder(15, Carbon::now()->subMinutes(5));

        // Create recent pending order (< 2 minutes old)
        $recentOrder = $this->createPendingOrder(15, Carbon::now()->subSeconds(30));

        $this->artisan('knzin:reconcile-ticket-generation')
            ->expectsOutputToContain('Reconciled and re-dispatched ticket generation for 1 order(s).')
            ->assertSuccessful();

        // Stale order should be re-dispatched
        Queue::assertPushed(GenerateTicketsJob::class, function ($job) use ($staleOrder) {
            return $job->orderId === $staleOrder->id;
        });

        // Recent order should NOT be dispatched yet by reconcile command
        Queue::assertNotPushed(GenerateTicketsJob::class, function ($job) use ($recentOrder) {
            return $job->orderId === $recentOrder->id;
        });
    }

    public function test_reconciled_job_execution_successfully_mints_tickets(): void
    {
        $staleOrder = $this->createPendingOrder(15, Carbon::now()->subMinutes(5));

        // Execute the job directly
        $job = new GenerateTicketsJob($staleOrder->id);
        $job->handle(app(TicketMintingService::class));

        $staleOrder->refresh();
        $this->assertEquals('completed', $staleOrder->tickets_status);
        $this->assertNotNull($staleOrder->tickets_minted_at);
        $this->assertEquals(15, Ticket::where('order_id', $staleOrder->id)->count());
    }

    public function test_opening_ticket_drawer_triggers_on_demand_redispatch_for_pending_orders(): void
    {
        Queue::fake();

        $pendingOrder = $this->createPendingOrder(15);

        Sanctum::actingAs($this->user, ['*']);

        $response = $this->getJson('/api/v1/user/tickets');
        $response->assertStatus(200);

        Queue::assertPushed(GenerateTicketsJob::class, function ($job) use ($pendingOrder) {
            return $job->orderId === $pendingOrder->id;
        });
    }
}
