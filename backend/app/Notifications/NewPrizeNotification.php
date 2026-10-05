<?php

namespace App\Notifications;

use App\Models\Draw;
use App\Models\Prize;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class NewPrizeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Prize $prize, public ?Draw $draw = null, public ?User $user = null)
    {
        if ($user) {
            $this->id = Uuid::uuid5(
                Uuid::NAMESPACE_OID,
                "prize_pub:{$prize->id}:{$user->id}"
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
            "prize_pub:{$this->prize->id}:{$notifiable->id}"
        )->toString();

        // Check user marketing preferences for prize_draw_promotions
        $prefs = $notifiable->notificationPreferences;
        if ($prefs) {
            if ($prefs->unsubscribed_at !== null || $prefs->prize_draw_promotions === false) {
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
        $prizeTitle = $this->prize->title_ar ?: $this->prize->title_en;
        $drawUrl = config('app.frontend_url', config('app.url')) . "/draws";

        return (new MailMessage)
            ->subject("جائزة جديدة بانتظارك: {$prizeTitle} | New Prize Announced")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("يسعدنا الإعلان عن إطلاق جائزة وسحب ترويجي جديد: {$prizeTitle}.")
            ->line("القيمة التقديرية: {$this->prize->display_iqd_label}")
            ->line("احصل على تذاكرك الترويجية مع كل باقة دورات تدريبية تشترك بها.")
            ->action('عرض تفاصيل الجائزة والسحب / View Prize Details', $drawUrl)
            ->line("مع تحيات فريق منصة كنزين.");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'category' => 'prize_draw_promotions',
            'title_ar' => "جائزة جديدة: {$this->prize->title_ar}",
            'title_en' => "New Prize: {$this->prize->title_en}",
            'body_ar' => "تمت إضافة جائزة جديدة ({$this->prize->title_ar}) بقيمة {$this->prize->display_iqd_label}. انقر لمعرفة تفاصيل السحب.",
            'body_en' => "A new prize '{$this->prize->title_en}' ({$this->prize->display_iqd_label}) is now available in draws.",
            'action_type' => 'navigate',
            'action_url' => "/draws",
            'entity_type' => 'draw',
            'entity_id' => (string) $this->prize->draw_id,
            'metadata' => [
                'prize_id' => $this->prize->id,
                'draw_id' => $this->prize->draw_id,
                'display_iqd_label' => $this->prize->display_iqd_label,
            ],
        ];
    }
}
