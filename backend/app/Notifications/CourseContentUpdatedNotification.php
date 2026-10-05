<?php

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class CourseContentUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Course $course,
        public int $contentVersion,
        public ?User $user = null
    ) {
        if ($user) {
            $this->id = Uuid::uuid5(
                Uuid::NAMESPACE_OID,
                "admin_update:course:{$course->id}:v{$contentVersion}:{$user->id}"
            )->toString();
        }
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $this->id = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "admin_update:course:{$this->course->id}:v{$this->contentVersion}:{$notifiable->id}"
        )->toString();

        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'category' => 'transactional',
            'title_ar' => "تم تحديث محتوى دورة {$this->course->title_ar}",
            'title_en' => "Course content updated: {$this->course->title_en}",
            'body_ar' => "قام المشرف بتحديث محتوى الدورة التدريبية. انقر على تحديث لتحميل الدروس الجديدة فوراً دون إعادة تحميل الصفحة.",
            'body_en' => "New lessons have been updated for {$this->course->title_en}. Click refresh to view the latest content.",
            'action_type' => 'refresh_course',
            'action_url' => "/courses/{$this->course->slug}",
            'entity_type' => 'course',
            'entity_id' => (string) $this->course->id,
            'metadata' => [
                'course_id' => $this->course->id,
                'slug' => $this->course->slug,
                'course_slug' => $this->course->slug,
                'content_version' => $this->contentVersion,
            ],
        ];
    }
}
