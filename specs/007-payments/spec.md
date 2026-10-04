# Feature Specification: Feature 007 — Dual-Gateway Direct Payment Integration & Server-to-Server Reconciliation (ZainCash & AsiaHawala)

**Feature Branch**: `007-payments`  
**Created**: 2026-10-03  
**Status**: Draft (Grill & Intake Stage)  
**Input**: Master Roadmap Requirement & Owner Decisions: Full Dual-Gateway Integration (ZainCash + AsiaHawala) with Standard Market Rounding (2,600 IQD / 13,000 IQD), Server-to-Server Webhook Authority, Idempotency, and Scheduled Reconciliation.

---

## 1. Executive Summary & Domain Invariants

Feature 007 transitions KNZiN from simulated and offline-instructed order processing to an authoritative, automated electronic financial engine. It integrates Iraq's two leading mobile wallet payment gateways: **ZainCash** (JWT/REST API with merchant redirection and webhooks) and **AsiaHawala** (Merchant wallet payment API and callbacks), backed by a deterministic local sandbox simulator for CI/local verification.

In accordance with the KNZiN Constitution (Sections VI, VII, VIII) and Technical Decision DEC-003:
1. **Server-to-Server Webhook Authority**: Payment confirmation, entitlement grants, affiliate commission credits, and promotional ticket issuance are driven **exclusively by cryptographically signed backend webhooks** and active gateway queries. Frontend redirects and client browser states are strictly untrusted navigation cues.
2. **Standard Market IQD Billing**: In accordance with the Product Owner's ratified decision, gateway transaction amounts are rounded to standard commercial Iraqi cash/wallet UX denominations:
   - **$2.00 Single Course Part**: Billed at exactly **2,600 IQD** (yields 1 free promotional ticket).
   - **$10.00 Full Course Bundle**: Billed at exactly **13,000 IQD** (yields 15 free promotional tickets).
3. **Idempotency & Replay Shield**: Every incoming webhook payload must be validated via gateway secret signatures and checked against atomic database uniqueness (`payment_webhooks.idempotency_key` or gateway transaction ID) under pessimistic row locks (`SELECT ... FOR UPDATE`). Replay notifications must return HTTP 200 without duplicate entitlement or ticket issuance.
4. **Resilient Reconciliation Engine**: To safeguard users against frequent Iraqi mobile network interruptions (e.g., dropped USSD sessions, lost post-PIN data connections), a background scheduled runner (`php artisan payments:reconcile`) queries gateway status APIs for stale pending orders, ensuring that every paid learner receives their educational content and promotional tickets automatically.

---

## Clarifications

### Session 2026-10-03
- Q: What payment gateways must be implemented in Feature 007? → A: Full Dual-Gateway Integration (ZainCash + AsiaHawala) simultaneously under unified interface, backed by a local deterministic `SimulatorDriver` for CI and offline local testing.
- Q: What exchange rate and IQD rounding policy governs gateway billing? → A: Standard Market Rounding: $2.00 Single Course Part = exactly 2,600 IQD (1 ticket); $10.00 Full Course Bundle = exactly 13,000 IQD (15 tickets). All DB values stored as `BIGINT UNSIGNED`.
- Q: How does the learner transition to the payment gateway? → A: Direct Hosted Gateway Redirect: Server initiates transaction, returns official checkout URL; browser redirects to gateway (supporting mobile app deep-linking and desktop QR) and returns to `/order-summary`.
- Q: How are retries and wallet switching handled for pending orders? → A: Multi-Attempt Continuity: 1:N relationship between `orders` and `payment_transactions`. Users can retry or switch wallets on the same pending order without re-creating the cart or losing referral attribution.
- Q: What are the order and session lifecycles (TTL)? → A: Orders remain payable for 24 hours (allowing cash-in kiosk visits); gateway checkout sessions expire after 30 minutes with on-demand refresh.
- Q: How are late payments reaching the server after a draw closes handled? → A: Course purchase is unconditionally unlocked; promotional tickets qualify dynamically for the next active draw cycle based on `issued_at` timestamp.
- Q: How are failed or cancelled payment attempts presented in the UI? → A: Contextual In-Page Feedback on `order-summary` with clear localized Arabic/English error banners and instant "Try Again" and "Switch Wallet" CTAs.

---

### User Story 1 — ZainCash Direct Mobile Checkout & Webhook Fulfillment (Priority: P1) 🎯 MVP

**User Journey**:  
A learner in Baghdad chooses an educational course part ($2.00 / 2,600 IQD), opens the checkout sheet, enters their email, passes the anti-piracy pledge, confirms the legal shield, and selects **زين كاش (ZainCash)**. Clicking "الدفع عبر زين كاش" initiates the payment transaction on the server. The user is redirected to the secure ZainCash payment gateway page (or opens the ZainCash mobile app) to authorize the payment via their wallet PIN and OTP. Upon completion, ZainCash issues a signed server-to-server webhook to KNZiN. KNZiN's backend verifies the webhook signature, completes the order, unlocks the course part, credits the affiliate commission (if referred), and mints the promotional ticket.

**Why this priority**:  
ZainCash is Iraq's dominant digital mobile wallet. Delivering an end-to-end working ZainCash checkout and webhook handler is the core MVP requirement for real-money monetization.

**Independent Test**:  
Can be independently tested using the local/sandbox payment simulator or ZainCash test credentials: initiating an order produces a valid ZainCash payment URL; sending a simulated signed webhook verifies the signature, transitions the order to `completed`, grants the `course_entitlements` record, and issues Crockford Base32 tickets.

**Acceptance Scenarios**:
1. **Given** a pending order for a $2.00 course part, **When** the user initiates ZainCash checkout, **Then** the server creates an `initiated` record in `payment_transactions` with `amount_iqd = 2600`, calls the ZainCash initialization API, and returns a redirect URL containing a valid transaction ID.
2. **Given** a valid ZainCash webhook payload with correct HMAC/JWT signature for transaction $T$, **When** `POST /api/v1/payments/webhooks/zaincash` is called, **Then** the endpoint returns HTTP 200, updates transaction status to `success`, marks the order `completed`, creates entitlements, credits affiliate commission, and dispatches ticket generation.
3. **Given** an invalid or tampered webhook signature, **When** the webhook endpoint is called, **Then** the request is rejected with HTTP 400/401 and logged as a failed verification without mutating the order.
4. **Given** a duplicate webhook delivery for an already completed order, **When** the webhook is received, **Then** the endpoint returns HTTP 200 immediately without creating duplicate entitlements or tickets.

---

### User Story 2 — AsiaHawala Mobile Wallet Checkout & Webhook Fulfillment (Priority: P1)

**User Journey**:  
A learner with an Asia Cell mobile line in Erbil or Sulaymaniyah selects **آسيا حوالة (AsiaHawala)** during checkout for a full course bundle ($10.00 / 13,000 IQD). Clicking "الدفع عبر آسيا حوالة" initiates an AsiaHawala merchant transaction. The user completes authentication via their AsiaHawala wallet or USSD. AsiaHawala dispatches an authoritative callback/webhook to KNZiN's backend. The backend validates the callback, marks the order completed, grants access to all active course parts, and mints 15 promotional tickets.

**Why this priority**:  
Ratified by the Product Owner for full dual-gateway launch parity, ensuring complete geographic and demographic mobile wallet coverage across Iraq.

**Independent Test**:  
Can be independently tested via AsiaHawala test endpoints and simulator: selecting AsiaHawala initiates a transaction record with `gateway = 'asiahawala'` and `amount_iqd = 13000`; valid callback securely fulfills the bundle order and issues 15 tickets.

**Acceptance Scenarios**:
1. **Given** a pending order for a $10.00 course bundle, **When** AsiaHawala checkout is selected, **Then** the server creates a payment transaction with `amount_iqd = 13000` and `gateway = 'asiahawala'`.
2. **Given** an authoritative AsiaHawala payment confirmation callback, **When** `POST /api/v1/payments/webhooks/asiahawala` is invoked, **Then** the signature is verified, the order is fulfilled, and HTTP 200 is returned.
3. **Given** a duplicate AsiaHawala callback, **When** received, **Then** idempotent handling returns HTTP 200 with zero side effects.

---

### User Story 3 — Deterministic Local Sandbox & Driver Simulator (Priority: P1)

**User Journey**:  
An engineer or automated CI test runner tests the entire checkout and payment pipeline in a development or test environment without requiring live Iraqi SIM cards or production gateway secrets.

**Why this priority**:  
Prevents blocking automated regression tests (`php artisan test`) and local development on external Iraqi telco infrastructure. Essential for repository reliability and CI stability.

**Independent Test**:  
In testing environment (`APP_ENV=testing` or `KNZIN_PAYMENT_SIMULATOR=true`), checkout redirects to a local simulated gateway authorization screen (`/payments/simulator/{transactionId}`) where the developer can click "Simulate Success", "Simulate Failure", or "Simulate Network Timeout".

**Acceptance Scenarios**:
1. **Given** `APP_ENV=testing` or `KNZIN_PAYMENT_SIMULATOR=true`, **When** payment checkout is initiated, **Then** the driver generates a deterministic mock transaction ID and mock redirect URL without making outbound network HTTP requests.
2. **Given** the simulator page, **When** "Simulate Success" is triggered, **Then** the simulator issues an authentic-format signed webhook to the backend webhook listener, causing authoritative fulfillment.

---

### User Story 4 — Dropped Connection & Auto-Reconciliation Engine (Priority: P2)

**User Journey**:  
A user enters their ZainCash or AsiaHawala PIN on their mobile phone, but their mobile 3G/4G connection drops immediately before returning to KNZiN, and the gateway webhook is delayed or dropped by intermediate carrier firewalls. The platform's scheduled reconciliation service automatically polls the gateway API, verifies that the money was successfully collected, marks the order completed, and mints the learner's tickets without requiring manual customer support intervention.

**Why this priority**:  
Crucial for consumer trust in the Iraqi market where flaky mobile data connections cause high cart abandonment and anxiety regarding unfulfilled payments.

**Independent Test**:  
Can be independently tested by creating an order with a pending transaction, disabling the webhook, and executing `php artisan payments:reconcile`. The command queries the gateway status mock/API, detects the successful charge, and fulfills the order.

**Acceptance Scenarios**:
1. **Given** an order in `pending` status with an initiated transaction older than 15 minutes, **When** `php artisan payments:reconcile` runs, **Then** it queries the gateway transaction status.
2. **Given** the gateway status returns `SUCCESS`, **When** reconciled, **Then** the order is transitioned to `completed`, entitlements are granted, tickets are minted, and the event is logged.
3. **Given** the gateway status returns `FAILED` or `EXPIRED`, **When** reconciled, **Then** the transaction is marked `failed` and the order remains unfulfilled or expires according to TTL policy.

---

### User Story 5 — Client Real-Time Payment Polling & Celebration UX (Priority: P2)

**User Journey**:  
After completing payment on ZainCash or AsiaHawala, the user is redirected back to `/[locale]/order-summary/[orderNumber]`. The page displays an interactive status monitor ("جاري التحقق من عملية الدفع..."). As soon as the backend webhook or reconciliation marks the order completed, the page dynamically updates via polling without manual page refresh, triggers a celebratory confirmation animation, and presents an immediate link to start learning in the Course Player.

**Why this priority**:  
Provides a premium, reassuring post-payment user experience while strictly adhering to the untrusted client invariant.

**Independent Test**:  
Can be tested by navigating to `/order-summary/{orderNumber}` in pending state, triggering the backend webhook via API, and observing the frontend automatically transition to the success state within 2 seconds.

**Acceptance Scenarios**:
1. **Given** an order in `pending` status, **When** viewed on the order summary page, **Then** a progress indicator is displayed, and the client polls `GET /api/v1/checkout/orders/{orderNumber}` every 3 seconds (up to 60 seconds).
2. **Given** the order status transitions to `completed` on the server, **When** the next poll responds, **Then** the polling stops, celebration animations activate, and course navigation CTAs appear.
3. **Given** 60 seconds elapse without webhook confirmation, **When** polling reaches timeout, **Then** the UI shows a helpful message explaining that verification is underway and that tickets will appear in the Header HUD once processed.

---

### User Story 6 — Payment Transaction Audit & Ledger Logging (Priority: P3)

**User Journey**:  
An administrator or auditor inspects payment records in the database or admin panel to verify gateway reference numbers, gross IQD amounts, exchange rate snapshots, and raw webhook payloads for financial dispute resolution or chargeback defense.

**Why this priority**:  
Fulfills Section VII of the Constitution (Append-Only Financial Integrity) and guarantees legal defensibility for all transactions.

**Independent Test**:  
Inspecting the database reveals complete records in `payment_transactions` and `payment_webhooks` with hashed IPs, timestamps, and raw payloads.

**Acceptance Scenarios**:
1. **Given** any gateway interaction or webhook call, **When** processed, **Then** the raw payload and headers are logged in `payment_webhooks` with an append-only invariant.
2. **Given** a completed transaction, **When** inspected, **Then** `gateway_transaction_id`, `amount_iqd`, and `status` are immutably preserved.

---

## 3. Edge Cases & Boundary Invariants

1. **Race Condition Between Webhook and Client Redirect**:
   - If the user returns to `order-summary` before the webhook arrives, the client must safely wait in `pending` polling state; it must never assume success based on URL query parameters (`?status=success`).
2. **Network Timeout During Gateway Initiation**:
   - If ZainCash or AsiaHawala API is unreachable during `store`, the checkout API must return HTTP 503 (`ERR_GATEWAY_UNAVAILABLE`) with a user-friendly Arabic error, leaving the order in `pending` without corrupted state.
3. **Mismatched Webhook Amount**:
   - If a compromised or simulated webhook reports a successful charge with an amount less than `order.paid_amount_gateway` (e.g. 100 IQD instead of 2,600 IQD), the transaction must be flagged as `fraud_suspected`, rejected, and not fulfilled.
4. **Draw Window Expiration During Payment**:
   - If an order is initiated 2 minutes before a daily draw closes, but payment completes 10 minutes later, the promotional tickets are evaluated by their issuance timestamp (`issued_at = now()`), cleanly qualifying for the *next* active draw window without invalidating the purchase.
5. **Simultaneous Webhook Replay**:
   - If the payment gateway sends two identical webhook requests simultaneously on concurrent threads, database row-level locking (`SELECT ... FOR UPDATE` on `orders` and `payment_transactions`) ensures only the first thread executes fulfillment; the second thread detects completed status and exits safely.

---

## 4. Requirements Matrix

### Functional Requirements

- **FR-001**: System MUST implement a unified `PaymentGatewayManager` supporting driver-based selection (`zaincash`, `asiahawala`, `simulator`).
- **FR-002**: System MUST bill single course parts at exactly **2,600 IQD** and full course bundles at exactly **13,000 IQD** on Iraqi gateways.
- **FR-003**: System MUST record every payment attempt in a new `payment_transactions` table with status progression (`initiated` &rarr; `processing` &rarr; `success` / `failed` / `expired`).
- **FR-004**: System MUST expose public webhook receiver endpoints:
  - `POST /api/v1/payments/webhooks/zaincash`
  - `POST /api/v1/payments/webhooks/asiahawala`
- **FR-005**: Webhook listeners MUST cryptographically verify signatures (JWT/HMAC) before accepting payloads.
- **FR-006**: Webhook listeners MUST operate within database transactions with row-level locking (`lockForUpdate`).
- **FR-007**: Webhook listeners MUST be 100% idempotent: duplicate payloads for completed orders MUST return HTTP 200 with zero duplicate mutations.
- **FR-008**: Webhook listeners MUST invoke `OrderService::fulfillOrder` to trigger atomic entitlement grants, affiliate commission credits, and ticket minting.
- **FR-009**: System MUST log raw incoming webhook payloads, headers, and IP hashes in a dedicated `payment_webhooks` table.
- **FR-010**: System MUST provide a console reconciliation command `php artisan payments:reconcile` queryable against gateway status APIs.
- **FR-011**: System MUST schedule `payments:reconcile` to run automatically via Laravel scheduler every 5 minutes.
- **FR-012**: System MUST provide a deterministic `SimulatorGatewayDriver` active in `local` and `testing` environments.
- **FR-013**: Checkout UI MUST present clear payment method options for ZainCash and AsiaHawala with localized logos and instructions.
- **FR-014**: Order Summary UI MUST poll order status using exponential backoff and transition to celebration state upon server confirmation.
- **FR-015**: System MUST validate that webhook charge amounts strictly match the order's expected gateway amount.
- **FR-016**: System MUST support multi-attempt payment continuity, allowing users to re-initiate payment or switch between ZainCash and AsiaHawala on an existing `pending` order without re-creating the order or losing referral attribution.
- **FR-017**: System MUST enforce an order expiration TTL of 24 hours from creation; gateway transaction sessions MUST expire after 30 minutes with on-demand refresh capability.
- **FR-018**: System MUST unconditionally fulfill course entitlements upon verified payment regardless of whether an active hourly or daily draw concluded during checkout; tickets issued after draw close MUST dynamically qualify for the next active draw cycle.
- **FR-019**: Frontend Order Summary UI MUST render contextual failure messages in Arabic and English for cancelled or failed transactions with an instant "Try Again / Switch Wallet" action.
- **FR-020**: System MUST reject any new payment initiation attempts against an order that has already transitioned to `completed` or `expired` with HTTP 409 Conflict.

---

## 5. Ratified Product Decisions (Grill-Me Log)

| # | Decision Topic | Ratified Choice | Technical / Architectural Consequence |
|---|---|---|---|
| **D-1** | **Gateway Rollout Scope** | Full Dual-Gateway Integration (ZainCash + AsiaHawala) | Both drivers implemented in parallel with unified `PaymentGatewayInterface` and local sandbox simulator. |
| **D-2** | **IQD Billing Policy** | Standard Market Rounding (2,600 IQD / 13,000 IQD) | Explicit integer mapping for parts ($2 = 2,600 IQD) and bundles ($10 = 13,000 IQD) matching Iraqi wallet UX norms. |
| **D-3** | **Checkout Transition UX** | Direct Hosted Gateway Redirect | Server creates transaction, returns official gateway URL; client redirects to gateway (supporting mobile app deep-linking & desktop QR) and returns to `/order-summary`. |
| **D-4** | **Payment Retries & Switching** | Multi-Attempt Order Continuity | 1:N relationship between `orders` and `payment_transactions`. Users can retry or switch wallets without losing their pending order or affiliate attribution. |
| **D-5** | **Order Lifetime (TTL)** | 24-Hour Active Expiration | Orders remain payable for 24 hours (allowing kiosk cash-in); gateway checkout sessions expire after 30 minutes with seamless refresh. |
| **D-6** | **Late Payment Arrival** | Fulfill & Qualify for Next Draw | Educational purchase is 100% fulfilled; promotional tickets issued at payment confirmation timestamp dynamically qualify for the next active draw window. |
| **D-7** | **Failure Presentation** | Contextual In-Page Feedback | Clear Arabic error banners with instant "Try Again" / "Switch Wallet" CTAs directly on the order summary page. |

---

## 6. Success Criteria

- **SC-001**: 100% of payment fulfillments are driven exclusively by verified server-to-server webhooks or reconciliation queries; 0% by client claims.
- **SC-002**: 100% of webhook listeners pass automated replay testing with zero duplicate entitlements or ticket grants.
- **SC-003**: Both ZainCash and AsiaHawala gateway workflows are fully testable in local development and CI via the simulator without external network access.
- **SC-004**: Reconciled payment events automatically recover dropped-connection orders within 10 minutes of gateway clearance.
- **SC-005**: All financial amounts in database records use integer units (`BIGINT` IQD / cents); zero floating-point arithmetic.
- **SC-006**: Automated test coverage includes feature tests for initiation, webhook validation, replay resistance, reconciliation, and signature tampering.
- **SC-007**: Frontend production build (`npm run build`) and TypeScript typechecks compile with zero errors.
- **SC-008**: Dual-language parity: all payment UI states, buttons, and error messages are 100% synchronized in Arabic (`ar`) and English (`en`).
