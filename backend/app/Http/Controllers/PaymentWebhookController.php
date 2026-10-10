<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\PaymentWebhook;
use App\Services\OrderService;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PaymentWebhookController extends ApiController
{
    public function __construct(
        protected PaymentGatewayManager $paymentManager,
        protected OrderService $orderService
    ) {}

    /**
     * Handle deterministic sandbox simulator webhook.
     */
    public function simulator(Request $request): JsonResponse
    {
        if (app()->environment('production') && !config('payments.simulator_enabled', false)) {
            return response()->json([
                'success' => false,
                'status' => 'fail',
                'error' => [
                    'code' => 'ERR_SIMULATOR_DISABLED',
                    'message' => 'محاكي الدفع معطل في بيئة الإنتاج',
                    'message_en' => 'Payment simulator is disabled in production',
                ],
            ], Response::HTTP_FORBIDDEN);
        }

        $driver = $this->paymentManager->driver('simulator');
        $verification = $driver->verifyWebhook($request);

        $transactionId = $verification['transaction_id'] ?? null;
        $idempotencyKey = 'simulator_' . ($transactionId ?? (string) Str::uuid());

        // Check if exact webhook idempotency record exists
        $existingWebhook = PaymentWebhook::where('idempotency_key', $idempotencyKey)->first();
        if ($existingWebhook && $existingWebhook->processed) {
            return response()->json([
                'status' => 'ok',
                'message' => 'Duplicate webhook acknowledged',
            ], Response::HTTP_OK);
        }

        $webhookLog = $existingWebhook ?? PaymentWebhook::create([
            'gateway' => 'simulator',
            'event_type' => 'payment.outcome',
            'idempotency_key' => $idempotencyKey,
            'payload' => $request->all(),
            'headers' => $request->headers->all(),
            'signature_verified' => true,
            'processed' => false,
            'ip_hash' => hash('sha256', (string) $request->ip()),
        ]);

        return $this->processTransactionFulfillment(
            gateway: 'simulator',
            transactionRef: $transactionId,
            verification: $verification,
            webhookLog: $webhookLog
        );
    }

    /**
     * Handle ZainCash dual-mode webhook (S2S IPN and browser redirect).
     */
    public function zaincash(Request $request): JsonResponse|RedirectResponse
    {
        $driver = $this->paymentManager->driver('zaincash');
        $verification = $driver->verifyWebhook($request);

        $transactionRef = $verification['transaction_id'] ?? null;
        $idempotencyKey = 'zaincash_' . ($transactionRef ?? (string) Str::uuid());

        $existingWebhook = PaymentWebhook::where('idempotency_key', $idempotencyKey)->first();
        if ($existingWebhook && $existingWebhook->processed) {
            return $this->dualModeResponse($request, $transactionRef, 'Duplicate webhook acknowledged');
        }

        $webhookLog = $existingWebhook ?? PaymentWebhook::create([
            'gateway' => 'zaincash',
            'event_type' => 'transaction.complete',
            'idempotency_key' => $idempotencyKey,
            'payload' => $request->all(),
            'headers' => $request->headers->all(),
            'signature_verified' => (bool) ($verification['verified'] ?? false),
            'processed' => false,
            'ip_hash' => hash('sha256', (string) $request->ip()),
        ]);

        if (!($verification['verified'] ?? false)) {
            $webhookLog->update([
                'processed' => false,
                'error_message' => 'ERR_SIGNATURE_VERIFICATION_FAILED',
            ]);

            return response()->json([
                'success' => false,
                'status' => 'fail',
                'error' => [
                    'code' => 'ERR_SIGNATURE_VERIFICATION_FAILED',
                    'message' => 'فشل التحقق من التوقيع الرقمي لبوابة زين كاش',
                    'message_en' => 'ZainCash cryptographic signature verification failed',
                ],
            ], Response::HTTP_UNAUTHORIZED);
        }

        $fulfillmentResponse = $this->processTransactionFulfillment(
            gateway: 'zaincash',
            transactionRef: $transactionRef,
            verification: $verification,
            webhookLog: $webhookLog
        );

        if ($fulfillmentResponse->getStatusCode() !== Response::HTTP_OK) {
            return $fulfillmentResponse;
        }

        return $this->dualModeResponse($request, $transactionRef, 'Webhook processed successfully');
    }

    /**
     * Handle AsiaHawala signed merchant callback.
     */
    public function asiahawala(Request $request): JsonResponse
    {
        $driver = $this->paymentManager->driver('asiahawala');
        $verification = $driver->verifyWebhook($request);

        $transactionRef = $verification['transaction_id'] ?? null;
        $idempotencyKey = 'asiahawala_' . ($transactionRef ?? (string) Str::uuid());

        $existingWebhook = PaymentWebhook::where('idempotency_key', $idempotencyKey)->first();
        if ($existingWebhook && $existingWebhook->processed) {
            return response()->json([
                'status' => 'ok',
                'message' => 'Duplicate webhook acknowledged',
            ], Response::HTTP_OK);
        }

        $webhookLog = $existingWebhook ?? PaymentWebhook::create([
            'gateway' => 'asiahawala',
            'event_type' => 'payment.callback',
            'idempotency_key' => $idempotencyKey,
            'payload' => $request->all(),
            'headers' => $request->headers->all(),
            'signature_verified' => (bool) ($verification['verified'] ?? false),
            'processed' => false,
            'ip_hash' => hash('sha256', (string) $request->ip()),
        ]);

        if (!($verification['verified'] ?? false)) {
            $webhookLog->update([
                'processed' => false,
                'error_message' => 'ERR_SIGNATURE_VERIFICATION_FAILED',
            ]);

            return response()->json([
                'success' => false,
                'status' => 'fail',
                'error' => [
                    'code' => 'ERR_SIGNATURE_VERIFICATION_FAILED',
                    'message' => 'فشل التحقق من التوقيع الرقمي لبوابة آسيا حوالة',
                    'message_en' => 'AsiaHawala cryptographic signature verification failed',
                ],
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $this->processTransactionFulfillment(
            gateway: 'asiahawala',
            transactionRef: $transactionRef,
            verification: $verification,
            webhookLog: $webhookLog
        );
    }

    /**
     * Internal atomic fulfillment handler executing DB transactions, row-level locks,
     * replay protection, and double charge anomaly shielding.
     */
    protected function processTransactionFulfillment(
        string $gateway,
        ?string $transactionRef,
        array $verification,
        PaymentWebhook $webhookLog
    ): JsonResponse {
        return DB::transaction(function () use ($gateway, $transactionRef, $verification, $webhookLog) {
            /** @var PaymentTransaction|null $transaction */
            $transaction = PaymentTransaction::where('gateway', $gateway)
                ->where(function ($query) use ($transactionRef) {
                    $query->where('gateway_transaction_id', $transactionRef)
                        ->orWhere('id', $transactionRef);
                })
                ->lockForUpdate()
                ->first();

            // Fallback: match by order_number if provided in verification
            if (!$transaction && !empty($verification['order_number'])) {
                $order = Order::where('order_number', $verification['order_number'])->first();
                if ($order) {
                    $transaction = PaymentTransaction::where('order_id', $order->id)
                        ->where('gateway', $gateway)
                        ->latest('attempt_number')
                        ->lockForUpdate()
                        ->first();
                }
            }

            if (!$transaction) {
                $webhookLog->update([
                    'processed' => false,
                    'error_message' => 'ERR_TRANSACTION_NOT_FOUND',
                ]);

                return response()->json([
                    'success' => false,
                    'status' => 'fail',
                    'error' => [
                        'code' => 'ERR_TRANSACTION_NOT_FOUND',
                        'message' => 'معاملة الدفع غير موجودة',
                        'message_en' => 'Payment transaction reference not found',
                    ],
                ], Response::HTTP_NOT_FOUND);
            }

            /** @var Order $order */
            $order = Order::where('id', $transaction->order_id)->lockForUpdate()->firstOrFail();

            // 1. Replay Shield: If transaction is already success, return HTTP 200 without side effects
            if ($transaction->status === 'success') {
                $webhookLog->update(['processed' => true]);

                return response()->json([
                    'status' => 'ok',
                    'message' => 'Transaction already processed',
                ], Response::HTTP_OK);
            }

            // 2. Cross-Gateway Double Charge Anomaly Detection (Decision D-4, Task T040)
            if ($order->status === 'completed' && $transaction->status !== 'success') {
                $transaction->update([
                    'status' => 'duplicate_charge_flagged',
                    'paid_at' => now(),
                    'gateway_response' => $verification['raw_data'] ?? null,
                ]);

                Log::critical("CRITICAL: Cross-gateway double charge anomaly detected for order {$order->order_number} via {$gateway}.", [
                    'order_id' => $order->id,
                    'transaction_id' => $transaction->id,
                    'gateway' => $gateway,
                    'amount_iqd' => $transaction->amount_iqd,
                ]);

                $webhookLog->update([
                    'processed' => true,
                    'error_message' => 'DUPLICATE_CHARGE_FLAGGED',
                ]);

                return response()->json([
                    'status' => 'ok',
                    'message' => 'Duplicate charge flagged for administrative review',
                ], Response::HTTP_OK);
            }

            // 3. Process outcome
            if (($verification['status'] ?? 'failed') === 'success') {
                // Verify amount if returned
                if (!empty($verification['amount_iqd']) && (int) $verification['amount_iqd'] !== (int) $transaction->amount_iqd) {
                    $webhookLog->update([
                        'processed' => false,
                        'error_message' => 'ERR_AMOUNT_MISMATCH',
                    ]);

                    return response()->json([
                        'success' => false,
                        'status' => 'fail',
                        'error' => [
                            'code' => 'ERR_AMOUNT_MISMATCH',
                            'message' => 'المبلغ المدفوع لا يتطابق مع قيمة الطلب',
                            'message_en' => 'Paid amount does not match order amount',
                        ],
                    ], Response::HTTP_UNPROCESSABLE_ENTITY);
                }

                $transaction->update([
                    'status' => 'success',
                    'paid_at' => now(),
                    'gateway_response' => $verification['raw_data'] ?? null,
                ]);

                // Atomically fulfill order (entitlements, affiliate commission, ticket minting job)
                $this->orderService->fulfillOrder($order);

                $webhookLog->update(['processed' => true]);

                return response()->json([
                    'status' => 'ok',
                    'message' => 'Webhook processed successfully',
                ], Response::HTTP_OK);
            }

            // Failed outcome
            $transaction->update([
                'status' => 'failed',
                'gateway_response' => $verification['raw_data'] ?? null,
            ]);

            $webhookLog->update(['processed' => true]);

            return response()->json([
                'status' => 'ok',
                'message' => 'Transaction marked as failed',
            ], Response::HTTP_OK);
        });
    }

    /**
     * Resolve dual-mode return: 302 redirect for browser, 200 JSON for server IPN.
     */
    protected function dualModeResponse(Request $request, ?string $transactionRef, string $jsonMessage): JsonResponse|RedirectResponse
    {
        $isBrowser = $request->isMethod('GET') || str_contains($request->header('Accept', ''), 'text/html');

        if ($isBrowser && $transactionRef) {
            $transaction = PaymentTransaction::with('order')->where('gateway_transaction_id', $transactionRef)
                ->orWhere('id', $transactionRef)
                ->first();

            if ($transaction && $transaction->order) {
                $locale = 'ar';
                return redirect("/{$locale}/order-summary/{$transaction->order->order_number}");
            }
        }

        return response()->json([
            'status' => 'ok',
            'message' => $jsonMessage,
        ], Response::HTTP_OK);
    }
}
