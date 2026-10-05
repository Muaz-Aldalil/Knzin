<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class OrderConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order)
    {
        $this->id = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "order_confirmed:{$order->id}:{$order->user_id}"
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
        $orderNumber = $this->order->order_number;
        $orderUrl = config('app.frontend_url', config('app.url')) . "/orders/{$this->order->id}";

        return (new MailMessage)
            ->subject("تأكيد الطلب #{$orderNumber} | Order Confirmation")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("تم تأكيد طلبك رقم {$orderNumber} بنجاح.")
            ->line("المبلغ الإجمالي: {$this->order->display_price_label}")
            ->action('عرض تفاصيل الطلب / View Order', $orderUrl)
            ->line("شكراً لانضمامك إلى منصة كنزين التعليمية.");
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
            'title_ar' => "تم تأكيد طلبك بنجاح",
            'title_en' => "Your order has been confirmed successfully",
            'body_ar' => "تم تأكيد طلبك رقم {$this->order->order_number} وحجز محتواك التعليمي بنجاح.",
            'body_en' => "Your order #{$this->order->order_number} has been confirmed successfully.",
            'action_type' => 'navigate',
            'action_url' => "/orders/{$this->order->id}",
            'entity_type' => 'order',
            'entity_id' => (string) $this->order->id,
            'metadata' => [
                'order_number' => $this->order->order_number,
                'total_amount_cents' => $this->order->total_amount_cents,
                'currency' => $this->order->currency,
            ],
        ];
    }
}
