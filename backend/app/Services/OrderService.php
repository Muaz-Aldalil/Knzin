<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public const FROZEN_EXCHANGE_RATE = '1.3100';

    /**
     * Create or retrieve an existing pending order with strict idempotency and dual-currency calculation.
     */
    public function createOrder(array $data, ?string $clientIp = '127.0.0.1'): array
    {
        return DB::transaction(function () use ($data, $clientIp) {
            // 1. Strict Idempotency Check with Row Lock inside transaction (DEF-01E)
            $existingOrder = Order::with(['items', 'user'])
                ->where('idempotency_key', $data['idempotency_key'])
                ->lockForUpdate()
                ->first();

            if ($existingOrder) {
                return [
                    'order' => $existingOrder,
                    'is_duplicate' => true,
                ];
            }

            // 2. Resolve User with Lock to prevent OAuth merge concurrency race (DEF-03B)
            $email = strtolower(trim($data['email']));
            $user = User::where('email', $email)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$user) {
                $user = User::create([
                    'email' => $email,
                    'display_name' => 'ضيف',
                    'auth_provider' => 'guest',
                    'status' => 'active',
                ]);
            }

            // 3. Resolve Course and Pricing
            $course = Course::findOrFail($data['course_id']);
            $itemType = $data['item_type'];
            $coursePart = null;

            if ($itemType === 'part') {
                $coursePart = CoursePart::where('course_id', $course->id)
                    ->where('id', $data['course_part_id'])
                    ->firstOrFail();

                $totalAmountCents = $coursePart->part_price_cents;
                $promotionalTickets = $coursePart->part_promotional_tickets;
                $displayPriceLabel = $coursePart->display_price_label;
            } else {
                $totalAmountCents = $course->bundle_price_cents;
                $promotionalTickets = $course->bundle_promotional_tickets;
                $displayPriceLabel = $course->display_price_label;
            }

            // Integer arithmetic: 1 USD = 100 cents = 1,310 IQD => (cents * 131) / 10 (DEF-01C)
            $paidAmountGateway = intdiv($totalAmountCents * 131, 10);

            // 4. Create Order and OrderItem
            $orderNumber = 'KNZ-ORD-' . date('Y') . '-' . strtoupper(Str::random(6));

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $user->id,
                'total_amount_cents' => $totalAmountCents,
                'currency' => 'USD',
                'exchange_rate' => self::FROZEN_EXCHANGE_RATE,
                'paid_amount_gateway' => $paidAmountGateway,
                'display_price_label' => $displayPriceLabel,
                'promotional_tickets_granted' => $promotionalTickets,
                'status' => 'pending',
                'idempotency_key' => $data['idempotency_key'],
                'legal_terms_agreed' => true,
                'terms_agreed_ip' => $clientIp ?: '127.0.0.1',
                'terms_agreed_at' => now(),
                'quiz_answers' => $data['quiz_answers'] ?? null,
                'quiz_completed_at' => !empty($data['quiz_answers']) ? now() : null,
                'expires_at' => now()->addHours(48),
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'course_id' => $course->id,
                'course_part_id' => $coursePart ? $coursePart->id : null,
                'item_type' => $itemType,
                'price_cents' => $totalAmountCents,
                'promotional_tickets_granted' => $promotionalTickets,
            ]);

            return [
                'order' => $order->load(['items', 'user']),
                'is_duplicate' => false,
            ];
        });
    }

    /**
     * Find order by public order number.
     */
    public function getOrderByNumber(string $orderNumber): ?Order
    {
        return Order::with(['items.course', 'items.part', 'user'])
            ->where('order_number', $orderNumber)
            ->first();
    }
}
