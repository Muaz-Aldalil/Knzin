<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMediaUrlSanitizationTest extends TestCase
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

    public function test_creating_course_with_javascript_url_is_rejected(): void
    {
        $payload = [
            'title_ar' => 'دورة اختبار',
            'title_en' => 'Test Course',
            'description_ar' => 'وصف الدورة',
            'description_en' => 'Course description',
            'bundle_price_cents' => 1000,
            'cover_image_url' => 'javascript:alert(document.cookie)',
        ];

        $response = $this->withHeaders($this->adminHeaders)
            ->postJson('/api/v1/admin/courses', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cover_image_url']);
    }

    public function test_creating_course_with_data_uri_is_rejected(): void
    {
        $payload = [
            'title_ar' => 'دورة اختبار',
            'title_en' => 'Test Course',
            'description_ar' => 'وصف الدورة',
            'description_en' => 'Course description',
            'bundle_price_cents' => 1000,
            'cover_image_url' => 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        ];

        $response = $this->withHeaders($this->adminHeaders)
            ->postJson('/api/v1/admin/courses', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cover_image_url']);
    }

    public function test_updating_course_with_file_uri_or_html_is_rejected(): void
    {
        $course = Course::factory()->create();

        $response1 = $this->withHeaders($this->adminHeaders)
            ->patchJson("/api/v1/admin/courses/{$course->id}", [
                'cover_image_url' => 'file:///etc/passwd',
            ]);
        $response1->assertStatus(422);
        $response1->assertJsonValidationErrors(['cover_image_url']);

        $response2 = $this->withHeaders($this->adminHeaders)
            ->patchJson("/api/v1/admin/courses/{$course->id}", [
                'cover_image_url' => 'https://example.com/image.jpg"<script>alert(1)</script>',
            ]);
        $response2->assertStatus(422);
        $response2->assertJsonValidationErrors(['cover_image_url']);
    }

    public function test_course_part_with_unsafe_video_and_pdf_urls_is_rejected(): void
    {
        $course = Course::factory()->create();

        // 1. Rejection of javascript: in video_url
        $resVideo = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$course->id}/parts", [
                'title_ar' => 'الجزء الأول',
                'title_en' => 'Part 1',
                'video_url' => 'javascript:stealTokens()',
            ]);
        $resVideo->assertStatus(422);
        $resVideo->assertJsonValidationErrors(['video_url']);

        // 2. Rejection of data: in pdf_url
        $resPdf = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$course->id}/parts", [
                'title_ar' => 'الجزء الأول',
                'title_en' => 'Part 1',
                'pdf_url' => 'data:application/pdf;base64,badpayload',
            ]);
        $resPdf->assertStatus(422);
        $resPdf->assertJsonValidationErrors(['pdf_url']);
    }

    public function test_course_and_part_accept_valid_https_and_storage_urls(): void
    {
        $coursePayload = [
            'title_ar' => 'دورة الصقل المتقدم',
            'title_en' => 'Advanced Polishing Course',
            'description_ar' => 'وصف الدورة بالعربية',
            'description_en' => 'Course description in English',
            'bundle_price_cents' => 2000,
            'cover_image_url' => 'https://images.unsplash.com/photo-test?auto=format',
        ];

        $resCourse = $this->withHeaders($this->adminHeaders)
            ->postJson('/api/v1/admin/courses', $coursePayload);
        $resCourse->assertStatus(201);
        $courseId = $resCourse->json('data.id');

        $partPayload = [
            'title_ar' => 'الجزء الأول: الأساسيات',
            'title_en' => 'Part 1: Fundamentals',
            'video_url' => 'https://stream.knzin.com/lessons/part-1.m3u8',
            'pdf_url' => '/storage/courses/part-1-syllabus.pdf',
        ];

        $resPart = $this->withHeaders($this->adminHeaders)
            ->postJson("/api/v1/admin/courses/{$courseId}/parts", $partPayload);
        $resPart->assertStatus(201);

        $this->assertDatabaseHas('course_parts', [
            'course_id' => $courseId,
            'video_url' => 'https://stream.knzin.com/lessons/part-1.m3u8',
            'pdf_url' => '/storage/courses/part-1-syllabus.pdf',
        ]);
    }
}
