# Architectural & Technical Research: Feature 007 — Dual-Gateway Direct Payment Integration & Server-to-Server Reconciliation

**Feature Branch**: `007-payments`  
**Date**: 2026-10-03 (Updated & Audited)  
**Status**: Completed & Audited (Phase 0)  
**Governing Documents**: `specs/007-payments/spec.md`, `Project info/FEATURE_007_REQUIREMENTS_REALITY_AUDIT.md`, `.specify/memory/constitution.md` (v3.3.0)

---

## 1. Executive Summary & Problem Formulation

Feature 007 transitions KNZiN from simulated and offline-instructed order processing to an automated, server-authoritative electronic financial engine. It integrates Iraq's primary digital payment rails:
1. **ZainCash** (Dominant mobile wallet in Iraq; JWT/REST protocol with hosted checkout, return callback redirect, and server status verification).
2. **AsiaHawala** (Major telecommunications mobile wallet powered by Asia Cell; HMAC/REST protocol with merchant callbacks).
3. **Deterministic Sandbox Simulator** (`SimulatorDriver`) ensuring that local development and CI pipelines (`php artisan test`) execute in complete network isolation with 100% deterministic reproducibility on `knzin_test`.

---

## 2. Research Area 1: ZainCash Integration Mechanics & Browser Redirect vs IPN

### 2.1 Overview & Credentials
ZainCash operates a RESTful API using JSON Web Tokens (JWT) signed with the merchant's secret key (HS256) for authentication and payload tamper-proofing.
- **Merchant Credentials**:
  - `msisdn`: Merchant wallet MSISDN (e.g., `9647833000000`).
  - `secret`: Merchant secret key used to sign and decode JWT tokens.
  - `merchant_id`: ZainCash account ID.
  - `is_production`: Boolean toggle between staging (`https://test.zaincash.iq`) and production (`https://api.zaincash.iq`).

### 2.2 Payment Initiation Flow
1. **Payload Composition**:
   ```json
   {
     "amount": 2600,
     "serviceType": "KNZiN Course Part Purchase",
     "msisdn": "9647833000000",
     "orderId": "KNZ-ORD-2026-ABC123",
     "redirectUrl": "https://api.knzin.com/api/v1/payments/webhooks/zaincash",
     "iat": 1759500000,
     "exp": 1759502400
   }
   ```
2. **Token Signing**: Encode payload via `Firebase\JWT\JWT::encode($payload, $secret, 'HS256')`.
3. **Outbound API Call**:
   - `POST https://test.zaincash.iq/transaction/init` (or production URL)
   - Headers: `Content-Type: application/json`
   - Body: `{"token": "<JWT_TOKEN>", "merchantId": "<MERCHANT_ID>", "lang": "ar"}`
4. **Gateway Response**:
   - Returns JSON containing `{"id": "64a1b2c3d4e5f67890abcdef"}`.
   - Redirect URL constructed as: `https://test.zaincash.iq/transaction/pay?id={id}`.
   - KNZiN records transaction in `payment_transactions` with `gateway_transaction_id = id`, status `initiated`, and `checkout_url`.
   - Backend returns `checkout_url` to Next.js client, which executes a window redirect to ZainCash.

### 2.3 Dual-Mode Webhook & Browser Redirect Handling
ZainCash's transaction lifecycle redirects the learner's mobile browser back to `redirectUrl` with a JWT `token`:
1. If the learner's browser is redirected to `https://api.knzin.com/api/v1/payments/webhooks/zaincash`:
   - The backend endpoint decodes and cryptographically verifies the token.
   - Executes atomic fulfillment with row-level locks (`lockForUpdate`).
   - Issues an HTTP 302 redirect back to the Next.js frontend: `https://knzin.com/{locale}/order-summary/{orderNumber}`.
   - This ensures the learner never sees raw JSON in their mobile browser, while strictly keeping JWT decoding and verification on the server.
2. If ZainCash's automated server issues a direct background webhook / IPN to the same endpoint:
   - The backend detects `Accept: application/json` or an API client.
   - Verifies token, fulfills atomically, and returns HTTP 200 `{"status": "ok"}`.

### 2.4 Status Check API (Reconciliation)
If neither callback arrives (carrier timeout, USSD disconnect, network drop):
- `GET https://test.zaincash.iq/transaction/get?id={transactionId}&msisdn={msisdn}`
- Headers: `Authorization: Bearer <JWT_SIGNED_AUTH_TOKEN>`
- Returns current transaction state (`success`, `failed`, `pending`, `expired`).

---

## 3. Research Area 2: AsiaHawala Integration Mechanics

### 3.1 Overview & Credentials
AsiaHawala (Asia Cell's mobile wallet) provides a merchant checkout API utilizing HMAC-SHA256 signature hashing for request authentication and webhook confirmation.
- **Merchant Credentials**:
  - `merchant_id`: AsiaHawala assigned merchant identifier.
  - `api_key`: Public API access key.
  - `secret_key`: Cryptographic secret key for HMAC generation and verification.
  - `endpoint_url`: Gateway base URL (staging or production).

### 3.2 Payment Initiation Flow
1. **Payload Composition**:
   ```json
   {
     "merchant_id": "AH_MERCHANT_5544",
     "order_number": "KNZ-ORD-2026-XYZ890",
     "amount": 13000,
     "currency": "IQD",
     "language": "ar",
     "callback_url": "https://api.knzin.com/api/v1/payments/webhooks/asiahawala",
     "return_url": "https://knzin.com/ar/order-summary/KNZ-ORD-2026-XYZ890",
     "timestamp": 1759500000
   }
   ```
2. **HMAC Signature**:
   - Signature computed as: `hash_hmac('sha256', "{$merchant_id}|{$order_number}|{$amount}|IQD|{$timestamp}", $secret_key)`.
3. **Outbound API Call**:
   - `POST {endpoint_url}/api/v1/checkout/initialize`
   - Headers: `X-Api-Key: {api_key}`, `X-Signature: {signature}`, `Content-Type: application/json`.
4. **Gateway Response**:
   - Returns `{"success": true, "transaction_ref": "AH-TXN-778899", "checkout_url": "https://checkout.asiahawala.iq/pay/AH-TXN-778899"}`.
   - KNZiN records transaction in `payment_transactions` with status `initiated`.

### 3.3 Callback Verification & Payload Flexibility
AsiaHawala sends a server-to-server POST request:
1. `POST /api/v1/payments/webhooks/asiahawala`.
2. Signature verification checks header `X-Callback-Signature` or payload field `signature`.
3. Validates against `hash_hmac('sha256', $request->getContent(), $secret_key)`.
4. If valid and `status === 'PAID'`, proceed to atomic fulfillment.

---

## 4. Research Area 3: Deterministic CI & Local Simulator (`SimulatorDriver`)

### 4.1 Rationale & Constraints
1. **Network Independence**: Automated tests (`php artisan test`) and CI runners run in isolated environments without access to external Iraqi telco endpoints.
2. **Flakiness Elimination**: External sandbox servers can fail, rate-limit, or require manual wallet approvals.
3. **Zero Configuration**: A developer pulling the repo should be able to run `php artisan test` or test the checkout UX out-of-the-box.

### 4.2 Simulator Implementation Design
- When `config('payments.default') === 'simulator'` or `APP_ENV === 'testing'`:
  - `initiatePayment()` generates a deterministic transaction reference: `SIM-TXN-{orderNumber}-{attempt}`.
  - Generates a local redirect URL: `/api/v1/payments/simulator/{transactionId}` (or Next.js route `/simulator/checkout/{transactionId}`).
  - Returns instantly without making any HTTP requests.
- The simulator interface allows triggering:
  - **Simulate Success**: Emits an authentic-format webhook POST to `/api/v1/payments/webhooks/simulator` with valid cryptographic signature.
  - **Simulate Failure**: Updates status to `failed` and fires failed callback.
  - **Simulate Timeout**: Leaves transaction in `initiated` to test the reconciliation command.
  - **Simulate Replay**: Sends identical webhook twice to verify idempotency handling.

---

## 5. Research Area 4: Webhook Ingestion vs Background Reconciliation

| Dimension | Webhook Ingestion (`POST /webhooks/*`) | Scheduled Reconciliation (`payments:reconcile`) |
|---|---|---|
| **Trigger Mechanism** | Push from payment gateway server upon transaction completion. | Pull from KNZiN cron job via gateway status check API. |
| **Latency** | Near-instantaneous (1 to 3 seconds after wallet authorization). | Periodic batch (Every 5 minutes for orders > 10 min old). |
| **Vulnerabilities** | Carrier network drops, webhook retries exhausting, firewall blockages. | Gateway API rate limits, increased server network traffic. |
| **Primary Purpose** | Fast-path user satisfaction and immediate course unlock celebration. | Safety net recovering abandoned/dropped connection payments. |
| **Idempotency Defense** | `SELECT ... FOR UPDATE` + `idempotency_key` verification. | Same atomic lock prevents racing with late webhooks. |

---

## 6. Research Area 5: Standard Market IQD Rounding & Order Reconciliation (Decision D-2)

### 6.1 Integer Mapping
- **$2.00 Single Course Part**: Billed at **2,600 IQD** (yields 1 promotional sweepstakes ticket).
- **$10.00 Full Course Bundle**: Billed at **13,000 IQD** (yields 15 promotional sweepstakes tickets).
- **Order Service Update**:
  - `OrderService::createOrder` currently calculates `$paidAmountGateway = intdiv($totalAmountCents * 131, 10)` (yielding 2,620 or 13,100).
  - Must be updated to:
    ```php
    $paidAmountGateway = $itemType === 'part' ? 2600 : 13000;
    ```
  - This guarantees 100% exact parity between `orders.paid_amount_gateway`, `payment_transactions.amount_iqd`, and the gateway charge amount.
  - All database values stored as `BIGINT UNSIGNED`; zero floats.

---

## 7. Research Area 6: Multi-Attempt Continuity & Duplicate Charge Anomaly Handling (Decision D-4)

### 7.1 Multi-Attempt Continuity
- An order in `pending` status has a **1:N** relationship with `payment_transactions`.
- If a user attempts payment via ZainCash, closes the gateway page, and returns, the order remains `pending`.
- The user can select AsiaHawala and click pay; this initiates a *second* transaction tied to the same `order_id`.
- The order retains its original `idempotency_key`, quiz answers, and affiliate referral attribution.

### 7.2 Cross-Gateway Double Charge Anomaly Protection
What happens if the user pays via AsiaHawala (Attempt 2), and then an earlier pending ZainCash payment (Attempt 1) also completes?
```php
DB::transaction(function () use ($webhookData) {
    $order = Order::where('id', $webhookData['order_id'])->lockForUpdate()->firstOrFail();
    $transaction = PaymentTransaction::where('gateway_transaction_id', $webhookData['transaction_id'])
        ->lockForUpdate()
        ->firstOrFail();

    // Case 1: Normal replay on the same already-successful transaction
    if ($transaction->status === 'success') {
        Log::info("Webhook replay detected for transaction {$transaction->id}");
        return ['status' => 'already_processed'];
    }

    // Case 2: CRITICAL ANOMALY: Order already completed by a DIFFERENT transaction
    if ($order->status === 'completed') {
        $transaction->update([
            'status' => 'duplicate_charge_flagged',
            'paid_at' => now(),
            'gateway_response' => $webhookData['raw_payload'],
        ]);
        Log::critical("DUPLICATE CHARGE DETECTED: Order {$order->order_number} was already fulfilled, but transaction {$transaction->id} also succeeded on {$transaction->gateway}. Flagged for administrative audit and refund.");
        return ['status' => 'duplicate_charge_flagged'];
    }

    // Case 3: Legitimate first-time fulfillment
    $transaction->update([
        'status' => 'success',
        'paid_at' => now(),
        'gateway_response' => $webhookData['raw_payload'],
    ]);

    app(OrderService::class)->fulfillOrder($order);
    return ['status' => 'fulfilled'];
});
```

---

## 8. Research Area 7: Order Expiration & Draw Timing (Decisions D-5 & D-6)

### 8.1 Lifetimes (TTL)
- **Order TTL**: 24 hours (`orders.expires_at = created_at + 24 hours`). Gives users sufficient time to visit physical cash-in agents or mobile kiosks.
- **Gateway Checkout Session TTL**: 30 minutes (`payment_transactions.expires_at = created_at + 30 minutes`). Matches gateway session limits. Users can generate a fresh session for the same pending order on demand.

### 8.2 Late Payment Fulfillment & Draw Windows
- Educational content purchase is unconditionally fulfilled whenever confirmed.
- Promotional tickets are minted asynchronously via `GenerateTicketsJob`.
- The job assigns `issued_at = now()`.
- If an active hourly or daily draw ended while the user was at the payment kiosk, the tickets automatically attach to the *currently active* draw cycle matching the `issued_at` timestamp. Tickets are never discarded or lost due to gateway delay.

---

## 9. Conclusion
All technical unknowns, edge cases, and cross-gateway race conditions are resolved. The design directly satisfies all 20 functional requirements (`FR-001`–`FR-020`) and 7 ratified product decisions (`D-1`–`D-7`).
