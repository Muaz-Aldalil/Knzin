<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class AbandonedOrderRecoveryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order)
    {
        $this->id = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "order_recovery:{$order->id}:{$order->user_id}"
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
        $paymentUrl = config('app.frontend_url', config('app.url')) . "/orders/{$this->order->id}/payment";

        return (new MailMessage)
            ->subject("استكمال طلبك | Complete your order #{$orderNumber}")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("لاحظنا أن لديك طلباً معلقاً رقم {$orderNumber} بقيمة {$this->order->display_price_label}.")
            ->line("يمكنك استكمال عملية الدفع الآن لتأكيد حجز التذاكر الترويجية والوصول إلى الدورة التعليمية.")
            ->action('استكمال الدفع الآن / Complete Payment', $paymentUrl)
            ->line("إذا واجهت أي مشكلة، يسعدنا مساعدتك في أي وقت.");
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
            'title_ar' => "طلبك بانتظار استكمال الدفع",
            'title_en' => "Your order is awaiting payment",
            'body_ar' => "لديك طلب معلق رقم {$this->order->order_number}. انقر هنا لاستكمال الدفع وتأكيد الحجز.",
            'body_en' => "You have a pending order #{$this->order->order_number}. Click to complete your payment.",
            'action_type' => 'navigate',
            'action_url' => "/orders/{$this->order->id}/payment",
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
