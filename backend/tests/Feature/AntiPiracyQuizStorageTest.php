<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AntiPiracyQuizStorageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_quiz_answers_are_stored_verbatim_with_timestamp_and_zero_scoring(): void
    {
        $course = Course::first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $quizPayload = [
            'experience_level' => 'advanced',
            'learning_goal' => 'freelancing',
            'weekly_hours' => 'more_than_10',
        ];

        $payload = [
            'email' => 'quiz_taker@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => $quizPayload,
        ];

        $response = $this->postJson('/api/v1/checkout/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        $order = Order::where('idempotency_key', $payload['idempotency_key'])->first();
        $this->assertNotNull($order);
        $this->assertEquals($quizPayload, $order->quiz_answers);
        $this->assertNotNull($order->quiz_completed_at);
        $this->assertEquals('pending', $order->status); // Unaffected by answers
    }
}
