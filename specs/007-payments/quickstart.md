# Quickstart & Developer Validation Guide: Feature 007 — Payments & Reconciliation

**Feature Branch**: `007-payments`  
**Date**: 2026-10-03  
**Status**: Completed (Phase 1)  
**Governing Documents**: `specs/007-payments/spec.md`, `specs/007-payments/plan.md`

---

## 1. Prerequisites & Environment Configuration

### 1.1 Backend Configuration (`backend/.env`)
Ensure the following payment keys are present in your local `.env`:

```ini
# Payment Driver Selection: 'simulator' (default for dev/test), 'zaincash', or 'asiahawala'
PAYMENT_DEFAULT_GATEWAY=simulator
KNZIN_PAYMENT_SIMULATOR=true

# ZainCash Staging / Test Credentials
ZAINCASH_MSISDN=9647833000000
ZAINCASH_SECRET=test_secret_key_change_in_production
ZAINCASH_MERCHANT_ID=5ff8561dad82562d9502e614
ZAINCASH_IS_PRODUCTION=false

# AsiaHawala Staging / Test Credentials
ASIAHAWALA_MERCHANT_ID=AH_TEST_MERCHANT_01
ASIAHAWALA_API_KEY=ah_test_api_key_12345
ASIAHAWALA_SECRET_KEY=ah_test_secret_key_67890
ASIAHAWALA_ENDPOINT=https://sandbox.asiahawala.iq
```

### 1.2 Database Preparation
Ensure test database isolation is active on `knzin_test`:
```bash
cd backend
php artisan migrate --database=mysql
```

---

## 2. Validation Scenario 1: Deterministic End-to-End Simulation

### Step 1: Create a Pending Order via Checkout
```bash
curl -X POST http://127.0.0.1:8000/api/v1/checkout/orders \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner@example.com",
    "item_type": "part",
    "course_id": "uuid-here",
    "course_part_id": "part-uuid-here",
    "idempotency_key": "test-idem-001",
    "legal_terms_agreed": true,
    "quiz_answers": {"focus": "vocational"}
  }'
```
*Expected Output*: Returns `order_number` (e.g. `KNZ-ORD-2026-TEST01`) with `status: "pending"`, `paid_amount_gateway: 2600`.

### Step 2: Initiate Payment Session via Simulator Driver
```bash
curl -X POST http://127.0.0.1:8000/api/v1/checkout/orders/KNZ-ORD-2026-TEST01/pay \
  -H "Content-Type: application/json" \
  -d '{"gateway": "simulator", "locale": "ar"}'
```
*Expected Output*: Returns HTTP 200 with `transaction_id` and `checkout_url: "http://localhost:3000/ar/payments/simulator/SIM-TXN-..."`.

### Step 3: Trigger Simulated Success Webhook
```bash
curl -X POST http://127.0.0.1:8000/api/v1/payments/webhooks/simulator \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "SIM-TXN-KNZ-ORD-2026-TEST01-1",
    "outcome": "success",
    "amount_iqd": 2600
  }'
```
*Expected Output*: Returns HTTP 200 `{"status": "ok", "message": "Webhook processed successfully"}`.

### Step 4: Verify Order Fulfillment & Polling Status
```bash
curl http://127.0.0.1:8000/api/v1/checkout/orders/KNZ-ORD-2026-TEST01/payment-status
```
*Expected Output*:
- `status`: `"completed"`
- `tickets_status`: `"minted"`
- `promotional_tickets_granted`: `1`
- `latest_transaction.status`: `"success"`

---

## 3. Validation Scenario 2: Webhook Replay & Idempotency Check

Re-send the exact payload from Step 3:
```bash
curl -X POST http://127.0.0.1:8000/api/v1/payments/webhooks/simulator \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "SIM-TXN-KNZ-ORD-2026-TEST01-1",
    "outcome": "success",
    "amount_iqd": 2600
  }'
```
*Expected Invariants*:
1. Returns HTTP 200 immediately.
2. Querying `course_entitlements` shows exactly **1** record (no duplicates).
3. Querying `tickets` shows exactly **1** ticket (no duplicates).
4. `payment_webhooks` records the duplicate event with `signature_verified = true` and `processed = true`.

---

## 4. Validation Scenario 3: Auto-Reconciliation Engine

Test recovery of dropped webhooks when a user pays at a mobile wallet kiosk:

1. Initiate payment for an order, creating a transaction in `initiated` status.
2. Do **not** send any webhook.
3. Advance the transaction's `created_at` timestamp past the stale threshold (> 10 minutes):
   ```bash
   php artisan tinker --execute="App\Models\PaymentTransaction::where('status', 'initiated')->first()->update(['created_at' => now()->subMinutes(15)]);"
   ```
4. Execute the reconciliation command:
   ```bash
   php artisan payments:reconcile --verbose
   ```
5. *Expected Result*:
   - The command queries the gateway status mock.
   - Detects the payment completion.
   - Invokes `OrderService::fulfillOrder`.
   - Logs: `[Reconciled] Order KNZ-ORD-... successfully fulfilled via reconciliation.`

---

## 5. Automated Regression Test Suite

Run the full payment and checkout test suite on `knzin_test`:
```bash
cd backend
php artisan test --filter=Payment
```
All feature tests covering initiation, signature verification, replay protection, multi-attempt switching, and reconciliation must pass with 100% green assertions.
