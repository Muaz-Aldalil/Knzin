<?php

namespace App\Services;

use App\Exceptions\IdempotencyConflictException;
use App\Jobs\GenerateTicketsJob;
use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Notifications\CoursePurchasedAdminNotification;
use App\Notifications\OrderConfirmationNotification;
use App\Services\AffiliateAttributionService;
use App\Services\AffiliateCommissionService;
use App\Support\AdminCapabilities;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public const FROZEN_EXCHANGE_RATE = '1.3100';

    /**
     * Create or retrieve an existing pending order with strict idempotency and dual-currency calculation.
     */
    public function createOrder(array $data, ?string $clientIp = '127.0.0.1', ?string $userAgent = null): array
    {
        return DB::transaction(function () use ($data, $clientIp, $userAgent) {
            // 1. Strict Idempotency Check with Row Lock inside transaction (DEF-01E / PENT-01)
            $existingOrder = Order::with(['items', 'user'])
                ->where('idempotency_key', $data['idempotency_key'])
                ->lockForUpdate()
                ->first();

            if ($existingOrder) {
                // Authoritative ownership verification: prevent cross-account order replay & disclosure
                $requestedEmail = strtolower(trim($data['email'] ?? ''));
                $existingEmail = strtolower(trim($existingOrder->user?->email ?? ''));

                if ($existingEmail !== '' && $requestedEmail !== '' && $existingEmail !== $requestedEmail) {
                    throw new IdempotencyConflictException('Idempotency key belongs to another customer order.');
                }

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

            // Standard commercial market Iraqi Dinar rounding (Decision D-2) or dynamic rate for custom pricing
            $defaultPaidAmount = ($itemType === 'part')
                ? (int) config('payments.amounts.part', 2600)
                : (int) config('payments.amounts.bundle', 13000);

            if (($itemType === 'part' && $totalAmountCents !== 200) || ($itemType === 'bundle' && $totalAmountCents !== 1000)) {
                $rate = (float) self::FROZEN_EXCHANGE_RATE;
                $paidAmountGateway = (int) round(($totalAmountCents / 100) * ($rate * 1000));
            } else {
                $paidAmountGateway = $defaultPaidAmount;
            }

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
                'tickets_status' => 'pending',
                'idempotency_key' => $data['idempotency_key'],
                'legal_terms_agreed' => true,
                'terms_agreed_ip' => $clientIp ?: '127.0.0.1',
                'terms_agreed_at' => now(),
                'quiz_answers' => $data['quiz_answers'] ?? null,
                'quiz_completed_at' => !empty($data['quiz_answers']) ? now() : null,
                'expires_at' => now()->addHours(24),
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'course_id' => $course->id,
                'course_part_id' => $coursePart ? $coursePart->id : null,
                'item_type' => $itemType,
                'price_cents' => $totalAmountCents,
                'promotional_tickets_granted' => $promotionalTickets,
            ]);

            // 5. Record Referral Attribution if referral code provided
            if (!empty($data['referral_code'])) {
                app(AffiliateAttributionService::class)->recordAttribution(
                    $order,
                    $data['referral_code'],
                    $data['campaign_tag'] ?? null,
                    $clientIp,
                    $userAgent
                );
            }

            return [
                'order' => $order->load(['items', 'user']),
                'is_duplicate' => false,
            ];
        });
    }

    /**
     * Fulfill a completed order: creates course entitlements and dispatches asynchronous ticket generation.
     */
    public function fulfillOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($lockedOrder->status !== 'completed') {
                $lockedOrder->update([
                    'status' => 'completed',
                    'tickets_status' => 'pending',
                ]);
            }

            // 1. Synchronously create verified course entitlements
            app(EntitlementService::class)->grantAfterFulfillment($lockedOrder);

            // 2. Synchronously credit affiliate sales commission (Feature 006 - US2)
            app(AffiliateCommissionService::class)->creditSalesCommission($lockedOrder);

            // 3. Asynchronously dispatch ticket minting strictly after transaction commit
            GenerateTicketsJob::dispatch($lockedOrder->id)->afterCommit();

            // 4. Dispatch order confirmation notification strictly after transaction commit
            DB::afterCommit(function () use ($lockedOrder) {
                if ($lockedOrder->user) {
                    $notificationId = \Ramsey\Uuid\Uuid::uuid5(
                        \Ramsey\Uuid\Uuid::NAMESPACE_OID,
                        "order_confirmed:{$lockedOrder->id}:{$lockedOrder->user_id}"
                    )->toString();

                    if (!DB::table('notifications')->where('id', $notificationId)->exists()) {
                        $lockedOrder->user->notify(new OrderConfirmationNotification($lockedOrder));
                    }
                }

                // Feature 010: Commercial sales notifications to authorized admins (manage_platform_settings OR settle_affiliate_payout)
                $adminRecipients = User::query()
                    ->where('status', 'active')
                    ->whereHas('capabilities', function ($query) {
                        $query->whereIn('capability', [
                            AdminCapabilities::MANAGE_PLATFORM_SETTINGS,
                            AdminCapabilities::SETTLE_AFFILIATE_PAYOUT,
                        ]);
                    })
                    ->get();

                foreach ($adminRecipients as $admin) {
                    $adminNotifId = \Ramsey\Uuid\Uuid::uuid5(
                        \Ramsey\Uuid\Uuid::NAMESPACE_OID,
                        "admin_sale:{$lockedOrder->id}:{$admin->id}"
                    )->toString();

                    if (!DB::table('notifications')->where('id', $adminNotifId)->exists()) {
                        $admin->notify(new CoursePurchasedAdminNotification($lockedOrder, $admin));
                    }
                }
            });

            return $lockedOrder->fresh(['items', 'user', 'courseEntitlements']);
        });
    }

    /**
     * Find order by public order number.
     */
    public function getOrderByNumber(string $orderNumber): ?Order
    {
        return Order::with(['items.course', 'items.part', 'user'])
            ->where('order_number', $orderNumber)
            ->orWhere('id', $orderNumber)
            ->first();
    }
}
