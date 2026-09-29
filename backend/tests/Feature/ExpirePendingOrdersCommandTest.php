<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ExpirePendingOrdersCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_expired_orders_transition_to_failed_while_fresh_orders_remain_pending(): void
    {
        $course = Course::first();
        $orderService = app(OrderService::class);

        // 1. Create order 1 (which will be expired)
        $order1 = $orderService->createOrder([
            'email' => 'expired_user@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ])['order'];

        // Artificially age order 1 past the 48-hour TTL
        $order1->update([
            'expires_at' => now()->subMinutes(10),
        ]);

        // 2. Create order 2 (fresh order with 48h validity)
        $order2 = $orderService->createOrder([
            'email' => 'fresh_user@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'intermediate',
                'learning_goal' => 'job_placement',
                'weekly_hours' => '2_to_5',
            ],
        ])['order'];

        // 3. Run artisan console command
        $this->artisan('orders:expire-pending')
            ->expectsOutputToContain('Expired 1 pending order(s)')
            ->assertExitCode(0);

        // 4. Verify statuses
        $reloadedOrder1 = Order::find($order1->id);
        $reloadedOrder2 = Order::find($order2->id);

        $this->assertEquals('failed', $reloadedOrder1->status);
        $this->assertEquals('pending', $reloadedOrder2->status);
    }
}
