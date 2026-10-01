<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DownloadAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected Course $courseA;
    protected Course $courseB;
    protected CoursePart $part1;
    protected CoursePart $part2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $courses = Course::with('parts')->get();
        $this->courseA = $courses[0];
        $this->courseB = $courses[1];

        $partsA = $this->courseA->parts->sortBy('part_number')->values();
        $this->part1 = $partsA[0];
        $this->part2 = $partsA[1];
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

    /**
     * 1. Authorized learner requesting correct resource succeeds.
     */
    public function test_authorized_learner_requesting_correct_resource_succeeds(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $this->createEntitlement($user, $this->courseA, $this->part2);

        $response = $this->postJson("/api/v1/lessons/{$this->courseA->slug}/parts/2/downloads/schematic-v1");

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'resource_id' => 'schematic-v1',
                'mime_type' => 'application/pdf',
                'validity_seconds' => 900,
            ],
        ]);

        $downloadUrl = $response->json('data.download_url');
        $this->assertNotEmpty($downloadUrl);
        $this->assertStringContainsString('signature=', $downloadUrl);

        // Accessing signed download URL returns HTTP 200 attachment
        $downloadResponse = $this->get($downloadUrl);
        $downloadResponse->assertStatus(200);
        $downloadResponse->assertHeader('Content-Disposition', 'attachment; filename="schematic-v1.pdf"');
    }

    /**
     * 2. Unauthorized / unauthenticated learner is denied (HTTP 401).
     */
    public function test_unauthenticated_learner_is_denied(): void
    {
        $response = $this->postJson("/api/v1/lessons/{$this->courseA->slug}/parts/2/downloads/schematic-v1");

        $response->assertStatus(401);
    }

    /**
     * 3. Learner with entitlement for another course is denied (HTTP 403).
     */
    public function test_learner_from_another_course_is_denied(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        // User owns Course B, but attempts to download Course A attachment
        $this->createEntitlement($user, $this->courseB, null);

        $response = $this->postJson("/api/v1/lessons/{$this->courseA->slug}/parts/2/downloads/schematic-v1");

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_RESOURCE_LOCKED',
        ]);
    }

    /**
     * 4. Learner lacking required part entitlement is denied (HTTP 403).
     */
    public function test_learner_lacking_part_entitlement_is_denied(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        // User owns Part 1 of Course A, but attempts to download Part 2 attachment
        $this->createEntitlement($user, $this->courseA, $this->part1);

        $response = $this->postJson("/api/v1/lessons/{$this->courseA->slug}/parts/2/downloads/schematic-v1");

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_RESOURCE_LOCKED',
        ]);
    }

    /**
     * 5. Tampered resource identifier with invalid characters is rejected (HTTP 400).
     */
    public function test_tampered_resource_identifier_is_rejected(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);
        $this->createEntitlement($user, $this->courseA, $this->part2);

        // Path traversal or illegal characters
        $response = $this->postJson("/api/v1/lessons/{$this->courseA->slug}/parts/2/downloads/invalid@resource!id");

        $response->assertStatus(400);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_INVALID_RESOURCE_ID',
        ]);
    }

    /**
     * 6. Expired signed access is denied at media origin (travel 16 minutes).
     */
    public function test_expired_signed_download_url_is_denied(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);
        $this->createEntitlement($user, $this->courseA, $this->part2);

        $response = $this->postJson("/api/v1/lessons/{$this->courseA->slug}/parts/2/downloads/schematic-v1");
        $downloadUrl = $response->json('data.download_url');

        // Verify valid now
        $this->get($downloadUrl)->assertStatus(200);

        // Fast forward 16 minutes
        Carbon::setTestNow(now()->addMinutes(16));
        $this->get($downloadUrl)->assertStatus(403);
        Carbon::setTestNow();
    }

    /**
     * 7. Direct public access to protected media without signature is denied.
     */
    public function test_direct_public_access_without_signature_is_denied(): void
    {
        $directUrl = "/api/v1/media/download/{$this->courseA->slug}/2/schematic-v1";

        $response = $this->get($directUrl);
        $response->assertStatus(403);
    }

    /**
     * 8. Signed access cannot be reused outside intended resource/context.
     */
    public function test_signed_access_cannot_be_reused_for_different_resource(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);
        $this->createEntitlement($user, $this->courseA, $this->part2);

        $response = $this->postJson("/api/v1/lessons/{$this->courseA->slug}/parts/2/downloads/schematic-v1");
        $downloadUrl = $response->json('data.download_url');

        // Swap resourceId in URL while keeping the same signature
        $tamperedUrl = str_replace('schematic-v1', 'other-secret-file', $downloadUrl);

        $this->get($tamperedUrl)->assertStatus(403);
    }
}
