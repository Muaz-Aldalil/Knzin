# Feature 008 — Technical Decision Records

> **STATUS: PROPOSED — PREPARED FOR `DECISIONS.md` RATIFICATION.**
> Formatted per KNZiN Technical Decision Record standards.

---

### DEC-008-01: Six-Capability Authorization Model with No Bypass

Status:
APPROVED

Decision:
The administrative system is governed strictly by six independent capabilities (`manage_platform_settings`, `manage_admin_capabilities`, `issue_kyc_approval`, `issue_draw_audit_approval`, `adjudicate_affiliate_coprize`, `settle_affiliate_payout`) enforced server-side via route middleware and service Gates with zero wildcard or super-admin bypass.

Evidence:
- Spec FR-001, FR-002, US1
- `backend/app/Providers/AppServiceProvider.php` (contains five existing gate definitions, zero wildcards)
- Product Owner decision baseline establishing strictly six capabilities

Problem solved:
Prevents privilege escalation and enforces strict separation of duties across financial settlement, RNG auditing, user access, and operational settings.

Implementation consequence:
`AdminCapabilities` enum, `AdminCapabilityMiddleware`, `AppServiceProvider`, and 30 admin routes under `backend/routes/api.php`.

Alternatives rejected:
- Single `is_admin` boolean flag (violates least privilege and separation of duties).
- Role-based access control (RBAC) hierarchy (introduces unapproved capability inheritance).

Owner decision required:
NO

Tasks:
AUTH-1, AUTH-7, AUTH-8, AUTH-9, API-1..14

---

### DEC-008-02: Dynamic Commission Rate Snapshotting at Attribution

Status:
APPROVED

Decision:
The platform sales commission rate is dynamic via `PlatformSettingsService` (`affiliate.commission_rate_bps`, baseline 2500) and snapshotted into `referral_attributions.commission_rate_bps` at order creation time with strictly forward-only effects.

Evidence:
- Spec FR-007, FR-008, US2
- `backend/app/Services/AffiliateAttributionService.php` L134
- Approved Product Owner amendment to Feature 006

Problem solved:
Allows administrative adjustment of commission incentives without recalculating historical earnings or violating ledger immutability.

Implementation consequence:
`PlatformSettingsService::setMany`, `AffiliateAttributionService::recordAttribution`, `AffiliateDashboardController`, `AffiliateDashboardView.tsx`.

Alternatives rejected:
- Reading dynamic rate at payout fulfillment time (retroactively changes earned affiliate entitlement).
- Recalculating historical commissions upon rate change (violates append-only ledger integrity).

Owner decision required:
NO

Tasks:
FIN-1, FIN-2, FIN-12, API-3, FE-6, FE-16

---

### DEC-008-03: Payout Settlement State Verification & Ledger Atomicity

Status:
ENGINEERING CONTROL

Decision:
`AffiliatePayoutService::settlePayout` and `rejectPayout` execute under row locks, preserve existing allowed source states (`requested` and `processing`), explicitly verify the boolean return of `$payout->markCompleted()` / `markRejected()`, and abort the transaction with 409 Conflict if model transition returns false.

Evidence:
- Spec FR-005, FR-006, US4
- `backend/app/Models/AffiliatePayout.php` L99 & L120 (explicitly permits `['requested', 'processing']`)
- `backend/app/Services/AffiliatePayoutService.php` L121–162 (currently ignores boolean return from model)

Problem solved:
Remediates a confirmed brownfield defect where failed model state transitions could still report operational success and trigger incorrect ledger mutations, while preserving the existing model's valid source state transitions.

Implementation consequence:
`AffiliatePayoutService::settlePayout`, `AffiliatePayoutService::rejectPayout`, `AffiliatePayout`, `AdminPayoutController`.

Alternatives rejected:
- Restricting source state to `requested` only (breaks compatibility with existing model's `processing` state).
- Relying on database triggers (hides business failure logic from application layer).
- Ignoring transition result (allows financial state drift).

Owner decision required:
NO

Tasks:
FIN-6, FIN-7, FIN-8, API-5, TST-10, TST-11

---

### DEC-008-04: Payout Receipt Staging & Hash Verification Lifecycle

Status:
ENGINEERING CONTROL

Decision:
Uploaded physical receipt files are validated and staged on a private disk under a random ULID key before the database transaction opens, with SHA-256 hash verified and stored on the payout record, and automatic cleanup of staged files upon definite transaction rollback.

Evidence:
- Spec US4 AC1, AC2
- `specs/008-admin-panel/gate-review.md` GC-4
- `backend/config/filesystems.php`

Problem solved:
Bridges the ACID gap between the external filesystem and database transactions, preventing completed payouts with missing receipts or unreferenced orphan files.

Implementation consequence:
`ReceiptStorageService`, `config/filesystems.php`, `AdminPayoutController`, `AddReceiptColumnsToAffiliatePayoutsTable` migration.

Alternatives rejected:
- Storing binary images in MySQL BLOBs (degrades database query and backup performance).
- Uploading file after database commit (risks completed payout referencing a missing file on network crash).

Owner decision required:
NO

Tasks:
CFG-3, DB-2, FIN-3, FIN-7, API-5, TST-10

---

### DEC-008-05: Provably Fair Seed Commitment Protocol at Draw Publication

Status:
ENGINEERING CONTROL

Decision:
`DrawLifecycleService::publish()` generates 32 CSPRNG bytes, computes SHA-256 hash, encrypts the seed, and atomically commits `server_seed_hash`, `server_seed_encrypted`, `seed_committed_at`, and `is_published = 1` in a single UPDATE inside a transaction guarded by `now < starts_at`.

Evidence:
- KNZiN Constitution Principle IX.1 ("The server seed hash is committed before ticket accumulation opens")
- Spec FR-013, US6 AC2
- `backend/database/migrations/2026_09_29_000007_create_draws_table.php`

Problem solved:
Enforces provably fair cryptographic commitment prior to ticket accumulation, ensuring the server seed cannot be post-selected to favor any participant.

Implementation consequence:
`DrawLifecycleService::publish`, `DrawSeedService`, `AddAdminColumnsToDrawsTable` migration.

Alternatives rejected:
- Generating seed upon draw draft creation (exposes encrypted seed too early; risk of key rotation desync).
- Generating seed upon draw completion (violates provable fairness; allows manipulation of seed).

Owner decision required:
NO

Tasks:
DB-4, DRAW-3, DRAW-4, API-8, TST-14

---

### DEC-008-06: Draw Operational Editing Boundaries (D1–D9)

Status:
ENGINEERING CONTROL

Decision:
Upcoming and active draws remain broadly editable by administrators for operational fields (titles, URLs, schedule dates, prize descriptions, display labels, images), with schedule edits constrained by `starts_at >= seed_committed_at` and locked against retroactive shifts only when a canonical `draw_winners` row already exists.

Evidence:
- Spec FR-014 ("strictly prohibiting modification of server_seed_hash, active draw tier, ticket allocations, and canonical winner records")
- Constitution Principle IX.3–5
- `backend/database/migrations/2026_09_29_000009_create_draw_winners_table.php`

Problem solved:
Preserves broad administrative operational flexibility while mathematically safeguarding the accumulation window of already-drawn canonical winners.

Implementation consequence:
`DrawLifecycleService::update`, `UpdateDrawRequest`, `AdminDrawController`.

Alternatives rejected:
- Generic "read-only after active" freeze (unnecessarily restricts operational extensions).
- Unsupported `ends_at` freeze (violates approved broad operational editing authority).

Owner decision required:
NO

Tasks:
DRAW-2, API-8, TST-15

---

### DEC-008-07: Canonical Winner Ownership External to Feature 008

Status:
REPOSITORY CONSTRAINT

Decision:
Feature 008 does not implement a draw engine and never selects or mints canonical winners; `POST /draws/{id}/complete` records completion and reveals the seed exclusively for an already-existing `draw_winners` row, returning 409 Conflict if no winner exists.

Evidence:
- `backend/database/migrations/2026_09_29_000009_create_draw_winners_table.php`
- Spec US6 AC4
- Repository reality: production canonical-winner ownership is not established by current evidence

Problem solved:
Prevents inventing an unapproved winner-selection engine within an administrative management interface.

Implementation consequence:
`DrawLifecycleService::complete`, `AdminDrawController@complete`.

Alternatives rejected:
- Auto-minting a synthetic winner on completion (violates provable fairness and repository boundaries).

Owner decision required:
NO

Tasks:
DRAW-5, API-8, TST-13

---

### DEC-008-08: Broad Operational Prize Management Without Invented Restriction

Status:
ENGINEERING CONTROL

Decision:
Feature 008 must not invent a winner-based prize deletion restriction.

Evidence:
- Current repository behavior: Prize belongs to draw and draw deletion cascades to prizes (`backend/database/migrations/2026_09_29_000008_create_prizes_table.php` L16). Migration `2026_09_29_000009_create_draw_winners_table.php` contains no `prize_id` column.
- Feature 008 policy: No additional winner-based prize deletion restriction is introduced unless a higher-authority requirement requires one.
- Spec FR-014, US6 AC1 (broad operational editing authority over upcoming and active draws).

Problem solved:
Aligns prize management with verified repository schema and approved operational authority, eliminating an imagined constraint based on a non-existent column.

Implementation consequence:
`PrizeService`, `AdminPrizeController`.

Alternatives rejected:
- Inventing a winner-bound prize deletion lock based on non-existent `draw_winners.prize_id` foreign key.
- Restricting prize edits to unpublished drafts only (contradicts FR-014).

Owner decision required:
NO

Tasks:
DRAW-10, API-9, TST-15

---

### DEC-008-09: Test Database Isolation via `TestDatabaseGuard` in `createApplication()`

Status:
ENGINEERING CONTROL

Decision:
`TestCase::createApplication()` invokes `TestDatabaseGuard::verifyTestDatabaseName()`, immediately throwing a fatal exception if the configured database matches `knzin_db` before PHPUnit test lifecycle or `RefreshDatabase` can execute.

Evidence:
- `backend/phpunit.xml` L25–26 (database overrides commented out)
- `backend/.env` (points to development `knzin_db`)
- 34 test files using `RefreshDatabase`

Problem solved:
Eliminates the critical risk of accidentally wiping the development database during test execution.

Implementation consequence:
`backend/tests/Support/TestDatabaseGuard.php`, `backend/tests/TestCase.php`, `backend/phpunit.xml`.

Alternatives rejected:
- Relying on manual developer configuration (prone to catastrophic human error).
- Placing guard in `setUp()` (executes too late; `createApplication()` boots before test setup).

Owner decision required:
NO

Tasks:
CFG-1, CFG-4, TST-1

---

### DEC-008-10: Preserving Stored Draw Enum and Deriving `active` Status Dynamically

Status:
ENGINEERING CONTROL

Decision:
The stored draw database enum `['upcoming', 'active', 'locked', 'completed']` is preserved without schema modification, while `Draw::computeEffectiveStatus()` dynamically derives `active` when published and in-window (`starts_at <= now < ends_at`) to ensure immediate presentation accuracy without background cron dependency.

Evidence:
- `backend/database/migrations/2026_09_29_000007_create_draws_table.php` L20
- `backend/app/Models/Draw.php` L69–76
- `frontend/src/types/draws.ts` L10

Problem solved:
Maintains backward compatibility with the brownfield schema while providing real-time lifecycle presentation across public countdowns and the admin panel.

Implementation consequence:
`Draw::computeEffectiveStatus`, `DrawResource`, `PublicDrawVisibilityTest`.

Alternatives rejected:
- Removing `active` from the database enum (unjustified schema migration that risks breaking existing data).
- Minutely cron job updating stored status (introduces polling lag and state race conditions).

Owner decision required:
NO

Tasks:
DRAW-9, DRAW-10, DRAW-11, TST-19

---

### DEC-008-11: Unclamped Net Balance Presentation for Co-Prize Reversal UI

Status:
ENGINEERING CONTROL

Decision:
The core balance formula in `AffiliatePayoutService::calculateAvailableBalance()` (`max(0, ...)`) is preserved unchanged, while the Admin UI and `GET /coprizes` API calculate and expose unclamped `net_after_reversal` and `withdrawn_exposure` to provide operators with full visibility into negative financial positions.

Evidence:
- Spec FR-012, US5 AC5
- `backend/app/Services/AffiliatePayoutService.php` L27
- Frozen Feature 006 contract (financial calculations immutable)

Problem solved:
Alerts administrators to overdraft exposures resulting from co-prize revocations without altering the platform-wide balance calculation contract.

Implementation consequence:
`AdminCoPrizeController`, `CoPrizeCard.tsx`, `AffiliateLedgerTable.tsx`.

Alternatives rejected:
- Rewriting `calculateAvailableBalance()` to return negative values platform-wide (violates frozen Feature 006 contract).
- Hiding the shortfall from administrators (creates blindness to unrecovered funds).

Owner decision required:
NO

Tasks:
FIN-10, API-6, FE-9

---

### DEC-008-12: Service-Owned Transactional Audit Logging & Separate Failure Audit

Status:
ENGINEERING CONTROL

Decision:
Every state-changing administrative mutation passes an `AdminAuditContext` into the domain service, which writes an `admin_activity_logs` entry within its own database transaction as the final statement before commit, while failed attempts (403, 409, 422) are logged outside the transaction by the terminating `AuditAdminFailures` middleware.

Evidence:
- Spec FR-018, FR-019, US8
- `specs/008-admin-panel/gate-review.md` GC-5
- Existing domain services owning transactions (`PlatformSettingsService`, `AffiliatePayoutService`)

Problem solved:
Guarantees atomic audit coupling for successful mutations while safely capturing security failures without relying on complex nested transaction wrappers.

Implementation consequence:
`AdminAuditContext`, `AuditRedactor`, `AdminAuditWriter`, `AuditAdminFailures`, `AdminActivityLog` model and migration.

Alternatives rejected:
- Asynchronous audit logging via queue (risks losing audit records during server crash).
- Generic controller wrapper `AdminActionExecutor` (unnecessary abstraction layer; services already own transactions).

Owner decision required:
NO

Tasks:
AUD-1, AUD-2, AUD-3, AUD-4, AUD-5, TST-18

---

### Decision Log Summary
Owner decisions required: 0
Engineering controls: 9
Repository constraints: 1
Inferred decisions: 0
Blocked decisions: 0
