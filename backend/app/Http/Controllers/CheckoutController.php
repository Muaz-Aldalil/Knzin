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
            $queryEmail = strtolower(trim((string) $request->query('email', '')));
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
}
