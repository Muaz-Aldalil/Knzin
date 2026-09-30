<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Draw;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CourseCatalogSeeder;
use Database\Seeders\DrawSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ActivityApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CourseCatalogSeeder::class);
    }

    public function test_activity_feed_returns_jsend_structure(): void
    {
        $response = $this->getJson('/api/v1/activity/recent');

        $response->assertStatus(200)
            ->assertHeader('Cache-Control')
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'events' => [
                        '*' => [
                            'id',
                            'type',
                            'text_ar',
                            'text_en',
                            'highlight_label_ar',
                            'highlight_label_en',
                            'timestamp',
                        ],
                    ],
                    'meta' => [
                        'total',
                        'has_live_orders',
                        'polled_at',
                    ],
                ],
            ]);
    }

    public function test_activity_feed_falls_back_to_bulletins_when_no_live_orders(): void
    {
        // Ensure no orders exist
        Order::query()->delete();

        $response = $this->getJson('/api/v1/activity/recent');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertFalse($data['meta']['has_live_orders']);
        $this->assertGreaterThanOrEqual(1, count($data['events']));

        foreach ($data['events'] as $event) {
            $this->assertMatchesRegularExpression('/^evt_(ord|drw|blt)_[a-f0-9]{12}$/', $event['id']);
            $this->assertNotEmpty($event['text_ar']);
            $this->assertNotEmpty($event['text_en']);
            $this->assertNotEmpty($event['highlight_label_ar']);
            $this->assertNotEmpty($event['highlight_label_en']);
            $this->assertNotEmpty($event['timestamp']);
        }
    }

    public function test_activity_feed_returns_sanitized_non_pii_enrollment_events(): void
    {
        $user = User::create([
            'id' => (string) Str::uuid(),
            'display_name' => 'John Private Customer',
            'email' => 'sensitive_customer_email@example.com',
            'auth_provider' => 'guest',
        ]);

        $course = Course::first();
        $orderUuid = (string) Str::uuid();
        $secretOrderNumber = 'ORD-SECRET-998877';
        $secretIp = '198.51.100.42';

        $order = Order::create([
            'id' => $orderUuid,
            'order_number' => $secretOrderNumber,
            'user_id' => $user->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 13100,
            'display_price_label' => '13,000 IQD',
            'promotional_tickets_granted' => 15,
            'status' => 'completed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => $secretIp,
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'price_cents' => 1000,
            'promotional_tickets_granted' => 15,
        ]);

        $response = $this->getJson('/api/v1/activity/recent');
        $response->assertStatus(200);

        $rawResponse = $response->getContent();
        $this->assertStringNotContainsString('sensitive_customer_email@example.com', $rawResponse);
        $this->assertStringNotContainsString('John Private Customer', $rawResponse);
        $this->assertStringNotContainsString($secretIp, $rawResponse);
        $this->assertStringNotContainsString($orderUuid, $rawResponse);
        $this->assertStringNotContainsString($secretOrderNumber, $rawResponse);
        $this->assertStringNotContainsString('terms_agreed_ip', $rawResponse);
        $this->assertStringNotContainsString('user_id', $rawResponse);

        $data = $response->json('data');
        $this->assertTrue($data['meta']['has_live_orders']);

        $enrollmentEvents = array_filter($data['events'], fn($e) => $e['type'] === 'enrollment');
        $this->assertNotEmpty($enrollmentEvents);

        $firstEnrollment = reset($enrollmentEvents);
        $this->assertMatchesRegularExpression('/^evt_ord_[a-f0-9]{12}$/', $firstEnrollment['id']);
        $this->assertStringContainsString($course->title_ar, $firstEnrollment['text_ar']);
        $this->assertStringContainsString($course->title_en, $firstEnrollment['text_en']);
    }

    public function test_activity_feed_includes_countdown_alerts_for_scheduled_draws(): void
    {
        $drawUuid = (string) Str::uuid();
        Draw::create([
            'id' => $drawUuid,
            'tier' => 'monthly',
            'execution_type' => 'live_broadcast',
            'title_ar' => 'سحب الجائزة الكبرى الشهري',
            'title_en' => 'Grand Monthly Draw',
            'status' => 'upcoming',
            'starts_at' => Carbon::now()->addDays(2),
            'ends_at' => Carbon::now()->addDays(3),
            'total_eligible_tickets' => 500,
        ]);

        $response = $this->getJson('/api/v1/activity/recent');
        $response->assertStatus(200);

        $data = $response->json('data');
        $countdownAlerts = array_filter($data['events'], fn($e) => $e['type'] === 'countdown_alert');

        $this->assertNotEmpty($countdownAlerts);
        $alert = reset($countdownAlerts);
        $this->assertMatchesRegularExpression('/^evt_drw_[a-f0-9]{12}$/', $alert['id']);
        $this->assertStringContainsString('سحب الجائزة الكبرى الشهري', $alert['text_ar']);
        $this->assertStringContainsString('Grand Monthly Draw', $alert['text_en']);
    }

    public function test_activity_feed_ignores_pending_and_failed_orders(): void
    {
        $user = User::create([
            'id' => (string) Str::uuid(),
            'display_name' => 'Pending Customer',
            'email' => 'pending@example.com',
            'auth_provider' => 'guest',
        ]);

        $course = Course::first();

        // Create pending order
        $pendingOrder = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'ORD-PENDING-001',
            'user_id' => $user->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 13100,
            'display_price_label' => '13,000 IQD',
            'promotional_tickets_granted' => 15,
            'status' => 'pending',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $pendingOrder->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'price_cents' => 1000,
            'promotional_tickets_granted' => 15,
        ]);

        // Create failed order
        Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'ORD-FAILED-002',
            'user_id' => $user->id,
            'total_amount_cents' => 200,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 2620,
            'display_price_label' => '2,000 IQD',
            'promotional_tickets_granted' => 1,
            'status' => 'failed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->subMinute(),
        ]);

        $response = $this->getJson('/api/v1/activity/recent');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertFalse($data['meta']['has_live_orders']);

        $enrollmentEvents = array_filter($data['events'], fn($e) => $e['type'] === 'enrollment');
        $this->assertEmpty($enrollmentEvents);
    }
}
