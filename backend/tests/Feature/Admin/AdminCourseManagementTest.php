<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\User;
use App\Services\MediaProtectionService;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCourseManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected array $adminHeaders;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $this->admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $this->admin->createToken('admin_token')->plainTextToken;
        $this->adminHeaders = ['Authorization' => "Bearer {$token}"];
    }

    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $response = $this->getJson('/api/v1/admin/courses');
        $response->assertStatus(401);
    }

    public function test_user_without_manage_platform_settings_is_forbidden_with_403(): void
    {
        $unauthorizedUser = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
        ]);
        $token = $unauthorizedUser->createToken('test_token')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/v1/admin/courses');

        $response->assertStatus(403);
    }

    public function test_admin_can_list_courses_with_kpis_and_pagination(): void
    {
        Course::factory()->count(3)->create(['is_active' => true]);
        Course::factory()->count(2)->create(['is_active' => false]);

        $response = $this->withHeaders($this->adminHeaders)
            ->getJson('/api/v1/admin/courses');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'items',
                'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
                'kpis' => ['total_courses', 'active_courses', 'total_parts'],
            ],
        ]);

        $this->assertEquals(5, $response->json('data.kpis.total_courses'));
        $this->assertEquals(3, $response->json('data.kpis.active_courses'));
    }

    public function test_admin_can_create_course_with_outcomes_and_audit_trail(): void
    {
        $payload = [
            'title_ar' => 'دورة العناية المتقدمة بالسيارات',
            'title_en' => 'Advanced Auto Detailing Course',
            'slug' => 'advanced-auto-detailing',
            'description_ar' => 'دورة مهنية متقدمة وشاملة في حماية وتلميع هياكل السيارات.',
            'description_en' => 'Comprehensive professional detailing curriculum.',
            'bundle_price_cents' => 1500,
            'bundle_promotional_tickets' => 20,
            'display_price_label' => '19,500 د.ع',
            'curriculum_summary_ar' => 'منهاج تدريبي مقسم لأجزاء عملية تطبيقية.',
            'curriculum_summary_en' => 'Curriculum structured in modular hands-on parts.',
            'outcomes' => [
                [
                    'title_ar' => 'تشخيص سمك الطلاء',
                    'title_en' => 'Paint Thickness Diagnostics',
                    'desc_ar' => 'استخدام مقاييس الميكرون للتشخيص السليم.',
                    'desc_en' => 'Using micron meters for safe diagnosis.',
                ],
            ],
            'justification' => 'Platform vocational catalog launch',
        ];

        $response = $this->withHeaders($this->adminHeaders)
            ->postJson('/api/v1/admin/courses', $payload);

        $response->assertStatus(201);
        $createdId = $response->json('data.id');

        $this->assertDatabaseHas('courses', [
            'id' => $createdId,
            'slug' => 'advanced-auto-detailing',
            'bundle_price_cents' => 1500,
            'bundle_promotional_tickets' => 20,
        ]);

        // Audit trail record
        $this->assertDatabaseHas('admin_activity_logs', [
            'action' => 'create_course',
            'target_id' => $createdId,
            'target_type' => 'course',
            'actor_user_id' => $this->admin->id,
            'outcome' => 'success',
        ]);
    }

    public function test_admin_can_show_course_with_ordered_parts(): void
    {
        $course = Course::factory()->create();
        $part1 = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 1,
            'title_ar' => 'الجزء الأول',
            'title_en' => 'Part 1',
            'syllabus_ar' => 'منهاج الجزء الأول',
            'syllabus_en' => 'Syllabus Part 1',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 30,
            'is_free' => true,
        ]);
        $part2 = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 2,
            'title_ar' => 'الجزء الثاني',
            'title_en' => 'Part 2',
            'syllabus_ar' => 'منهاج الجزء الثاني',
            'syllabus_en' => 'Syllabus Part 2',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 45,
            'is_free' => false,
        ]);

        $response = $this->withHeaders($this->adminHeaders)
            ->getJson("/api/v1/admin/courses/{$course->id}");

        $response->assertStatus(200);
        $this->assertEquals($course->id, $response->json('data.id'));
        $this->assertCount(2, $response->json('data.parts'));
        $this->assertEquals(1, $response->json('data.parts.0.part_number'));
        $this->assertTrue($response->json('data.parts.0.is_free'));
        $this->assertFalse($response->json('data.parts.1.is_free'));
    }

    public function test_admin_can_update_course_and_pricing_with_audit_trail(): void
    {
        $course = Course::factory()->create([
            'bundle_price_cents' => 1000,
            'bundle_promotional_tickets' => 10,
        ]);

        $response = $this->withHeaders($this->adminHeaders)
            ->patchJson("/api/v1/admin/courses/{$course->id}", [
                'title_ar' => 'عنوان محدث بالعربية',
                'title_en' => 'Updated Title in English',
                'bundle_price_cents' => 1200,
                'bundle_promotional_tickets' => 15,
                'justification' => 'Updating pricing for seasonal campaign',
            ]);

        $response->assertStatus(200);
        $this->assertEquals(1200, $response->json('data.bundle_price_cents'));
        $this->assertEquals(15, $response->json('data.bundle_promotional_tickets'));

        $this->assertDatabaseHas('admin_activity_logs', [
            'action' => 'update_course',
            'target_id' => (string) $course->id,
            'actor_user_id' => $this->admin->id,
            'outcome' => 'success',
        ]);
    }

    public function test_admin_can_toggle_course_status(): void
    {
        $course = Course::factory()->create(['is_active' => true]);

        // Toggle to inactive
        $response1 = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$course->id}/toggle-status");
        $response1->assertStatus(200);
        $this->assertFalse($response1->json('data.is_active'));

        // Toggle back to active
        $response2 = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$course->id}/toggle-status");
        $response2->assertStatus(200);
        $this->assertTrue($response2->json('data.is_active'));
    }

    public function test_admin_can_add_modular_part_with_free_preview_and_media_urls(): void
    {
        $course = Course::factory()->create();

        $payload = [
            'title_ar' => 'الجزء الأول: أدوات التشخيص',
            'title_en' => 'Part 1: Diagnostic Tools',
            'duration_minutes' => 40,
            'is_free' => true,
            'video_url' => 'https://stream.knzin.com/lessons/part-1.m3u8',
            'pdf_url' => 'https://static.knzin.com/docs/part-1-guide.pdf',
            'pdf_title_ar' => 'دليل الأدوات.pdf',
            'pdf_title_en' => 'Tools_Guide.pdf',
            'part_price_cents' => 250,
            'part_promotional_tickets' => 2,
        ];

        $response = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$course->id}/parts", $payload);

        $response->assertStatus(201);
        $partId = $response->json('data.id');

        $this->assertDatabaseHas('course_parts', [
            'id' => $partId,
            'course_id' => $course->id,
            'part_number' => 1,
            'is_free' => true,
            'video_url' => 'https://stream.knzin.com/lessons/part-1.m3u8',
            'pdf_url' => 'https://static.knzin.com/docs/part-1-guide.pdf',
        ]);
    }

    public function test_admin_can_update_part_media_and_free_access_flag(): void
    {
        $course = Course::factory()->create();
        $part = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 2,
            'title_ar' => 'الجزء الثاني',
            'title_en' => 'Part 2',
            'syllabus_ar' => 'منهاج الجزء الثاني',
            'syllabus_en' => 'Syllabus Part 2',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 45,
            'is_free' => false,
        ]);

        $response = $this->withHeaders($this->adminHeaders)
            ->patchJson("/api/v1/admin/courses/{$course->id}/parts/{$part->id}", [
                'title_ar' => 'الجزء الثاني: تم التحديث',
                'is_free' => true, // Made free by admin
                'video_url' => 'https://stream.knzin.com/lessons/updated-part-2.m3u8',
            ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.is_free'));
        $this->assertEquals('https://stream.knzin.com/lessons/updated-part-2.m3u8', $response->json('data.video_url'));

        $this->assertDatabaseHas('course_parts', [
            'id' => $part->id,
            'is_free' => true,
            'video_url' => 'https://stream.knzin.com/lessons/updated-part-2.m3u8',
        ]);
    }

    public function test_admin_can_reorder_parts_atomically(): void
    {
        $course = Course::factory()->create();
        $partA = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 1,
            'title_ar' => 'جزء أ',
            'title_en' => 'Part A',
            'syllabus_ar' => 'منهاج أ',
            'syllabus_en' => 'Syllabus A',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 30,
            'is_free' => true,
        ]);
        $partB = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 2,
            'title_ar' => 'جزء ب',
            'title_en' => 'Part B',
            'syllabus_ar' => 'منهاج ب',
            'syllabus_en' => 'Syllabus B',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 30,
            'is_free' => false,
        ]);

        // Reorder B first, then A
        $response = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$course->id}/parts/reorder", [
                'part_ids' => [$partB->id, $partA->id],
            ]);

        $response->assertStatus(200);

        $this->assertEquals(1, $partB->fresh()->part_number);
        $this->assertEquals(2, $partA->fresh()->part_number);
    }

    public function test_learner_protection_course_is_archived_instead_of_deleted_when_active_enrollments_exist(): void
    {
        $course = Course::factory()->create(['is_active' => true]);
        $learner = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $order = Order::factory()->create(['user_id' => $learner->id]);

        // Learner has entitlement
        CourseEntitlement::create([
            'user_id' => $learner->id,
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'access_type' => 'full_bundle',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->adminHeaders)
            ->deleteJson("/api/v1/admin/courses/{$course->id}");

        $response->assertStatus(200);
        $this->assertEquals('archived', $response->json('data.action_taken'));

        // Course record must still exist in DB, but with is_active = false
        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'is_active' => false,
        ]);
    }

    public function test_learner_protection_part_is_archived_instead_of_deleted_when_progress_exists(): void
    {
        $course = Course::factory()->create();
        $part = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 1,
            'title_ar' => 'جزء للتعلم',
            'title_en' => 'Learning Part',
            'syllabus_ar' => 'منهاج تجريبي',
            'syllabus_en' => 'Trial syllabus',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 30,
            'is_active' => true,
        ]);

        $learner = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        LessonProgress::create([
            'user_id' => $learner->id,
            'course_id' => $course->id,
            'course_part_id' => $part->id,
            'seconds_watched' => 300,
            'is_completed' => false,
        ]);

        $response = $this->withHeaders($this->adminHeaders)
            ->deleteJson("/api/v1/admin/courses/{$course->id}/parts/{$part->id}");

        $response->assertStatus(200);
        $this->assertEquals('archived', $response->json('data.action_taken'));

        // Part still exists but is_active = false
        $this->assertDatabaseHas('course_parts', [
            'id' => $part->id,
            'is_active' => false,
        ]);
    }

    public function test_media_protection_service_allows_streaming_for_configured_free_part(): void
    {
        $course = Course::factory()->create();
        $part = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 2, // Even part 2 can be configured as free by admin!
            'title_ar' => 'جزء مجاني ترويجي',
            'title_en' => 'Free Promotional Part',
            'syllabus_ar' => 'منهاج مجاني',
            'syllabus_en' => 'Free syllabus',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 30,
            'is_free' => true,
            'video_url' => 'https://custom.stream/part-2.m3u8',
        ]);

        $learner = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $service = app(MediaProtectionService::class);

        // Even though part_number is 2, because is_free is true, playback generation succeeds without subscription!
        $res = $service->generatePlaybackToken($learner, $course, $part);
        $this->assertEquals($course->slug, $res['course_slug']);
        $this->assertEquals(2, $res['part_number']);
        $this->assertEquals('https://custom.stream/part-2.m3u8', $res['stream']['stream_url']);
    }

    public function test_learner_protection_part_is_archived_when_course_bundle_enrollment_exists(): void
    {
        $course = Course::factory()->create(['is_active' => true]);
        $part = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 2,
            'title_ar' => 'الجزء الثاني',
            'title_en' => 'Part Two',
            'syllabus_ar' => 'منهاج الجزء الثاني',
            'syllabus_en' => 'Part Two syllabus',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 45,
            'is_active' => true,
        ]);
        $learner = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $learner->id]);

        // Learner has full bundle entitlement (course_part_id is null)
        CourseEntitlement::create([
            'user_id' => $learner->id,
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'status' => 'active',
        ]);

        $response = $this->withHeaders($this->adminHeaders)
            ->deleteJson("/api/v1/admin/courses/{$course->id}/parts/{$part->id}");

        $response->assertStatus(200);
        $this->assertEquals('archived', $response->json('data.action_taken'));

        $this->assertDatabaseHas('course_parts', [
            'id' => $part->id,
            'is_active' => false,
        ]);
    }

    public function test_course_action_audit_preserves_authenticated_actor_id(): void
    {
        $course = Course::factory()->create(['is_active' => true]);

        $response = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$course->id}/toggle-status");

        $response->assertStatus(200);

        $this->assertDatabaseHas('admin_activity_logs', [
            'action' => 'toggle_course_status',
            'target_id' => (string) $course->id,
            'actor_user_id' => (string) $this->admin->id,
        ]);
    }

    public function test_course_and_part_without_enrollments_are_hard_deleted(): void
    {
        $course = Course::factory()->create();
        $part = CoursePart::create([
            'course_id' => $course->id,
            'part_number' => 1,
            'title_ar' => 'جزء قابل للحذف',
            'title_en' => 'Deletable Part',
            'syllabus_ar' => 'منهاج قابل للحذف',
            'syllabus_en' => 'Deletable Syllabus',
            'part_price_cents' => 200,
            'part_promotional_tickets' => 1,
            'duration_minutes' => 20,
            'is_free' => false,
        ]);

        // Delete part with zero progress / enrollments -> hard delete
        $partDeleteRes = $this->withHeaders($this->adminHeaders)
            ->deleteJson("/api/v1/admin/courses/{$course->id}/parts/{$part->id}");
        $partDeleteRes->assertStatus(200);
        $this->assertEquals('deleted', $partDeleteRes->json('data.action_taken'));
        $this->assertDatabaseMissing('course_parts', ['id' => $part->id]);

        // Delete course with zero enrollments / orders -> hard delete
        $courseDeleteRes = $this->withHeaders($this->adminHeaders)
            ->deleteJson("/api/v1/admin/courses/{$course->id}");
        $courseDeleteRes->assertStatus(200);
        $this->assertEquals('deleted', $courseDeleteRes->json('data.action_taken'));
        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }
}
