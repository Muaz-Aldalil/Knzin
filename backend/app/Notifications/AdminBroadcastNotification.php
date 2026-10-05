<?php

namespace App\Notifications;

use App\Models\AdminBroadcast;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;
use Ramsey\Uuid\Uuid;

class AdminBroadcastNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public AdminBroadcast $broadcast, public ?User $user = null)
    {
        if ($user) {
            $this->id = Uuid::uuid5(
                Uuid::NAMESPACE_OID,
                "broadcast:{$broadcast->id}:{$user->id}"
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
            "broadcast:{$this->broadcast->id}:{$notifiable->id}"
        )->toString();

        // Check marketing preference for admin_broadcasts
        $prefs = $notifiable->notificationPreferences;
        if ($prefs) {
            if ($prefs->unsubscribed_at !== null || $prefs->admin_broadcasts === false) {
                return [];
            }
        }

        $channels = [];
        $selected = (array) ($this->broadcast->channels ?? ['in_app', 'email']);

        if (in_array('in_app', $selected, true)) {
            $channels[] = 'database';
        }
        if (in_array('email', $selected, true)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subject = "{$this->broadcast->title_ar} | {$this->broadcast->title_en}";
        $unsubscribeUrl = URL::signedRoute('api.v1.notifications.unsubscribe', [
            'user' => $notifiable->id,
            'category' => 'admin_broadcasts',
        ]);

        return (new MailMessage)
            ->subject($subject)
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line($this->broadcast->body_ar)
            ->line($this->broadcast->body_en)
            ->line("---")
            ->line("لإلغاء الاشتراك من إشعارات الإعلانات الترويجية:")
            ->action('إلغاء الاشتراك / Unsubscribe', $unsubscribeUrl);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'category' => 'admin_broadcasts',
            'title_ar' => $this->broadcast->title_ar,
            'title_en' => $this->broadcast->title_en,
            'body_ar' => $this->broadcast->body_ar,
            'body_en' => $this->broadcast->body_en,
            'action_type' => 'navigate',
            'action_url' => "/notifications",
            'entity_type' => 'broadcast',
            'entity_id' => (string) $this->broadcast->id,
            'metadata' => [
                'broadcast_id' => $this->broadcast->id,
            ],
        ];
    }
}
