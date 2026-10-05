<?php

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class NewCourseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Course $course, public ?User $user = null)
    {
        if ($user) {
            $this->id = Uuid::uuid5(
                Uuid::NAMESPACE_OID,
                "course_pub:{$course->id}:{$user->id}"
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
        // Enforce deterministic UUIDv5 primary key per notifiable user
        $this->id = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "course_pub:{$this->course->id}:{$notifiable->id}"
        )->toString();

        // Check user marketing preferences for course_announcements
        $prefs = $notifiable->notificationPreferences;
        if ($prefs) {
            if ($prefs->unsubscribed_at !== null || $prefs->course_announcements === false) {
                return [];
            }
        }

        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $courseTitle = $this->course->title_ar ?: $this->course->title_en;
        $courseUrl = config('app.frontend_url', config('app.url')) . "/courses/{$this->course->slug}";

        return (new MailMessage)
            ->subject("دورة تدريبية جديدة متاحة الآن: {$courseTitle} | New Vocational Course")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("يسرنا الإعلان عن إطلاق دورة مهنية جديدة: {$courseTitle}.")
            ->line("طوّر مهاراتك العملية واستفد من المحتوى التدريبي الشامل مع حجز التذاكر الترويجية للسحوبات.")
            ->action('استكشاف الدورة التدريبية / Explore Course', $courseUrl)
            ->line("تعلّم مهارة حقيقية وافتح آفاقاً جديدة لمستقبلك المهني.");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'category' => 'course_announcements',
            'title_ar' => "دورة جديدة: {$this->course->title_ar}",
            'title_en' => "New Course: {$this->course->title_en}",
            'body_ar' => "تم إطلاق دورة جديدة بعنوان {$this->course->title_ar}. انقر لاستكشاف المنهج والبدء.",
            'body_en' => "A new course '{$this->course->title_en}' is now live. Click to explore curriculum.",
            'action_type' => 'navigate',
            'action_url' => "/courses/{$this->course->slug}",
            'entity_type' => 'course',
            'entity_id' => (string) $this->course->id,
            'metadata' => [
                'course_id' => $this->course->id,
                'slug' => $this->course->slug,
                'bundle_price_cents' => $this->course->bundle_price_cents,
            ],
        ];
    }
}
