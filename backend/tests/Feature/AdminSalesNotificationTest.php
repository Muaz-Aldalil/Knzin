<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Notifications\CoursePurchasedAdminNotification;
use App\Services\OrderService;
use App\Support\AdminCapabilities;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class AdminSalesNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $learner;
    protected User $managingAdmin;
    protected User $financeAdmin;
    protected User $auditAdmin;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->learner = User::factory()->create([
            'email' => 'student@knzin.com',
            'display_name' => 'Ahmed Student',
        ]);

        // 1. Admin with manage_platform_settings
        $this->managingAdmin = User::factory()->create([
            'email' => 'platform_admin@knzin.com',
            'display_name' => 'Platform Admin',
            'status' => 'active',
        ]);
        $this->managingAdmin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        // 2. Admin with settle_affiliate_payout
        $this->financeAdmin = User::factory()->create([
            'email' => 'finance_admin@knzin.com',
            'display_name' => 'Finance Admin',
            'status' => 'active',
        ]);
        $this->financeAdmin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT);

        // 3. Low-privilege admin (only issue_draw_audit_approval)
        $this->auditAdmin = User::factory()->create([
            'email' => 'audit_admin@knzin.com',
            'display_name' => 'Audit Admin',
            'status' => 'active',
        ]);
        $this->auditAdmin->grantCapability(AdminCapabilities::ISSUE_DRAW_AUDIT_APPROVAL);

        $this->course = Course::first();
    }

    private function createPendingOrder(int $cents = 15000): Order
    {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $this->learner->id,
            'total_amount_cents' => $cents,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => $cents,
            'display_price_label' => '$150.00',
            'promotional_tickets_granted' => 10,
            'status' => 'pending',
            'tickets_status' => 'pending',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $this->course->id,
            'course_part_id' => null,
            'item_type' => 'bundle',
            'price_cents' => $cents,
            'promotional_tickets_granted' => 10,
        ]);

        return $order;
    }

    public function test_order_fulfillment_dispatches_sales_notification_to_authorized_admins_only(): void
    {
        Notification::fake();

        $order = $this->createPendingOrder();
        $orderService = app(OrderService::class);
        $orderService->fulfillOrder($order);

        // Authorized admins must receive the notification
        Notification::assertSentTo($this->managingAdmin, CoursePurchasedAdminNotification::class);
        Notification::assertSentTo($this->financeAdmin, CoursePurchasedAdminNotification::class);

        // Low-privilege admin must NOT receive commercial sales notification
        Notification::assertNotSentTo($this->auditAdmin, CoursePurchasedAdminNotification::class);

        // Standard student must NOT receive admin sales notification
        Notification::assertNotSentTo($this->learner, CoursePurchasedAdminNotification::class);
    }

    public function test_admin_sales_notification_stores_valid_database_payload(): void
    {
        $order = $this->createPendingOrder();
        $orderService = app(OrderService::class);
        $orderService->fulfillOrder($order);

        $notification = DB::table('notifications')
            ->where('notifiable_id', $this->managingAdmin->id)
            ->where('type', CoursePurchasedAdminNotification::class)
            ->first();

        $this->assertNotNull($notification);
        $data = json_decode($notification->data, true);

        $this->assertSame('admin_sales', $data['category']);
        $this->assertSame('navigate', $data['action_type']);
        $this->assertSame("/orders/{$order->id}", $data['action_url']);
        $this->assertStringContainsString($this->course->title_ar ?? $this->course->title_en, $data['title_ar'] . $data['title_en']);
        $this->assertSame($order->order_number, $data['metadata']['order_number']);
        $this->assertSame(15000, $data['metadata']['total_amount_cents']);
    }

    public function test_non_admin_cannot_access_admin_scoped_notifications(): void
    {
        $response = $this->actingAs($this->learner)
            ->getJson('/api/v1/notifications?scope=admin');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_UNAUTHORIZED_SCOPE',
        ]);
    }

    public function test_admin_can_filter_notifications_by_scope(): void
    {
        // 1. Seed an admin_sales notification
        $order = $this->createPendingOrder();
        $orderService = app(OrderService::class);
        $orderService->fulfillOrder($order);

        // 2. Seed a learner notification for the admin (as a learner)
        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'App\Notifications\OrderConfirmationNotification',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $this->managingAdmin->id,
            'data' => json_encode([
                'category' => 'transactional',
                'title_ar' => 'تم تأكيد طلبك',
                'title_en' => 'Order confirmed',
                'body_ar' => 'تفاصيل الدورة',
                'body_en' => 'Course details',
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Query scope=admin
        $adminRes = $this->actingAs($this->managingAdmin)
            ->getJson('/api/v1/notifications?scope=admin');
        $adminRes->assertOk();
        $adminData = $adminRes->json('data');
        $this->assertNotEmpty($adminData);
        foreach ($adminData as $item) {
            $this->assertContains($item['category'], ['admin_sales', 'admin_ops']);
        }

        // Query scope=learner
        $learnerRes = $this->actingAs($this->managingAdmin)
            ->getJson('/api/v1/notifications?scope=learner');
        $learnerRes->assertOk();
        $learnerData = $learnerRes->json('data');
        $this->assertNotEmpty($learnerData);
        foreach ($learnerData as $item) {
            $this->assertNotContains($item['category'], ['admin_sales', 'admin_ops']);
        }
    }

    public function test_unread_count_returns_scoped_breakdown(): void
    {
        $order = $this->createPendingOrder();
        $orderService = app(OrderService::class);
        $orderService->fulfillOrder($order);

        // Seed 1 learner notification
        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'App\Notifications\OrderConfirmationNotification',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $this->managingAdmin->id,
            'data' => json_encode(['category' => 'transactional']),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->actingAs($this->managingAdmin)
            ->getJson('/api/v1/notifications/unread-count');

        $res->assertOk();
        $data = $res->json('data');
        $this->assertSame(2, $data['unread_count']);
        $this->assertSame(1, $data['learner_unread_count']);
        $this->assertSame(1, $data['admin_unread_count']);
    }

    public function test_mark_all_read_supports_scoping(): void
    {
        $order = $this->createPendingOrder();
        $orderService = app(OrderService::class);
        $orderService->fulfillOrder($order);

        // Seed 1 learner notification
        $learnerNotifId = (string) Str::uuid();
        DB::table('notifications')->insert([
            'id' => $learnerNotifId,
            'type' => 'App\Notifications\OrderConfirmationNotification',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $this->managingAdmin->id,
            'data' => json_encode(['category' => 'transactional']),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Mark only scope=admin as read
        $res = $this->actingAs($this->managingAdmin)
            ->postJson('/api/v1/notifications/mark-all-read?scope=admin');

        $res->assertOk();

        // Verify admin notification is read
        $adminNotif = DB::table('notifications')
            ->where('notifiable_id', $this->managingAdmin->id)
            ->where('type', CoursePurchasedAdminNotification::class)
            ->first();
        $this->assertNotNull($adminNotif->read_at);

        // Verify learner notification is STILL unread
        $learnerNotif = DB::table('notifications')->where('id', $learnerNotifId)->first();
        $this->assertNull($learnerNotif->read_at);
    }
}
