<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends ApiController
{
    public function __construct(
        protected PaymentGatewayManager $paymentManager
    ) {}

    /**
     * Initiate a payment session with a supported gateway.
     */
    public function pay(Request $request, string $orderNumber): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'gateway' => 'required|string|in:zaincash,asiahawala,simulator',
            'locale' => 'nullable|string|in:ar,en',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'status' => 'fail',
                'error' => [
                    'code' => 'ERR_INVALID_GATEWAY',
                    'message' => 'بوابة الدفع المحددة غير مدعومة',
                    'message_en' => 'The selected payment gateway is not supported',
                ],
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $gateway = $request->input('gateway');
        $locale = $request->input('locale', 'ar');

        if ($gateway === 'simulator' && !config('payments.simulator_enabled', false) && !app()->environment(['local', 'testing'])) {
            return response()->json([
                'success' => false,
                'status' => 'fail',
                'error' => [
                    'code' => 'ERR_SIMULATOR_DISABLED',
                    'message' => 'بوابة الدفع التجريبية غير متاحة في بيئة الإنتاج',
                    'message_en' => 'Payment simulator is disabled in production environment',
                ],
            ], Response::HTTP_FORBIDDEN);
        }

        return DB::transaction(function () use ($request, $orderNumber, $gateway, $locale) {
            /** @var Order|null $order */
            $order = Order::with('user')->where('order_number', $orderNumber)->lockForUpdate()->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'status' => 'fail',
                    'error' => [
                        'code' => 'ERR_ORDER_NOT_FOUND',
                        'message' => 'الطلب غير موجود',
                        'message_en' => 'Order not found',
                    ],
                ], Response::HTTP_NOT_FOUND);
            }

            if ($authError = $this->authorizeOrderAccess($request, $order)) {
                return $authError;
            }

            if ($order->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'status' => 'fail',
                    'error' => [
                        'code' => 'ERR_ORDER_ALREADY_COMPLETED',
                        'message' => 'تم إتمام هذا الطلب مسبقاً بنجاح',
                        'message_en' => 'This order has already been completed',
                    ],
                ], Response::HTTP_CONFLICT);
            }

            if ($order->isExpired() || ($order->expires_at && $order->expires_at->isPast())) {
                return response()->json([
                    'success' => false,
                    'status' => 'fail',
                    'error' => [
                        'code' => 'ERR_ORDER_EXPIRED',
                        'message' => 'انتهت صلاحية هذا الطلب',
                        'message_en' => 'This order has expired',
                    ],
                ], Response::HTTP_CONFLICT);
            }

            $lastAttempt = PaymentTransaction::where('order_id', $order->id)->max('attempt_number') ?? 0;
            $attemptNumber = $lastAttempt + 1;

            $transaction = PaymentTransaction::create([
                'order_id' => $order->id,
                'gateway' => $gateway,
                'amount_iqd' => $order->paid_amount_gateway,
                'currency' => 'IQD',
                'status' => 'initiated',
                'attempt_number' => $attemptNumber,
                'expires_at' => now()->addMinutes(config('payments.session_ttl_minutes', 30)),
            ]);

            try {
                $driver = $this->paymentManager->driver($gateway);
                $initResult = $driver->initiatePayment($order, $transaction, $locale);

                $transaction->update([
                    'gateway_transaction_id' => $initResult['gateway_transaction_id'] ?? null,
                    'checkout_url' => $initResult['checkout_url'] ?? null,
                    'gateway_response' => $initResult,
                ]);

                return response()->json([
                    'success' => true,
                    'status' => 'success',
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'gateway' => $transaction->gateway,
                        'gateway_transaction_id' => $transaction->gateway_transaction_id,
                        'checkout_url' => $transaction->checkout_url,
                        'amount_iqd' => (int) $transaction->amount_iqd,
                        'currency' => $transaction->currency,
                        'expires_at' => $transaction->expires_at->toIso8601String(),
                    ],
                ], Response::HTTP_OK);
            } catch (\Throwable $e) {
                Log::error("Payment initiation failed for order {$orderNumber} on {$gateway}: " . $e->getMessage(), [
                    'exception' => $e,
                ]);

                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => ['error' => $e->getMessage()],
                ]);

                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'error' => [
                        'code' => 'ERR_GATEWAY_UNAVAILABLE',
                        'message' => 'خدمة الدفع غير متوفرة حالياً، يرجى المحاولة بعد قليل',
                        'message_en' => 'Payment gateway is temporarily unavailable. Please try again shortly.',
                    ],
                ], Response::HTTP_SERVICE_UNAVAILABLE);
            }
        });
    }

    /**
     * Polling endpoint to check real-time order and latest payment status.
     */
    public function paymentStatus(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::with('user')->where('order_number', $orderNumber)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'status' => 'fail',
                'error' => [
                    'code' => 'ERR_ORDER_NOT_FOUND',
                    'message' => 'الطلب غير موجود',
                    'message_en' => 'Order not found',
                ],
            ], Response::HTTP_NOT_FOUND);
        }

        if ($authError = $this->authorizeOrderAccess($request, $order)) {
            return $authError;
        }

        /** @var PaymentTransaction|null $latestTxn */
        $latestTxn = $order->paymentTransactions()->latest('created_at')->first();

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'tickets_status' => $order->status === 'completed' ? 'minted' : 'pending',
                'promotional_tickets_granted' => (int) $order->promotional_tickets_granted,
                'paid_amount_gateway' => (int) $order->paid_amount_gateway,
                'currency' => 'IQD',
                'latest_transaction' => $latestTxn ? [
                    'id' => $latestTxn->id,
                    'gateway' => $latestTxn->gateway,
                    'gateway_transaction_id' => $latestTxn->gateway_transaction_id,
                    'status' => $latestTxn->status,
                    'paid_at' => $latestTxn->paid_at?->toIso8601String(),
                    'error_message' => $latestTxn->gateway_response['error_message'] ?? null,
                ] : null,
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Verify whether the current request is authorized to interact with the given order.
     * Invariants:
     * 1. If user is authenticated, they may only access their own orders (by user_id or matching email).
     * 2. If user is unauthenticated (guest), they may only access orders belonging to guest accounts.
     *    Orders created by authenticated accounts require authentication to prevent hijacking/IDOR.
     */
    protected function authorizeOrderAccess(Request $request, Order $order): ?JsonResponse
    {
        /** @var \App\Models\User|null $authUser */
        $authUser = auth('sanctum')->user() ?? $request->user('sanctum') ?? $request->user();

        if ($authUser) {
            $isOwner = ($order->user_id === $authUser->id) ||
                ($order->user && strtolower(trim($order->user->email)) === strtolower(trim($authUser->email)));

            if (!$isOwner) {
                return response()->json([
                    'success' => false,
                    'status' => 'fail',
                    'error' => [
                        'code' => 'ERR_FORBIDDEN',
                        'message' => 'غير مصرح لك بالوصول إلى هذا الطلب أو إتمام دفعه',
                        'message_en' => 'You are not authorized to pay for or access this order',
                    ],
                ], Response::HTTP_FORBIDDEN);
            }
        } else {
            // Anonymous guest: if order belongs to a registered/verified user (non-guest), reject anonymous access
            if ($order->user && $order->user->auth_provider !== 'guest') {
                return response()->json([
                    'success' => false,
                    'status' => 'fail',
                    'error' => [
                        'code' => 'ERR_UNAUTHORIZED',
                        'message' => 'يرجى تسجيل الدخول للوصول إلى هذا الطلب',
                        'message_en' => 'Please sign in to access this order',
                    ],
                ], Response::HTTP_UNAUTHORIZED);
            }
        }

        return null;
    }
}
