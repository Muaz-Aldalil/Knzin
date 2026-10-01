<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LessonProgressMonotonicityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Course $course;
    protected CoursePart $part1;
    protected CoursePart $part2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->user = User::factory()->create();
        $this->course = Course::with('parts')->first();
        $parts = $this->course->parts->sortBy('part_number')->values();
        $this->part1 = $parts[0];
        $this->part2 = $parts[1];
    }

    private function createEntitlement(User $user, Course $course, CoursePart $part): CourseEntitlement
    {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $user->id,
            'total_amount_cents' => 200,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 2620,
            'display_price_label' => '2,000 IQD',
            'promotional_tickets_granted' => 1,
            'status' => 'completed',
            'tickets_status' => 'completed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        return CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => $part->id,
            'order_id' => $order->id,
            'status' => 'active',
        ]);
    }

    public function test_unauthenticated_progress_write_returns_http_401(): void
    {
        $response = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 1,
            'watch_seconds' => 100,
            'percent_complete' => 25,
        ]);

        $response->assertStatus(401);
    }

    public function test_unentitled_progress_write_on_paid_part_returns_http_403(): void
    {
        Sanctum::actingAs($this->user, ['*']);

        // Part 2 requires entitlement
        $response = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 2,
            'watch_seconds' => 100,
            'percent_complete' => 25,
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_PART_LOCKED',
        ]);
    }

    public function test_lower_watch_depth_or_percentage_cannot_regress_higher_recorded_values(): void
    {
        Sanctum::actingAs($this->user, ['*']);
        $this->createEntitlement($this->user, $this->course, $this->part2);

        // 1. First report: 600 seconds, 50%
        $response1 = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 2,
            'watch_seconds' => 600,
            'percent_complete' => 50,
        ]);

        $response1->assertStatus(200);
        $this->assertEquals(600, $response1->json('data.progress.watch_seconds'));
        $this->assertEquals(50, $response1->json('data.progress.percent_complete'));

        // 2. Second report: Attempt regression to 120 seconds, 10%
        $response2 = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 2,
            'watch_seconds' => 120,
            'percent_complete' => 10,
        ]);

        $response2->assertStatus(200);
        // Server preserves the higher previous values
        $this->assertEquals(600, $response2->json('data.progress.watch_seconds'));
        $this->assertEquals(50, $response2->json('data.progress.percent_complete'));

        // Verify in database
        $record = LessonProgress::where('user_id', $this->user->id)
            ->where('course_part_id', $this->part2->id)
            ->first();

        $this->assertEquals(600, $record->watch_seconds);
        $this->assertEquals(50, $record->percent_complete);
    }

    public function test_reaching_95_percent_sets_is_completed_true_permanently(): void
    {
        Sanctum::actingAs($this->user, ['*']);
        $this->createEntitlement($this->user, $this->course, $this->part2);

        $response = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 2,
            'watch_seconds' => 1140,
            'percent_complete' => 95,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.progress.is_completed'));

        $record = LessonProgress::where('user_id', $this->user->id)
            ->where('course_part_id', $this->part2->id)
            ->first();

        $this->assertTrue((bool) $record->is_completed);
    }

    public function test_subsequent_lower_watch_report_does_not_reset_is_completed_flag(): void
    {
        Sanctum::actingAs($this->user, ['*']);
        $this->createEntitlement($this->user, $this->course, $this->part2);

        // First reach 95%
        $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 2,
            'watch_seconds' => 1140,
            'percent_complete' => 95,
        ]);

        // Subsequent lower report (rewatching beginning of lesson)
        $response = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 2,
            'watch_seconds' => 200,
            'percent_complete' => 15,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.progress.is_completed'));

        $record = LessonProgress::where('user_id', $this->user->id)
            ->where('course_part_id', $this->part2->id)
            ->first();

        $this->assertTrue((bool) $record->is_completed);
    }

    public function test_percent_complete_rejected_if_out_of_bounds(): void
    {
        Sanctum::actingAs($this->user, ['*']);

        // Negative percentage
        $response1 = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 1,
            'watch_seconds' => 10,
            'percent_complete' => -5,
        ]);
        $response1->assertStatus(422);

        // Exceeding 100 percentage
        $response2 = $this->postJson('/api/v1/progress', [
            'course_slug' => $this->course->slug,
            'part_number' => 1,
            'watch_seconds' => 10,
            'percent_complete' => 105,
        ]);
        $response2->assertStatus(422);
    }
}
