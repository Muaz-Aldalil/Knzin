# Tasks: Feature 008 — Admin Panel

**Input Documents**: `specs/008-admin-panel/spec.md`, `specs/008-admin-panel/plan.md`, `specs/008-admin-panel/data-model.md`, `specs/008-admin-panel/contracts/admin-api.md`, `specs/008-admin-panel/contracts/public-api-delta.md`, `specs/008-admin-panel/gate-review.md`.  
**Baseline & Target Files**: 147 CREATE, 43 MODIFY, 0 DELETE = 190 total files.  
**Execution Database**: `knzin_test` on MySQL (isolated via `TestDatabaseGuard`).

---

## Phase 1: Setup (Test Database Isolation & Configuration)

**Purpose**: Test database isolation and runtime environment configuration prerequisites (blocking all test execution).

- [ ] T001 Configure PHPUnit test environment to force MySQL connection and database `knzin_test` in `backend/phpunit.xml`
- [ ] T002 [P] Create `backend/tests/Support/TestDatabaseGuard.php` enforcing database name ends with `_test` and aborting if `knzin_db` is detected
- [ ] T003 Override `createApplication()` in `backend/tests/TestCase.php` to execute `TestDatabaseGuard::assertSafe()` before test boot
- [ ] T004 [P] Create unit test for database guard logic in `backend/tests/Unit/TestDatabaseGuardTest.php`
- [ ] T005 Create read-only database smoke test asserting active database is `knzin_test` in `backend/tests/Feature/TestDatabaseSmokeTest.php`
- [ ] T006 [P] Configure admin session max age parameter in `backend/config/knzin.php` (`KNZIN_ADMIN_SESSION_MAX_AGE_MINUTES`, default 480)
- [ ] T007 [P] Configure private `payout-receipts` disk in `backend/config/filesystems.php` (`PAYOUT_RECEIPTS_DISK`, local/s3 private driver)
- [ ] T008 [P] Document environment variables `KNZIN_ADMIN_SESSION_MAX_AGE_MINUTES` and `PAYOUT_RECEIPTS_DISK` in `backend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites - Schema, Audit, Middleware & Base Exceptions)

**Purpose**: Core database schema, domain exceptions, audit writing infrastructure, and base middleware that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T009 Add publication and seed commitment columns with CHECK constraints to draws table via migration `backend/database/migrations/2026_10_03_000001_add_publication_and_seed_commitment_to_draws_table.php` (verbatim constraints: `is_published` BOOL default 1, `published_at` TIMESTAMP NULL, `published_by_user_id` CHAR(36) FK `users` nullOnDelete, `server_seed_hash` CHAR(64) NULL, `server_seed_encrypted` TEXT NULL, `seed_committed_at` TIMESTAMP NULL, `server_seed_revealed` CHAR(64) NULL, `seed_revealed_at` TIMESTAMP NULL; CHECK `is_published = 1 OR status = 'upcoming'`; CHECK `(server_seed_hash IS NULL AND server_seed_encrypted IS NULL AND seed_committed_at IS NULL) OR (server_seed_hash IS NOT NULL AND server_seed_encrypted IS NOT NULL AND seed_committed_at IS NOT NULL)`; CHECK `server_seed_hash IS NULL OR CHAR_LENGTH(server_seed_hash) = 64`; CHECK `server_seed_revealed IS NULL OR server_seed_hash IS NOT NULL`; index `idx_draws_published_status_tier`)
- [ ] T010 [P] Add receipt path, receipt sha256, and index on admin reference number to affiliate payouts via migration `backend/database/migrations/2026_10_03_000002_add_receipt_columns_to_affiliate_payouts_table.php` (columns: `receipt_path` VARCHAR(255) NULL, `receipt_sha256` CHAR(64) NULL; non-unique index `idx_affiliate_payouts_admin_reference`)
- [ ] T011 [P] Create immutable admin activity logs table via migration `backend/database/migrations/2026_10_03_000003_create_admin_activity_logs_table.php` (columns: `id` BIGINT UNSIGNED PK AI, `request_id` CHAR(36) NOT NULL, `actor_user_id` CHAR(36) FK `users` nullOnDelete, `capability_used` VARCHAR(64) NULL, `action` VARCHAR(64) NOT NULL, `target_type` VARCHAR(64) NULL, `target_id` VARCHAR(64) NULL, `outcome` VARCHAR(16) NOT NULL, `reason_code` VARCHAR(64) NULL, `administrative_justification` VARCHAR(500) NULL, `before_state` JSON NULL, `after_state` JSON NULL, `ip_hash` CHAR(64) NULL, `created_at` TIMESTAMP NOT NULL; no `updated_at`; indexes on `created_at`, `actor_user_id,created_at`, `action,created_at`, `target_type,target_id`, `outcome,created_at`)
- [ ] T012 [P] Create promotional awards table via migration `backend/database/migrations/2026_10_03_000004_create_promotional_awards_table.php` (columns: `id` BIGINT UNSIGNED PK AI, `recipient_user_id` CHAR(36) FK `users` restrictOnDelete, `draw_id` CHAR(36) FK `draws` restrictOnDelete NULL, `award_title` VARCHAR(150) NOT NULL, `award_details` TEXT NULL, `valuation_usd_cents` BIGINT UNSIGNED NULL CHECK `>= 0`, `reason` VARCHAR(500) NOT NULL, `awarded_by_admin_id` CHAR(36) FK `users` restrictOnDelete, `created_at` TIMESTAMP NOT NULL; no `updated_at`; indexes on `recipient_user_id,created_at`, `draw_id`)
- [ ] T013 [P] Add CHECK constraint restricting admin capabilities to approved six in `backend/database/migrations/2026_10_03_000005_constrain_admin_capabilities_to_approved_set.php` (constraint: `CHECK (capability IN ('manage_admin_capabilities','manage_platform_settings','adjudicate_affiliate_coprize','issue_kyc_approval','issue_draw_audit_approval','settle_affiliate_payout'))`)
- [ ] T014 [P] Create typed domain exceptions `AdminStateConflictException.php` (HTTP 409) and `ProtectedFieldException.php` (HTTP 422) in `backend/app/Exceptions/`
- [ ] T015 [P] Create payout state conflict exceptions `PayoutStateConflictException.php` (HTTP 409) and `AmbiguousCommitException.php` in `backend/app/Exceptions/`
- [ ] T016 [P] Create approval, lockout, and audit exceptions `LastAdminLockoutException.php` (HTTP 409), `CoPrizeApprovalsIncompleteException.php` (HTTP 409), and `ImmutableAuditException.php` in `backend/app/Exceptions/`
- [ ] T017 [P] Create base form request `backend/app/Http/Requests/Admin/AdminFormRequest.php` providing standardized JSend 422 validation response and audit context extraction helper
- [ ] T018 [P] Define approved capabilities constant (`const ALL = [...]`) and `canViewRecipientDetails(User)` policy in `backend/app/Support/AdminCapabilities.php`
- [ ] T019 Register six capability gates without wildcard bypass and define `admin` rate limiter in `backend/app/Providers/AppServiceProvider.php`
- [ ] T020 [P] Create immutable audit log model in `backend/app/Models/AdminActivityLog.php` throwing `ImmutableAuditException` on update/delete with `$timestamps = false`
- [ ] T021 [P] Create readonly audit context value object in `backend/app/Services/Admin/AdminAuditContext.php` (actor id, capability used, request id, ip hash, justification)
- [ ] T022 [P] Create audit redactor service with sensitive field deny-list in `backend/app/Services/Admin/AuditRedactor.php`
- [ ] T023 Create transactional audit writer asserting active transaction (`DB::transactionLevel() > 0`) in `backend/app/Services/Admin/AdminAuditWriter.php`
- [ ] T024 [P] Create request ID assignment middleware extracting `X-Request-Id` or generating UUID in `backend/app/Http/Middleware/AssignAdminRequestId.php`
- [ ] T025 [P] Create failure audit middleware logging 401, 403, 409, 422, and 5xx failures out-of-transaction in `backend/app/Http/Middleware/AuditAdminFailures.php`
- [ ] T026 Register middleware aliases (`admin.principal`, `admin.capability`, `throttle:admin`) and custom JSON exception renders in `backend/bootstrap/app.php`

**Checkpoint**: Foundation ready — database migrations, exceptions, audit writer, and base middleware are fully operational. User story implementation can now begin.

---

## Phase 3: User Story 1 — Secure Admin Authentication & Capability-Gated Navigation (Priority: P1) 🎯 MVP

**Goal**: Deliver the secure administrative authentication barrier, session management, and capability-aware navigation shell so administrators access only authorized operational areas.

**Independent Test**: Sign in with an account holding only `manage_platform_settings`; verify settings and draw controls are accessible, while affiliate adjudication, KYC approvals, payout settlement, user management, and full audit logs return server-side HTTP 403 and are hidden/disabled in navigation. Direct access to `/api/v1/admin/me` returns `{user, capabilities, server_time_utc}`.

### Tests for User Story 1
- [ ] T027 [P] [US1] Create authorization matrix test in `backend/tests/Feature/Admin/AdminAuthorizationMatrixTest.php` asserting capability isolation and no `Gate::before` bypass
- [ ] T028 [P] [US1] Create route capability coverage test in `backend/tests/Feature/Admin/AdminRoutesCapabilityCoverageTest.php` verifying all protected admin routes have `admin.principal`, routes requiring a specific capability have `admin.capability:<cap>`, and `GET /me` is the sole intentional exception to `admin.capability`
- [ ] T029 [P] [US1] Create admin principal guard test in `backend/tests/Feature/Admin/AdminPrincipalGuardTest.php` verifying guest tokens, unverified users, merged users, deactivated accounts, mock-in-production 503, and expired tokens

### Implementation for User Story 1
- [ ] T030 [US1] Implement admin principal verification middleware in `backend/app/Http/Middleware/EnsureAdminPrincipal.php` checking verified Google provider, active status, unmerged account, and $\ge 1$ approved capability
- [ ] T031 [US1] Implement capability check middleware in `backend/app/Http/Middleware/EnsureAdminCapability.php` evaluating `Gate::forUser` for route-level capabilities
- [ ] T032 [US1] Implement admin session info controller in `backend/app/Http/Controllers/Admin/AdminSessionController.php` returning authenticated admin profile and active capabilities
- [ ] T033 [US1] Register `/api/v1/admin/me` route under `auth:sanctum`, `admin.principal`, and `throttle:admin` in `backend/routes/api.php`
- [ ] T034 [P] [US1] Update API client in `frontend/src/lib/api-client.ts` to support FormData uploads without setting manual `Content-Type: application/json`
- [ ] T035 [P] [US1] Create site frame wrapper in `frontend/src/components/layout/SiteFrame.tsx` to suppress consumer site HUD/ticker/footer on administrative routes
- [ ] T036 [US1] Update root layout in `frontend/src/app/[locale]/layout.tsx` to conditionally mount `SiteFrame` for `/[locale]/admin/*`
- [ ] T037 [P] [US1] Define administrative TypeScript interfaces and capability enum in `frontend/src/types/admin.ts`
- [ ] T038 [P] [US1] Define capability-gated navigation mapping in `frontend/src/lib/admin/nav.ts`
- [ ] T039 [P] [US1] Implement formatting helpers for integer cents, dates, and bdi-wrapped identifiers in `frontend/src/lib/admin/format.ts`
- [ ] T040 [US1] Implement session and capability management hook in `frontend/src/hooks/admin/useAdminSession.ts` consuming `GET /api/v1/admin/me`
- [ ] T041 [US1] Implement admin authentication and capability guard component in `frontend/src/components/admin/AdminGuard.tsx`
- [ ] T042 [US1] Implement capability-gated navigation bar in `frontend/src/components/admin/AdminNav.tsx`
- [ ] T043 [US1] Implement admin shell component with responsive RTL/LTR drawer layout in `frontend/src/components/admin/AdminShell.tsx`
- [ ] T044 [US1] Implement admin layout in `frontend/src/app/[locale]/admin/layout.tsx` wrapping routes with `AdminGuard` and `AdminShell`
- [ ] T045 [US1] Implement admin landing page in `frontend/src/app/[locale]/admin/page.tsx` redirecting to the first authorized administrative section
- [ ] T046 [P] [US1] Create shared admin UI components `DataTable.tsx`, `ConfirmDialog.tsx`, `ReasonDialog.tsx`, `StatusBadge.tsx`, and `MoneyText.tsx` in `frontend/src/components/admin/`
- [ ] T047 [P] [US1] Add admin localization dictionary keys in `frontend/messages/ar.json` and `frontend/messages/en.json` ensuring full ar/en parity
- [ ] T048 [P] [US1] Create frontend tests for navigation, i18n parity, RTL invariants, confirmation dialogs, and untrusted client state in `frontend/src/tests/{AdminI18nParity,AdminNavigationCapability,AdminRtlInvariants,AdminConfirmationInvariants,AdminClientUntrust}.test.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently. Non-admin users are blocked, and authorized admins see only their permitted navigation sections.

---

## Phase 4: User Story 2 — Platform Settings & Dynamic Commission Governance (Priority: P1)

**Goal**: Enable dynamic administrative control over the sales commission rate (basis points) and minimum payout threshold with atomic transactional audit, snapshotting the rate forward-only at order attribution creation.

**Independent Test**: Update `affiliate.commission_rate_bps` from 2500 (25%) to 3000 (30%). Verify that a new qualifying order created thereafter snapshots 3000 bps into `referral_attributions.commission_rate_bps`, while pre-existing attributions and ledger entries retain their historical snapshot.

### Tests for User Story 2
- [ ] T049 [P] [US2] Create settings and commission snapshot integration test in `backend/tests/Feature/Admin/AdminSettingsAndCommissionSnapshotTest.php` proving rate updates snapshot forward-only and maturation edits are rejected with 422
- [ ] T050 [P] [US2] Create affiliate policy display test in `backend/tests/Feature/AffiliatePolicyDisplayTest.php` asserting public policy and dashboard reflect the active dynamic rate

### Implementation for User Story 2
- [ ] T051 [US2] Implement atomic `setMany` with typed registry (`affiliate.commission_rate_bps` int 0-10000, `affiliate.payout_min_cents` int $\ge 0$) and in-transaction audit in `backend/app/Services/PlatformSettingsService.php`
- [ ] T052 [US2] Snapshot dynamic commission rate from `PlatformSettingsService` at attribution creation in `backend/app/Services/AffiliateAttributionService.php` (line 134)
- [ ] T053 [P] [US2] Update affiliate dashboard controller in `backend/app/Http/Controllers/AffiliateDashboardController.php` to return dynamic active rate and snapshotted entry rates in ledger descriptions
- [ ] T054 [P] [US2] Create public policy controller in `backend/app/Http/Controllers/AffiliatePolicyController.php` returning `{sales_commission_rate_percent}`
- [ ] T055 [US2] Register public `GET /api/v1/affiliate/policy` route in `backend/routes/api.php`
- [ ] T056 [P] [US2] Create form request `backend/app/Http/Requests/Admin/UpdateSettingsRequest.php` enforcing integer cents, 0-10000 bps range, and rejecting unknown keys
- [ ] T057 [US2] Implement settings controller in `backend/app/Http/Controllers/Admin/AdminSettingsController.php` (`GET /settings`, `PATCH /settings`)
- [ ] T058 [US2] Register admin settings endpoints `GET /api/v1/admin/settings` and `PATCH /api/v1/admin/settings` in `backend/routes/api.php` under `admin.capability:manage_platform_settings`
- [ ] T059 [US2] Implement settings management hook in `frontend/src/hooks/admin/useAdminSettings.ts`
- [ ] T060 [US2] Implement settings form with typed confirmation dialog in `frontend/src/components/admin/SettingsForm.tsx` displaying maturation hours as read-only info
- [ ] T061 [US2] Implement settings page in `frontend/src/app/[locale]/admin/settings/page.tsx`
- [ ] T062 [P] [US2] Create public affiliate policy hook in `frontend/src/hooks/useAffiliatePolicy.ts` and update `frontend/src/components/affiliate/AffiliateDashboardView.tsx`, `AffiliateLedgerTable.tsx`, `ReferralLinkCard.tsx`, and `frontend/src/app/[locale]/affiliate/page.tsx` to remove hardcoded 25% references
- [ ] T063 [P] [US2] Create frontend rate display test in `frontend/src/tests/AffiliateRateDisplay.test.ts` verifying no literal 25% remains in affiliate screens

**Checkpoint**: User Stories 1 and 2 work independently. Commission rates are dynamically configurable without altering historical ledger entries.

---

## Phase 5: User Story 3 — Affiliate Ledger & Payout Oversight (Priority: P1)

**Goal**: Provide read-only operational visibility into affiliate profiles, chronological ledger transaction histories, and submitted payout requests without side-effect writes.

**Independent Test**: Navigate to an affiliate profile; verify that available and pending balances are computed on-the-fly as projections of `affiliate_ledger_entries`. Verify that individual ledger rows contain zero inline edit or delete controls and GET requests trigger no maturation sweep.

### Tests for User Story 3
- [ ] T064 [P] [US3] Create read-only affiliate overview test in `backend/tests/Feature/Admin/AdminAffiliateReadTest.php` asserting zero database writes on GET, correct projection calculations, and pagination cap

### Implementation for User Story 3
- [ ] T065 [US3] Add read-only balance projection calculations (`calculateLifetimeEarned`, `calculateLedgerNet`) in `backend/app/Services/AffiliatePayoutService.php` without triggering `sweepMaturedCommissionsForUser`
- [ ] T066 [US3] Implement admin affiliate oversight controller in `backend/app/Http/Controllers/Admin/AdminAffiliateController.php` (`GET /affiliates`, `GET /affiliates/{userId}/ledger`)
- [ ] T067 [US3] Register admin affiliate routes `GET /api/v1/admin/affiliates` and `GET /api/v1/admin/affiliates/{userId}/ledger` in `backend/routes/api.php` under any-of `manage_platform_settings,settle_affiliate_payout`
- [ ] T068 [US3] Implement affiliate oversight hook in `frontend/src/hooks/admin/useAdminAffiliates.ts` consuming paged affiliates and ledger projections
- [ ] T069 [US3] Implement affiliate overview page in `frontend/src/app/[locale]/admin/affiliates/page.tsx` displaying search, balances, and immutable ledger drawer

**Checkpoint**: User Stories 1, 2, and 3 work independently. Administrative operators can inspect affiliate ledgers without risking database mutation.

---

## Phase 6: User Story 4 — Affiliate Payout Settlement & Rejection (Priority: P1)

**Goal**: Enable settlement of affiliate payouts with mandatory MTCN reference and physical receipt file upload to protected private storage, or rejection with mandatory reason and compensating ledger reversal credit.

**Independent Test**: Select a payout in `requested` or `processing` state; submit settlement with MTCN and receipt file; verify payout status transitions to `completed`, receipt is saved on private disk, and debit ledger entry transitions to `cleared`. In a separate test, reject a payout with reason; verify status transitions to `rejected` and a compensating `reversal_credit` entry is appended to the ledger. Verify reject-after-complete and settle-after-reject return 409 Conflict.

### Tests for User Story 4
- [ ] T070 [P] [US4] Create payout settlement tests in `backend/tests/Feature/Admin/AdminPayoutSettlementTest.php` verifying MTCN validation, receipt upload, anti-self-settlement 403, and ledger transition
- [ ] T071 [P] [US4] Create receipt staging tests in `backend/tests/Feature/Admin/AdminReceiptStagingTest.php` verifying file type sniff, size cap (5 MB), and private disk isolation
- [ ] T072 [P] [US4] Create payout state machine and concurrency tests in `backend/tests/Feature/Admin/AdminPayoutStateTransitionTest.php` and `AdminPayoutConcurrencyTest.php` verifying both `requested` and `processing` states proceed, terminal transitions return 409, and concurrent submissions serialize cleanly

### Implementation for User Story 4
- [ ] T073 [US4] Add `receipt_path` and `receipt_sha256` to `$fillable` and `$hidden` in `backend/app/Models/AffiliatePayout.php`
- [ ] T074 [US4] Implement receipt staging and deletion service in `backend/app/Services/Admin/ReceiptStorageService.php` (`stage`, `discard` on `payout-receipts` disk)
- [ ] T075 [US4] Harden `settlePayout` in `backend/app/Services/AffiliatePayoutService.php` with row lock, state guard (`requested|processing`), anti-self guard, MTCN validation, verified receipt reference, checked return of `markCompleted()`, exact 1-row `payout_debit` status flip (`available→cleared`), and atomic audit
- [ ] T076 [US4] Harden `rejectPayout` in `backend/app/Services/AffiliatePayoutService.php` with row lock, state guard (`requested|processing`), anti-self guard, mandatory reason, checked return of `markRejected()`, appending single compensating `reversal_credit` ledger entry, and atomic audit
- [ ] T077 [P] [US4] Create payout form requests `backend/app/Http/Requests/Admin/SettlePayoutRequest.php` (validating reference $\le 128$, receipt file $\le 5$ MB, jpg/png/webp) and `RejectPayoutRequest.php` (validating reason $\le 500$)
- [ ] T078 [P] [US4] Create payout resource `backend/app/Http/Resources/Admin/AdminPayoutResource.php` enforcing recipient details masking via `canViewRecipientDetails()` and hiding internal receipt path
- [ ] T079 [US4] Implement admin payout controller in `backend/app/Http/Controllers/Admin/AdminPayoutController.php` (`GET /payouts`, `POST /payouts/{payoutNumber}/settle`, `POST /payouts/{payoutNumber}/reject`)
- [ ] T080 [US4] Register admin payout routes in `backend/routes/api.php` under `settle_affiliate_payout` capability
- [ ] T081 [US4] Implement admin payouts hook in `frontend/src/hooks/admin/useAdminPayouts.ts`
- [ ] T082 [US4] Implement payout settlement dialog `PayoutSettleDialog.tsx` (with file upload) and rejection dialog `PayoutRejectDialog.tsx` in `frontend/src/components/admin/`
- [ ] T083 [US4] Implement payout management page in `frontend/src/app/[locale]/admin/payouts/page.tsx`

**Checkpoint**: Financial settlement workflow is complete. Payouts transition authoritatively with receipt evidence, and rejections append compensating reversal credits.

---

## Phase 7: User Story 5 — Co-Prize Approval Verification & Adjudication (Priority: P2)

**Goal**: Deliver independent KYC and draw-integrity approval issuance, supersession, and explicit revocation workflows, and gate 40% affiliate co-prize release and post-release revocation.

**Independent Test**: Seed a winning ticket for a referred user with a pending co-prize credit. Issue KYC approval for the winner and draw-integrity audit approval for the draw. With `adjudicate_affiliate_coprize`, trigger release; verify the ledger entry transitions to `available`. Attempt release when either approval is revoked; verify release is blocked with 409. Revoke approval using explicit per-type flow (`issue_kyc_approval` vs `issue_draw_audit_approval`).

### Tests for User Story 5
- [ ] T084 [P] [US5] Create co-prize adjudication tests in `backend/tests/Feature/Admin/AdminCoPrizeAdjudicationTest.php` verifying dual-approval gating, 100% winner retention, 40% marketing pool release, and post-release revocation
- [ ] T085 [P] [US5] Create approvals security test in `backend/tests/Feature/Admin/AdminApprovalsTest.php` verifying per-type authorization, cross-type 403 on issue and revoke, and explicit type checking on `POST /approvals/{id}/revoke`

### Implementation for User Story 5
- [ ] T086 [US5] Update approval registry service in `backend/app/Services/ApprovalRegistryService.php` to accept optional `AdminAuditContext` and write synchronous audit record inside existing transaction
- [ ] T087 [US5] Add `adjudicateCoPrizeRelease` to `backend/app/Services/AffiliateCoPrizeService.php` and `AffiliateCoPrizeServiceInterface.php` gated by `adjudicate_affiliate_coprize` and checking dual current-valid approvals
- [ ] T088 [US5] Add `adjudicateCoPrizeRevocation` (requiring original entry `status = 'available'`) and unclamped `previewRevocation` in `backend/app/Services/AffiliateCoPrizeService.php` appending compensating `reversal_debit`
- [ ] T089 [P] [US5] Create approval requests `IssueKycApprovalRequest.php`, `IssueDrawIntegrityApprovalRequest.php`, and `RevokeApprovalRequest.php` in `backend/app/Http/Requests/Admin/`
- [ ] T090 [US5] Implement admin approval controller in `backend/app/Http/Controllers/Admin/AdminApprovalController.php` with explicit revocation flow: resolve record, determine type, check required capability (`issue_kyc_approval` vs `issue_draw_audit_approval`), reject cross-type caller with 403 `ERR_FORBIDDEN`, call `revokeApproval`
- [ ] T091 [P] [US5] Create co-prize revocation request `backend/app/Http/Requests/Admin/RevokeCoPrizeRequest.php` requiring justification and explicit confirmation
- [ ] T092 [US5] Implement admin co-prize controller in `backend/app/Http/Controllers/Admin/AdminCoPrizeController.php` (`GET /coprizes`, `POST /coprizes/{serial}/release`, `POST /coprizes/{serial}/revoke`)
- [ ] T093 [US5] Register approval routes (`GET /approvals`, `POST /approvals/kyc`, `POST /approvals/draw-integrity`, `POST /approvals/{id}/revoke`) and co-prize routes in `backend/routes/api.php`
- [ ] T094 [US5] Implement co-prizes hook `useAdminCoPrizes.ts` and card component `CoPrizeCard.tsx` in `frontend/src/components/admin/` with unclamped exposure display
- [ ] T095 [US5] Implement co-prizes page in `frontend/src/app/[locale]/admin/coprizes/page.tsx`
- [ ] T096 [US5] Implement approvals hook `useAdminApprovals.ts` and form `ApprovalForm.tsx` in `frontend/src/components/admin/`
- [ ] T097 [US5] Implement approvals page in `frontend/src/app/[locale]/admin/approvals/page.tsx`

**Checkpoint**: Dual-approval gating and co-prize release/revocation are functional and verified. Approval revocation enforces strict per-type authorization.

---

## Phase 8: User Story 6 — Draw Lifecycle, Pre-Commitment & Broad Operational Editing (Priority: P2)

**Goal**: Deliver private draft creation, atomic publication with cryptographic SHA-256 pre-commitment before ticket accumulation opens, broad live operational data editing, prize management, and post-draw winner metadata editing.

**Independent Test**: Create a draw; verify it is in private draft (`is_published = false`) and hidden from public APIs. Publish the draw; verify `is_published = true`, server seed hash is committed, and public countdowns display it. Edit operational fields while live (title, broadcast URL, end time); verify updates succeed. Attempt to modify `server_seed_hash` or live `tier`; verify rejection.

### Tests for User Story 6
- [ ] T098 [P] [US6] Create draw lifecycle, seed commitment, and editing boundaries tests in `backend/tests/Feature/Admin/{AdminDrawLifecycleTest,AdminDrawSeedCommitmentTest,AdminDrawEditingBoundariesTest}.php` and `backend/tests/Unit/DrawSeedServiceTest.php`
- [ ] T099 [P] [US6] Create draw effective status and public visibility tests in `backend/tests/Feature/DrawEffectiveStatusTest.php` and `PublicDrawVisibilityTest.php` verifying private drafts are excluded from all 4 consumers and derived status `active` is returned
- [ ] T100 [P] [US6] Create public draw seed commitment frontend verification test in `frontend/src/tests/PublicDrawSeedCommitment.test.ts` (verifying: commitment hash rendered, raw seed unrendered, revealed verification rendered, absent data backward compatible)

### Implementation for User Story 6
- [ ] T101 [US6] Update `backend/app/Models/Draw.php` with publication attributes, scope `published()`, commitment guards, and dynamic status derivation in `computeEffectiveStatus()` (`completed→completed`, `now>=ends_at→locked`, stored `upcoming` ∧ published ∧ `starts_at<=now<ends_at` → `active`)
- [ ] T102 [US6] Filter public draw queries by `published()` in `backend/app/Http/Controllers/DrawController.php` (`active`, `concluded`), `TicketController.php` (tier selection), and `ActivityController.php`
- [ ] T103 [US6] Extend public draw response with additive commitment and verification fields in `backend/app/Http/Resources/DrawResource.php` and `DrawWinnerResource.php` (`seed_commitment: {hash, committed_at}`, `seed_verification: {revealed_seed, verified}`)
- [ ] T104 [US6] Implement CSPRNG seed generation, hashing, encryption, and reveal verification in `backend/app/Services/Admin/DrawSeedService.php` using `#[\SensitiveParameter]`
- [ ] T105 [US6] Implement draw draft creation, operational updates (D1-D9 rules), atomic publishing, completion (requiring existing `draw_winners` row), and winner display metadata updates in `backend/app/Services/Admin/DrawLifecycleService.php`
- [ ] T106 [US6] Implement prize creation, operational editing, and winner-safe deletion in `backend/app/Services/Admin/PrizeService.php`
- [ ] T107 [P] [US6] Create draw and prize form requests `StoreDrawRequest.php`, `UpdateDrawRequest.php`, `StorePrizeRequest.php`, `UpdatePrizeRequest.php`, and `UpdateWinnerMetadataRequest.php` in `backend/app/Http/Requests/Admin/`
- [ ] T108 [P] [US6] Create admin draw resource in `backend/app/Http/Resources/Admin/AdminDrawResource.php` exposing lifecycle stage and masking seed ciphertext
- [ ] T109 [US6] Implement admin draw controllers `AdminDrawController.php`, `AdminPrizeController.php`, and `AdminDrawWinnerController.php` in `backend/app/Http/Controllers/Admin/`
- [ ] T110 [US6] Register draw, prize, and winner management routes in `backend/routes/api.php` under `manage_platform_settings` capability
- [ ] T111 [US6] Implement draw management hook in `frontend/src/hooks/admin/useAdminDraws.ts`
- [ ] T112 [US6] Implement draw forms and editors `DrawForm.tsx`, `DrawLifecyclePanel.tsx`, `PrizeEditor.tsx`, and `WinnerMetadataForm.tsx` in `frontend/src/components/admin/`
- [ ] T113 [US6] Implement draw admin pages `admin/draws/page.tsx`, `admin/draws/new/page.tsx`, and `admin/draws/[id]/page.tsx` in `frontend/src/app/[locale]/admin/`
- [ ] T114 [P] [US6] Create public seed commitment badge in `frontend/src/components/draws/SeedCommitmentBadge.tsx` and integrate into `DrawCard.tsx`, `HeroGrandPrizeCountdown.tsx`, `ConcludedDrawsList.tsx`, and `types/draws.ts`

**Checkpoint**: Draw operations, pre-commitment, operational live editing, and public transparency displays are complete and verified.

---

## Phase 9: User Story 8 — Centralized Activity Audit Logging & Viewer (Priority: P2)

**Goal**: Provide a centralized, filterable audit log viewer for administrators with `manage_admin_capabilities`, presenting immutable audit events with sensitive field redaction.

**Independent Test**: Perform a settings change, a payout settlement, and an approval; open the Audit Viewer with `manage_admin_capabilities`; verify that each action appears with actor, capability, action name, target reference, outcome, and timestamp. Verify that an admin without `manage_admin_capabilities` receives HTTP 403.

### Tests for User Story 8
- [ ] T115 [P] [US8] Create audit log viewer tests in `backend/tests/Feature/Admin/AdminAuditViewerTest.php` verifying filter behavior, keyset pagination, and capability restriction
- [ ] T116 [P] [US8] Create audit atomicity and failure tests in `backend/tests/Feature/Admin/{AdminAuditAtomicityTest,AdminFailureAuditTest,AdminAuditCoverageTest}.php` and unit test `backend/tests/Unit/AuditRedactorTest.php` proving throwing writer aborts mutation and failure middleware logs 401/403/409/422

### Implementation for User Story 8
- [ ] T117 [P] [US8] Create audit log list request `backend/app/Http/Requests/Admin/ListAuditLogsRequest.php` enforcing 50-row max page limit and date filter validation
- [ ] T118 [P] [US8] Create audit log resource `backend/app/Http/Resources/Admin/AdminAuditLogResource.php` enforcing redaction of sensitive values
- [ ] T119 [US8] Implement audit log controller in `backend/app/Http/Controllers/Admin/AdminAuditLogController.php` (`GET /audit-logs`)
- [ ] T120 [US8] Register `GET /api/v1/admin/audit-logs` route in `backend/routes/api.php` under `manage_admin_capabilities` capability
- [ ] T121 [US8] Implement audit logs hook in `frontend/src/hooks/admin/useAdminAuditLogs.ts`
- [ ] T122 [US8] Implement audit log table `AuditLogTable.tsx` and filters `AuditLogFilters.tsx` in `frontend/src/components/admin/`
- [ ] T123 [US8] Implement audit log viewer page in `frontend/src/app/[locale]/admin/audit/page.tsx`

**Checkpoint**: Audit logging and viewing infrastructure is complete and verified.

---

## Phase 10: User Story 7 — Global User Directory & Capability Delegation (Priority: P3)

**Goal**: Enable global user lookup by email, UUID, or learner code, and delegated capability provisioning and revocation with anti-self-grant and last-admin lockout prevention.

**Independent Test**: Look up a user by learner code; grant `issue_kyc_approval`; verify active capability row created. Attempt to grant a capability to yourself; verify server rejection with 403. Attempt to revoke `manage_admin_capabilities` from the sole remaining admin; verify lockout protection rejection with 409.

### Tests for User Story 7
- [ ] T124 [P] [US7] Create user directory and capability management tests in `backend/tests/Feature/Admin/{AdminUserDirectoryTest,AdminCapabilityManagementTest}.php` verifying self-grant 403, last-admin 409 under row lock, DB CHECK rejection of 7th capability, and CLI parity

### Implementation for User Story 7
- [ ] T125 [US7] Implement capability management service in `backend/app/Services/Admin/AdminCapabilityService.php` with target eligibility check (`status = 'active'`, `merged_into_user_id IS NULL`, verified Google provider), anti-self-grant, and last-admin lockout under `lockForUpdate`
- [ ] T126 [US7] Delegate capability commands `GrantAdminCapabilityCommand.php`, `RevokeAdminCapabilityCommand.php`, and `BootstrapAdminCommand.php` in `backend/app/Console/Commands/` to `AdminCapabilityService` while preserving existing console output
- [ ] T127 [P] [US7] Create user list request `ListUsersRequest.php` (search $\ge 3$ chars, limit $\le 25$) and capability requests `GrantCapabilityRequest.php` and `RevokeCapabilityRequest.php` in `backend/app/Http/Requests/Admin/`
- [ ] T128 [P] [US7] Create admin user resource in `backend/app/Http/Resources/Admin/AdminUserResource.php` exposing only allowlisted profile fields and masking credentials
- [ ] T129 [US7] Implement admin user controller `AdminUserController.php` (`GET /users`) and capability controller `AdminCapabilityController.php` (`POST /users/{id}/capabilities`, `DELETE /users/{id}/capabilities/{capability}`) in `backend/app/Http/Controllers/Admin/`
- [ ] T130 [US7] Register user directory and capability routes in `backend/routes/api.php` under `manage_admin_capabilities` capability
- [ ] T131 [US7] Implement user directory hook in `frontend/src/hooks/admin/useAdminUsers.ts`
- [ ] T132 [US7] Implement user directory table `UserDirectoryTable.tsx` and capability manager `CapabilityManager.tsx` in `frontend/src/components/admin/`
- [ ] T133 [US7] Implement user directory page in `frontend/src/app/[locale]/admin/users/page.tsx`

**Checkpoint**: Global user lookup and delegated capability administration are functional and protected against privilege escalation and lockout.

---

## Phase 11: User Story 9 — Administrative Promotional Awards (Priority: P3)

**Goal**: Allow administrators with `manage_platform_settings` to grant promotional awards with administrative provenance, completely isolated from canonical RNG draw winners and financial ledger loops.

**Independent Test**: Create a promotional award for a user associated with a draw; verify that the award is recorded in `promotional_awards` with recipient, reason, award details, and admin ID. Verify that the canonical `draw_winners` record and the 40% affiliate co-prize loop are unaffected.

### Tests for User Story 9
- [ ] T134 [P] [US9] Create promotional award tests in `backend/tests/Feature/Admin/AdminPromotionalAwardTest.php` asserting `promotional_awards` row created and `draw_winners`, `tickets`, and ledger counts remain unchanged

### Implementation for User Story 9
- [ ] T135 [US9] Implement promotional award model in `backend/app/Models/PromotionalAward.php` with `$guarded = ['id']` and `$timestamps = false`
- [ ] T136 [US9] Implement promotional award service with recipient resolution (UUID or learner code) and zero-side-effect isolation in `backend/app/Services/Admin/PromotionalAwardService.php`
- [ ] T137 [P] [US9] Create award form request in `backend/app/Http/Requests/Admin/StoreAwardRequest.php` validating recipient, title, description, valuation, and reason
- [ ] T138 [US9] Implement promotional award controller in `backend/app/Http/Controllers/Admin/AdminPromotionalAwardController.php` (`POST /awards`)
- [ ] T139 [US9] Register `POST /api/v1/admin/awards` route in `backend/routes/api.php` under `manage_platform_settings` capability
- [ ] T140 [US9] Implement awards hook in `frontend/src/hooks/admin/useAdminAwards.ts`
- [ ] T141 [US9] Implement award form in `frontend/src/components/admin/AwardForm.tsx`
- [ ] T142 [US9] Implement awards page in `frontend/src/app/[locale]/admin/awards/page.tsx`

**Checkpoint**: Promotional awards can be granted with full provenance without disturbing canonical draw results.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Backward compatibility updates, regression test execution, and end-to-end verification across the complete feature boundary.

- [ ] T143 [P] Update existing test fixtures in `backend/tests/Feature/AffiliatePayoutLifecycleTest.php` (lines 138, 193), `AffiliateAcceptanceScenariosTest.php` (line 337), `DrawApiTest.php`, `AffiliateDashboardContractTest.php`, and `AdminPlatformSettingsAuthorizationTest.php` for signature compatibility, Google provider defaults, and derived active status
- [ ] T144 [P] Update existing frontend hooks `frontend/src/hooks/useAffiliateDashboard.ts` and `frontend/src/hooks/useDraws.ts` for dynamic policy and commitment payload compatibility
- [ ] T145 Run full test database suite verification on `knzin_test` ensuring all 34 existing suites and new test suites pass green
- [ ] T146 Verify TypeScript compilation, ESLint, and Next.js production build (`npm run build`) with zero lint or build errors
- [ ] T147 Validate quickstart scenarios S1 through S23 against test database and document completion in quickstart report

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T001-T008)
    ↓
Phase 2: Foundational (T009-T026) ⚠️ BLOCKS ALL STORIES
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Parallel Story Tracks (after Foundational Phase 2):         │
│   • US1: Auth & Navigation (T027-T048) [P1] 🎯 MVP           │
│   • US2: Platform Settings & Commission (T049-T063) [P1]    │
│   • US3: Affiliate Oversight (T064-T069) [P1]               │
│   • US4: Payout Settlement (T070-T083) [P1]                 │
│   • US5: Co-Prizes & Approvals (T084-T097) [P2]             │
│   • US6: Draw Lifecycle & Pre-Commitment (T098-T114) [P2]   │
│   • US8: Activity Audit Log Viewer (T115-T123) [P2]         │
│   • US7: User Directory & Capabilities (T124-T133) [P3]     │
│   • US9: Promotional Awards (T134-T142) [P3]                │
└─────────────────────────────────────────────────────────────┘
    ↓
Phase 12: Polish & Regression Gates (T143-T147)
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational Phase 2. Provides `AdminGuard`, `AdminShell`, and `apiClient` for all admin screens.
- **User Story 2 (P1)**: Depends on Phase 2. Can execute in parallel with US1.
- **User Story 3 (P1)**: Depends on Phase 2. Integrates with US1 shell.
- **User Story 4 (P1)**: Depends on Phase 2 and US3 read model. Requires receipt disk and lock serialization.
- **User Story 5 (P2)**: Depends on Phase 2 and US1 shell. Requires dual-approval gating and unclamped preview.
- **User Story 6 (P2)**: Depends on Phase 2. Requires CSPRNG seed commitment before accumulation window opens.
- **User Story 8 (P2)**: Depends on Phase 2 audit writer and failure middleware.
- **User Story 7 (P3)**: Depends on Phase 2 and US1 shell. Requires anti-self-grant and last-admin lockout.
- **User Story 9 (P3)**: Depends on Phase 2 and US6 draw models. Isolated from winner records.

### Parallel Opportunities

- Within **Phase 1**: `T002`, `T004`, `T006`, `T007`, `T008` can run in parallel.
- Within **Phase 2**: `T010`, `T011`, `T012`, `T013` (migrations), `T014`, `T015`, `T016`, `T017` (exceptions/requests), `T018`, `T020`, `T021`, `T022`, `T024`, `T025` can run in parallel.
- Across **User Stories**: Once Phase 2 completes, US1, US2, US3, US4, US5, US6, US8, US7, and US9 can proceed concurrently or sequentially according to priority order (P1 → P2 → P3).

---

## Parallel Example: User Story 1

```bash
# Launch test suite creation for User Story 1 together:
Task: T027 "Create authorization matrix test in backend/tests/Feature/Admin/AdminAuthorizationMatrixTest.php"
Task: T028 "Create route capability coverage test in backend/tests/Feature/Admin/AdminRoutesCapabilityCoverageTest.php"
Task: T029 "Create admin principal guard test in backend/tests/Feature/Admin/AdminPrincipalGuardTest.php"

# Launch frontend foundational types and navigation helpers together:
Task: T037 "Define administrative TypeScript interfaces in frontend/src/types/admin.ts"
Task: T038 "Define capability-gated navigation mapping in frontend/src/lib/admin/nav.ts"
Task: T039 "Implement formatting helpers in frontend/src/lib/admin/format.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001`–`T008`) to isolate `knzin_test`.
2. Complete Phase 2: Foundational (`T009`–`T026`) to establish migrations, exceptions, audit, and middleware.
3. Complete Phase 3: User Story 1 (`T027`–`T048`).
4. **STOP and VALIDATE**: Verify that admin login, capability-gated navigation, and route coverage tests pass independently.

### Incremental Delivery

1. Setup + Foundational $\rightarrow$ Foundation Ready.
2. User Story 1 (Auth & Navigation) $\rightarrow$ MVP operational shell!
3. User Stories 2, 3, 4 (Settings, Affiliate Oversight, Payout Settlement) $\rightarrow$ Complete financial and operational governance.
4. User Stories 5, 6, 8 (Co-Prizes, Draws, Audit Viewer) $\rightarrow$ Concluded draw and forensic adjudication.
5. User Stories 7, 9 (User Directory, Promotional Awards) $\rightarrow$ Administrative delegation and promotional gifting.
6. Polish & Regression Gates $\rightarrow$ Final verification and convergence.
