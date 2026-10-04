<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderDualCurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_dual_currency_calculation_for_part_purchase(): void
    {
        $course = Course::with('parts')->first();
        $part = $course->parts->first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'part_buyer@example.com',
            'course_id' => $course->id,
            'course_part_id' => $part->id,
            'item_type' => 'part',
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
            ->assertJsonPath('data.total_amount_cents', 200)
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.exchange_rate', '1.3100')
            ->assertJsonPath('data.paid_amount_gateway', 2600)
            ->assertJsonPath('data.display_price_label', '2,000 IQD')
            ->assertJsonPath('data.promotional_tickets_granted', 1);

        $order = Order::where('idempotency_key', $payload['idempotency_key'])->first();
        $this->assertNotNull($order);
        $this->assertEquals(200, $order->total_amount_cents);
        $this->assertEquals('1.3100', $order->exchange_rate);
        $this->assertEquals(2600, $order->paid_amount_gateway);
        $this->assertEquals('2,000 IQD', $order->display_price_label);
        $this->assertEquals(1, $order->promotional_tickets_granted);
    }

    public function test_dual_currency_calculation_for_bundle_purchase(): void
    {
        $course = Course::first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'bundle_buyer@example.com',
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'intermediate',
                'learning_goal' => 'job_placement',
                'weekly_hours' => '2_to_5',
            ],
        ];

        $response = $this->postJson('/api/v1/checkout/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.total_amount_cents', 1000)
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.exchange_rate', '1.3100')
            ->assertJsonPath('data.paid_amount_gateway', 13000)
            ->assertJsonPath('data.display_price_label', '13,000 IQD')
            ->assertJsonPath('data.promotional_tickets_granted', 15);

        $order = Order::where('idempotency_key', $payload['idempotency_key'])->first();
        $this->assertNotNull($order);
        $this->assertEquals(1000, $order->total_amount_cents);
        $this->assertEquals('1.3100', $order->exchange_rate);
        $this->assertEquals(13000, $order->paid_amount_gateway);
        $this->assertEquals('13,000 IQD', $order->display_price_label);
        $this->assertEquals(15, $order->promotional_tickets_granted);
    }
}
