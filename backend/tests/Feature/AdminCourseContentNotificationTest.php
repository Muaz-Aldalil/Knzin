<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\User;
use App\Notifications\CourseContentUpdatedNotification;
use App\Services\Admin\AdminAuditContext;
use App\Services\Admin\AdminCourseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class AdminCourseContentNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $enrolledUser;
    protected User $nonEnrolledUser;
    protected Course $course;
    protected CoursePart $coursePart;
    protected AdminAuditContext $auditContext;
    protected AdminCourseService $courseService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->courseService = app(AdminCourseService::class);

        $this->admin = User::factory()->create([
            'email' => 'admin@example.com',
            'display_name' => 'Admin Actor',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);

        $this->auditContext = new AdminAuditContext(
            actorUserId: $this->admin->id,
            capabilityUsed: 'manage_course_catalog',
            requestId: (string) Str::uuid()
        );

        $this->enrolledUser = User::factory()->create([
            'email' => 'learner@example.com',
            'display_name' => 'Enrolled Learner',
            'status' => 'active',
        ]);

        $this->nonEnrolledUser = User::factory()->create([
            'email' => 'visitor@example.com',
            'display_name' => 'Non Enrolled User',
            'status' => 'active',
        ]);

        $this->course = Course::first();
        $this->course->update(['content_version' => 1]);

        $this->coursePart = $this->course->parts()->first();

        $order = Order::factory()->create([
            'user_id' => $this->enrolledUser->id,
            'status' => 'completed',
        ]);

        CourseEntitlement::create([
            'id' => (string) Str::uuid(),
            'user_id' => $this->enrolledUser->id,
            'course_id' => $this->course->id,
            'course_part_id' => null,
            'order_id' => $order->id,
            'status' => 'active',
        ]);
    }

    public function test_learner_facing_course_update_increments_version_and_notifies_entitled_learners(): void
    {
        Notification::fake();

        $this->courseService->updateCourse(
            course: $this->course,
            data: [
                'curriculum_summary_ar' => 'ملخص محدث للمنهج الدراسي مع دروس إضافية',
            ],
            actor: $this->admin,
            auditContext: $this->auditContext
        );

        $this->course->refresh();
        $this->assertEquals(2, $this->course->content_version);

        Notification::assertSentTo(
            $this->enrolledUser,
            CourseContentUpdatedNotification::class,
            function (CourseContentUpdatedNotification $notification) {
                $array = $notification->toArray($this->enrolledUser);
                $expectedUuid = Uuid::uuid5(
                    Uuid::NAMESPACE_OID,
                    "admin_update:course:{$this->course->id}:v2:{$this->enrolledUser->id}"
                )->toString();

                return $notification->contentVersion === 2
                    && $array['action_type'] === 'refresh_course'
                    && $array['metadata']['content_version'] === 2
                    && $array['metadata']['course_slug'] === $this->course->slug
                    && $notification->id === $expectedUuid;
            }
        );

        Notification::assertNotSentTo($this->nonEnrolledUser, CourseContentUpdatedNotification::class);
    }

    public function test_identical_content_resave_does_not_increment_version_or_send_notification(): void
    {
        Notification::fake();

        $originalTitleAr = $this->course->title_ar;

        $this->courseService->updateCourse(
            course: $this->course,
            data: [
                'title_ar' => $originalTitleAr,
            ],
            actor: $this->admin,
            auditContext: $this->auditContext
        );

        $this->course->refresh();
        $this->assertEquals(1, $this->course->content_version);

        Notification::assertNothingSent();
    }

    public function test_pricing_and_promotional_tickets_alteration_does_not_trigger_notification(): void
    {
        Notification::fake();

        $this->courseService->updateCourse(
            course: $this->course,
            data: [
                'bundle_price_cents' => 4500,
                'bundle_promotional_tickets' => 25,
            ],
            actor: $this->admin,
            auditContext: $this->auditContext
        );

        $this->course->refresh();
        $this->assertEquals(1, $this->course->content_version);

        Notification::assertNothingSent();
    }

    public function test_course_part_update_increments_version_and_notifies_entitled_learners(): void
    {
        Notification::fake();

        $this->courseService->updatePart(
            part: $this->coursePart,
            data: [
                'video_url' => 'https://example.com/videos/lesson1_v2.mp4',
                'duration_minutes' => 60,
            ],
            actor: $this->admin,
            auditContext: $this->auditContext
        );

        $this->course->refresh();
        $this->assertEquals(2, $this->course->content_version);

        Notification::assertSentTo(
            $this->enrolledUser,
            CourseContentUpdatedNotification::class,
            function (CourseContentUpdatedNotification $notification) {
                return $notification->contentVersion === 2;
            }
        );

        Notification::assertNotSentTo($this->nonEnrolledUser, CourseContentUpdatedNotification::class);
    }

    public function test_course_part_creation_increments_version_and_notifies_entitled_learners(): void
    {
        Notification::fake();

        $this->courseService->addPart(
            course: $this->course,
            data: [
                'title_ar' => 'الجزء المتقدم الجديد',
                'title_en' => 'New Advanced Part',
                'syllabus_ar' => 'محتوى متقدم',
                'syllabus_en' => 'Advanced Content',
                'duration_minutes' => 30,
            ],
            actor: $this->admin,
            auditContext: $this->auditContext
        );

        $this->course->refresh();
        $this->assertEquals(2, $this->course->content_version);

        Notification::assertSentTo(
            $this->enrolledUser,
            CourseContentUpdatedNotification::class
        );
    }
}
