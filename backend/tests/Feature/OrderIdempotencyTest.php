<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_replaying_idempotency_key_returns_existing_order_with_200_and_no_duplicates(): void
    {
        $course = Course::first();
        $idempotencyKey = (string) Str::uuid();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'student@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => $idempotencyKey,
            'quiz_answers' => [
                'experience_level' => 'intermediate',
                'learning_goal' => 'job_placement',
                'weekly_hours' => '2_to_5',
            ],
        ];

        // First attempt creates order (HTTP 201)
        $firstResponse = $this->postJson('/api/v1/checkout/orders', $payload);
        $firstResponse->assertStatus(201);
        $orderNumber = $firstResponse->json('data.order_number');

        $this->assertEquals(1, Order::where('idempotency_key', $idempotencyKey)->count());

        // Second attempt with exact same idempotency_key returns existing order with HTTP 200
        $secondResponse = $this->postJson('/api/v1/checkout/orders', $payload);
        $secondResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.order_number', $orderNumber);

        // Database must still contain exactly 1 order row
        $this->assertEquals(1, Order::where('idempotency_key', $idempotencyKey)->count());
    }
}
