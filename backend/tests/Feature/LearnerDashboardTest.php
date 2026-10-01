<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LearnerDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected Course $course;
    protected CoursePart $part1;
    protected CoursePart $part2;
    protected CoursePart $part3;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->course = Course::with('parts')->first();
        $parts = $this->course->parts->sortBy('part_number')->values();
        $this->part1 = $parts[0];
        $this->part2 = $parts[1];
        $this->part3 = $parts[2];
    }

    private function createOrder(User $user, string $itemType = 'bundle', ?CoursePart $part = null, int $tickets = 15): Order
    {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $user->id,
            'total_amount_cents' => $itemType === 'bundle' ? 1000 : 200,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => $itemType === 'bundle' ? 13100 : 2620,
            'display_price_label' => $itemType === 'bundle' ? '13,000 IQD' : '2,000 IQD',
            'promotional_tickets_granted' => $tickets,
            'status' => 'completed',
            'tickets_status' => 'completed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $this->course->id,
            'course_part_id' => $part?->id,
            'item_type' => $itemType,
            'price_cents' => $itemType === 'bundle' ? 1000 : 200,
            'promotional_tickets_granted' => $tickets,
        ]);

        return $order;
    }

    public function test_get_dashboard_returns_enrolled_courses_progress_and_continuation_hero(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $order = $this->createOrder($user, 'bundle', null, 15);

        // Bundle entitlement
        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'course_part_id' => null,
            'order_id' => $order->id,
            'status' => 'active',
        ]);

        // Promotional ticket
        Ticket::create([
            'user_id' => $user->id,
            'order_id' => $order->id,
            'order_ticket_index' => 1,
            'serial_number' => 'KNZ-26-DASH-0001',
            'issued_at' => now('UTC'),
        ]);

        // Progress on Part 1
        LessonProgress::create([
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'course_part_id' => $this->part1->id,
            'watch_seconds' => 450,
            'percent_complete' => 45,
            'is_completed' => false,
            'last_watched_at' => Carbon::now('UTC'),
        ]);

        $response = $this->getJson('/api/v1/user/dashboard');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'enrolled_courses_count' => 1,
                    'completed_courses_count' => 0,
                    'total_tickets_count' => 1,
                ],
                'active_learning' => [
                    'course_slug' => $this->course->slug,
                    'part_number' => 1,
                    'watch_seconds' => 450,
                    'percent_complete' => 45,
                    'is_completed' => false,
                ],
            ],
        ]);

        $enrolled = $response->json('data.enrolled_courses');
        $this->assertCount(1, $enrolled);
        $this->assertEquals($this->course->id, $enrolled[0]['course_id']);
        $this->assertEquals('bundle', $enrolled[0]['entitlement_type']);
        $totalParts = $this->course->parts->where('is_active', true)->count();
        $this->assertEquals($totalParts, $enrolled[0]['total_active_parts']);
        $this->assertEquals($totalParts, $enrolled[0]['owned_parts_count']);
    }

    public function test_single_part_owner_displays_owned_scope_progress_and_overall_progress_accurately(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $order = $this->createOrder($user, 'part', $this->part2, 1);

        // Modular entitlement: user only owns Part 2
        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'course_part_id' => $this->part2->id,
            'order_id' => $order->id,
            'status' => 'active',
        ]);

        // Completed Part 2 (100%)
        LessonProgress::create([
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'course_part_id' => $this->part2->id,
            'watch_seconds' => 1200,
            'percent_complete' => 100,
            'is_completed' => true,
            'last_watched_at' => Carbon::now('UTC'),
        ]);

        $response = $this->getJson('/api/v1/user/dashboard');
        $response->assertStatus(200);

        $enrolled = $response->json('data.enrolled_courses')[0];
        $totalParts = $this->course->parts->where('is_active', true)->count();

        $this->assertEquals('part', $enrolled['entitlement_type']);
        $this->assertEquals(1, $enrolled['owned_parts_count']);
        $this->assertEquals($totalParts, $enrolled['total_active_parts']);
        $this->assertEquals(1, $enrolled['completed_parts_count']);

        // Owned scope: 100% of the 1 part owned
        $this->assertEquals(100, $enrolled['owned_scope_progress_percentage']);

        // Overall curriculum: 100% on 1 of total active parts
        $expectedOverall = (int) round(100 / $totalParts);
        $this->assertEquals($expectedOverall, $enrolled['overall_progress_percentage']);
        $this->assertFalse($enrolled['is_course_completed']);
    }

    public function test_empty_state_returns_empty_enrolled_list_with_zero_mock_data(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/v1/user/dashboard');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'enrolled_courses_count' => 0,
                    'completed_courses_count' => 0,
                    'total_tickets_count' => 0,
                ],
                'active_learning' => null,
                'enrolled_courses' => [],
            ],
        ]);
    }
}
