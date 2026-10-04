<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Initialize a payment transaction with the gateway.
     * Returns an array containing 'gateway_transaction_id' and 'checkout_url'.
     */
    public function initiatePayment(Order $order, PaymentTransaction $transaction, string $locale = 'ar'): array;

    /**
     * Authoritatively verify an incoming server-to-server webhook request.
     * Returns an array with ['verified' => bool, 'transaction_id' => string, 'amount_iqd' => int, 'raw_data' => array].
     */
    public function verifyWebhook(Request $request): array;

    /**
     * Actively query gateway status for auto-reconciliation.
     * Returns one of: 'success', 'failed', 'pending', 'expired'.
     */
    public function checkStatus(PaymentTransaction $transaction): string;
}
