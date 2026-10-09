<?php

namespace App\Services\Payments\Drivers;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\Payments\PayloadNormalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AsiaHawalaDriver implements PaymentGatewayInterface
{
    /**
     * Initialize a payment session with AsiaHawala.
     */
    public function initiatePayment(Order $order, PaymentTransaction $transaction, string $locale = 'ar'): array
    {
        $config = config('payments.gateways.asiahawala');
        $merchantId = $config['merchant_id'];
        $apiKey = $config['api_key'];
        $secretKey = $config['secret_key'];
        $endpoint = rtrim($config['endpoint'], '/');
        $callbackUrl = $config['callback_url'];

        $timestamp = time();
        $amount = (int) $transaction->amount_iqd;
        $signString = sprintf('%s|%s|%d|IQD|%d', $merchantId, $order->order_number, $amount, $timestamp);
        $signature = hash_hmac('sha256', $signString, $secretKey);

        $payload = [
            'merchant_id' => $merchantId,
            'order_number' => $order->order_number,
            'amount' => $amount,
            'currency' => 'IQD',
            'language' => $locale,
            'callback_url' => $callbackUrl,
            'return_url' => url(sprintf('/%s/order-summary/%s', $locale, $order->order_number)),
            'timestamp' => $timestamp,
        ];

        $response = Http::timeout(config('payments.http_timeout_seconds', 10))
            ->retry(config('payments.http_retries', 2), 100)
            ->withHeaders([
                'X-Api-Key' => $apiKey,
                'X-Signature' => $signature,
            ])
            ->asJson()
            ->post("{$endpoint}/api/v1/checkout/initialize", $payload);

        if (!$response->successful()) {
            throw new \RuntimeException(sprintf(
                'AsiaHawala initiation request failed with HTTP %d: %s',
                $response->status(),
                $response->body()
            ));
        }

        $data = $response->json();
        $gatewayTxnId = $data['transaction_ref'] ?? $data['transaction_id'] ?? null;
        $checkoutUrl = $data['checkout_url'] ?? null;

        if (!$gatewayTxnId || !$checkoutUrl) {
            throw new \RuntimeException('AsiaHawala response missing transaction_ref or checkout_url: ' . $response->body());
        }

        return [
            'gateway_transaction_id' => (string) $gatewayTxnId,
            'checkout_url' => $checkoutUrl,
            'raw_response' => $data,
        ];
    }

    /**
     * Authoritatively verify an incoming AsiaHawala merchant callback.
     */
    public function verifyWebhook(Request $request): array
    {
        $secretKey = config('payments.gateways.asiahawala.secret_key');

        if (empty($secretKey)) {
            Log::error('AsiaHawala callback verification failed: secret_key is not configured.');
            return [
                'verified' => false,
                'error' => 'Payment gateway secret key is not configured on the server.',
            ];
        }

        $receivedSignature = $request->header('X-Callback-Signature')
            ?? $request->input('signature')
            ?? $request->input('hash');

        if (!$receivedSignature) {
            return [
                'verified' => false,
                'error' => 'AsiaHawala callback signature is missing.',
            ];
        }

        $content = $request->getContent();
        $computedSignature = hash_hmac('sha256', $content, $secretKey);

        $isValid = hash_equals($computedSignature, (string) $receivedSignature);

        // Fallback: if request content format differs slightly due to JSON formatting
        if (!$isValid && is_array($request->all())) {
            $data = $request->all();
            unset($data['signature'], $data['hash']);
            $computedAlt = hash_hmac('sha256', json_encode($data), $secretKey);
            $isValid = hash_equals($computedAlt, (string) $receivedSignature);
        }

        if (!$isValid) {
            Log::warning('AsiaHawala HMAC signature mismatch.', [
                'received' => $receivedSignature,
            ]);

            return [
                'verified' => false,
                'error' => 'Cryptographic signature mismatch.',
            ];
        }

        $normalized = PayloadNormalizer::extractAsiaHawala($request->all());
        $isSuccess = in_array($normalized['status'], ['PAID', 'SUCCESS'], true);

        return [
            'verified' => true,
            'transaction_id' => $normalized['gateway_transaction_id'],
            'order_number' => $normalized['order_id'],
            'status' => $isSuccess ? 'success' : 'failed',
            'amount_iqd' => $normalized['amount'] ?? 0,
            'raw_data' => $request->all(),
        ];
    }

    /**
     * Query AsiaHawala transaction state for auto-reconciliation.
     */
    public function checkStatus(PaymentTransaction $transaction): string
    {
        $config = config('payments.gateways.asiahawala');
        $endpoint = rtrim($config['endpoint'], '/');
        $apiKey = $config['api_key'];
        $secretKey = $config['secret_key'];
        $merchantId = $config['merchant_id'];

        if (!$transaction->gateway_transaction_id) {
            return 'failed';
        }

        $timestamp = time();
        $signString = sprintf('%s|%s|%d', $merchantId, $transaction->gateway_transaction_id, $timestamp);
        $signature = hash_hmac('sha256', $signString, $secretKey);

        try {
            $response = Http::timeout(config('payments.http_timeout_seconds', 10))
                ->withHeaders([
                    'X-Api-Key' => $apiKey,
                    'X-Signature' => $signature,
                ])
                ->get("{$endpoint}/api/v1/checkout/status", [
                    'merchant_id' => $merchantId,
                    'transaction_ref' => $transaction->gateway_transaction_id,
                    'timestamp' => $timestamp,
                ]);

            if (!$response->successful()) {
                return 'pending';
            }

            $data = $response->json();
            $status = strtoupper($data['status'] ?? '');

            if ($status === 'PAID' || $status === 'SUCCESS') {
                return 'success';
            }

            if (in_array($status, ['FAILED', 'CANCELLED', 'CANCELED'], true)) {
                return 'failed';
            }

            if ($status === 'EXPIRED') {
                return 'expired';
            }

            return 'pending';
        } catch (\Throwable $e) {
            Log::warning('AsiaHawala status check exception: ' . $e->getMessage());

            return 'pending';
        }
    }
}
