<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class TicketIssuanceNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param array<int, string> $serials
     */
    public function __construct(public Order $order, public array $serials = [])
    {
        $this->id = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "ticket_issuance:{$order->id}:{$order->user_id}"
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
        $ticketCount = count($this->serials);
        $orderNumber = $this->order->order_number;
        $ticketsUrl = config('app.frontend_url', config('app.url')) . '/tickets';

        $mail = (new MailMessage)
            ->subject("تم إصدار تذاكر السحب الترويجية ({$ticketCount} تذكرة) | Tickets Issued")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("تم إصدار {$ticketCount} تذكرة سحب ترويجية مجانية بنجاح مرفقة مع طلبك رقم {$orderNumber}.")
            ->line("أرقام التذاكر الترويجية الخاصة بك:")
            ->line(implode(', ', array_slice($this->serials, 0, 5)) . ($ticketCount > 5 ? " (والمزيد...)" : ""))
            ->action('عرض محفظة التذاكر / View Tickets', $ticketsUrl)
            ->line("نتمنى لك حظاً موفقاً في السحب القادم!");

        return $mail;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $ticketCount = count($this->serials);

        return [
            'category' => 'transactional',
            'title_ar' => "تم إصدار تذاكرك الترويجية المجانية",
            'title_en' => "Your Promotional Tickets Have Been Issued",
            'body_ar' => "تم إصدار {$ticketCount} تذكرة ترويجية مجانية لطلبك رقم {$this->order->order_number}.",
            'body_en' => "{$ticketCount} promotional tickets have been issued for your order #{$this->order->order_number}.",
            'action_type' => 'navigate',
            'action_url' => '/tickets',
            'entity_type' => 'order',
            'entity_id' => (string) $this->order->id,
            'metadata' => [
                'order_number' => $this->order->order_number,
                'ticket_count' => $ticketCount,
                'serials' => array_slice($this->serials, 0, 10),
            ],
        ];
    }
}
