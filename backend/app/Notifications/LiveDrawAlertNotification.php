<?php

namespace App\Notifications;

use App\Models\Draw;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class LiveDrawAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Draw $draw, public ?User $user = null)
    {
        if ($user) {
            $this->id = Uuid::uuid5(
                Uuid::NAMESPACE_OID,
                "draw_15m:{$draw->id}:{$user->id}"
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
            "draw_15m:{$this->draw->id}:{$notifiable->id}"
        )->toString();

        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $drawTitle = $this->draw->title_ar ?: $this->draw->title_en;
        $streamUrl = $this->draw->broadcast_url ?: (config('app.frontend_url', config('app.url')) . "/draws/{$this->draw->id}/live");

        return (new MailMessage)
            ->subject("تنبيه: السحب المباشر سيبدأ خلال 15 دقيقة! | Live Draw Alert")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("نود تذكيرك بأن السحب على {$drawTitle} سيبدأ مباشرة خلال 15 دقيقة!")
            ->line("تذاكرك الترويجية مسجلة ومؤهلة للدخول في السحب.")
            ->action('مشاهدة البث المباشر / Watch Live Stream', $streamUrl)
            ->line("نتمنى لك حظاً موفقاً في السحب القادم.");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $streamUrl = $this->draw->broadcast_url ?: "/draws/{$this->draw->id}/live";

        return [
            'category' => 'transactional',
            'title_ar' => "السحب المباشر سيبدأ خلال 15 دقيقة!",
            'title_en' => "Live Draw starts in 15 minutes!",
            'body_ar' => "السحب على جائزة {$this->draw->title_ar} سيبدأ قريباً. انضم إلى البث المباشر الآن!",
            'body_en' => "The live draw for {$this->draw->title_en} is starting soon. Join the live stream now!",
            'action_type' => 'navigate',
            'action_url' => $streamUrl,
            'entity_type' => 'draw',
            'entity_id' => (string) $this->draw->id,
            'metadata' => [
                'draw_id' => $this->draw->id,
                'tier' => $this->draw->tier,
                'title_en' => $this->draw->title_en,
                'broadcast_url' => $this->draw->broadcast_url,
                'ends_at' => $this->draw->ends_at?->toIso8601String(),
            ],
        ];
    }
}
