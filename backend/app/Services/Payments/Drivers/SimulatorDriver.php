<?php

namespace App\Services\Payments\Drivers;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

class SimulatorDriver implements PaymentGatewayInterface
{
    /**
     * Initialize a payment transaction with the simulator.
     */
    public function initiatePayment(Order $order, PaymentTransaction $transaction, string $locale = 'ar'): array
    {
        $gatewayTxnId = sprintf('SIM-TXN-%s-%d', $order->order_number, $transaction->attempt_number);
        $checkoutUrl = sprintf('/%s/payments/simulator/%s', $locale, $gatewayTxnId);

        return [
            'gateway_transaction_id' => $gatewayTxnId,
            'checkout_url' => $checkoutUrl,
        ];
    }

    /**
     * Authoritatively verify an incoming simulator webhook request.
     */
    public function verifyWebhook(Request $request): array
    {
        $transactionId = $request->input('transaction_id') 
            ?? $request->input('gateway_transaction_id')
            ?? (string) $request->input('id');

        $outcome = strtolower((string) $request->input('outcome', 'success'));
        $amountIqd = (int) ($request->input('amount_iqd') ?? 0);

        return [
            'verified' => true,
            'transaction_id' => $transactionId,
            'status' => $outcome === 'success' ? 'success' : 'failed',
            'amount_iqd' => $amountIqd,
            'raw_data' => $request->all(),
        ];
    }

    /**
     * Actively query simulator status for auto-reconciliation.
     */
    public function checkStatus(PaymentTransaction $transaction): string
    {
        $gatewayResponse = $transaction->gateway_response;
        if (is_array($gatewayResponse) && isset($gatewayResponse['mock_status'])) {
            return (string) $gatewayResponse['mock_status'];
        }

        if ($transaction->status === 'initiated') {
            return 'pending';
        }

        return $transaction->status;
    }
}
