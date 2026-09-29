<?php

namespace Tests\Feature;

use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LegalShieldValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_order_creation_succeeds_with_exact_canonical_legal_shield(): void
    {
        $course = Course::with('parts')->first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'guest@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ];

        $response = $this->postJson('/api/v1/checkout/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.legal_terms_agreed', true);
    }

    public function test_order_creation_rejects_modified_legal_shield_with_422(): void
    {
        $course = Course::first();
        $tamperedText = "أوافق على الشروط وسياسة الخصوصية وأشتري كورس"; // Tampered / shortened string

        $payload = [
            'email' => 'guest@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => $tamperedText,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ];

        $response = $this->postJson('/api/v1/checkout/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'fail')
            ->assertJsonPath('code', 'ERR_LEGAL_SHIELD_MISMATCH');
    }

    public function test_order_creation_rejects_unagreed_legal_terms(): void
    {
        $course = Course::first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'guest@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => false,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ];

        $response = $this->postJson('/api/v1/checkout/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'fail');
    }
}
