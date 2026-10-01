<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlaybackAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected Course $course;
    protected CoursePart $part1;
    protected CoursePart $part2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->course = Course::with('parts')->first();
        $parts = $this->course->parts->sortBy('part_number')->values();
        $this->part1 = $parts[0];
        $this->part2 = $parts[1];
    }

    private function createEntitlement(User $user, Course $course, ?CoursePart $part = null): CourseEntitlement
    {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $user->id,
            'total_amount_cents' => $part ? 200 : 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => $part ? 2620 : 13100,
            'display_price_label' => $part ? '2,000 IQD' : '13,000 IQD',
            'promotional_tickets_granted' => $part ? 1 : 15,
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
            'course_part_id' => $part?->id,
            'order_id' => $order->id,
            'status' => 'active',
        ]);
    }

    public function test_part_1_returns_public_stream_url_with_zero_authentication(): void
    {
        $response = $this->postJson("/api/v1/lessons/{$this->course->slug}/parts/1/playback-auth");

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'course_slug' => $this->course->slug,
                'part_number' => 1,
                'stream' => [
                    'format' => 'hls',
                    'expires_at' => null,
                    'validity_seconds' => null,
                ],
                'watermark' => null,
            ],
        ]);

        $streamUrl = $response->json('data.stream.stream_url');
        $this->assertStringContainsString("/api/v1/media/stream/{$this->course->slug}/1", $streamUrl);

        // Verify public streaming route allows access for Part 1 without signature
        $streamResponse = $this->get($streamUrl);
        $streamResponse->assertStatus(200);
    }

    public function test_part_2_plus_without_authentication_returns_http_401(): void
    {
        $response = $this->postJson("/api/v1/lessons/{$this->course->slug}/parts/2/playback-auth");

        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_UNAUTHORIZED',
        ]);
    }

    public function test_part_2_plus_with_unentitled_user_returns_http_403_err_part_locked(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson("/api/v1/lessons/{$this->course->slug}/parts/2/playback-auth");

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_PART_LOCKED',
            'data' => [
                'code' => 'ERR_PART_LOCKED',
                'pricing' => [
                    'part_price_cents' => (int) $this->part2->part_price_cents,
                    'bundle_price_cents' => (int) $this->course->bundle_price_cents,
                ],
            ],
        ]);
    }

    public function test_part_2_plus_with_entitled_user_returns_signed_stream_url_and_watermark(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $this->createEntitlement($user, $this->course, $this->part2);

        $response = $this->postJson("/api/v1/lessons/{$this->course->slug}/parts/2/playback-auth");

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'course_slug' => $this->course->slug,
                'part_number' => 2,
                'stream' => [
                    'format' => 'hls',
                    'validity_seconds' => 900,
                ],
                'watermark' => [
                    'account_email' => $user->email,
                    'learner_code' => $user->learner_code,
                ],
            ],
        ]);

        $streamUrl = $response->json('data.stream.stream_url');
        $this->assertNotEmpty($streamUrl);
        $this->assertStringContainsString('signature=', $streamUrl);

        // Fetching valid signed stream URL returns HTTP 200
        $streamResponse = $this->get($streamUrl);
        $streamResponse->assertStatus(200);
    }

    public function test_url_signature_tampering_or_expired_timestamp_is_rejected_at_media_origin(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $this->createEntitlement($user, $this->course, $this->part2);

        $authResponse = $this->postJson("/api/v1/lessons/{$this->course->slug}/parts/2/playback-auth");
        $authResponse->assertStatus(200);
        $validStreamUrl = $authResponse->json('data.stream.stream_url');

        // 1. Valid stream access passes
        $this->get($validStreamUrl)->assertStatus(200);

        // 2. Tampered signature fails with 403
        $tamperedUrl = $validStreamUrl . 'tampered';
        $this->get($tamperedUrl)->assertStatus(403);

        // 3. Expired timestamp fails with 403 (travel 16 minutes into future)
        Carbon::setTestNow(now()->addMinutes(16));
        $this->get($validStreamUrl)->assertStatus(403);
        Carbon::setTestNow(); // Reset test clock
    }

    public function test_cross_user_playback_authorization_attempt_is_denied(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // User A purchases Part 2
        $this->createEntitlement($userA, $this->course, $this->part2);

        // User B tries to authorize playback for Part 2
        Sanctum::actingAs($userB, ['*']);

        $response = $this->postJson("/api/v1/lessons/{$this->course->slug}/parts/2/playback-auth");
        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_PART_LOCKED',
        ]);
    }

    public function test_parameter_tampering_mismatched_course_slug_rejected(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        // Non-existent course
        $response1 = $this->postJson('/api/v1/lessons/non-existent-course-slug/parts/1/playback-auth');
        $response1->assertStatus(404);
        $response1->assertJson(['code' => 'ERR_COURSE_NOT_FOUND']);

        // Non-existent part
        $response2 = $this->postJson("/api/v1/lessons/{$this->course->slug}/parts/999/playback-auth");
        $response2->assertStatus(404);
        $response2->assertJson(['code' => 'ERR_PART_NOT_FOUND']);
    }
}
