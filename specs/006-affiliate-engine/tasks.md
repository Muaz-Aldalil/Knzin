# Tasks: Feature 006 — Affiliate & Referral Engine (منظومة التسويق بالعمولة وسجل الإحالات والشريك الذكي)

**Feature**: [specs/006-affiliate-engine/spec.md](spec.md)  
**Branch**: `006-affiliate-engine`  
**Input Documents**: `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `plan.md`, `checklists/requirements.md`, `DECISIONS.md`, Constitution  
**Predecessor Baseline**: Feature 005 Learner Hub (Merged commit `b23d9febf1d1fa4a26173d7ad306e2cbfac1b461`)  
**Scope Boundaries**: Single-tier affiliate/referral engine only. Multi-level/downline MLM is strictly excluded. Live payment gateway drivers belong to Feature 007 (Payments). Draw RNG selection and winner declaration belong to Feature 008 (Admin & Draws). Only the minimal runtime settings foundation required to store, read, and snapshot the active Admin payout threshold is in scope.

---

## Phase 1: Setup (Shared Infrastructure & Domain Policies)

**Purpose**: Establish centralized domain configuration and a real persistent runtime settings foundation.

- [X] T001 Define centralized affiliate domain configuration baseline in `backend/config/knzin.php` with keys: `affiliate.commission_rate_bps = 2500` (25.00%), `affiliate.payout_min_cents = 5000` ($50.00 default baseline), `affiliate.maturation_hours = 24` (sales commission holding period), `affiliate.cookie_duration_days = 30` (last-click attribution window), and `affiliate.co_prize_rate_bps = 4000` (40.00% marketing pool co-share).
- [X] T002 [P] Create migration `backend/database/migrations/2026_10_02_000001_create_platform_settings_table.php` for dynamic Admin runtime settings with columns `id` (BIGINT UNSIGNED PK), `key` (VARCHAR(64), UNIQUE), `value` (JSON), `description` (TEXT, NULLABLE), `updated_by_user_id` (CHAR(36) UUID, NULLABLE, FK to `users(id)` ON DELETE SET NULL), and timestamps.
- [X] T003 [P] Implement Eloquent model `backend/app/Models/PlatformSetting.php` and service `backend/app/Services/PlatformSettingsService.php` providing concurrency-safe `get(string $key, mixed $default = null): mixed` (reading from database with fallback to `config("knzin.{$key}", $default)`) and `set(string $key, mixed $value, ?string $adminId = null): void` (atomic upsert for runtime Admin updates).

---

## Phase 2: Foundational (Database Migrations & Core Entities)

**Purpose**: Core schema migrations, strict foreign-key dependency ordering, and Eloquent models required across all user stories.

**⚠️ CRITICAL**: Tables must migrate in strict foreign-key order: `platform_settings` -> `affiliate_profiles` -> `affiliate_payouts` -> `referral_attributions` -> `affiliate_ledger_entries`.

- [X] T004 [P] Create migration `backend/database/migrations/2026_10_02_000002_create_affiliate_profiles_table.php` with columns `id` (BIGINT UNSIGNED PK), `user_id` (CHAR(36) UUID, UNIQUE, FK to `users(id)` ON DELETE RESTRICT), `custom_slug` (VARCHAR(64), UNIQUE, NULLABLE), `default_payout_method` (VARCHAR(32), NULLABLE), `payout_details` (TEXT, NULLABLE, encrypted JSON), `status` (VARCHAR(24), default `'active'`), and timestamps.
- [X] T005 [P] Create migration `backend/database/migrations/2026_10_02_000003_create_affiliate_payouts_table.php` with columns `id` (BIGINT UNSIGNED PK), `payout_number` (VARCHAR(32), UNIQUE), `user_id` (CHAR(36) UUID, FK to `users(id)` ON DELETE RESTRICT), `amount_cents` (BIGINT UNSIGNED), `threshold_cents_at_request` (BIGINT UNSIGNED, immutable snapshot of active Admin threshold at request creation), `amount_iqd` (BIGINT UNSIGNED), `payout_method` (VARCHAR(32)), `recipient_details` (TEXT, encrypted JSON), `status` (VARCHAR(24), default `'requested'`, values: `requested`, `processing`, `completed`, `rejected`), `admin_reference_number` (VARCHAR(128), NULLABLE), `admin_notes` (TEXT, NULLABLE), `processed_by_admin_id` (CHAR(36) UUID, NULLABLE, FK to `users(id)` ON DELETE SET NULL), `processed_at` (TIMESTAMP, NULLABLE), timestamps, and constraint `CONSTRAINT chk_affiliate_payouts_positive_amount CHECK (amount_cents > 0)`.
- [X] T006 [P] Create migration `backend/database/migrations/2026_10_02_000004_create_referral_attributions_table.php` with columns `id` (BIGINT UNSIGNED PK), `order_id` (CHAR(36) UUID, UNIQUE, FK to `orders(id)` ON DELETE RESTRICT), `referrer_user_id` (CHAR(36) UUID, FK to `users(id)` ON DELETE RESTRICT), `buyer_user_id` (CHAR(36) UUID, NULLABLE, FK to `users(id)` ON DELETE RESTRICT), `referral_code` (VARCHAR(32)), `campaign_tag` (VARCHAR(64), NULLABLE), `commission_rate_bps` (INT UNSIGNED, default `2500`), `attribution_type` (VARCHAR(32), default `'cookie'`), `ip_hash` (CHAR(64), NULLABLE), `user_agent_hash` (CHAR(64), NULLABLE), timestamps, and constraint `CONSTRAINT chk_ref_attr_anti_self_referral CHECK (referrer_user_id != buyer_user_id)`.
- [X] T007 [P] Create migration `backend/database/migrations/2026_10_02_000005_create_affiliate_ledger_entries_table.php` with columns `id` (BIGINT UNSIGNED PK), `user_id` (CHAR(36) UUID, FK to `users(id)` ON DELETE RESTRICT), `order_id` (CHAR(36) UUID, NULLABLE, FK to `orders(id)` ON DELETE RESTRICT), `payout_id` (BIGINT UNSIGNED, NULLABLE, FK to `affiliate_payouts(id)` ON DELETE RESTRICT), `entry_type` (VARCHAR(32), values: `sales_commission`, `co_prize_credit`, `payout_debit`, `reversal_debit`, `reversal_credit`), `amount_cents` (BIGINT signed integer cents), `currency` (CHAR(3), default `'USD'`), `status` (VARCHAR(24), default `'pending'`, values: `pending`, `available`, `cleared`, `cancelled`), `matures_at` (TIMESTAMP, NULLABLE), `idempotency_key` (VARCHAR(128), UNIQUE), timestamps, and unique compound constraint `UNIQUE KEY uq_affiliate_ledger_order_commission (order_id, entry_type)`.
- [X] T008 [P] Create Eloquent model `backend/app/Models/AffiliateProfile.php` with `$casts = ['payout_details' => 'encrypted:json']`, relationship `belongsTo(User::class)`, and vanity slug resolution scope.
- [X] T009 [P] Create Eloquent model `backend/app/Models/AffiliatePayout.php` with `$casts = ['recipient_details' => 'encrypted:json']`, relationship `belongsTo(User::class)`, relationship `hasMany(AffiliateLedgerEntry::class, 'payout_id')`, and state machine methods (`requested` -> `processing` -> `completed` / `rejected`).
- [X] T010 [P] Create Eloquent model `backend/app/Models/ReferralAttribution.php` with relationships `belongsTo(Order::class)`, `belongsTo(User::class, 'referrer_user_id')`, and `belongsTo(User::class, 'buyer_user_id')`, supporting optional `campaign_tag`.
- [X] T011 [P] Create Eloquent model `backend/app/Models/AffiliateLedgerEntry.php` with financial immutability invariant (model boot event throws `ImmutableLedgerException` on any update to `amount_cents`, `currency`, or `idempotency_key`), scopes `matureAvailable()`, `pendingHold()`, and relationships with `User`, `Order`, and `AffiliatePayout`.
- [X] T012 Enhance `backend/app/Models/User.php` with relationships `affiliateProfile(): HasOne`, `referralAttributions(): HasMany`, `affiliateLedgerEntries(): HasMany`, and `affiliatePayouts(): HasMany`, and enhance `backend/app/Models/Order.php` with relationships `referralAttribution(): HasOne` and `affiliateLedgerEntries(): HasMany`.

**Checkpoint**: Core database schema, foreign key integrity, and models in place. Feature 006 entities compile cleanly alongside Feature 005 tables.

---

## Phase 3: User Story 1 — Seamless Referral Attribution & Buyer Protection (Priority: P1) 🎯 MVP

**Goal**: Visitors clicking `?ref=CODE&campaign=TAG` have their referral intent captured in a 30-day cookie (`knzin_ref`). When purchasing a $2 part or $10 bundle, the attribution and optional campaign tag are locked server-side to the order, while buyer benefits remain strictly unaltered ($2 part = 1 ticket, $10 bundle = 15 tickets, zero surcharge).

**Independent Test**: Simulate referred checkout for a $2 part; assert buyer receives part entitlement and exactly 1 promotional ticket without price increase, while the order captures `referrer_id` and `campaign_tag`.

### Tests for User Story 1
- [X] T013 [P] [US1] Create contract test `backend/tests/Feature/ReferralResolutionContractTest.php` testing `GET /api/v1/referrals/resolve/{codeOrSlug}` per `contracts/referrals.contract.md` (valid code returns 200 with referrer profile and buyer protection notice; invalid returns 404; self-referral returns 422 `ERR_SELF_REFERRAL_FORBIDDEN`).
- [X] T014 [P] [US1] Create feature test `backend/tests/Feature/ReferralAttributionTest.php` testing: 30-day cookie attribution, last-click replacement, per-order isolation (no lifetime ownership), guest checkout attribution, `campaign_tag` persistence, and preservation across guest-to-Google OAuth merge via `AccountMergeService`.
- [X] T015 [P] [US1] Create frontend invariant test `frontend/src/tests/BuyerBenefitPreservation.test.ts` verifying that entering via referral link preserves canonical buyer promotional tickets (1 ticket for $2 part, 15 tickets for $10 bundle) with zero ticket loss, zero price markup, and identical API request structure.

### Implementation for User Story 1
- [X] T016 [US1] Implement `backend/app/Services/AffiliateAttributionService.php` to resolve referral codes (`User.learner_code` Base32 format e.g. `LRN-7K2M` and `AffiliateProfile.custom_slug`), validate referrer active status, evaluate anti-self-referral rules, and generate salted SHA-256 audit hashes (`ip_hash`, `user_agent_hash`).
- [X] T017 [US1] Implement `backend/app/Http/Controllers/ReferralController.php` with `resolve(Request $request, string $codeOrSlug)` returning JSON matching `contracts/referrals.contract.md`.
- [X] T018 [US1] Register public route `GET /api/v1/referrals/resolve/{codeOrSlug}` in `backend/routes/api.php` with rate limiting middleware `throttle:60,1`.
- [X] T019 [US1] Update `backend/app/Services/OrderService.php` in `createOrder()` to accept optional `referral_code` and `campaign_tag`, invoke `AffiliateAttributionService`, and insert `referral_attributions` inside the order creation database transaction.
- [X] T020 [US1] Update `backend/app/Services/AccountMergeService.php` to ensure that when a guest account merges into a Google OAuth account, existing `referral_attributions.buyer_user_id` records are updated without altering the attributed referrer.
- [X] T021 [US1] Implement Next.js referral capture utility and middleware integration in `frontend/src/middleware.ts` (or client layout wrapper `frontend/src/lib/referral-cookie.ts`) to intercept `?ref=CODE&campaign=TAG`, set cookie `knzin_ref=CODE` (and campaign metadata) with `Max-Age=2592000` (30 days), `SameSite=Lax`, `Path=/`.
- [X] T022 [US1] Update checkout payload in `frontend/src/hooks/useCheckout.ts` to read `knzin_ref` cookie and include `referral_code` and `campaign_tag` in `POST /api/v1/checkout/orders` payload.

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently. Buyers get 100% normal course and ticket benefits, and orders are accurately attributed to referrers.

---

## Phase 4: User Story 2 — Authoritative Sales Commission Accrual & Append-Only Ledger (Priority: P1) 🎯 MVP

**Goal**: Referrers earn an authoritative 25% sales commission ($0.50 on $2 part, $2.50 on $10 bundle) credited to an append-only ledger upon order fulfillment commit with a 24-hour maturation hold, failure-safe transaction atomicity, automated scheduled maturation, and compensating refund reversals.

**Independent Test**: Trigger order fulfillment twice for a referred $10 order; assert exactly one `sales_commission` entry of 250 cents is created with `status = 'pending'`, and balance increases accurately.

### Tests for User Story 2
- [X] T023 [P] [US2] Create unit test `backend/tests/Unit/AffiliateCommissionMathTest.php` testing integer cents arithmetic: `intdiv($cents * 2500, 10000)` ($2.00 / 200 cents -> 50 cents; $10.00 / 1000 cents -> 250 cents) with zero floating-point imprecision.
- [X] T024 [P] [US2] Create feature test `backend/tests/Feature/AffiliateCommissionFulfillmentTest.php` testing: failure-safe commission creation within fulfillment transaction, 24-hour holding period (`matures_at = created_at + 24 hours`), idempotency on duplicate webhook replays (`uq_affiliate_ledger_order_commission`), concurrent fulfillment row locking, and compensating reversal debit generation on order refund without rewriting historical records.

### Implementation for User Story 2
- [X] T025 [US2] Implement `backend/app/Services/AffiliateCommissionService.php` with:
  - `calculateCommission(int $totalAmountCents): int` using integer division `intdiv($totalAmountCents * config('knzin.affiliate.commission_rate_bps'), 10000)`
  - `creditSalesCommission(Order $order): ?AffiliateLedgerEntry` using row-level locking, setting `entry_type = 'sales_commission'`, `amount_cents = $commissionCents`, `status = 'pending'`, `matures_at = now()->addHours(config('knzin.affiliate.maturation_hours'))`, and `idempotency_key = "order_commission_{$order->id}"`
  - `reverseCommission(Order $order, string $reason): ?AffiliateLedgerEntry` creating a new compensating `entry_type = 'reversal_debit'` row without mutating the original commission entry
- [X] T026 [US2] Integrate failure-safe commission accrual into `backend/app/Services/OrderService.php` inside `fulfillOrder()`: invoke `app(AffiliateCommissionService::class)->creditSalesCommission($lockedOrder)` synchronously inside the `DB::transaction` before commit so an order cannot be marked completed without its commission entry.
- [X] T027 [US2] Implement artisan command `backend/app/Console/Commands/MatureAffiliateCommissionsCommand.php` (`php artisan knzin:mature-commissions`) and register it in `backend/routes/console.php` with `Schedule::command('knzin:mature-commissions')->hourly()` to automatically transition matured pending ledger entries to `status = 'available'`.
- [X] T028 [US2] Implement reconciliation command `backend/app/Console/Commands/ReconcileAffiliateCommissionsCommand.php` (`php artisan knzin:reconcile-commissions`) to detect completed referred orders missing ledger entries and safely backfill them idempotently.

**Checkpoint**: At this point, User Stories 1 AND 2 are complete (MVP Achieved). Referred orders mint accurate 25% commissions into the append-only subledger with failure-safe atomicity and automated maturation.

---

## Phase 5: User Story 3 — Grand-Prize 40% Co-Share Resolution (Priority: P2)

**Goal**: When a referred buyer's promotional ticket wins an eligible grand prize, the referrer receives an independent 40% prize valuation award funded by the KNZiN marketing pool; the entry remains `pending` until the winner's KYC and draw audit are approved by Admin (Option C).

**Independent Test**: Simulate a grand prize win for a referred ticket; assert winner keeps 100% of the prize, while referrer receives a 40% pending co-prize ledger entry funded by the marketing pool that transitions to `available` upon Admin KYC approval.

### Tests for User Story 3
- [X] T029 [P] [US3] Create unit test `backend/tests/Unit/AffiliateCoPrizeMathTest.php` verifying 40% integer calculation: `intdiv($prizeValuationUsdCents * 4000, 10000)` ($10,000 / 1,000,000 cents -> 400,000 cents / $4,000.00).
- [X] T030 [P] [US3] Create feature test `backend/tests/Feature/AffiliateCoPrizeResolutionTest.php` testing: ticket serial attribution lookup, 100% prize retention by winner, 40% co-prize allocation from marketing pool, initial `pending` hold state, duplicate win event idempotency (`co_prize_ticket_{$serial}`), Admin release to `available` upon KYC approval, and cancellation upon winner disqualification.

### Implementation for User Story 3
- [X] T031 [US3] Implement domain interface `backend/app/Services/AffiliateCoPrizeServiceInterface.php` and service `backend/app/Services/AffiliateCoPrizeService.php` decoupled from Feature 008 internals using primitive types:
  - `awardCoPrize(string $winningTicketSerial, int $prizeValuationUsdCents, ?string $winnerId = null, ?string $drawId = null): ?AffiliateLedgerEntry` creating `entry_type = 'co_prize_credit'`, `amount_cents = intdiv($prizeValuationUsdCents * 4000, 10000)`, `status = 'pending'`, `idempotency_key = "co_prize_ticket_{$winningTicketSerial}"`
  - `releaseCoPrize(string $winningTicketSerial, ?string $adminId = null): ?AffiliateLedgerEntry` transitioning entry to `status = 'available'`
  - `cancelCoPrize(string $winningTicketSerial, string $reason, ?string $adminId = null): ?AffiliateLedgerEntry` transitioning entry to `status = 'cancelled'`
- [X] T032 [US3] Implement CLI test harness command `backend/app/Console/Commands/SimulateCoPrizeAwardCommand.php` (`php artisan knzin:test-co-prize-award --ticket=SERIAL --prize-cents=AMOUNT`) with production safety guard (`App::environment('production')` aborts) to allow manual and automated verification of Scenario 3 per `quickstart.md`.

**Checkpoint**: At this point, the 40% Grand-Prize Co-Share domain service is fully operational with Option C KYC/draw audit hold and clean domain boundaries.

---

## Phase 6: User Story 4 — Affiliate Portal, Referral Generator & Campaign Tracking (Priority: P2)

**Goal**: Authenticated affiliates can access `/affiliate` to view real-time KPI cards (Unpaid Available, Pending, Total Earned, Referred Orders, Co-Prize Entries), copy their personalized referral link, generate UTM campaign tags, and review paginated ledger history with 100% Arabic RTL / English LTR parity.

**Independent Test**: Log in as an affiliate, load `/affiliate`; verify KPI metrics match ledger aggregate sums, the referral URL copies cleanly, and the ledger table displays paginated transactions.

### Tests for User Story 4
- [X] T033 [P] [US4] Create contract test `backend/tests/Feature/AffiliateDashboardContractTest.php` verifying `GET /api/v1/affiliate/dashboard` and `GET /api/v1/affiliate/ledger` responses against `contracts/affiliate-dashboard.contract.md` (KPI aggregation, active threshold payload, paginated ledger entries).
- [X] T034 [P] [US4] Create frontend test `frontend/src/tests/AffiliatePortalInvariants.test.ts` asserting 100% dictionary synchronization between `frontend/messages/ar.json` and `frontend/messages/en.json` for the `affiliate` namespace, valid URL generation with UTM parameters, and responsive layout classes.

### Implementation for User Story 4
- [X] T035 [US4] Implement `backend/app/Http/Controllers/AffiliateDashboardController.php` with:
  - `dashboard(Request $request)`: calculates `unpaid_available_cents`, `unpaid_pending_cents`, `total_earned_cents`, `total_withdrawn_cents`, `total_referred_orders_count`, `active_co_prize_tickets_count`, returns referral URLs and active `commission_policy.minimum_payout_cents` resolved via `PlatformSettingsService`
  - `ledger(Request $request)`: returns paginated `affiliate_ledger_entries` with bilingual descriptions
- [X] T036 [US4] Register routes in `backend/routes/api.php` under `auth:sanctum`: `GET /api/v1/affiliate/dashboard` and `GET /api/v1/affiliate/ledger`.
- [X] T037 [US4] Add comprehensive bilingual localization keys for the `affiliate` namespace in `frontend/messages/ar.json` and `frontend/messages/en.json` covering KPI titles, link generator, ledger states, and threshold notices.
- [X] T038 [US4] Implement data fetching hooks in `frontend/src/hooks/useAffiliateDashboard.ts` and `frontend/src/hooks/useAffiliateLedger.ts` using TanStack React Query.
- [X] T039 [US4] Implement referral link sharing card component `frontend/src/components/affiliate/ReferralLinkCard.tsx` with canonical link, vanity slug display, one-click clipboard copy, and UTM campaign tag builder.
- [X] T040 [US4] Implement KPI metric cards component `frontend/src/components/affiliate/AffiliateKpiCards.tsx` displaying available balance, pending maturation balance, total earnings, driven sales count, and active draw co-prize tickets.
- [X] T041 [US4] Implement paginated transaction history component `frontend/src/components/affiliate/AffiliateLedgerTable.tsx` displaying date, description, type badge, amount (+/-), and status.
- [X] T042 [US4] Implement composite container view `frontend/src/components/affiliate/AffiliateDashboardView.tsx` assembling KPI cards, link generator, and ledger table with RTL/LTR layout support.
- [X] T043 [US4] Create route page `frontend/src/app/[locale]/affiliate/page.tsx` rendering `AffiliateDashboardView` with metadata and authentication guard.
- [X] T044 [US4] Add navigation link to `/affiliate` in `frontend/src/components/layout/Navbar.tsx` and mobile navigation drawer for authenticated users.

**Checkpoint**: At this point, the self-service Affiliate Portal is complete, bilingual, and reactive.

---

## Phase 7: User Story 5 — Payout Request Lifecycle & Admin-Controlled Minimum Threshold (Priority: P3)

**Goal**: Affiliates with mature available balances meeting or exceeding the currently active Admin-controlled threshold (`available_balance >= active_threshold`) can request cash withdrawals (`requested_amount > 0` and `<= available_balance`). The request atomically snapshots `threshold_cents_at_request`, debits available balance via a ledger entry, survives subsequent threshold adjustments without cancellation, and provides double-spend locking.

**Independent Test**: Attempt withdrawal when available balance is below active threshold (rejected with 422 `ERR_PAYOUT_THRESHOLD_UNMET`); submit valid withdrawal when available balance meets threshold (accepted, balance locked, threshold snapshotted); raise threshold to $100 (existing request remains valid through settlement, new requests require $100 available); lower threshold to $25 (no auto-payouts created).

### Tests for User Story 5
- [X] T045 [P] [US5] Create contract test `backend/tests/Feature/AffiliatePayoutContractTest.php` testing `POST /api/v1/affiliate/payouts/request` and `GET /api/v1/affiliate/payouts` against `contracts/payouts.contract.md` (success 201, 422 threshold unmet, 422 insufficient balance, history with snapshot thresholds).
- [X] T046 [P] [US5] Create feature test `backend/tests/Feature/AffiliatePayoutLifecycleTest.php` testing:
  - Exact threshold semantics: eligibility requires `available_balance >= active_threshold`; requested amount requires `amount > 0` and `amount <= available_balance`
  - Active threshold enforcement resolved from `PlatformSettingsService` at the exact moment of submission
  - Snapshot persistence of `threshold_cents_at_request` on `affiliate_payouts`
  - Pending payout invariance: threshold raised after acceptance ($50 -> $100) leaves pending payout valid and progressing through settlement
  - Zero auto-payout generation when threshold is lowered
  - Double-spend prevention under concurrent requests via `lockForUpdate()`
  - Settlement state transition (`requested` -> `completed` with `admin_reference_number`) and compensating reversal if rejected without historical row deletion

### Implementation for User Story 5
- [X] T047 [US5] Implement `backend/app/Services/AffiliatePayoutService.php` with:
  - `calculateAvailableBalance(string $userId): int` aggregating mature credit entries minus debit entries
  - `requestPayout(User $user, int $amountCents, string $payoutMethod, array $recipientDetails): AffiliatePayout` executed inside a database transaction with `lockForUpdate()`, validating `$availableCents >= $activeThresholdCents` and `$amountCents > 0 && $amountCents <= $availableCents`, creating `affiliate_payouts` record with `threshold_cents_at_request`, and inserting `payout_debit` entry into `affiliate_ledger_entries`
  - `settlePayout(AffiliatePayout $payout, string $adminReferenceNumber, string $adminId): AffiliatePayout` transitioning status to `completed`
  - `rejectPayout(AffiliatePayout $payout, string $reason, string $adminId): AffiliatePayout` creating a compensating `reversal_credit` ledger entry, never deleting the debit
- [X] T048 [US5] Implement `backend/app/Http/Controllers/AffiliatePayoutController.php` with `requestPayout(Request $request)` and `history(Request $request)` matching `contracts/payouts.contract.md`.
- [X] T049 [US5] Register routes in `backend/routes/api.php` under `auth:sanctum`: `POST /api/v1/affiliate/payouts/request` and `GET /api/v1/affiliate/payouts`.
- [X] T050 [US5] Implement payout mutation hook `frontend/src/hooks/useAffiliatePayouts.ts` with error handling for `ERR_PAYOUT_THRESHOLD_UNMET` and `ERR_INSUFFICIENT_AVAILABLE_BALANCE`.
- [X] T051 [US5] Implement withdrawal modal component `frontend/src/components/affiliate/PayoutRequestModal.tsx` dynamically displaying current active Admin threshold from dashboard API, validating that `unpaid_available_cents >= minimum_payout_cents` to unlock submission, allowing user to enter amount up to available balance, and collecting ZainCash/AsiaHawala/Western Union recipient details.

**Checkpoint**: At this point, the complete payout request lifecycle is active, auditable, and resilient against race conditions and threshold changes.

---

## Phase 8: User Story 6 — Anti-Self-Referral & Fraud Invariant Enforcement (Priority: P3)

**Goal**: Hard deterministic rejection of self-referrals (authenticated user ID match, guest normalized email match), audit logging of salted hashes (`ip_hash`, `user_agent_hash`), and IDOR protection across all affiliate ledger and payout endpoints.

**Independent Test**: Attempt checkout using one's own referral code; verify attribution is rejected and zero commission is created, while direct purchase succeeds.

### Tests for User Story 6
- [X] T052 [P] [US6] Create feature test `backend/tests/Feature/AntiSelfReferralTest.php` testing: rejection of self-referral when authenticated buyer matches referrer, rejection when guest checkout email matches referrer email, database constraint enforcement `chk_ref_attr_anti_self_referral`, and graceful organic order completion without commission.
- [X] T053 [P] [US6] Create security and authorization test `backend/tests/Feature/AffiliateSecurityAndFraudTest.php` testing: IDOR authorization guards (User A cannot view User B's ledger or payouts), rate-limiting on resolver endpoint, and sanitized audit hash generation.

### Implementation for User Story 6
- [X] T054 [US6] Implement authorization policies `backend/app/Policies/AffiliateLedgerPolicy.php` and `backend/app/Policies/AffiliatePayoutPolicy.php` ensuring users can only read their own ledger transactions and payout requests.
- [X] T055 [US6] Enhance anti-fraud validation in `backend/app/Services/AffiliateAttributionService.php` to perform normalized email matching (lowercased, trimmed) against referrer user account and log salted `ip_hash` and `user_agent_hash`.
- [X] T056 [US6] Implement administrative setting CLI helper `backend/app/Console/Commands/SetPlatformSettingCommand.php` (`php artisan knzin:set-setting <key> <value>`) with production confirmation guard allowing developers and testers to update dynamic settings (e.g. `affiliate.payout_min_cents`) during local verification without requiring the full Feature 008 Admin UI.

**Checkpoint**: All security, fraud invariants, and IDOR defenses are actively verified.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end integration validation across all 8 acceptance scenarios, verification scripts, and final quality checks.

- [X] T057 [P] Update developer walkthrough command script `specs/006-affiliate-engine/quickstart.md` with verified local CLI commands for Scenarios 1 through 8.
- [X] T058 [P] Create automated integration scenario suite `backend/tests/Feature/AffiliateAcceptanceScenariosTest.php` executing Scenarios 1 through 8 sequentially in a unified test run.
- [X] T059 [P] Run full bilingual static analysis and lint checks across frontend messages (`frontend/messages/ar.json` and `frontend/messages/en.json`) to confirm 100% key and token parity.
- [X] T060 Run full test suite validation (`php artisan test --filter=Affiliate` and `npm --prefix frontend test`) to verify zero regressions against Feature 005 and 100% green test passes.

---

## Phase 10: Multi-User Security Architecture & Integration Contracts (T061–T068)

- [X] **T061**: Create `admin_capabilities` migration [`2026_10_02_000006_create_admin_capabilities_table.php`](backend/database/migrations/2026_10_02_000006_create_admin_capabilities_table.php) and Eloquent model [`AdminCapability.php`](backend/app/Models/AdminCapability.php) with multi-user status, provenance, and revocation columns.
- [X] **T062**: Create `approval_records` migration [`2026_10_02_000007_create_approval_records_table.php`](backend/database/migrations/2026_10_02_000007_create_approval_records_table.php), Eloquent model [`ApprovalRecord.php`](backend/app/Models/ApprovalRecord.php) with unique version constraint `uq_approval_version`, and trusted write boundary [`ApprovalRegistryService.php`](backend/app/Services/ApprovalRegistryService.php).
- [X] **T063**: Implement `knzin:bootstrap-admin` console command ([`BootstrapAdminCommand.php`](backend/app/Console/Commands/BootstrapAdminCommand.php)) with race-safe atomic singleton lock, secret token validation (`ADMIN_BOOTSTRAP_TOKEN`), and least-privilege root capability assignment.
- [X] **T064**: Implement delegated provisioning (`knzin:grant-admin-capability`) and revocation (`knzin:revoke-admin-capability`) console commands enforcing active admin authorizer possessing `manage_admin_capabilities`, anti-self-grant, and audit provenance.
- [X] **T065**: Implement `DatabaseCoPrizeApprovalProvider` ([`DatabaseCoPrizeApprovalProvider.php`](backend/app/Services/DatabaseCoPrizeApprovalProvider.php)) and `ApprovalProvenance` DTO querying authoritative `approval_records` for exact winner user ID and draw ID.
- [X] **T066**: Implement `adjudicateCoPrizeRevocation()` in `AffiliateCoPrizeService` ([`AffiliateCoPrizeService.php`](backend/app/Services/AffiliateCoPrizeService.php)) requiring `adjudicate_affiliate_coprize` capability and appending compensating `reversal_debit` entry under the Append-Only Affiliate Financial Subledger.
- [X] **T067**: Expand `AdminPlatformSettingsAuthorizationTest` ([`AdminPlatformSettingsAuthorizationTest.php`](backend/tests/Feature/AdminPlatformSettingsAuthorizationTest.php)) to 17 tests covering bootstrap, tokens, multi-admin, delegation, capability segregation, self-grant prevention, and race safety.
- [X] **T068**: Expand `AffiliateCoPrizeResolutionTest` ([`AffiliateCoPrizeResolutionTest.php`](backend/tests/Feature/AffiliateCoPrizeResolutionTest.php)) to 19 tests covering state-based freshness, missing/revoked/superseded states, post-release revocation adjudication, and trusted approval write boundary.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies — can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories. Foreign-key migration sequence strictly enforced.
- **Phase 3 (User Story 1, P1)**: Depends on Phase 2 — Core MVP.
- **Phase 4 (User Story 2, P1)**: Depends on Phase 2 and Phase 3 — Core MVP.
- **Phase 5 (User Story 3, P2)**: Depends on Phase 2 and Phase 4. Decoupled from Feature 008 draw implementation.
- **Phase 6 (User Story 4, P2)**: Depends on Phase 2 and Phase 4.
- **Phase 7 (User Story 5, P3)**: Depends on Phase 2, Phase 4, and `PlatformSettingsService`.
- **Phase 8 (User Story 6, P3)**: Depends on Phase 2, Phase 3, and Phase 4.
- **Phase 9 (Polish)**: Depends on all user story phases (Phase 3 through Phase 8).
- **Phase 10 (Multi-User Security Architecture & Integration Contracts)**: Depends on Phase 1, Phase 5, Phase 7, and Phase 9.

### User Story Dependencies & Graph
```text
Phase 1: Setup & Platform Settings (T001-T003)
   ↓
Phase 2: Foundational Migrations & Models (T004-T012)
   ↓
Phase 3: [US1] Referral Attribution & Buyer Protection (T013-T022) 🎯 MVP
   ↓
Phase 4: [US2] Sales Commission & Append-Only Ledger (T023-T028) 🎯 MVP
   ├── Phase 5: [US3] Grand-Prize 40% Co-Share (T029-T032)
   ├── Phase 6: [US4] Affiliate Portal UI & Dashboard (T033-T044)
   ├── Phase 7: [US5] Payout Request Lifecycle & Admin Threshold (T045-T051)
   └── Phase 8: [US6] Anti-Self-Referral & Security Shields (T052-T056)
   ↓
Phase 9: Polish & Cross-Cutting Verification (T057-T060)
   ↓
Phase 10: Multi-User Security Architecture & Integration Contracts (T061-T068)
```

---

## Parallel Execution Opportunities

### Phase 2 (Foundational Migrations & Models)
The migrations and models touch independent files and can be created in parallel (provided migrations are executed in sequence):
```bash
# Migrations:
T002: create_platform_settings_table.php
T004: create_affiliate_profiles_table.php
T005: create_affiliate_payouts_table.php
T006: create_referral_attributions_table.php
T007: create_affiliate_ledger_entries_table.php

# Models:
T003: PlatformSetting.php
T008: AffiliateProfile.php
T009: AffiliatePayout.php
T010: ReferralAttribution.php
T011: AffiliateLedgerEntry.php
```

### Phase 3–8 User Story Parallel Tracks
Once Phase 4 (US2) is complete, team members or parallel agents can implement:
* **Track A**: User Story 3 (40% Co-Prize Domain Service, T029–T032)
* **Track B**: User Story 4 (Affiliate Portal UI & Components, T033–T044)
* **Track C**: User Story 5 (Payout Request & Dynamic Threshold Service, T045–T051)
* **Track D**: User Story 6 (Anti-Fraud & Security Policies, T052–T056)

---

## Implementation Strategy

### MVP First (Phases 1, 2, 3, and 4)
1. Complete Phase 1 (Configuration & Dynamic Settings Foundation).
2. Complete Phase 2 (Migrations & Core Entities in strict FK order).
3. Complete Phase 3 (Referral Attribution & 100% Buyer Protection).
4. Complete Phase 4 (25% Sales Commission, Failure-Safe Transaction Hook & Append-Only Subledger).
5. **STOP and VALIDATE**: Verify referred $2 and $10 purchases award canonical buyer tickets and mint exact commission ledger entries. Core viral commercial loop is proven.

### Incremental Delivery (Phases 5 through 10)
1. Add Phase 5 (Grand-Prize 40% Co-Share with Option C KYC hold, decoupled from Feature 008).
2. Add Phase 6 (Affiliate Portal UI & Real-time KPI reporting).
3. Add Phase 7 (Payout Request Lifecycle with Dynamic Admin Threshold semantics).
4. Add Phase 8 (Anti-Self-Referral & Security Shields).
5. Add Phase 9 (Full automated scenario suite & cross-cutting polish).
6. Add Phase 10 (Multi-User Security Architecture & Integration Contracts: Admin Provisioning and Approval Freshness).


