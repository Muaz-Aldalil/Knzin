# API Contract Specification: Feature 007 — Dual-Gateway Direct Payment Integration & Server-to-Server Reconciliation

**Feature Branch**: `007-payments`  
**Date**: 2026-10-03 (Iteration 2 — Hardened & Reconciled)  
**Status**: Completed & Audited (Phase 1)  
**Governing Documents**: `specs/007-payments/spec.md`, `.specify/memory/constitution.md` (v3.3.0)

---

## 1. Overview

This document specifies the exact REST API contracts, headers, payloads, cryptographic signature verifications, and HTTP response codes for payment initiation, real-time polling, and public server-to-server webhook ingestion.

---

## 2. Payment Initiation API

### `POST /api/v1/checkout/orders/{orderNumber}/pay`

Initiates a payment session with the chosen payment gateway. If an active pending transaction already exists, the server may reuse or renew the checkout session; if the previous attempt failed or the user selected a different gateway, a new transaction attempt is recorded under the same pending order (Decision D-4).

#### Request
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
- **Path Parameters**:
  - `orderNumber` (string, required): Canonical order reference (e.g., `KNZ-ORD-2026-ABC123`).
- **Body**:
  ```json
  {
    "gateway": "zaincash",
    "locale": "ar"
  }
  ```
  - `gateway` (string, required): One of `zaincash`, `asiahawala`, or `simulator`.
  - `locale` (string, optional, default: `ar`): Language code (`ar` or `en`) for gateway interface localization.

#### Responses

##### `200 OK` — Payment Session Created
```json
{
  "success": true,
  "data": {
    "transaction_id": "9d3e5b12-88ef-41a3-b4e6-01c9a4b3d789",
    "gateway": "zaincash",
    "checkout_url": "https://test.zaincash.iq/transaction/pay?id=64a1b2c3d4e5f67890abcdef",
    "amount_iqd": 2600,
    "currency": "IQD",
    "expires_at": "2026-10-03T19:30:00Z"
  }
}
```

##### `404 Not Found` — Order Not Found
```json
{
  "success": false,
  "error": {
    "code": "ERR_ORDER_NOT_FOUND",
    "message": "الطلب غير موجود",
    "message_en": "Order not found"
  }
}
```

##### `409 Conflict` — Order Already Completed or Expired
```json
{
  "success": false,
  "error": {
    "code": "ERR_ORDER_ALREADY_COMPLETED",
    "message": "تم إتمام هذا الطلب مسبقاً بنجاح",
    "message_en": "This order has already been completed"
  }
}
```

##### `422 Unprocessable Entity` — Invalid Gateway Choice
```json
{
  "success": false,
  "error": {
    "code": "ERR_INVALID_GATEWAY",
    "message": "بوابة الدفع المحددة غير مدعومة",
    "message_en": "The selected payment gateway is not supported"
  }
}
```

##### `503 Service Unavailable` — Gateway Connection Failed
```json
{
  "success": false,
  "error": {
    "code": "ERR_GATEWAY_UNAVAILABLE",
    "message": "خدمة الدفع غير متوفرة حالياً، يرجى المحاولة بعد قليل",
    "message_en": "Payment gateway is temporarily unavailable. Please try again shortly."
  }
}
```

---

## 3. Real-Time Status Polling API

### `GET /api/v1/checkout/orders/{orderNumber}/payment-status`

Used by the frontend `OrderSummaryPage` to poll fulfillment progress after returning from the hosted gateway redirect. Adheres strictly to the untrusted client invariant: client reads server-authoritative state without sending unverified claims.

#### Request
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Path Parameters**:
  - `orderNumber` (string, required): Canonical order reference.

#### Responses

##### `200 OK` — Order Completed & Fulfilled
```json
{
  "success": true,
  "data": {
    "order_number": "KNZ-ORD-2026-ABC123",
    "status": "completed",
    "tickets_status": "minted",
    "promotional_tickets_granted": 1,
    "paid_amount_gateway": 2600,
    "currency": "IQD",
    "latest_transaction": {
      "id": "9d3e5b12-88ef-41a3-b4e6-01c9a4b3d789",
      "gateway": "zaincash",
      "status": "success",
      "paid_at": "2026-10-03T19:02:15Z",
      "error_message": null
    }
  }
}
```

##### `200 OK` — In-Progress State (Order Still Pending)
```json
{
  "success": true,
  "data": {
    "order_number": "KNZ-ORD-2026-ABC123",
    "status": "pending",
    "tickets_status": "pending",
    "promotional_tickets_granted": 1,
    "paid_amount_gateway": 2600,
    "currency": "IQD",
    "latest_transaction": {
      "id": "9d3e5b12-88ef-41a3-b4e6-01c9a4b3d789",
      "gateway": "zaincash",
      "status": "initiated",
      "paid_at": null,
      "error_message": null
    }
  }
}
```

##### `200 OK` — Failed Attempt (Ready for Retry / Switch Wallet)
```json
{
  "success": true,
  "data": {
    "order_number": "KNZ-ORD-2026-ABC123",
    "status": "pending",
    "tickets_status": "pending",
    "promotional_tickets_granted": 1,
    "paid_amount_gateway": 2600,
    "currency": "IQD",
    "latest_transaction": {
      "id": "9d3e5b12-88ef-41a3-b4e6-01c9a4b3d789",
      "gateway": "zaincash",
      "status": "failed",
      "paid_at": null,
      "error_message": "User canceled transaction at wallet prompt"
    }
  }
}
```

---

## 4. Server-to-Server Webhook APIs & Key Normalization

### 4.1 ZainCash Webhook & Redirect Ingestion Endpoint

#### `POST /api/v1/payments/webhooks/zaincash` & `GET /api/v1/payments/webhooks/zaincash`
Receives authoritative transaction settlement token from ZainCash servers or via learner browser redirect.

- **Request Body / Query Parameter**:
  - `token` (string, required): Encrypted JWT token signed with merchant secret.

#### Signature Verification:
- Decoded using `Firebase\JWT\JWT::decode($token, new Key(config('payments.zaincash.secret'), 'HS256'))`.
- Decoded payload structure:
  ```json
  {
    "status": "success",
    "orderid": "KNZ-ORD-2026-ABC123",
    "id": "64a1b2c3d4e5f67890abcdef",
    "operationid": "ZC_OP_55443322",
    "msg": "success"
  }
  ```
- **Defensive Normalization**: `PayloadNormalizer::extractZainCash` supports `orderid`/`orderId`, `id`/`operationid`.

#### Dual-Mode Response Handling:
1. **Browser Return Mode** (`Accept: text/html` or GET redirect from ZainCash):
   - Backend verifies token, executes atomic fulfillment, and responds with:
     ```http
     HTTP/1.1 302 Found
     Location: https://knzin.com/ar/order-summary/KNZ-ORD-2026-ABC123
     ```
   - Learner is seamlessly returned to the Order Summary page where polling confirms immediate course access.
2. **Server-to-Server API Mode** (`Accept: application/json` or automated IPN):
   - Responds with `200 OK`:
     ```json
     {
       "status": "ok",
       "message": "Webhook processed successfully"
     }
     ```

---

### 4.2 AsiaHawala Webhook Endpoint

#### `POST /api/v1/payments/webhooks/asiahawala`
Receives signed payment notification from AsiaHawala merchant callback service.

- **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  X-Callback-Signature: a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
  ```
- **Body**:
  ```json
  {
    "transaction_ref": "AH-TXN-778899",
    "order_number": "KNZ-ORD-2026-XYZ890",
    "amount": 13000,
    "currency": "IQD",
    "status": "PAID",
    "paid_at": "2026-10-03T18:30:00Z"
  }
  ```

#### Signature Verification:
- Computed: `hash_hmac('sha256', $request->getContent(), config('payments.asiahawala.secret_key'))`.
- Verified using `hash_equals($computedSignature, $receivedSignature)`.
- If valid and `status === 'PAID'`, fulfills order atomically.

---

### 4.3 Deterministic Sandbox Simulator Endpoint

#### `POST /api/v1/payments/webhooks/simulator`
Used in `local` and `testing` environments to trigger deterministic test scenarios without external network access.

- **Body**:
  ```json
  {
    "transaction_id": "SIM-TXN-KNZ-ORD-2026-ABC123-1",
    "outcome": "success",
    "amount_iqd": 2600
  }
  ```
- **Protection**: Middleware blocks access if `APP_ENV === 'production'`.

---

## 5. Error Code Registry

| Error Code | HTTP Status | Description | User-Facing Action |
|---|---|---|---|
| `ERR_ORDER_NOT_FOUND` | 404 | Order reference does not exist. | Return to catalog. |
| `ERR_ORDER_ALREADY_COMPLETED` | 409 | Order was previously fulfilled. | Redirect to Course Player. |
| `ERR_ORDER_EXPIRED` | 409 | Order 24-hour window elapsed. | Prompt to create a new order. |
| `ERR_INVALID_GATEWAY` | 422 | Gateway not in (`zaincash`, `asiahawala`, `simulator`). | Select a supported wallet. |
| `ERR_GATEWAY_UNAVAILABLE` | 503 | Gateway connection timed out (>10s) or unreachable. | Retry or choose alternative wallet. |
| `ERR_SIGNATURE_VERIFICATION_FAILED` | 401 | Webhook token/HMAC signature invalid. | Internal security alert. |
| `ERR_AMOUNT_MISMATCH` | 422 | Paid amount does not match order amount. | Flagged for audit. |
| `ERR_TRANSACTION_NOT_FOUND` | 404 | Gateway transaction ID does not match database record. | Reconciliation fallback. |
