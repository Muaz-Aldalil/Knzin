<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Ramsey\Uuid\Uuid;

class CoursePurchasedAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Order $order,
        public User $admin
    ) {
        $this->id = Uuid::uuid5(
            Uuid::NAMESPACE_OID,
            "course_purchased:{$order->id}:{$admin->id}"
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
        $firstItem = $this->order->items->first();
        $courseTitle = $firstItem?->course?->title_ar ?? $firstItem?->course?->title_en ?? 'الدورة التعليمية';
        $buyerName = $this->order->user?->display_name ?? 'متدرب';
        $price = $this->order->display_price_label ?: ('$' . number_format($this->order->total_amount_cents / 100, 2));

        return (new MailMessage)
            ->subject("🛒 عملية شراء جديدة | New Course Sale #{$orderNumber}")
            ->greeting("مرحباً {$notifiable->display_name}")
            ->line("تم تسجيل عملية شراء دورة جديدة بنجاح في منصة كَنزين:")
            ->line("اسم الدورة: {$courseTitle}")
            ->line("المتدرب: {$buyerName}")
            ->line("قيمة الطلب: {$price}")
            ->line("رقم الطلب: #{$orderNumber}")
            ->action('عرض تفاصيل الطلب / View Order', $orderUrl);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $firstItem = $this->order->items->first();
        $course = $firstItem?->course;
        $courseTitleAr = $course?->title_ar ?? $course?->title_en ?? 'الدورة التعليمية';
        $courseTitleEn = $course?->title_en ?? $course?->title_ar ?? 'Course';
        $buyerName = $this->order->user?->display_name ?? 'طالب كنزين';
        $price = $this->order->display_price_label ?: ('$' . number_format($this->order->total_amount_cents / 100, 2));

        return [
            'category' => 'admin_sales',
            'title_ar' => "🛒 عملية شراء جديدة: {$courseTitleAr}",
            'title_en' => "🛒 New Course Sale: {$courseTitleEn}",
            'body_ar' => "قام المتدرب {$buyerName} بشراء {$courseTitleAr} بقيمة {$price} (طلب رقم #{$this->order->order_number}).",
            'body_en' => "Learner {$buyerName} purchased {$courseTitleEn} for {$price} (Order #{$this->order->order_number}).",
            'action_type' => 'navigate',
            'action_url' => "/orders/{$this->order->id}",
            'entity_type' => 'order',
            'entity_id' => (string) $this->order->id,
            'metadata' => [
                'order_number' => $this->order->order_number,
                'course_slug' => $course?->slug,
                'course_title' => $courseTitleAr,
                'total_amount_cents' => $this->order->total_amount_cents,
                'currency' => $this->order->currency,
                'buyer_name' => $buyerName,
                'buyer_code' => $this->order->user?->learner_code,
            ],
        ];
    }
}
