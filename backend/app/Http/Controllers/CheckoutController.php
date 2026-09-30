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
        $result = $this->orderService->createOrder(
            $request->validated(),
            $request->ip()
        );

        $httpStatus = $result['is_duplicate'] ? Response::HTTP_OK : Response::HTTP_CREATED;

        return $this->successResponse(new OrderResource($result['order']), $httpStatus);
    }

    /**
     * Get order details by public reference number.
     */
    public function show(string $orderNumber): JsonResponse
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

        return $this->successResponse(new OrderResource($order));
    }
}
