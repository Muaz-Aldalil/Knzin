# Research: Feature 008 — Admin Panel (Phase 0)

**Branch**: `008-admin-panel` (to be cut from `006-affiliate-engine` @ `c0042c5`) | **Date**: 2026-10-03
**Method**: read-only repository investigation. Evidence tags: **E1** runtime · **E2** direct source · **E3** corroborated repo · **E4** historical · **E5** engineering proposal.
**Negative-claim rule**: every "not found" below states its search scope.

---

## 0. Repository Baseline (E1/E2)

| Fact | Evidence |
|---|---|
| Checked-out branch is `006-affiliate-engine` @ `c0042c5`; local `main` = `b23d9fe`; 006's 3 commits are **not** on `main`. | E1 `git branch -vv`, `git log main..006-affiliate-engine` |
| Branch `008-admin-panel` does **not** exist; `specs/008-admin-panel/` is untracked (0 tracked files). | E1 `git ls-files` |
| `.specify/feature.json` → `specs/008-admin-panel`. | E1 |
| No `.specify/extensions.yml` → no before/after-plan hooks. | E1 |
| Stack: Laravel 11 / PHP 8.4.21, Sanctum, MySQL/MariaDB (`DB_DATABASE=knzin_db`); Next.js 16 + next-intl + Tailwind v4 + Radix + TanStack Query. | E2 `.env`, `composer`, `package.json` |
| `phpunit.xml` has the sqlite lines **commented out** and there is **no** `.env.testing` ⇒ `RefreshDatabase` tests run against the **dev DB `knzin_db`**. | E2 `phpunit.xml`, E1 `Test-Path backend/.env.testing = False` |

> [!CAUTION]
> Test-isolation hazard: running the existing PHPUnit suite as-is wipes the dev database. Plan includes a **supporting task** (T-INFRA-1) creating a dedicated `knzin_test` DB before any new backend test is run. No test was executed during planning.

---

## 1. Spec-vs-Repository Reconciliation (Errata for the `/speckit-analyze` gate)

The approved spec describes several items as **Existing** that the repository does not contain. These are *implementation gaps*, not product changes.

| # | Spec claim | Repository reality | Search scope | Class |
|---|---|---|---|---|
| ER-1 | `draws.is_published`, `server_seed_hash`, `server_seed_encrypted`, `server_seed_revealed` "Existing" (§2.1, §5) | **Absent.** `draws` = `id, tier, execution_type, title_ar/en, status, starts_at, ends_at, broadcast_url, total_eligible_tickets, timestamps`. | grep `is_published\|server_seed` over all `backend/database/migrations/*.php` + `Draw.php`; migration `2026_09_29_000007` read in full | E2 → **New (migration)** |
| ER-2 | `affiliate_payouts.receipt_path` "Existing" (§5) | **Absent** from migration `…000003`, `$fillable`, casts. | grep `receipt` over migrations + `AffiliatePayout.php` | E2 → **New (migration)** |
| ER-3 | Sixth capability `settle_affiliate_payout` treated as existing | **Absent**: no `Gate::define` (only 5 in `AppServiceProvider`), not in `GrantAdminCapabilityCommand::ALLOWED_CAPABILITIES`, not granted by bootstrap. | grep `settle_affiliate_payout` over `backend/`, `frontend/src`, `.specify` → matches only in `specs/008-admin-panel/` | E2 → **New** |
| ER-4 | FR-008 "snapshot active rate" | Snapshot *timing* is already correct (attribution is created inside `OrderService::createOrder`'s transaction) but the **source is `config('knzin.affiliate.commission_rate_bps', 2500)`**, not `PlatformSettingsService`. A changed setting is a no-op today. | `AffiliateAttributionService.php:~129`, `OrderService.php:109-118` | **Confirmed Defect vs approved amendment** |
| ER-5 | "25% displayed" | Hard-coded in: `AffiliateDashboardController.php:131` (`'sales_commission_rate_percent' => 25`), `:211-212` (ledger description text), FE `affiliate/page.tsx:17-18`, `AffiliateDashboardView.tsx:63-64`, `AffiliateLedgerTable.tsx:77`, `messages/ar.json:224`, `messages/en.json:224`. | grep `25%\|rate_percent` over `backend/app`, `frontend/src`, `frontend/messages` | E2 → must become dynamic (amendment: "reflected wherever displayed") |
| ER-6 | US1 "sign in using credentials" | There are **no credentials**: users table has no password; auth = Google OAuth (mock mode **default `true`**) or `/auth/guest` email-only Sanctum token. Plan: Admin Panel reuses this (no parallel auth). | `users` migration, `AuthController`, `GoogleAuthService`, `config/services.php` | E2 |
| ER-7 | Spec cites `[DEC-008-03]` | `DECISIONS.md` ends at **DEC-006**; no DEC-007/008 exist. | grep `DEC-00[78]` over all `*.md` | E2 → documentation task |
| ER-8 | FR-007/US2/§1 list `affiliate.maturation_hours` as Admin-editable; §8 says Maturation Hold is **Frozen — "Admin cannot bypass"**; Feature 006 preserves 24 h. | Internal spec contradiction (**spec drift**). | spec §1, FR-007, §8 | **Already decided by Feature 006 / spec §8** (not a PO question): `maturation_hours` read-only; only `commission_rate_bps` and `payout_min_cents` are editable (gate-review GC-1) |
| ER-9 | Spec lists audit columns without `reason_code`/`ip_hash` | Needed for failure rows & forensics | spec §5 | E5 engineering additions (privacy-minimized) |

---

## 2. Decisions

### R-01 — Admin API placement & auth boundary
- **Decision**: New routes inside the existing `Route::prefix('v1')` group → `/api/v1/admin/*`, middleware `auth:sanctum` → `admin.principal` → `throttle:admin` → per-route `admin.capability:<cap[,cap]>`.
- **Rationale (E2)**: `routes/api.php` has one versioned group; all authenticated routes use `auth:sanctum`; the existing test (`AdminPlatformSettingsAuthorizationTest::…strictly_out_of_band`) asserts `POST /api/admin/bootstrap` ⇒ 404 and stays valid. No bootstrap route is added (FR-020).
- **Alternatives**: separate `routes/admin.php` + new guard — rejected (parallel auth mechanism, forbidden by scope).

### R-02 — `admin.principal` middleware (guest-takeover closure) — **CORRECTED by gate-review GC-2**
> Three coordinated controls are required (grant-time target validation shared with CLI/bootstrap; request-time principal incl. token name `google_auth_token` only; fail-closed on mock mode). The "takeover of any admin email" framing below is narrowed: `/auth/guest` cannot take over Google/verified accounts; the confirmed vulnerabilities are (i) capability grantable to guest-provider accounts and (ii) Google mock impersonation when mock is on.
- **Evidence (E2)**: `POST /auth/guest` issues a Sanctum token for **any active guest user by email with no ownership proof**; `GoogleAuthService::isMockMode()` defaults `true` and the mock callback accepts an arbitrary `mock_email`. A capability granted to a guest-provider account, or any admin email while mock mode is on, is therefore takeover-able.
- **Decision**: `EnsureAdminPrincipal` requires: active user (`status='active'`, `merged_into_user_id IS NULL`), `isVerified()` (Google + `email_verified_at`), ≥ 1 active capability, token age ≤ `knzin.admin.session_max_age_minutes` (default 720, configurable), and — outside `local`/`testing` — `GoogleAuthService::isMockMode() === false` else HTTP 503 `ERR_ADMIN_AUTH_UNSAFE_CONFIG`. `AdminCapabilityService::grant` also refuses non-verified targets.
- **Rationale**: closes a real privilege-escalation path without introducing a second auth system.
- **Alternatives**: password/2FA admin login — rejected (new auth system, out of scope, PO decides auth policy).

### R-03 — Sixth capability and "no seventh capability"
- **Decision**: single constant `App\Support\AdminCapabilities::ALL` (the six). `AppServiceProvider` defines Gates by looping the constant; `GrantAdminCapabilityCommand::ALLOWED_CAPABILITIES` references it; migration adds `CHECK (capability IN (…six…))` to `admin_capabilities` so a seventh cannot be stored.
- **Rationale**: one source of truth; DB-level enforcement of the PO's "exactly six".
- **Alternatives**: leave string literals scattered — rejected (that is exactly how the sixth went missing).

### R-04 — Atomic audit coupling — **REPLACED by gate-review GC-5 (no `AdminActionExecutor`)**
> Final model: Admin Controller → authorization → authoritative service → **service-owned `DB::transaction`** → domain mutation → `admin_activity_logs` insert as the **last** statement → commit. Existing services receive an optional trailing `?AdminAuditContext` (CLI/legacy callers pass null ⇒ no audit row, unchanged behavior); new services require it. The receipt rule is the stage-before-transaction protocol (GC-4): keep the file when the commit outcome is ambiguous, delete it on any definite failure. Steps below that mention an executor are **historical** and superseded.
- **Evidence (E2)**: every domain service (`PlatformSettingsService::set`, `AffiliatePayoutService::*`, `AffiliateCoPrizeService::*`, `ApprovalRegistryService::*`) opens its **own** `DB::transaction`. Laravel nests these as **savepoints** inside an outer transaction; an exception after the inner "commit" rolls back the entire outer unit.
- **Superseded decision (historical, do not implement)**: one small class `App\Services\Admin\AdminActionExecutor::execute(AdminAction $ctx, callable $mutation)`:
  1. open **outer** `DB::transaction`;
  2. `$ctx->lock()` (e.g. `lockForUpdate` on payout/draw/ledger row) so `before_state` is read under lock;
  3. capture `before_state` (explicit allowlist, no model dumps);
  4. run the domain service (nested ⇒ savepoint);
  5. capture `after_state`;
  6. `AdminActivityLog::create(...)` **last**, same connection;
  7. commit. Any throwable (incl. audit insert failure) ⇒ outer rollback ⇒ domain mutation rolled back.
- **External side effects**: the only one is receipt file storage — see GC-4 (stage before the transaction; keep on `AmbiguousCommitException`; delete otherwise; a crash can leave an unreferenced private file — accepted, swept periodically).
- **Idempotency/retry interaction**: state guards under row lock (payout status, ledger idempotency keys, approval versioning) make a duplicate call a deterministic `409 ERR_STATE_CONFLICT`; the duplicate writes a *failure* audit row (out-of-transaction), never a second success row.
- **Alternatives**: model observers writing audit rows — rejected (cannot know actor/capability/justification, and observers fire inside nested saves unpredictably); queue-based audit — rejected (violates "both succeed or both roll back").

### R-05 — Failure-audit path
- **Decision**: terminating middleware `AuditAdminFailures` writes an `outcome ∈ {denied,rejected,conflict,failed}` row **outside** any transaction when an admin-route response is 401/403/409/422/5xx and no success row exists for the request. Write failure is `Log::critical` only (never changes the response). The throttle runs *before* it, bounding unauthenticated flood volume.
- **Rationale**: spec AC "rejected requests logged out-of-transaction"; failures are evidence, not domain truth.

### R-06 — Audit table: append-only, redacted, bounded
- Immutability via model `updating`/`deleting` guards (same pattern as `AffiliateLedgerEntry`, E2) — no triggers, hash chains or Merkle structures (PO: not unless evidence demands). Optional deployment hardening (revoke UPDATE/DELETE on the table from the app DB user) documented, not required.
- Redaction: snapshots built from **per-action allowlists** + `AuditRedactor` defense-in-depth deny-list (`password|token|secret|seed|recipient_details|authorization|receipt_path`).
- Viewer: keyset (`cursorPaginate`) on `id DESC`, `per_page ≤ 50`, indexed filter columns, default window last 30 days.

### R-07 — Draw publication & cryptographic commitment
- **Evidence (E2)**: tickets are **not bound to a draw** (`tickets` has no `draw_id`); eligibility is the half-open window `starts_at <= issued_at < ends_at` computed at read time (`TicketEligibilityTest`, `TicketController`). "Ticket accumulation opens" therefore = `starts_at`.
- **Decision**: seed generation happens **in the publish transaction**, not at draft creation (PO: do not move it needlessly). Publish requires: draw is a draft, `now < starts_at`, `lockForUpdate` on the draw row, seed absent (a missing prize is only a UI warning — not a server rule, GC-7). Steps: `random_bytes(32)` → lowercase hex (64 chars) → `server_seed_hash = hash('sha256', $hex)` → `server_seed_encrypted = Crypt::encryptString($hex)` (Laravel `encrypted` cast, APP_KEY) → `seed_committed_at`, `published_at`, `published_by_user_id`, `is_published = true` — all in one transaction/one UPDATE; any failure rolls back (no half-published draw); the plaintext seed is never logged or returned before the authorized reveal.
- **Immutability**: `Draw::updating` guard throws if `server_seed_hash|server_seed_encrypted|seed_committed_at` dirty when previously non-null; these columns are **not** `$fillable` and are hidden from every serializer; no endpoint accepts them.
- **Time-window protection** (evidence-derived, not arbitrary): after commitment, `starts_at` may not be set earlier than `seed_committed_at` (otherwise tickets issued before the commitment could become eligible).
- **Reveal**: `DrawSeedService::reveal()` only when status `completed` **and** a canonical `draw_winners` row exists; verifies `hash_equals(sha256(decrypted), server_seed_hash)`; writes `server_seed_revealed`, `seed_revealed_at`; one-way.
- **Legacy**: existing/seeded published draws have no commitment ⇒ columns `NULL`; public API shows `seed_commitment: null`. No retroactive fake commitment (would be forged provenance).
- **Alternatives**: seed at draft creation — rejected (unnecessary secret lifetime); seed in separate table — rejected (extra join, no isolation gain since DB access ≈ APP_KEY access).

### R-08 — Private Draft representation
- **Decision**: `draws.is_published BOOLEAN NOT NULL DEFAULT 1`; admin `createDraft` sets `0`; public status enum **unchanged**; `CHECK (is_published = 1 OR status = 'upcoming')`.
- **Why DEFAULT 1 (fail-open at schema level) and why it is acceptable**: DEFAULT 0 would hide every existing draw and require editing ≥ 8 fixtures in completed Features 003/005 tests (`DrawApiTest`, `TicketEligibilityTest`×6, `ActivityApiTest`) plus the seeder. Draws can only be created by the seeder, tests, and the new `DrawLifecycleService::createDraft` (grep `Draw::create` / `Draw::` over `backend/app` = no other writers, E2/E3). A test asserts `createDraft` always yields a private draft. Risk accepted & logged (R-09).
- **Public consumers that MUST gain `->published()`** (E2 grep of `Draw::` in `backend/app`): `DrawController::active`, `::concluded`, `TicketController` (~line 39), `ActivityController` (~line 35). Missing any one leaks a draft or pollutes `firstWhere('tier')`.

### R-09 — Live draw editing: field classification (evidence-based)
See `data-model.md §3`. Restrictions exist only where a downstream dependency was traced:
- `tier` — spec FR-014 ("active draw `tier`") / US6 AC4 ⇒ rejected once `now >= starts_at` or stored status `completed` (spec-required, not an engineering inference; superseded detail: gate-review GC-7.3).
- `server_seed_*`, `seed_committed_at` — cryptographic commitment.
- `total_eligible_tickets` — derived (no writer in app; read by `DrawResource`).
- `draw_winners.winning_ticket_serial|draw_id|prize_id|drawn_at` — canonical evidence (unique constraints + co-prize provider key off them).
- `prizes.valuation_usd_cents|category` — **no winner-based freeze** (removed; `awardCoPrize` receives the valuation as a parameter, no repository coupling). Prize **deletion** is permitted under `manage_platform_settings` operational editing authority (FR-014); `draw_winners` table has no `prize_id` column and no winner-bound restriction exists in schema or spec.
- Everything else (titles, `broadcast_url`, `execution_type`, `starts_at/ends_at` within rule, prize text/images/labels, winner display metadata) is operationally editable per the PO's broad-authority decision.

### R-10 — Commission-rate amendment wiring
- `AffiliateAttributionService::recordAttribution` → `app(PlatformSettingsService::class)->get('affiliate.commission_rate_bps', 2500)` cast `int`. `PlatformSettingsService::get` already falls back to `config('knzin.affiliate.commission_rate_bps')` (env default 2500) ⇒ **baseline remains 2500 with no backfill**.
- `PlatformSettingsService::set` gains a typed-key registry (`affiliate.commission_rate_bps` integer (0-10000 is the domain validity of a percentage, **not** a business cap); `affiliate.payout_min_cents` int ≥ 0); unknown keys keep current pass-through (CLI/bootstrap compatibility). The Admin API additionally allow-lists keys.
- `AffiliateCommissionService::calculateCommission` fallback and `creditSalesCommission` already use `$attribution->commission_rate_bps` (E2) ⇒ fulfillment uses the snapshot; unchanged.
- Dynamic display: dashboard `commission_policy.sales_commission_rate_percent` ← active rate (field kept ⇒ additive/compatible); ledger `sales_commission` description ← **that entry's snapshot** (join `referral_attributions` by `order_id`), never the live rate; unauthenticated affiliate landing uses current rate from settings; FE strings become ICU `{rate}`.
- `referral_attributions.commission_rate_bps DEFAULT 2500` column default is **left as is** (app always supplies a value; changing it adds migration risk for zero benefit).
- Concurrency: a rate change racing an order creation is "either value is valid, whichever commit is visible at attribution insert"; both are snapshotted atomically with the order (E2).

### R-11 — Payout settlement/rejection hardening (extend `AffiliatePayoutService`)
- **Confirmed Defects (E2, `AffiliatePayoutService.php:121-162`)**: `settlePayout` ignores the boolean from `markCompleted()` and then unconditionally flips `payout_debit` to `cleared` — on a **rejected** payout this clears a reversed debit; `rejectPayout` ignores `markRejected()` and then **always** appends a `reversal_credit` — on a **completed** payout this creates money (only the unique idempotency key stops a *second* one). Neither method has authorization; settlement has no receipt.
- **Decision**: refactor in place (signature gains `User $actor`, `string $receiptPath`, `string $receiptSha256`): `lockForUpdate` payout row → require `status ∈ {requested, processing}` else `PayoutStateConflictException` → `Gate settle_affiliate_payout` → anti-self-settlement (`payout.user_id !== actor.id`) → mutate. Update the three existing call sites (`AffiliatePayoutLifecycleTest` L138/L193, `AffiliateAcceptanceScenariosTest` L337).
- **No uniqueness on `admin_reference_number`** (plain index only): uniqueness would be an invented business rule (GC-15); replay of the same reference on the same payout is handled by idempotent-replay semantics (GC-16).
- Admin read paths **never** call `sweepMaturedCommissionsForUser` (a write on GET in the user dashboard); balances are computed with the `matures_at <= now()` scopes so no sweep is needed.

### R-12 — Receipt storage — **ordering/failure semantics CORRECTED by gate-review GC-4**
- New disk `payout-receipts` following the `protected-media` pattern (env-switchable local/S3, `visibility: private`) — financial documents must not share a bucket/ACL with course media.
- Validation: `image` + `mimes:jpg,jpeg,png,webp` + content-sniffed MIME, `max:5120` KB; stored as `receipts/{ULID}.{ext}`; no payout/PII data in the name; `receipt_sha256` stored; served only by `GET /admin/payouts/{n}/receipt` (capability + audit) with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`.
- **Unknown (U-3/U-6)**: GD/Imagick availability for re-encoding and any malware scanner — none exist in the stack; images-only + attachment-only delivery + admin-only audience is the mitigation.

### R-13 — Co-prize operations
- **Evidence (E2)**: `releaseCoPrize` has no capability check (the `$actorId` param is unused) and silently returns the still-`pending` entry when approvals are incomplete; `adjudicateCoPrizeRevocation` checks the capability but does not require the credit to be `available`; `cancelCoPrize` is ungated (system path).
- **Decision** *(see gate-review GC-6 for corrections: removed the "draw-integrity approval requires completed draw" precondition; revocation requires `available` = 006 post-release semantics; post-payout preview + confirmation)*: keep primitives (12 existing test call sites rely on `releaseCoPrize($serial)`); add gated `adjudicateCoPrizeRelease(serial, User $admin)` mirroring the existing `adjudicateCoPrizeRevocation` precedent: capability → call primitive → if result still `pending` throw `CoPrizeApprovalsIncompleteException` carrying `CoPrizeApprovalState` ⇒ `409 ERR_COPRIZE_APPROVALS_INCOMPLETE`. Tighten revocation: require original `status = 'available'` (post-release revocation, per spec). Approval validity stays state/version-based (`ApprovalRecord::isFresh()` has **no time component**, E2) — no expiry invented.
- **Dependency finding (E2/E3)**: `awardCoPrize` has **no production caller** (callers: `SimulateCoPrizeAwardCommand`, tests; grep over `backend/app`, `backend/tests`, `backend/database`). The admin co-prize queue will be empty in production until a draw engine invokes it ⇒ D-2.

### R-14 — Capability management & last-admin safeguard
- New `AdminCapabilityService` (grant/revoke) used by both the new API and the existing CLI commands (single invariant source). Rules: actor holds `manage_admin_capabilities`; no self-grant (existing rule); target must be verified & active; capability ∈ six; revoke of `manage_admin_capabilities` rejected if it would leave **zero** active holders — implemented by `lockForUpdate` over the active `manage_admin_capabilities` rows inside the transaction, then counting (serializes two admins revoking each other).
- Self-revoke of a non-last capability is allowed (de-escalation). Bootstrap grants only 3 capabilities (E2) and self-grant is forbidden ⇒ the first admin can never hold KYC/draw-audit/settle themselves ⇒ operational runbook needs ≥ 2 admin accounts (D-3).
- `User::grantCapability` overwrites the single `(user_id, capability)` row on re-grant ⇒ grant/revoke **history lives in the audit log** (documented).

### R-15 — Promotional awards
- New table/model/service only. No writes to `draw_winners`, `affiliate_ledger_entries`, `tickets`. Recipient must be an `active`, non-merged user (minimal evidence-based eligibility; no taxonomy invented). Append-only in v1 is an **engineering proposal (E5), not a locked/PO-approved rule** (D-4; gate-review GC-9).

### R-16 — User directory & audit viewer boundaries
- Directory: read-only; exact/prefix lookups only (`email` prefix uses `idx_users_email`; `learner_code` unique index; UUID PK); min 3 chars; ≤ 25 rows; exposes `id,email,display_name,auth_provider,is_verified,status,learner_code,orders_count,active capabilities,created_at` — never provider ids, tokens, recipient details.
- No generic user edit endpoint exists.

### R-17 — Frontend integration
- **Evidence (E2)**: `[locale]/layout.tsx` wraps every page in `HeaderHUD`/`ActivityTicker`/`Footer`/`FloatingWhatsAppButton` + `max-w-7xl` main; auth = token in `localStorage` read by `apiClient`; `apiClient` hard-codes `Content-Type: application/json` (breaks multipart); tests are `node:test` source/dictionary invariants (no DOM/Playwright installed).
- **Decision**: (a) new client `SiteFrame` that suppresses site chrome and the `max-w-7xl` wrapper when the path is `/[locale]/admin/*` (1 modified file + 1 new, vs. moving ~11 route directories into a route group); (b) `apiClient` skips the JSON content-type for `FormData`; (c) `admin` message namespace with ar/en parity test; (d) capability-aware nav driven by `GET /admin/me` (UI hint only); (e) tests = existing `node:test` convention + pure helper modules + scripted browser verification (no new test framework dependency).

### R-18 — Test infrastructure
- Add `knzin_test` DB via `phpunit.xml` env with `force="true"` **and** a runtime guard in `tests/TestCase::createApplication()` (NOT `setUp()` - `RefreshDatabase` boots inside `parent::setUp()`) aborting unless the DB name ends with `_test` (gate-review GC-10; T-INFRA-1, task #1). Concurrency is proven with **deterministic interleaving** (second DB connection holding a row lock) plus state-guard sequencing — PHP on Windows has no `pcntl` for true parallelism. Atomicity is proven by binding a throwing `AdminAuditWriter` and asserting zero domain change.
