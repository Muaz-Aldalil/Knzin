<?php

namespace App\Services\Payments\Drivers;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\Payments\PayloadNormalizer;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZainCashDriver implements PaymentGatewayInterface
{
    /**
     * Initialize a payment session with ZainCash.
     */
    public function initiatePayment(Order $order, PaymentTransaction $transaction, string $locale = 'ar'): array
    {
        $config = config('payments.gateways.zaincash');
        $msisdn = $config['msisdn'];
        $secret = $config['secret'];
        $merchantId = $config['merchant_id'];
        $initUrl = $config['init_url'];
        $checkoutBaseUrl = $config['checkout_base_url'];
        $callbackUrl = $config['callback_url'];

        $payload = [
            'amount' => (int) $transaction->amount_iqd,
            'serviceType' => 'KNZiN Educational Content Purchase',
            'msisdn' => $msisdn,
            'orderId' => $order->order_number,
            'redirectUrl' => $callbackUrl,
            'iat' => time(),
            'exp' => time() + (4 * 3600),
        ];

        $token = JWT::encode($payload, $secret, 'HS256');

        $response = Http::timeout(config('payments.http_timeout_seconds', 10))
            ->retry(config('payments.http_retries', 2), 100)
            ->asJson()
            ->post($initUrl, [
                'token' => $token,
                'merchantId' => $merchantId,
                'lang' => $locale,
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException(sprintf(
                'ZainCash initiation request failed with HTTP %d: %s',
                $response->status(),
                $response->body()
            ));
        }

        $data = $response->json();
        $gatewayTxnId = $data['id'] ?? null;
        if (!$gatewayTxnId) {
            throw new \RuntimeException('ZainCash response did not contain transaction ID: ' . $response->body());
        }

        $checkoutUrl = sprintf('%s?id=%s', $checkoutBaseUrl, $gatewayTxnId);

        return [
            'gateway_transaction_id' => (string) $gatewayTxnId,
            'checkout_url' => $checkoutUrl,
            'raw_response' => $data,
        ];
    }

    /**
     * Authoritatively verify an incoming ZainCash server-to-server or redirect webhook token.
     */
    public function verifyWebhook(Request $request): array
    {
        $token = $request->input('token') ?? $request->query('token');

        if (!$token || !is_string($token)) {
            return [
                'verified' => false,
                'error' => 'ZainCash token parameter is missing.',
            ];
        }

        $secret = config('payments.gateways.zaincash.secret');

        if (empty($secret)) {
            Log::error('ZainCash callback verification failed: secret is not configured.');
            return [
                'verified' => false,
                'error' => 'Payment gateway secret key is not configured on the server.',
            ];
        }

        try {
            $decoded = (array) JWT::decode($token, new Key($secret, 'HS256'));
        } catch (\Throwable $e) {
            Log::warning('ZainCash JWT signature decode failure: ' . $e->getMessage(), [
                'token_sample' => substr($token, 0, 20) . '...',
            ]);

            return [
                'verified' => false,
                'error' => 'Invalid JWT signature: ' . $e->getMessage(),
            ];
        }

        $normalized = PayloadNormalizer::extractZainCash($decoded);
        $isSuccess = ($normalized['status'] === 'success');

        return [
            'verified' => true,
            'transaction_id' => $normalized['gateway_transaction_id'],
            'order_number' => $normalized['order_id'],
            'status' => $isSuccess ? 'success' : 'failed',
            'amount_iqd' => $normalized['amount'] ?? 0,
            'raw_data' => $decoded,
        ];
    }

    /**
     * Query ZainCash transaction state for auto-reconciliation.
     */
    public function checkStatus(PaymentTransaction $transaction): string
    {
        $config = config('payments.gateways.zaincash');
        $statusUrl = $config['status_url'];
        $msisdn = $config['msisdn'];
        $secret = $config['secret'];

        if (!$transaction->gateway_transaction_id) {
            return 'failed';
        }

        $token = JWT::encode([
            'id' => $transaction->gateway_transaction_id,
            'msisdn' => $msisdn,
            'iat' => time(),
            'exp' => time() + 3600,
        ], $secret, 'HS256');

        try {
            $response = Http::timeout(config('payments.http_timeout_seconds', 10))
                ->withToken($token)
                ->get($statusUrl, [
                    'id' => $transaction->gateway_transaction_id,
                    'msisdn' => $msisdn,
                ]);

            if (!$response->successful()) {
                return 'pending';
            }

            $data = $response->json();
            $status = strtolower($data['status'] ?? '');

            if ($status === 'success') {
                return 'success';
            }

            if (in_array($status, ['failed', 'canceled', 'cancelled'])) {
                return 'failed';
            }

            if ($status === 'expired') {
                return 'expired';
            }

            return 'pending';
        } catch (\Throwable $e) {
            Log::warning('ZainCash status check exception: ' . $e->getMessage());

            return 'pending';
        }
    }
}
