<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CourseMissionReminder;
use App\Models\CoursePart;
use App\Models\Draw;
use App\Models\LessonProgress;
use App\Models\NotificationPreference;
use App\Models\Order;
use App\Models\Prize;
use App\Models\User;
use App\Notifications\MissionReminderNotification;
use App\Notifications\NewCourseNotification;
use App\Notifications\NewPrizeNotification;
use App\Services\Admin\AdminAuditContext;
use App\Services\Admin\AdminCourseService;
use App\Services\Admin\DrawLifecycleService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class CatalogLifecycleNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $optedInUser;
    protected User $optedOutUser;
    protected AdminAuditContext $auditContext;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin@example.com',
            'display_name' => 'Catalog Admin',
        ]);

        $this->optedInUser = User::factory()->create([
            'email' => 'optedin@example.com',
            'display_name' => 'Opted In Learner',
        ]);

        NotificationPreference::create([
            'id' => (string) Str::uuid(),
            'user_id' => $this->optedInUser->id,
            'course_announcements' => true,
            'prize_draw_promotions' => true,
            'admin_broadcasts' => true,
        ]);

        $this->optedOutUser = User::factory()->create([
            'email' => 'optedout@example.com',
            'display_name' => 'Opted Out Learner',
        ]);

        NotificationPreference::create([
            'id' => (string) Str::uuid(),
            'user_id' => $this->optedOutUser->id,
            'course_announcements' => false,
            'prize_draw_promotions' => false,
            'admin_broadcasts' => false,
        ]);

        $this->auditContext = new AdminAuditContext(
            actorUserId: $this->admin->id,
            capabilityUsed: 'manage_catalog',
            requestId: (string) Str::uuid()
        );
    }

    public function test_course_activation_dispatches_new_course_notification_respecting_preferences(): void
    {
        Notification::fake();

        $course = Course::create([
            'slug' => 'welding-and-fabrication',
            'title_ar' => 'اللحام وتشكيل المعادن',
            'title_en' => 'Welding and Metal Fabrication',
            'description_ar' => 'وصف الدورة',
            'description_en' => 'Course description',
            'bundle_price_cents' => 1500,
            'bundle_promotional_tickets' => 20,
            'display_price_label' => '20,000 IQD',
            'cover_image_url' => 'https://knzin.com/courses/welding.jpg',
            'is_active' => false,
        ]);

        $service = app(AdminCourseService::class);
        $service->toggleStatus($course, $this->admin, $this->auditContext);

        $this->assertTrue($course->fresh()->is_active);

        // Opted-in user SHOULD receive notification
        Notification::assertSentTo(
            $this->optedInUser,
            NewCourseNotification::class,
            function (NewCourseNotification $notification) use ($course) {
                return $notification->course->id === $course->id
                    && $notification->id === Uuid::uuid5(Uuid::NAMESPACE_OID, "course_pub:{$course->id}:{$this->optedInUser->id}")->toString();
            }
        );

        // Opted-out user MUST NOT receive notification
        Notification::assertNotSentTo(
            $this->optedOutUser,
            NewCourseNotification::class
        );
    }

    public function test_draw_publication_dispatches_new_prize_notification_respecting_preferences(): void
    {
        Notification::fake();

        $draw = Draw::create([
            'id' => (string) Str::uuid(),
            'tier' => 'daily',
            'execution_type' => 'live_broadcast',
            'title_ar' => 'سحب الجوائز الكبرى',
            'title_en' => 'Grand Prize Draw',
            'status' => 'upcoming',
            'is_published' => false,
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addDays(2),
        ]);

        $prize = Prize::create([
            'id' => (string) Str::uuid(),
            'draw_id' => $draw->id,
            'title_ar' => 'سيارة كيا سبورتاج',
            'title_en' => 'Kia Sportage',
            'category' => 'merchandise',
            'valuation_usd_cents' => 2500000,
            'display_iqd_label' => '32,500,000 IQD',
            'image_url' => 'https://knzin.com/images/kia.jpg',
        ]);

        $service = app(DrawLifecycleService::class);
        $service->publish($draw, $this->admin, $this->auditContext);

        $this->assertTrue($draw->fresh()->is_published);

        // Opted-in user SHOULD receive notification
        Notification::assertSentTo(
            $this->optedInUser,
            NewPrizeNotification::class,
            function (NewPrizeNotification $notification) use ($prize) {
                return $notification->prize->id === $prize->id;
            }
        );

        // Opted-out user MUST NOT receive notification
        Notification::assertNotSentTo(
            $this->optedOutUser,
            NewPrizeNotification::class
        );
    }

    public function test_mission_reminder_evaluates_3day_inactivity_and_enforces_7day_cooldown(): void
    {
        Notification::fake();

        $course = Course::with('parts')->first();
        $part = $course->parts->first();

        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $this->optedInUser->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 13100,
            'display_price_label' => '13,000 IQD',
            'promotional_tickets_granted' => 5,
            'status' => 'completed',
            'tickets_status' => 'completed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
        ]);

        // Create entitlement created 5 days ago
        $entitlement = CourseEntitlement::create([
            'id' => (string) Str::uuid(),
            'user_id' => $this->optedInUser->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order->id,
            'status' => 'active',
            'created_at' => Carbon::now()->subDays(5),
            'updated_at' => Carbon::now()->subDays(5),
        ]);

        // Unfinished lesson progress with last_watched_at 4 days ago (> 3d inactivity)
        LessonProgress::create([
            'id' => (string) Str::uuid(),
            'user_id' => $this->optedInUser->id,
            'course_id' => $course->id,
            'course_part_id' => $part->id,
            'percent_complete' => 30,
            'is_completed' => false,
            'last_watched_at' => Carbon::now()->subDays(4),
        ]);

        // 1. First evaluator run: should send reminder
        Artisan::call('notifications:evaluate-mission-reminders');

        Notification::assertSentTo(
            $this->optedInUser,
            MissionReminderNotification::class,
            function (MissionReminderNotification $notification) use ($course) {
                return $notification->course->id === $course->id;
            }
        );

        Notification::assertSentTimes(MissionReminderNotification::class, 1);

        // Verify tracking record created
        $tracking = CourseMissionReminder::where('user_id', $this->optedInUser->id)
            ->where('course_id', $course->id)
            ->first();

        $this->assertNotNull($tracking);

        // 2. Second run immediately: should be suppressed by 7-day cooldown
        Artisan::call('notifications:evaluate-mission-reminders');
        Notification::assertSentTimes(MissionReminderNotification::class, 1);

        // 3. User who completed all parts should NEVER receive reminder
        LessonProgress::where('user_id', $this->optedInUser->id)->delete();
        foreach ($course->parts as $p) {
            LessonProgress::create([
                'id' => (string) Str::uuid(),
                'user_id' => $this->optedInUser->id,
                'course_id' => $course->id,
                'course_part_id' => $p->id,
                'percent_complete' => 100,
                'is_completed' => true,
                'last_watched_at' => Carbon::now()->subDays(10),
            ]);
        }

        // Fast forward 8 days
        $tracking->update(['last_reminded_at' => Carbon::now()->subDays(8)]);

        Artisan::call('notifications:evaluate-mission-reminders');
        Notification::assertSentTimes(MissionReminderNotification::class, 1); // Still 1, not 2
    }
}
