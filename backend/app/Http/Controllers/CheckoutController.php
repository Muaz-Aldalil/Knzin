<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CheckoutController extends ApiController
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Create a new pending order or replay existing idempotent order.
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Authoritative server-side identity: if user is authenticated via Sanctum, use their verified email
        /** @var \App\Models\User|null $authUser */
        $authUser = $request->user('sanctum') ?? $request->user();
        if ($authUser) {
            $data['email'] = $authUser->email;
        }

        $result = $this->orderService->createOrder(
            $data,
            $request->ip(),
            $request->userAgent()
        );

        $httpStatus = $result['is_duplicate'] ? Response::HTTP_OK : Response::HTTP_CREATED;

        return $this->successResponse(new OrderResource($result['order']), $httpStatus);
    }

    /**
     * Get order details by public reference number.
     */
    public function show(string $orderNumber, \Illuminate\Http\Request $request): JsonResponse
    {
        $order = $this->orderService->getOrderByNumber($orderNumber);

        if (!$order) {
            return $this->failResponse(
                'ERR_ORDER_NOT_FOUND',
                "Order with reference {$orderNumber} not found",
                [],
                Response::HTTP_NOT_FOUND
            );
        }

        // Authorize order access (PENT-04)
        /** @var \App\Models\User|null $authUser */
        $authUser = $request->user('sanctum') ?? $request->user();

        if ($authUser) {
            if ($authUser->id !== $order->user_id && !$authUser->isAdmin()) {
                return $this->failResponse(
                    'ERR_FORBIDDEN',
                    'You are not authorized to view this order.',
                    [],
                    Response::HTTP_FORBIDDEN
                );
            }
        } else {
            // For unauthenticated access, require matching customer email
            $queryEmail = strtolower(trim((string) ($request->query('guest_email') ?? $request->query('email', ''))));
            $orderEmail = strtolower(trim($order->user?->email ?? ''));

            if ($orderEmail !== '' && $queryEmail !== $orderEmail) {
                return $this->failResponse(
                    'ERR_UNAUTHORIZED',
                    'Authentication or verified order email required to view order details.',
                    [],
                    Response::HTTP_UNAUTHORIZED
                );
            }
        }

        return $this->successResponse(new OrderResource($order));
    }

    /**
     * Simulate successful payment fulfillment for testing and mock data.
     * Synchronously grants course entitlements and mints promotional sweepstakes tickets.
     */
    public function simulateSuccess(string $orderNumber, \Illuminate\Http\Request $request): JsonResponse
    {
        if (app()->isProduction()) {
            return $this->failResponse(
                'ERR_SIMULATOR_DISABLED',
                'محاكي الدفع غير متاح في بيئة الإنتاج.',
                ['message_en' => 'Payment simulator is disabled in production.'],
                Response::HTTP_NOT_FOUND
            );
        }

        $order = $this->orderService->getOrderByNumber($orderNumber);

        if (!$order) {
            return $this->failResponse(
                'ERR_ORDER_NOT_FOUND',
                "Order with reference {$orderNumber} not found",
                [],
                Response::HTTP_NOT_FOUND
            );
        }

        /** @var \App\Models\User|null $authUser */
        $authUser = $request->user('sanctum') ?? $request->user();

        // Security check: allow if owner, admin, or demo email / mode
        $isOwner = $authUser && ($authUser->id === $order->user_id || strtolower(trim((string)$authUser->email)) === strtolower(trim((string)$order->user?->email)));
        $isAdmin = $authUser && $authUser->isAdmin();
        $isDemoAllowed = !app()->isProduction() && (
            config('payments.simulator_enabled', false) 
            || (bool) env('KNZIN_ALLOW_DEMO_ADMIN', false)
            || in_array(strtolower(trim((string)$order->user?->email)), ['mock_student@example.com', 'admin@knzin.com'], true)
        );

        if (!$isOwner && !$isAdmin && !$isDemoAllowed) {
            return $this->failResponse(
                'ERR_FORBIDDEN',
                'غير مصرح لك بمحاكاة دفع هذا الطلب',
                ['message_en' => 'You are not authorized to simulate payment for this order.'],
                Response::HTTP_FORBIDDEN
            );
        }

        // Fulfill the order if not already completed
        if ($order->status !== 'completed') {
            // Update latest transaction to success if present
            $latestTxn = $order->paymentTransactions()->latest('created_at')->first();
            if ($latestTxn && $latestTxn->status !== 'success') {
                $latestTxn->update([
                    'status' => 'success',
                    'paid_at' => now(),
                    'gateway_response' => array_merge($latestTxn->gateway_response ?? [], [
                        'reconciled_via' => 'simulate_success',
                        'reconciled_at' => now()->toIso8601String(),
                    ]),
                ]);
            }

            // Fulfill order (grants course entitlements and schedules ticket minting)
            $order = $this->orderService->fulfillOrder($order);

            // Synchronously ensure tickets are minted right now for instant availability in testing
            try {
                $mintingService = app(\App\Services\TicketMintingService::class);
                $mintingService->mintForOrder($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("simulateSuccess: synchronous ticket mint notice: " . $e->getMessage());
            }
        }

        return $this->successResponse([
            'order' => new OrderResource($order->fresh(['items.course', 'items.part', 'user'])),
            'message' => 'تم تأكيد الدفع التجريبي بنجاح وتفعيل الدورة وتذاكر السحب',
            'message_en' => 'Payment simulated successfully. Course access granted and tickets minted.',
        ]);
    }
}
