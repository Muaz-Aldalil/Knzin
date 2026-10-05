<?php

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class MissionReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Course $course, public ?User $user = null)
    {
        if ($user) {
            $this->id = Uuid::uuid5(
                Uuid::NAMESPACE_OID,
                "mission_remind:{$course->id}:{$user->id}"
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
            "mission_remind:{$this->course->id}:{$notifiable->id}"
        )->toString();

        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $courseTitle = $this->course->title_ar ?: $this->course->title_en;
        $resumeUrl = config('app.frontend_url', config('app.url')) . "/courses/{$this->course->slug}/learn";

        return (new MailMessage)
            ->subject("واصل رحلتك التعليمية: {$courseTitle} | Resume Your Learning Path")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("لاحظنا أنك لم تستكمل دروسك في دورة {$courseTitle} منذ بضعة أيام.")
            ->line("الاستمرار والممارسة هما مفتاح إتقان المهارات المهنية. خصص بضع دقائق اليوم لمتابعة تقدمك!")
            ->action('متابعة التعلم الآن / Resume Learning', $resumeUrl)
            ->line("كل خطوة تخطوها تقربك من إتقان مهارة مهنية جديدة.");
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
            'title_ar' => "واصل مسيرتك في دورة {$this->course->title_ar}",
            'title_en' => "Resume your learning in {$this->course->title_en}",
            'body_ar' => "لديك أجزاء غير مكتملة في دورة {$this->course->title_ar}. انقر لاستكمال دراستك.",
            'body_en' => "You have unfinished lessons in {$this->course->title_en}. Click to resume your learning.",
            'action_type' => 'navigate',
            'action_url' => "/courses/{$this->course->slug}/learn",
            'entity_type' => 'course',
            'entity_id' => (string) $this->course->id,
            'metadata' => [
                'course_id' => $this->course->id,
                'slug' => $this->course->slug,
            ],
        ];
    }
}
