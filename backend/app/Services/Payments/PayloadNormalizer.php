<?php

namespace App\Services\Payments;

class PayloadNormalizer
{
    /**
     * Safely normalize ZainCash webhook and callback payload variants.
     */
    public static function extractZainCash(array $payload): array
    {
        return [
            'order_id' => $payload['orderid'] ?? $payload['orderId'] ?? $payload['order_id'] ?? null,
            'gateway_transaction_id' => $payload['id'] ?? $payload['transaction_id'] ?? $payload['operationid'] ?? null,
            'status' => strtolower($payload['status'] ?? ''),
            'amount' => isset($payload['amount']) ? (int) $payload['amount'] : null,
            'msg' => $payload['msg'] ?? null,
        ];
    }

    /**
     * Safely normalize AsiaHawala callback payload variants.
     */
    public static function extractAsiaHawala(array $payload): array
    {
        return [
            'order_id' => $payload['order_number'] ?? $payload['orderNumber'] ?? $payload['order_id'] ?? null,
            'gateway_transaction_id' => $payload['transaction_ref'] ?? $payload['transactionId'] ?? $payload['transaction_id'] ?? null,
            'status' => strtoupper($payload['status'] ?? ''),
            'amount' => isset($payload['amount']) ? (int) $payload['amount'] : null,
            'paid_at' => $payload['paid_at'] ?? null,
        ];
    }
}
