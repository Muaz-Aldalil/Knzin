<?php

namespace App\Notifications;

use App\Models\Draw;
use App\Models\DrawWinner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class WinnerKycNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public DrawWinner $winner, public ?Draw $draw = null)
    {
        $this->id = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "winner_kyc:{$winner->id}"
        )->toString();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $kycUrl = config('app.frontend_url', config('app.url')) . '/account/kyc';

        return (new MailMessage)
            ->subject("تهانينا! لقد فزت في سحب كنزين | You Won the KNZiN Draw!")
            ->greeting("مبارك لك يا {$notifiable->display_name}!")
            ->line("يسعدنا إبلاغك بأن تذكرتك الترويجية رقم {$this->winner->winning_ticket_serial} قد تم سحبها كفائز رسمي!")
            ->line("للمطالبة بجائزتك وتأكيد أهليتك القانونية، يرجى تقديم وثائق التحقق من الهوية (KYC) عبر حسابك الشخصي.")
            ->line("المستندات المطلوبة: بطاقة الهوية الوطنية أو جواز السفر ساري المفعول وتأكيد بيانات الاتصال.")
            ->action('إكمال التحقق من الهوية / Complete KYC Verification', $kycUrl)
            ->line("فريق كنزين يبارك لك هذا الفوز ويتمنى لك دوام النجاح.");
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
            'title_ar' => "تهانينا! لقد فزت في سحب كنزين",
            'title_en' => "Congratulations! You won the KNZiN draw",
            'body_ar' => "تهانينا! لقد فازت تذكرتك رقم {$this->winner->winning_ticket_serial} بالسحب. يرجى إكمال التحقق من الهوية (KYC) لاستلام جائزتك.",
            'body_en' => "Congratulations! Your ticket #{$this->winner->winning_ticket_serial} won the draw. Please complete KYC identity verification to claim your prize.",
            'action_type' => 'navigate',
            'action_url' => "/account/kyc",
            'entity_type' => 'winner',
            'entity_id' => (string) $this->winner->id,
            'metadata' => [
                'draw_id' => $this->winner->draw_id,
                'prize_id' => $this->winner->prize_id,
                'winning_ticket_serial' => $this->winner->winning_ticket_serial,
            ],
        ];
    }
}
