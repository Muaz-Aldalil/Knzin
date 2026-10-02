# Feature Specification: Feature 006 — Multi-Tier Affiliate & Referral Engine (منظومة التسويق بالعمولة وسجل الإحالات والشريك الذكي)

**Feature Branch**: `006-affiliate-engine`  
**Created**: 2026-10-02  
**Status**: Draft (Specification Phase — Ready for Review)  
**Input**: Master Roadmap & Feature 006 Implementation Instruction: "Affiliate & Referral Engine (Dual-Track Model: Unaltered Buyer Promotional Benefits, Authoritative Sales Commission, and 40% Grand-Prize Co-Share from Platform Marketing Pool)."

---

## 1. Feature Overview & Canonical Model

In the KNZiN dual-engine ecosystem, **Feature 006 (Affiliate & Referral Engine)** establishes viral growth and commercial distribution by producing **two separate benefits for two distinct parties**:

### 1.1 Buyer-Side Benefit (المشتري / المتعلّم المحال)
When User A shares their referral link and User B enters KNZiN through that referral and makes a qualifying purchase:
* **User B receives the normal purchase benefits exactly like any other customer.**
  ```text
  $2 course part           → course entitlement + 1 free promotional ticket
  $10 full-course bundle   → course entitlement + 15 free promotional tickets
  ```
* **Strict Preservation Invariant**: The referral system MUST NOT:
  * Remove any of User B's promotional tickets.
  * Reduce User B's promotional entitlement.
  * Transfer User B's tickets to User A.
  * Convert User B's tickets into financial commission.
  * Charge User B extra because of the referral.

### 1.2 Referrer-Side Benefits (المحيل / المسوّق الشريك)
The referring User A receives two distinct benefits resulting from **two completely separate business triggering events**:

1. **Benefit 1: Affiliate Sales Commission (عمولة المبيعات المباشرة)**:
   * **Triggering Event**: User B completes a qualifying course purchase, and that order is authoritatively fulfilled on the server.
   * **Reward**: User A receives an independent affiliate sales commission credited to their append-only financial ledger.
   * **Invariant**: The commission is funded by platform commercial operations; it is NEVER deducted from User B's course price, entitlement, or tickets.

2. **Benefit 2: Grand-Prize 40% Co-Share (حصة الصديق 40% من الجائزة الكبرى)**:
   * **Triggering Event**: The referred customer User B later wins an eligible grand prize in a promotional draw (Feature 003 / Feature 008).
   * **Reward**: User A receives **40% of the grand-prize valuation** funded directly from the KNZiN marketing pool.
   * **Maturation & KYC Hold (Option C)**: The 40% co-prize is initially credited in `status = 'pending'`. It transitions to `available` for cash withdrawal strictly after the winner's identity verification (KYC) and draw audit are officially approved by Admin (Constitution Section X).
   * **Invariant**: Winner User B receives 100% of their prize; the 40% co-share is an independent marketing award and is NEVER deducted from the winner's prize.

```text
                                REFERRAL
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ Referred User B │
                          └────────┬────────┘
                                   │
                           purchase event
                                   │
                      ┌────────────┴────────────┐
                      ▼                         ▼
               B gets normal             A gets sales
               purchase benefits         commission
               + promotional tickets
                      │
                      │ later wins draw
                      ▼
                A gets 40% grand-prize co-share
                from KNZiN marketing pool
```

---

## 2. Repository Reality & Brownfield Baseline

### 2.1 Reused Infrastructure (Feature 005 & Core Baseline)
* **Learner Code Baseline**: Migration [`2026_10_01_000004_add_learner_code_to_users_table.php`](file:///d:/Work%20Projects/Knzin%20Project/backend/database/migrations/2026_10_01_000004_add_learner_code_to_users_table.php) provides every user with a unique, indexed `learner_code` (e.g. `LRN-7K2M` formatted in Crockford Base32). This is reused as the default universal referral code.
* **Order Fulfillment Lifecycle**: [`OrderService.php`](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/OrderService.php) manages idempotent order transitions (`pending` → `completed`), dual-currency calculations ($2.00 = 200 cents, $10.00 = 1,000 cents, fixed IQD rate 1,310), and synchronous entitlement issuance.
* **Ticket Minting Engine**: [`TicketMintingService.php`](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/TicketMintingService.php) assigns Crockford Base32 serials (`KNZ-26-XXXX-YYYY`) tied to `order_id` and `user_id`.
* **Account Merge Continuity**: [`AccountMergeService.php`](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/AccountMergeService.php) handles guest-to-Google OAuth account migration. Referral attributions bound to guest emails must seamlessly re-attribute to verified Google accounts upon merge.

### 2.2 System Invariants
* **Feature 005 is a Dependency, Not a Rewrite Target**: Feature 006 attaches referral metadata to the existing purchase flow without creating secondary ticketing or checkout paths.
* **Server-Authoritative Attribution**: The browser may transport attribution parameters (`?ref=CODE`), but the server strictly validates eligibility, anti-self-referral rules, commission rates, and ledger states.

---

## 3. User Scenarios & Acceptance Criteria *(mandatory)*

### User Story 1 — Seamless Referral Attribution with Unaltered Buyer Benefits (Priority: P1) 🎯 MVP

As an unregistered visitor or student (User B) entering KNZiN via a friend's referral link (`knzin.com?ref=LRN-XXXX`),  
I want to browse the vocational catalog and complete a $2 part or $10 bundle purchase,  
So that I receive my complete course entitlements and 100% of my promotional tickets without any price surcharge or ticket deduction.

**Why this priority**: Core commercial integrity. The platform must guarantee that entering via a referral link never penalizes the buyer.

**Independent Test**: Complete a referred purchase for a $2 part and verify that User B receives the part entitlement plus exactly 1 promotional ticket, while User A receives the sales commission.

**Acceptance Scenarios**:
1. **Given** User A shares referral code `LRN-USERA`,  
   **When** User B clicks `knzin.com?ref=LRN-USERA` and purchases a $2 course part,  
   **Then** User B receives the course part entitlement and exactly 1 promotional ticket,  
   **And** User A receives an affiliate sales commission record,  
   **And** User B's price remains exactly $2.00 (2,620 IQD).
2. **Given** User B clicks `knzin.com?ref=LRN-USERA` and purchases a $10 full-course bundle,  
   **When** the order is fulfilled,  
   **Then** User B receives full-course bundle access and exactly 15 promotional tickets,  
   **And** User A receives the approved sales commission for a bundle sale.

---

### User Story 2 — Authoritative Sales Commission Accrual & Append-Only Ledger (Priority: P1) 🎯 MVP

As an active affiliate, creator, or student promoter (User A),  
I want my earned sales commissions to be calculated server-side and recorded in an immutable financial ledger,  
So that my earnings are tamper-proof, auditable, and resilient against duplicate webhook events or server crashes.

**Why this priority**: Financial integrity per Constitution DEC-002 and DEC-006. Balances must be derived from an append-only ledger, not mutable integer columns.

**Independent Test**: Trigger order fulfillment twice for the same referred order; assert that exactly one commission ledger entry is created with an identical idempotency key.

**Acceptance Scenarios**:
1. **Given** a qualifying referred order `KNZ-ORD-101` is fulfilled,  
   **When** `AffiliateCommissionService` processes the fulfillment hook,  
   **Then** an append-only ledger row is inserted into `affiliate_ledger_entries` with `entry_type = 'sales_commission'`, referencing `order_id`,  
   **And** the affiliate's available/pending balance increases by the exact calculated integer cents.
2. **Given** a payment gateway redelivers a webhook for `KNZ-ORD-101`,  
   **When** fulfillment executes a second time,  
   **Then** row-level locking and unique constraint `uq_affiliate_ledger_order_type` prevent any duplicate commission credit.

---

### User Story 3 — Grand-Prize 40% Co-Share Resolution (Priority: P2)

As a referring user (User A) whose referred friend (User B) wins an eligible grand prize in a promotional draw,  
I want to automatically receive a 40% co-prize allocation credited to my affiliate ledger from the platform marketing fund,  
So that I am rewarded for bringing active winners to KNZiN without taking anything away from my friend's prize.

**Why this priority**: Fulfills the published marketing and legal promise of the platform while establishing a clean domain boundary for Feature 008 (Draw Engine).

**Independent Test**: Simulate a grand prize win for User B; verify that User B retains 100% of the prize value, while User A receives a distinct 40% co-prize ledger entry funded by the marketing pool.

**Acceptance Scenarios**:
1. **Given** User B holds winning ticket `#KNZ-26-ABCD-1234` for a $10,000 Grand Prize draw,  
   **And** User B's order was attributed to referrer User A,  
   **When** the draw domain invokes `AffiliateCoPrizeService::awardCoPrize()`,  
   **Then** User B is awarded the full $10,000 prize,  
   **And** an immutable ledger row is created for User A for $4,000 (400,000 cents) with `entry_type = 'co_prize_credit'` and `status = 'pending'`,  
   **And** the event logs confirm funding originates from the KNZiN promotional marketing pool,  
   **And** when Admin approves User B's KYC and draw audit (`approveWinnerKyc`), the co-prize ledger entry status transitions to `'available'`.
2. **Given** the winning draw event is re-processed,  
   **When** the co-prize service runs again,  
   **Then** idempotency guards prevent duplicate 40% co-prize issuance.

---

### User Story 4 — Affiliate Portal, Referral Generator & Campaign Tracking (Priority: P2)

As a registered student or influencer (User A),  
I want to access an Affiliate Dashboard (`/affiliate`) displaying my unique link, real-time KPI metrics, and referral history,  
So that I can monitor my referral traffic, sales conversions, and draw co-prize qualifications.

**Why this priority**: Provides the user-facing surface for both casual students and professional creators to monitor their performance.

**Independent Test**: Navigate to `/affiliate` as an authenticated user; verify that the personalized referral URL, total clicks, total sales count, unpaid balance, and draw co-prize eligibility count render accurately.

**Acceptance Scenarios**:
1. **Given** an authenticated user with `learner_code = 'LRN-7K2M'`,  
   **When** they view `/affiliate`,  
   **Then** they see their canonical referral link `https://knzin.com?ref=LRN-7K2M` with a one-click copy button,  
   **And** they see KPI cards: Unpaid Balance ($ / IQD), Total Driven Sales ($ / IQD), Referred Students Count, and Active Co-Prize Entries Count.
2. **Given** an approved influencer with custom slug `alifaraj`,  
   **When** they generate a link with campaign tags `?campaign=tiktok_launch`,  
   **Then** clicks and conversions via that link are tagged with the campaign identifier in reporting.

---

### User Story 5 — Payout Request Lifecycle & Admin-Controlled Minimum Threshold (Priority: P3)

As an affiliate with accumulated mature commission earnings (User A),  
I want to view the currently active minimum withdrawal threshold in my dashboard and submit a payout request once my available balance reaches that threshold,  
So that I can withdraw my cash earnings via local payment methods (ZainCash, AsiaHawala, or Western Union) according to platform business policy.

**Why this priority**: Closes the loop on affiliate monetization while enforcing server-authoritative operational thresholds without hard-coding business policy into immutable application code.

**Independent Test**: Attempt a withdrawal request with balance below the currently active threshold (rejected with dynamic threshold payload); reach or exceed the threshold and submit request (available balance locked, active threshold snapshotted, and debited via ledger entry); alter active threshold and verify pending payouts remain unaffected.

**Acceptance Scenarios**:
1. **Given** the Admin-configured minimum payout threshold is currently active at $50.00 (5,000 cents),  
   **And** an affiliate has $30.00 in mature available balance,  
   **When** they attempt to submit a payout request,  
   **Then** the request is rejected with `HTTP 422 ERR_PAYOUT_THRESHOLD_UNMET`,  
   **And** the response payload clearly indicates the requested amount ($30.00) and the required active threshold ($50.00).
2. **Given** the Admin updates the active threshold to $25.00 (2,500 cents),  
   **When** the same affiliate with $30.00 submits a payout request,  
   **Then** the request is validated against the $25.00 active threshold,  
   **And** an `affiliate_payouts` record is created in `status = 'requested'` with `threshold_cents_at_request = 2500`,  
   **And** an immutable `payout_debit` entry locks $30.00 from their available balance, preventing double-spending.
3. **Given** an affiliate with mature available balance meeting or exceeding the active threshold,  
   **When** they submit a payout request for $65.00 with their ZainCash mobile number,  
   **Then** an `affiliate_payouts` record is created in `status = 'requested'`,  
   **And** the record captures `threshold_cents_at_request = 5000` for permanent auditability,  
   **And** an immutable `payout_debit` entry locks $65.00 from their available balance, preventing double-spending.
4. **Given** an affiliate has an accepted payout request of $60.00 in `status = 'requested'` created when the threshold was $50.00,  
   **When** the Admin subsequently raises the active threshold to $100.00 (10,000 cents),  
   **Then** the existing $60.00 payout remains valid, pending, and proceeds through administrative settlement without cancellation or modification,  
   **And** only future payout requests are required to meet the new $100.00 threshold.
5. **Given** the Admin lowers the active threshold from $50.00 to $25.00,  
   **When** the setting is updated,  
   **Then** no payouts are automatically generated for affiliates who have not submitted a request; affiliates must explicitly submit a withdrawal request.

---

### User Story 6 — Anti-Self-Referral & Fraud Invariant Enforcement (Priority: P3)

As the KNZiN platform operator,  
I want the system to reject self-referrals and detect suspicious duplicate attribution attempts,  
So that the promotional fund and commission margins are protected against synthetic abuse.

**Why this priority**: Protects commercial viability and prevents self-dealing exploit loops.

**Independent Test**: Attempt to place an order using one's own referral code; verify that attribution is rejected and zero commission is generated.

**Acceptance Scenarios**:
1. **Given** User A is logged in with `learner_code = 'LRN-USERA'`,  
   **When** User A attempts to checkout using `ref=LRN-USERA`,  
   **Then** the server attribution resolver detects `referrer_id === buyer_id` and rejects attribution,  
   **And** the purchase proceeds as a normal direct purchase with zero commission created.
2. **Given** an unauthenticated visitor checks out with an email identical to the referrer's account email,  
   **When** the order is evaluated,  
   **Then** normalized email matching flags self-referral and blocks commission generation.

---

## 4. Edge Cases & Boundary Handling

1. **Guest Checkout Converting via Google OAuth**:
   - If User B enters as a guest via User A's referral, places an order, and later authenticates with Google, [`AccountMergeService.php`](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/AccountMergeService.php) preserves the existing `order.referral_attribution` record unchanged.
2. **Attribution Replacement (Last-Click Semantics)**:
   - If User B clicks User A's link on Day 1, and clicks User C's link on Day 5, the active referral attribution follows the approved Last-Click rule; User C is credited upon checkout.
3. **Refunds, Chargebacks & Cancellations**:
   - If an order is refunded or cancelled, any associated `pending` commission entry is reversed via an explicit `reversal_debit` ledger entry. Commissions already paid out in cash are marked as negative balance against future earnings, never silently erasing ledger history.
4. **Drawing a Ticket with No Referrer**:
   - If a winning ticket belongs to an organic, direct purchaser (no referral attribution), the 40% co-prize allocation simply does not trigger; the winner receives 100% of their prize, and zero marketing co-prize is disbursed.
5. **Simultaneous Webhook Replays**:
   - Database row-level locks on the `orders` row (`lockForUpdate()`) and unique compound constraint on `(order_id, entry_type)` guarantee that concurrent queue workers or duplicate webhooks cannot mint multiple commissions.

---

## 5. Requirements *(mandatory)*

### Functional Requirements

* **FR-001**: System MUST assign every registered user a unique, non-null referral identifier based on their Crockford Base32 `learner_code`.
* **FR-002**: System MUST capture incoming referral codes via URL query parameter (`?ref=CODE`), validating that the code corresponds to an active, valid referrer.
* **FR-003**: System MUST NOT alter, reduce, transfer, or convert the promotional tickets granted to a referred customer upon qualifying purchase ($2 part = 1 ticket, $10 bundle = 15 tickets).
* **FR-004**: System MUST NOT increase the purchase price for a customer entering via a referral link.
* **FR-005**: System MUST record referral attribution server-side against the authoritative `orders` row upon order creation.
* **FR-006**: System MUST calculate and credit an affiliate sales commission to the referrer upon authoritative order fulfillment (`OrderService::fulfillOrder`).
* **FR-007**: System MUST record all financial commission transactions in an append-only `affiliate_ledger_entries` table with zero floating-point math (integer cents only).
* **FR-008**: System MUST implement an append-only affiliate financial subledger where available balance is strictly derived from the sum of mature credit entries minus debit/payout entries.
* **FR-009**: System MUST enforce strict anti-self-referral guards, rejecting attribution where the referrer and buyer share the same user ID or normalized email.
* **FR-010**: System MUST expose an idempotent domain service (`awardCoPrize`) that calculates and credits exactly 40% of an eligible grand prize value to the attributed referrer when a referred customer's ticket wins a draw.
* **FR-011**: System MUST fund the 40% co-prize exclusively from the platform marketing pool with zero deduction from the winner's prize.
* **FR-012**: System MUST render an Affiliate Portal (`/affiliate`) displaying personalized referral links, QR code, real-time KPI cards, and transaction history.
* **FR-013**: System MUST permit affiliates with mature available balances meeting or exceeding the currently active Admin-defined minimum withdrawal threshold (evaluated at the exact moment of submission in integer minor units / cents) to submit withdrawal requests with local payout details.
* **FR-014**: System MUST atomically lock and debit the requested withdrawal amount from the affiliate's available balance upon payout request submission.
* **FR-015**: System MUST maintain idempotency across all fulfillment, commission minting, and draw co-prize triggers to prevent duplicate disbursements.
* **FR-016**: System MUST support optional custom vanity slugs (e.g. `knzin.com/alifaraj`) for approved influencers.
* **FR-017**: System MUST support optional campaign tracking tags (e.g. `?ref=CODE&campaign=tiktok_ad`) in referral URLs and report conversions by campaign.
* **FR-018**: System MUST clearly display the currently active Admin-defined minimum required balance in the affiliate dashboard and payout modal before a withdrawal request is submitted, while keeping the server authoritative.
* **FR-019**: System MUST ensure that updating the Admin-defined minimum payout threshold takes effect dynamically only for future requests, leaving previously accepted pending/processing payouts and completed payouts unaltered, and never automatically generating payouts when the threshold is lowered.
* **FR-020**: System MUST persist the effective threshold in integer minor units (`threshold_cents_at_request`) on every created payout record to provide an immutable audit trail of the active threshold at request creation time.
* **FR-021**: System MUST establish an initial Admin provisioning path using a one-time out-of-band bootstrap guarded by a protected deployment credential token (`ADMIN_BOOTSTRAP_TOKEN`), permanently blocked once any active administrator exists, with subsequent multi-user administrative access requiring delegated authorization and full revocation auditability.
* **FR-022**: System MUST consume trusted approval evidence conforming to the universal `approval_records` contract, requiring state/version-based freshness for both winner KYC and draw integrity audit prior to releasing Option C co-prizes, strictly rejecting caller-supplied booleans.
* **FR-023**: System MUST enforce append-only subledger immutability: post-release revocation of approvals must never delete or mutate historical financial entries, and any subsequent clawback must require authorized administrative adjudication appending a compensating `reversal_debit` entry.

### Success Criteria

* **SC-001**: 100% of referred purchases yield exactly the canonical promotional tickets for the buyer (1 ticket per $2 part, 15 tickets per $10 bundle) with zero ticket loss.
* **SC-002**: Referrer sales commission is credited in under 500ms following order fulfillment commit.
* **SC-003**: 100% of duplicate webhook or fulfillment triggers produce exactly zero duplicate commission ledger entries.
* **SC-004**: Self-referral attempts are rejected with 100% reliability.
* **SC-005**: When a referred ticket wins a grand prize, the 40% co-prize allocation is executed with 100% auditability and zero deduction from the winner's award.
* **SC-006**: The Affiliate Portal renders fully responsive on mobile and desktop viewports, with 100% bilingual parity between Arabic RTL and English LTR.
* **SC-007**: Available balance calculations match ledger entry aggregates with zero discrepancy across all testing permutations.
* **SC-008**: 100% of unauthorized attempts to mutate platform settings or trigger admin bootstrap once an active admin exists are rejected server-side.
* **SC-009**: 100% of post-release co-prize revocations preserve original ledger rows intact and require authorized adjudication for compensating reversals.

---

## 6. System Boundaries & Integration Contracts

### In Scope for Feature 006 — Affiliate & Referral Engine
* Referral identity generation & resolution (`learner_code` and custom vanity slugs).
* Server-side referral attribution capture and binding to `orders`.
* Sales commission calculation and append-only ledger creation upon fulfillment.
* Independent 40% grand-prize co-share domain service and ledger entry creation.
* Append-Only Affiliate Financial Subledger balance derivation and payout request lifecycle.
* Initial Admin Provisioning Path (`knzin:bootstrap-admin`) and persistent multi-admin capability authorization (`manage_platform_settings`).
* Integration with universal `approval_records` contract for Option C co-prize release freshness verification.
* Dedicated Affiliate Portal (`/affiliate`) and dashboard UI components.
* Anti-self-referral and basic fraud validation shields.
* Automated unit, feature, and invariant test suites.

### Out of Scope for Feature 006 (Strict Boundaries)
* **Payment Gateway Drivers**: Live API integration with ZainCash/AsiaHawala gateway endpoints belongs to **Feature 007 (Payments)**.
* **Draw Winner Selection & RNG**: Commit-reveal draw RNG, ticket accumulation, and winner selection belong to **Feature 008 (Admin & Draws)**. Feature 006 consumes winner evidence and draw integrity approval records.
* **KYC Identity Verification System**: Raw KYC identity document storage, facial recognition, and verification workflow belong to the **KYC / Identity Domain**. Feature 006 only consumes trusted `ApprovalRecord` evidence.
* **Multi-Level / Downline Network Marketing**: KNZiN is a single-tier referral/affiliate engine. Multi-tier pyramid or multi-level commission structures are strictly forbidden.
* **Video/Course Content Delivery**: Handled exclusively by Feature 005.

---

## 7. Locked Product & Security Contracts (Ratified by Product Owner)

Following explicit Product Owner ratification and review, all commercial and policy rules for Feature 006 are formally locked:

### Decision 1: Direct Course Sales Commission Rate
* **Status**: **LOCKED PRODUCT DECISION (APPROVED)**
* **Ratified Policy**: **25% of qualifying referred course purchases**.
  * $2.00 part (200 cents) $\rightarrow$ **$0.50 commission** (50 cents).
  * $10.00 bundle (1,000 cents) $\rightarrow$ **$2.50 commission** (250 cents).
  * Arithmetic executed strictly in integer cents: `intdiv($cents * 2500, 10000)`.
* **Buyer Protection**: Buyer keeps 100% of normal course entitlement and promotional tickets (1 ticket per $2 part, 15 tickets per $10 bundle). Commission is funded by commercial platform margin and never deducted from buyer.

### Decision 2: Attribution Window & Binding Duration
* **Status**: **LOCKED PRODUCT DECISION (APPROVED)**
* **Ratified Policy**: **30-day Last-Click Attribution locked per order**.
  * Attribution is locked server-side to the specific `orders` row upon checkout creation.
  * **No automatic lifetime customer ownership**: Subsequent purchases outside the 30-day window or via direct organic traffic have no attribution; future orders via another link credit the new referrer.

### Decision 3: Admin-Controlled Minimum Payout Threshold & 24-Hour Maturation Hold
* **Status**: **LOCKED PRODUCT DECISION (APPROVED)**
* **Ratified Policy**: **Admin-Controlled Minimum Withdrawal Threshold, 24-Hour Maturation Hold for Sales Commissions**.
  * **Dynamic Business Setting**: The minimum payout threshold is an **Admin-controlled business setting** (stored as integer minor units / cents, default: 5,000 cents / $50.00 USD), **NOT a permanently hardcoded $50 rule**.
  * **Active Threshold Enforcement**: Every new payout request is validated server-side against the threshold active at the exact moment the request is submitted. The backend is authoritative; the frontend only displays the current threshold.
  * **Pending Payouts Invariance**: Once a payout request has been successfully accepted, a later threshold change MUST NOT invalidate, cancel, or modify that pending/processing payout. The accepted payout is governed by the threshold that was active when the request was created.
  * **No Automatic Payout Generation**: Lowering the threshold MUST NOT automatically create payouts for affiliates who have not submitted a request; affiliates must explicitly submit a withdrawal request.
  * **Audit Requirement**: Each payout record must retain the threshold value that was effective at creation time (`threshold_cents_at_request`) so administrators can audit what threshold was active, what amount was requested, and why the request was accepted.
  * **Historical Invariance**: Modifying the threshold takes effect dynamically for future withdrawal requests without retroactively altering historical ledger entries, completed payouts, or accepted pending requests.
  * **Concurrency Protection**: Database row-level locking (`lockForUpdate()`) and ledger debits prevent spending the same available balance twice.
  * **Sales Commission Hold**: 24 hours holding period from fulfillment commit before commission moves from `pending` to `available`.
  * Configured in `config/knzin.php` (`affiliate.payout_min_cents`, `affiliate.maturation_hours`) and backed by platform setting storage. Zero scattered magic numbers.

### Decision 4: Grand-Prize 40% Co-Prize Maturation Policy (Option C)
* **Status**: **LOCKED PRODUCT DECISION (APPROVED)**
* **Ratified Policy**: **Option C (Held in `pending` status until winner KYC and draw audit are approved)**.
  * Sales commissions follow the standard 24-hour hold.
  * The 40% grand-prize co-share remains in `pending` status until both winner KYC identity verification and draw integrity audit are officially approved.
  * After official approval verification, the co-prize funds transition to `available` and become eligible for cash withdrawal.

### Security Contract 1: Initial Admin Provisioning Path & Persistent Authorization
* **Status**: **LOCKED SECURITY CONTRACT**
* **Model**: Multi-user production architecture distinguishing `User` $\to$ `Admin assignment` $\to$ `Admin capability` $\to$ `protected platform-setting mutation`.
* **One-Time Bootstrap**: `knzin:bootstrap-admin {user} --token={secret}` usable ONLY when zero active admins exist. Validates target is an existing legitimate user. Never accepted via ordinary HTTP API.
* **Delegated Grants**: Normal admin provisioning uses `knzin:grant-admin-capability {user} {cap} --authorized-by={admin}` requiring an active admin authorizer.
* **Explicit Revocation**: `knzin:revoke-admin-capability {user} {cap} --authorized-by={admin} --reason={justification}` revokes capability immediately while preserving audit log.

### Security Contract 2: Option C Approval Freshness & Revocation Contract
* **Status**: **LOCKED SECURITY CONTRACT**
* **Universal Contract**: Consumes `approval_records` with provenance (`approval_id`, `approval_type`, `subject_type`, `subject_id`, `status`, `approved_at`, `approved_by`, `source`, `version`, `revoked_at`, `revoked_by`, `revocation_reason`, `superseded_at`).
* **State/Version Freshness**: KYC approval is fresh only when matching the winner user ID, status is approved, and it is neither revoked nor superseded. Draw integrity approval is fresh only when matching the draw ID, status is approved, and it is neither revoked nor superseded. Generic caller booleans (`true/false`) are strictly rejected.
* **Pre-Release Revocation**: Revocation of either approval holds the co-prize in `pending`; disqualification cancels the co-prize.
* **Post-Release Revocation & Append-Only Financial Subledger**: Revocation after release preserves the original ledger entry immutability (`amount_cents` is never rewritten in place, row is never deleted). Authorized administrative adjudication (`adjudicateCoPrizeRevocation`) appends a compensating `reversal_debit` entry, preserving complete accounting history.

---

*This specification establishes the canonical baseline for Feature 006 — Affiliate & Referral Engine. All product decisions and security contracts are fully locked and reconciled.*


