<?php

namespace App\Http\Controllers;

use App\Models\AffiliateLedgerEntry;
use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Ticket;
use App\Models\User;
use App\Services\AffiliateCommissionService;
use App\Services\AffiliateCoPrizeService;
use App\Services\OrderService;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PaymentSimulatorController extends ApiController
{
    public function __construct(
        protected PaymentGatewayManager $paymentManager,
        protected OrderService $orderService,
        protected AffiliateCommissionService $affiliateCommissionService,
        protected AffiliateCoPrizeService $affiliateCoPrizeService
    ) {}

    /**
     * Security guard: Ensure payment simulator is allowed in the current environment.
     */
    protected function ensureSimulatorAllowed(): ?JsonResponse
    {
        if (app()->environment('production') || !config('payments.simulator_enabled', false)) {
            return $this->failResponse(
                'ERR_SIMULATOR_DISABLED',
                'محاكي الدفع معطل في بيئة الإنتاج',
                ['message_en' => 'Payment simulator is disabled in production environment'],
                Response::HTTP_FORBIDDEN
            );
        }

        return null;
    }

    /**
     * Inspect details of a simulator payment transaction and its associated financial state.
     */
    public function show(Request $request, string $transactionRef): JsonResponse
    {
        if ($guard = $this->ensureSimulatorAllowed()) {
            return $guard;
        }

        $transaction = PaymentTransaction::with([
            'order.items.course',
            'order.items.part',
            'order.user',
            'order.referralAttribution.referrer',
            'order.referralAttribution.buyer',
            'order.courseEntitlements',
            'order.tickets',
            'order.affiliateLedgerEntries',
        ])
        ->where('gateway_transaction_id', $transactionRef)
        ->orWhere('id', $transactionRef)
        ->first();

        // Fallback: match by order number
        if (!$transaction) {
            $order = Order::with([
                'items.course',
                'items.part',
                'user',
                'referralAttribution.referrer',
                'referralAttribution.buyer',
                'courseEntitlements',
                'tickets',
                'affiliateLedgerEntries',
            ])->where('order_number', $transactionRef)->first();

            if ($order) {
                $transaction = PaymentTransaction::where('order_id', $order->id)
                    ->where('gateway', 'simulator')
                    ->latest('attempt_number')
                    ->first();
            }
        }

        if (!$transaction) {
            return $this->failResponse(
                'ERR_TRANSACTION_NOT_FOUND',
                'معاملة الدفع التجريبية غير موجودة',
                ['message_en' => 'Simulator payment transaction not found'],
                Response::HTTP_NOT_FOUND
            );
        }

        $order = $transaction->order;
        $firstItem = $order?->items->first();
        $attribution = $order?->referralAttribution;
        $referrer = $attribution?->referrer;
        $buyer = $order?->user;

        // Determine if this constitutes a self-referral
        $isSelfReferral = false;
        if ($referrer && $buyer) {
            $isSelfReferral = ($referrer->id === $buyer->id) || 
                (strtolower(trim($referrer->email ?? '')) === strtolower(trim($buyer->email ?? '')));
        }

        // Calculate projected/minted commission
        $commissionBps = $attribution?->commission_rate_bps ?? (int) config('knzin.affiliate.commission_rate_bps', 2500);
        $projectedCommissionCents = $order ? intdiv($order->total_amount_cents * $commissionBps, 10000) : 0;

        // Get minted affiliate ledger entry if exists
        $salesCommissionEntry = $order?->affiliateLedgerEntries
            ->firstWhere('entry_type', 'sales_commission');
        $reversalDebitEntry = $order?->affiliateLedgerEntries
            ->firstWhere('entry_type', 'reversal_debit');

        return $this->successResponse([
            'transaction' => [
                'id' => $transaction->id,
                'gateway_transaction_id' => $transaction->gateway_transaction_id,
                'gateway' => $transaction->gateway,
                'amount_iqd' => $transaction->amount_iqd,
                'currency' => $transaction->currency ?? 'IQD',
                'status' => $transaction->status,
                'attempt_number' => $transaction->attempt_number,
                'created_at' => $transaction->created_at?->toIso8601String(),
                'paid_at' => $transaction->paid_at?->toIso8601String(),
                'expires_at' => $transaction->expires_at?->toIso8601String(),
                'is_terminal' => $transaction->isTerminal(),
            ],
            'order' => $order ? [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total_amount_cents' => $order->total_amount_cents,
                'item_type' => $firstItem?->item_type ?? 'bundle',
                'status' => $order->status,
                'tickets_status' => $order->tickets_status,
                'expires_at' => $order->expires_at?->toIso8601String(),
            ] : null,
            'item' => $firstItem ? [
                'course_title_ar' => $firstItem->course?->title_ar ?? 'دورة تدريبية',
                'course_title_en' => $firstItem->course?->title_en ?? 'Training Course',
                'item_type' => $firstItem->item_type,
                'part_number' => $firstItem->part?->part_number ?? null,
                'price_cents' => $firstItem->price_cents,
                'promotional_tickets_granted' => $firstItem->promotional_tickets_granted,
            ] : null,
            'buyer' => [
                'id' => $buyer?->id,
                'email' => $buyer?->email ?? $order?->user?->email,
                'display_name' => $buyer?->display_name ?? 'متعلم كنزين',
            ],
            'referral' => [
                'has_attribution' => $attribution !== null,
                'referrer_id' => $referrer?->id,
                'referrer_name' => $referrer?->display_name ?? $referrer?->name,
                'referrer_code' => $attribution?->referral_code,
                'campaign_tag' => $attribution?->campaign_tag,
                'is_self_referral' => $isSelfReferral,
                'commission_rate_bps' => $commissionBps,
                'commission_rate_percent' => ($commissionBps / 100) . '%',
                'projected_commission_cents' => $projectedCommissionCents,
                'projected_commission_usd' => number_format($projectedCommissionCents / 100, 2),
                'ledger_status' => $salesCommissionEntry?->status ?? ($attribution ? 'unfulfilled' : 'none'),
                'matures_at' => $salesCommissionEntry?->matures_at?->toIso8601String(),
            ],
            'financial_ledger' => [
                'sales_commission' => $salesCommissionEntry ? [
                    'id' => $salesCommissionEntry->id,
                    'amount_cents' => $salesCommissionEntry->amount_cents,
                    'status' => $salesCommissionEntry->status,
                    'matures_at' => $salesCommissionEntry->matures_at?->toIso8601String(),
                ] : null,
                'reversal_debit' => $reversalDebitEntry ? [
                    'id' => $reversalDebitEntry->id,
                    'amount_cents' => $reversalDebitEntry->amount_cents,
                    'status' => $reversalDebitEntry->status,
                ] : null,
            ],
            'entitlements_count' => $order?->courseEntitlements->count() ?? 0,
            'tickets' => $order?->tickets->map(fn(Ticket $t) => [
                'id' => $t->id,
                'serial_number' => $t->serial_number,
                'order_ticket_index' => $t->order_ticket_index,
                'issued_at' => $t->issued_at?->toIso8601String(),
            ])->values() ?? [],
        ]);
    }

    /**
     * Trigger simulated carrier reconnection & automatic reconciliation.
     */
    public function reconcile(Request $request, string $transactionRef): JsonResponse
    {
        if ($guard = $this->ensureSimulatorAllowed()) {
            return $guard;
        }

        $transaction = PaymentTransaction::with('order')
            ->where('gateway_transaction_id', $transactionRef)
            ->orWhere('id', $transactionRef)
            ->first();

        if (!$transaction || !$transaction->order) {
            return $this->failResponse('ERR_TRANSACTION_NOT_FOUND', 'معاملة الدفع غير موجودة', [], Response::HTTP_NOT_FOUND);
        }

        $order = $transaction->order;

        return DB::transaction(function () use ($transaction, $order) {
            /** @var Order $lockedOrder */
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();
            /** @var PaymentTransaction $lockedTxn */
            $lockedTxn = PaymentTransaction::where('id', $transaction->id)->lockForUpdate()->firstOrFail();

            if ($lockedOrder->status === 'completed') {
                return $this->successResponse([
                    'reconciled' => true,
                    'message' => 'الطلب مكتمل مسبقاً',
                    'order_status' => $lockedOrder->status,
                    'transaction_status' => $lockedTxn->status,
                ]);
            }

            $lockedTxn->update([
                'status' => 'success',
                'paid_at' => now(),
                'gateway_response' => array_merge($lockedTxn->gateway_response ?? [], [
                    'reconciled_via' => 'simulator_manual_reconcile',
                    'reconciled_at' => now()->toIso8601String(),
                ]),
            ]);

            $this->orderService->fulfillOrder($lockedOrder);

            return $this->successResponse([
                'reconciled' => true,
                'message' => 'تمت تسوية وتأكيد المعاملة بنجاح واستيفاء الطلب',
                'order_status' => 'completed',
                'transaction_status' => 'success',
            ]);
        });
    }

    /**
     * Simulate an order refund or dispute, testing the compensating reversal debit in the affiliate ledger.
     */
    public function refund(Request $request, string $transactionRef): JsonResponse
    {
        if ($guard = $this->ensureSimulatorAllowed()) {
            return $guard;
        }

        $transaction = PaymentTransaction::with('order')
            ->where('gateway_transaction_id', $transactionRef)
            ->orWhere('id', $transactionRef)
            ->first();

        if (!$transaction || !$transaction->order) {
            return $this->failResponse('ERR_TRANSACTION_NOT_FOUND', 'معاملة الدفع غير موجودة', [], Response::HTTP_NOT_FOUND);
        }

        $order = $transaction->order;

        return DB::transaction(function () use ($transaction, $order) {
            /** @var Order $lockedOrder */
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();
            /** @var PaymentTransaction $lockedTxn */
            $lockedTxn = PaymentTransaction::where('id', $transaction->id)->lockForUpdate()->firstOrFail();

            // Reverse affiliate commission if credited
            $reversalEntry = $this->affiliateCommissionService->reverseCommission(
                $lockedOrder,
                'simulator_test_refund'
            );

            $lockedOrder->update(['status' => 'refunded']);
            $lockedTxn->update([
                'status' => 'refunded',
                'gateway_response' => array_merge($lockedTxn->gateway_response ?? [], [
                    'refunded_via' => 'simulator_refund_tool',
                    'refunded_at' => now()->toIso8601String(),
                ]),
            ]);

            return $this->successResponse([
                'refunded' => true,
                'message' => 'تم استرداد المعاملة وإنشاء قيد عكسي في سجل المسوقين',
                'order_status' => 'refunded',
                'transaction_status' => 'refunded',
                'reversal_entry' => $reversalEntry ? [
                    'id' => $reversalEntry->id,
                    'amount_cents' => $reversalEntry->amount_cents,
                    'status' => $reversalEntry->status,
                ] : null,
            ]);
        });
    }

    /**
     * Fast-forward commission maturation from 24h hold to 'available' for withdrawal testing.
     */
    public function fastForwardMaturation(Request $request): JsonResponse
    {
        if ($guard = $this->ensureSimulatorAllowed()) {
            return $guard;
        }

        $userId = $request->input('user_id');

        return DB::transaction(function () use ($userId) {
            $query = AffiliateLedgerEntry::where('entry_type', 'sales_commission')
                ->where('status', 'pending');

            if ($userId) {
                $query->where('user_id', $userId);
            }

            // Fast-forward maturation timestamps to past
            $pendingEntries = $query->lockForUpdate()->get();
            $count = $pendingEntries->count();

            if ($count === 0) {
                return $this->successResponse([
                    'matured_count' => 0,
                    'message' => 'لا توجد عمولات معلقة بحاجة إلى تسريع النضج',
                ]);
            }

            foreach ($pendingEntries as $entry) {
                // Update matures_at to 1 hour ago
                $entry->matures_at = now()->subHour();
                $entry->save();
            }

            // Sweep matured entries to available
            if ($userId) {
                $swept = $this->affiliateCommissionService->sweepMaturedCommissionsForUser($userId);
            } else {
                $swept = AffiliateLedgerEntry::where('entry_type', 'sales_commission')
                    ->where('status', 'pending')
                    ->whereNotNull('matures_at')
                    ->where('matures_at', '<=', now())
                    ->update(['status' => 'available']);
            }

            return $this->successResponse([
                'matured_count' => $swept,
                'message' => "تم تسريع نضج وتحويل {$swept} عمولة إلى رصيد متاح للسحب بنجاح",
            ]);
        });
    }

    /**
     * Simulate a promotional draw win on a referred ticket, awarding 40% co-prize to the referrer.
     */
    public function simulateCoPrize(Request $request): JsonResponse
    {
        if ($guard = $this->ensureSimulatorAllowed()) {
            return $guard;
        }

        $ticketSerial = $request->input('ticket_serial');
        $prizeValuationUsd = (int) ($request->input('prize_valuation_usd', 50000));
        $prizeValuationCents = $prizeValuationUsd * 100;

        if (empty($ticketSerial)) {
            // Find most recent ticket with a referred order
            $ticket = Ticket::whereHas('order.referralAttribution')->latest()->first();
            $ticketSerial = $ticket?->serial_number;
        }

        if (!$ticketSerial) {
            return $this->failResponse(
                'ERR_NO_REFERRED_TICKET',
                'لم يتم العثور على تذكرة مرتبطة بطلب إحالة لتجربة الجائزة المشتركة',
                [],
                Response::HTTP_NOT_FOUND
            );
        }

        $coPrizeEntry = $this->affiliateCoPrizeService->awardCoPrize(
            $ticketSerial,
            $prizeValuationCents
        );

        if (!$coPrizeEntry) {
            return $this->failResponse(
                'ERR_CO_PRIZE_INELIGIBLE',
                'التذكرة غير مؤهلة للجائزة المشتركة أو تم منحها مسبقاً',
                ['ticket_serial' => $ticketSerial],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        return $this->successResponse([
            'co_prize_awarded' => true,
            'ticket_serial' => $ticketSerial,
            'referrer_user_id' => $coPrizeEntry->user_id,
            'amount_cents' => $coPrizeEntry->amount_cents,
            'amount_usd' => number_format($coPrizeEntry->amount_cents / 100, 2),
            'status' => $coPrizeEntry->status,
            'funding_source' => $coPrizeEntry->funding_source,
            'message' => "تم منح حصة الصديق (40%) بنجاح بقيمة $" . number_format($coPrizeEntry->amount_cents / 100, 2),
        ]);
    }

    /**
     * List recent simulator transactions for the Sandbox Hub console.
     */
    public function listTransactions(Request $request): JsonResponse
    {
        if ($guard = $this->ensureSimulatorAllowed()) {
            return $guard;
        }

        $transactions = PaymentTransaction::with(['order.user', 'order.referralAttribution.referrer'])
            ->where('gateway', 'simulator')
            ->latest('id')
            ->limit(25)
            ->get()
            ->map(function (PaymentTransaction $txn) {
                $order = $txn->order;
                $attribution = $order?->referralAttribution;
                return [
                    'id' => $txn->id,
                    'gateway_transaction_id' => $txn->gateway_transaction_id,
                    'order_number' => $order?->order_number,
                    'amount_iqd' => $txn->amount_iqd,
                    'status' => $txn->status,
                    'order_status' => $order?->status,
                    'buyer_email' => $order?->user?->email,
                    'referrer_name' => $attribution?->referrer?->display_name ?? $attribution?->referrer?->name,
                    'referral_code' => $attribution?->referral_code,
                    'checkout_url' => $txn->checkout_url,
                    'created_at' => $txn->created_at?->toIso8601String(),
                ];
            });

        return $this->successResponse([
            'transactions' => $transactions,
        ]);
    }

    /**
     * 1-Click Scenario Launcher: Quick-generate test orders with/without referrals.
     */
    public function seedScenario(Request $request): JsonResponse
    {
        if ($guard = $this->ensureSimulatorAllowed()) {
            return $guard;
        }

        $scenario = $request->input('scenario', 'bundle_with_referral');
        $course = Course::with('parts')->first();

        if (!$course) {
            return $this->failResponse('ERR_NO_COURSES', 'لا توجد دورات مسجلة في قاعدة البيانات', [], Response::HTTP_NOT_FOUND);
        }

        // Find or create test referrer
        $referrer = User::firstOrCreate(
            ['email' => 'alifaraj_affiliate@knzin.com'],
            [
                'display_name' => 'علي فرج (Ali Faraj)',
                'learner_code' => 'ALIFARAJ',
                'role' => 'user',
                'status' => 'active',
                'password' => bcrypt('Password123!'),
            ]
        );

        $buyerEmail = match ($scenario) {
            'self_referral_exploit' => 'alifaraj_affiliate@knzin.com',
            default => 'tester_' . Str::random(5) . '@knzin.test',
        };

        $itemType = str_contains($scenario, 'part') ? 'part' : 'bundle';
        $part = $itemType === 'part' ? $course->parts->first() : null;

        $referralCode = match ($scenario) {
            'bundle_no_referral' => null,
            default => 'ALIFARAJ',
        };

        $orderPayload = [
            'email' => $buyerEmail,
            'course_id' => $course->id,
            'item_type' => $itemType,
            'course_part_id' => $part?->id,
            'idempotency_key' => 'sim_seed_' . Str::uuid(),
            'referral_code' => $referralCode,
            'quiz_answers' => ['focus' => 'vocational', 'weekly_hours' => 5],
        ];

        $orderResult = $this->orderService->createOrder($orderPayload, '127.0.0.1', 'KNZiN-Simulator/1.0');
        $order = $orderResult['order'];

        // Initiate simulator payment transaction
        $transaction = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'simulator',
            'amount_iqd' => $order->paid_amount_gateway,
            'currency' => 'IQD',
            'status' => 'initiated',
            'attempt_number' => 1,
            'expires_at' => now()->addMinutes(30),
        ]);

        $initData = $this->paymentManager->driver('simulator')->initiatePayment($order, $transaction, 'ar');
        $transaction->update([
            'gateway_transaction_id' => $initData['gateway_transaction_id'],
            'checkout_url' => $initData['checkout_url'],
        ]);

        return $this->successResponse([
            'scenario' => $scenario,
            'order_number' => $order->order_number,
            'transaction_id' => $transaction->gateway_transaction_id,
            'checkout_url' => $initData['checkout_url'],
            'amount_iqd' => $order->paid_amount_gateway,
            'buyer_email' => $buyerEmail,
            'referral_code' => $referralCode,
            'message' => 'تم إنشاء سيناريو الاختبار بنجاح',
        ], Response::HTTP_CREATED);
    }
}
