# KNZiN Feature 007: Comprehensive Requirements, Reality & Architecture Audit

**Document:** Feature 007 Requirements & Reality Audit (Before Implementation Planning)  
**Author:** Senior Engineering Agent (KNZiN)  
**Target Feature:** Feature 007 — Dual-Gateway Direct Payment Integration & Server-to-Server Reconciliation (ZainCash & AsiaHawala)  
**Governing Documents:**
- `Project info/تفاصيل مشروع KNZiN 💰.md` (Original Client Brief)
- `PROJECT_CONTEXT.md` (Project Technical Context & Architectural Baseline)
- `docs/REQUIREMENTS_BASELINE.md` (Requirements Baseline & Protected Decisions)
- `DECISIONS.md` (Ratified Technical Decisions Log)
- `.specify/memory/constitution.md` (v3.3.0 Technical Constitution)
- `specs/007-payments/spec.md` (Feature 007 Specification & Ratified Grill Decisions)

---

## 1. Executive Summary

This document performs an exhaustive cross-examination of all client requirements, stakeholder expectations, and technical invariants against current repository reality before drafting the implementation plan for **Feature 007: Payments & Reconciliation**.

Its objective is to eliminate all speculative assumptions, verify existing code assets, expose edge-case traps, and ground the upcoming `plan.md`, `data-model.md`, and `contracts/` in empirical code and validated business rules.

---

## 2. Source-by-Source Requirements Cross-Examination

### Source 1: Original Client Brief (`Project info/تفاصيل مشروع KNZiN 💰.md`)

| Client Requirement | Section in Brief | Exact Requirement | Repository Reality & Architectural Truth |
|---|---|---|---|
| **Failed Payments & Auto-Reconciliation** | Section 3 (بروتوكول معالجة فشل الدفع) | In case of unstable internet where user pays via mobile wallet but connection drops before returning to KNZiN, system must automatically reconcile payment status via gateway API check and unlock course/issue tickets without human intervention. | **Status: 0% Built.** Currently only an offline manual instruction card exists. Must be implemented via scheduled runner (`payments:reconcile`) and gateway status query driver. |
| **Frictionless Guest Checkout** | Section 1 (نطاق العمل والشراء السريع) | Purchase directly by entering email only; no mandatory account creation or password wall prior to payment. | **Status: 100% Built.** `CheckoutController::store` creates guest users and links orders to email. Verified in Feature 002. |
| **Canonical Legal Shield** | Section 4 (الغطاء القانوني) | Mandatory non-pre-checked checkbox with exact Arabic clause confirming purchase is for digital educational material and raffle ticket is a free promotional gift. | **Status: 100% Built & Verified.** Enforced on frontend (`LegalShieldCheckbox.tsx`) and backend (`LegalShieldValidationTest.php`). |
| **Psychological Anti-Piracy Quiz** | Section 2 (محرك التخصيص) | Interactive personalization quiz modal before checkout cementing personal relevance. | **Status: 100% Built & Verified.** Enforced in `CheckoutBottomSheet.tsx` and stored verbatim in `orders.quiz_answers`. |
| **Payment Gateways** | Section 1, 3 | Local Iraqi payment methods: ZainCash, AsiaHawala, Qi Card. | **Status: In Progress (Feature 007).** Client prioritizes mobile wallets. Feature 007 implements ZainCash + AsiaHawala dual-gateway. |

---

### Source 2: Technical Project Constitution (`.specify/memory/constitution.md` v3.3.0)

| Constitutional Invariant | Article | Strict Rule | Engineering Obligation |
|---|---|---|---|
| **Server-to-Server Webhook Authority** | Section VIII | Order fulfillment, entitlements, and ticket creation MUST be triggered exclusively by validated backend webhook callbacks or reconciliation queries. Client redirect URLs or browser callbacks are purely cosmetic navigation cues. | Zero trust in frontend queries (`?status=success`). Backend must verify cryptographic signature (JWT/HMAC) before mutating database state. |
| **Idempotency Guarantee** | Section VIII | Every webhook listener MUST enforce atomic `idempotency_key` or gateway transaction verification before mutating any record, preventing double-crediting or duplicate tickets. | Row-level locking (`SELECT ... FOR UPDATE`) on `orders` and `payment_transactions`. Append-only webhook audit log in `payment_webhooks`. |
| **Zero Floating-Point Arithmetic** | Section VII | All monetary amounts MUST be calculated and stored as `BIGINT` integers in minor currency units (cents for USD, whole Dinars for IQD). | All amounts in `payment_transactions` stored as `BIGINT UNSIGNED amount_iqd`. No floats or division drift. |
| **Promotional Gift Model** | Section VI | Orders are legally 100% educational course purchases ($2.00 part, $10.00 bundle). Sweepstakes tickets are zero-cost promotional grants (`promotional_tickets_granted`), never standalone line items. | Pricing remains $2.00 / 2,600 IQD (1 ticket) and $10.00 / 13,000 IQD (15 tickets). |
| **Asynchronous Ticket Generation** | Section VIII | Ticket minting under high-volume draw countdowns MUST NOT block HTTP request-response cycles. Purchases dispatch queued `GenerateTicketsJob` to Redis. | `OrderService::fulfillOrder` dispatches `GenerateTicketsJob::dispatch($order->id)->afterCommit()`. This verified pattern must be preserved. |

---

### Source 3: Ratified Product Decisions (Feature 007 Grill Log)

| Decision ID | Ratified Decision | Engineering Requirement for Feature 007 Plan |
|---|---|---|
| **D-1** | Full Dual-Gateway Integration | Both `ZainCashDriver` and `AsiaHawalaDriver` implemented simultaneously under unified `PaymentGatewayInterface`, backed by `SimulatorDriver` for CI and offline local development. |
| **D-2** | Standard Market IQD Rounding | $2.00 Single Part = **2,600 IQD**; $10.00 Complete Bundle = **13,000 IQD**. Aligns with Iraqi wallet denominations and prevents customer confusion over fractional 100-dinar notes. |
| **D-3** | Direct Hosted Gateway Redirect | Server creates transaction, generates gateway payment URL; client redirects to gateway (supports mobile app deep-linking & desktop QR) and returns to `/order-summary`. |
| **D-4** | Multi-Attempt Order Continuity | 1:N relationship between `orders` and `payment_transactions`. Users can retry or switch between ZainCash and AsiaHawala on an existing pending order without losing their cart or affiliate attribution. |
| **D-5** | 24-Hour Order Expiration (TTL) | Orders remain payable for 24 hours (allowing kiosk cash-in); gateway checkout sessions expire after 30 minutes with seamless on-demand refresh. |
| **D-6** | Late Payment Arrival Policy | Educational purchase is 100% fulfilled; promotional tickets issued at payment confirmation timestamp dynamically qualify for the next active draw window. |
| **D-7** | Contextual Failure Presentation | Clear Arabic error banners with instant "Try Again" / "Switch Wallet" CTAs directly on the order summary page. |

---

## 3. Repository Reality Audit: Existing Code Assets vs Gaps

```text
Existing Assets (Do Not Reinvent):
├── Order Creation: OrderService::createOrder (handles guest user resolution, dual currency, referral attribution, quiz answers)
├── Order Fulfillment: OrderService::fulfillOrder (handles status=completed, EntitlementService, AffiliateCommissionService, GenerateTicketsJob)
├── Order Summary Page: /[locale]/order-summary/[orderNumber] (existing Next.js page ready to host dynamic payment status)
└── Test Database Isolation: TestDatabaseGuard (guarantees safe testing on knzin_test)

What Remains to Build in Feature 007:
├── 1. Database Migrations:
│   ├── payment_transactions table (order_id, gateway, gateway_transaction_id, amount_iqd, status, attempts, metadata)
│   └── payment_webhooks table (gateway, event_type, payload, signature_verified, ip_hash, idempotency_key)
├── 2. Payment Gateway Architecture (Backend):
│   ├── PaymentGatewayInterface (initiatePayment, verifyWebhook, checkStatus)
│   ├── PaymentGatewayManager (driver resolution: zaincash, asiahawala, simulator)
│   ├── ZainCashDriver (JWT creation, /transaction/init POST, webhook JWT decoding & HMAC verification, /transaction/get status check)
│   ├── AsiaHawalaDriver (Merchant payload, callback signature check, status query)
│   └── SimulatorDriver (Deterministic in-memory/local mock for automated PHPUnit tests & local dev)
├── 3. Controllers & Routes:
│   ├── POST /api/v1/checkout/orders/{orderNumber}/pay (Payment initiation endpoint returning redirect_url)
│   ├── POST /api/v1/payments/webhooks/zaincash (Public signed webhook listener)
│   └── POST /api/v1/payments/webhooks/asiahawala (Public signed webhook listener)
├── 4. Scheduled Reconciliation Engine:
│   └── php artisan payments:reconcile (Console command scanning stale pending orders and auto-reconciling with gateway APIs)
└── 5. Frontend Checkout & Polling Experience:
    ├── Payment method selection (ZainCash vs AsiaHawala) in CheckoutBottomSheet
    ├── Payment initiation button triggering gateway redirection
    └── Real-time polling component on OrderSummaryPage with celebration state upon webhook fulfillment
```

---

## 4. Architectural Trap Analysis & Mitigations

### Trap 1: The "External Gateway Mock" Assumption
* **Trap**: Assuming tests can call external ZainCash or AsiaHawala sandbox servers over the internet.
* **Reality**: External sandbox APIs require live network connectivity, merchant credentials, and can experience latency or outages, causing brittle CI pipelines.
* **Mitigation**: Implement `SimulatorDriver` active whenever `APP_ENV=testing` or `KNZIN_PAYMENT_SIMULATOR=true`. The simulator must generate valid-format mock transaction IDs and dispatch authentic-format webhooks locally.

### Trap 2: The "Client Redirect Success" Vulnerability
* **Trap**: Believing the order is paid because the user's browser redirected to `?status=success&token=XYZ`.
* **Reality**: Anyone can forge a GET request with query parameters.
* **Mitigation**: The browser redirect is purely cosmetic. The order summary page will display "جاري التحقق من عملية الدفع..." and poll `GET /api/v1/checkout/orders/{orderNumber}` until the server-to-server webhook marks the database record as `completed`.

### Trap 3: The Webhook Replay Attack & Duplicate Entitlement Trap
* **Trap**: Gateways retry webhook deliveries if intermediate networks drop the HTTP 200 response, potentially granting multiple course entitlements or duplicate tickets.
* **Reality**: High-traffic draw countdowns experience intense webhook retries.
* **Mitigation**:
  1. Enforce unique index `uq_payment_transactions_gateway_txn` on `(gateway, gateway_transaction_id)`.
  2. In the webhook controller, execute within `DB::transaction()` with `Order::where('id', $orderId)->lockForUpdate()->first()`.
  3. If `$order->status === 'completed'`, immediately log the duplicate in `payment_webhooks` and return HTTP 200 without re-calling `fulfillOrder()`.

### Trap 4: Floating-Point Math on Dinars
* **Trap**: Using PHP floats or MySQL `DOUBLE` to convert USD to IQD.
* **Reality**: Currency calculation drifts by fractional dinars, failing gateway integer validation.
* **Mitigation**: Standard market rounding is hardcoded as integer constants:
  - `PART_AMOUNT_IQD = 2600`
  - `BUNDLE_AMOUNT_IQD = 13000`
  All database columns use `BIGINT UNSIGNED`.

---

## 5. Conclusion & Clearance for Implementation Planning

All requirements from the client brief, project roadmap, constitution, and ratified grill decisions are 100% reconciled and accounted for. There are zero unresolved product decisions or ungrounded technical assumptions.

**Status: CLEARED FOR `/speckit-plan`.**
