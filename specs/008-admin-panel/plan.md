# Implementation Plan: Feature 008 — Admin Panel

**Branch**: `008-admin-panel` (to be cut from `006-affiliate-engine` @ `c0042c5`) | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)
**Input**: `specs/008-admin-panel/spec.md` (Updated 2026-10-03 "Post-Grill Reconciliation & Gate Ratification", 466 lines) + Product Owner planning directive of 2026-10-03.
**Artifacts**: [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/admin-api.md](./contracts/admin-api.md) · [contracts/public-api-delta.md](./contracts/public-api-delta.md) · [quickstart.md](./quickstart.md) · **[evidence-index.md](./evidence-index.md)** (git baseline, SHA-pinned permalinks, evidence table, file inventory)

## Summary

Feature 008 adds a capability-gated Admin Panel on the existing Laravel 11 + Next.js 16 stack. It is a **transport/UI layer over existing domain services** (payouts, co-prize, approvals, platform settings), extended where repository evidence shows a gap, plus **new** domains that do not exist yet (draw lifecycle/commitment, promotional awards, audit log, capability management API, user directory).
Technical approach (reuse → extend → refactor → new): one atomic-audit executor wrapping existing services' nested transactions; one `admin.principal` middleware closing a verified guest-takeover path; an additive migration set; the Feature 006 commission-rate amendment wired from `PlatformSettingsService` into the order-time snapshot; a Next.js `/[locale]/admin` area with capability-aware navigation under the existing i18n/RTL system.

## Technical Context

**Language/Version**: PHP 8.4.21 / Laravel 11 (Sanctum); TypeScript / Next.js 16.3 (App Router), React 19
**Primary Dependencies**: Laravel Sanctum, next-intl 4, TanStack Query 5, Radix UI, Tailwind v4, zod 4, lucide-react — **no new runtime dependency planned**
**Storage**: MySQL/MariaDB InnoDB `utf8mb4_unicode_ci` (CHECK constraints already relied upon); private file disk for receipts
**Testing**: PHPUnit (Feature/Unit) on a **dedicated `knzin_test` DB**; frontend `node --test` + `tsx` (source/dictionary/pure-function invariants); scripted browser verification
**Target Platform**: Web (Desktop ≥1280, Tablet 768–1024, Mobile 375–430), Arabic RTL primary + English LTR
**Project Type**: web application (backend + frontend)
**Performance Goals**: admin lists O(page) with indexed predicates; audit viewer keyset-paginated; no unbounded query
**Constraints**: append-only ledger; integer cents; six capabilities only; no second auth/ledger; public API non-breaking
**Scale/Scope**: low-volume operator tool (≈ tens of admins); data growth dominated by audit log and ledger — **Unknown (U-5)**: production volumes
**NEEDS CLARIFICATION**: none blocking; engineering unknowns classified in §2 and PO confirmations in §19.

## Constitution Check

*GATE evaluated before Phase 0 and re-evaluated after Phase 1 design.*

| Principle | Result | Note |
|---|---|---|
| I Evidence-first / brownfield | **PASS** | every claim tagged; 9 spec-vs-repo errata surfaced instead of assumed |
| II Full-stack ownership | **PASS** | plan covers FE→API→service→DB→tests |
| IV No-guessing / owner policy | **PASS** | 5 genuine PO confirmations (D-1…D-5), each with a safe implemented default |
| V Arabic-first RTL/LTR, responsive, a11y | **PASS (planned)** | logical CSS, `<bdi>`, ≥44px, parity test, 3-viewport pass |
| VII Server-authoritative finance | **PASS** | no client authority; ledger append-only; no balance column |
| VIII Payment/DB integrity | **PASS** | reversible additive migrations, FKs, named indexes, idempotent state guards |
| IX Provably fair draws | **PASS** | commit-before-window, secret encrypted, reveal verified |
| X Server-enforced authz / receipt before zeroing | **PASS** | closes receipt + capability gaps in `AffiliatePayoutService` |
| XI SDD lifecycle | **PASS** | this plan → tasks → **analyze gate (spec errata first)** → implement → converge |
| XII Simplicity | **PASS w/ justification** | small new abstractions only (`AdminCapabilities`, `AdminAuditContext`, `AdminAuditWriter`, `TestDatabaseGuard`) — see Complexity Tracking; **no executor/wrapper** (GC-5) |

Post-design re-check: no violation introduced; Complexity Tracking lists the only deliberate additions.

---

# PLANNING REPORT

## 1. Planning Status

| Item | Value |
|---|---|
| Status | **READY** (for implementation *review*; implementation not started). **Final gate applied — see [`gate-review.md`](gate-review.md) (normative; wins on any conflict with this file)** |
| Repo baseline (E1) | HEAD `006-affiliate-engine` @ `c0042c5`; local `main` @ `b23d9fe` **does not contain Feature 006**; `008-admin-panel` branch not yet created; `specs/008-admin-panel/` untracked; working tree otherwise clean except `Project report/*` untracked |
| Branch plan | Cut `008-admin-panel` from `006-affiliate-engine` tip (008 depends on 006 code). 006 must merge to `main` first **or** 008 merges stacked after it |
| Spec reviewed | `spec.md` Updated 2026-10-03 (466 lines) + `checklists/requirements.md` |
| Preconditions before `/speckit-tasks` | (a) spec errata ER-1…ER-9 (incl. maturation drift) **already applied** to `spec.md`/`requirements.md`; (b) tasks obey `gate-review.md` GC-1…GC-16; (c) **no PO answers are required** — D-1…D-5 were reclassified (gate-review GC-9) |
| Not executed | no tests were run (test DB hazard, §2); no code/migration/config modified |

## 2. Evidence Baseline

### 2.1 Existing and verified (E2/E3 unless noted)
| Area | Finding |
|---|---|
| Authorization | `User::hasCapability()` (DB lookup per call → immediate revocation); 5 Gates in `AppServiceProvider`; `AdminCapability` table with unique `(user_id,capability)`; bootstrap CLI grants 3; grant CLI forbids self-grant; **revoke CLI has no last-admin guard** |
| Settings | `PlatformSettingsService::get/set` (Gate `manage_platform_settings`, nested-safe `DB::transaction`, no key allow-list, no audit) |
| Commission | Attribution created in `OrderService::createOrder` transaction ✔ timing; **source is `config()` ✘** (ER-4); fulfilment uses `$attribution->commission_rate_bps` ✔; ledger model enforces immutability of financial fields ✔ (status is the only mutable field) |
| Payouts | `requestPayout` (user lock, threshold snapshot, negative `payout_debit`); `settlePayout`/`rejectPayout` **ungated, state-unsafe, no receipt** (R-11 Confirmed Defect, source-verified) |
| Co-prize | `awardCoPrize`, `releaseCoPrize` (no capability, silent no-op), `cancelCoPrize`, `adjudicateCoPrizeRevocation` (capability ✔, no `available` precondition); approval validity is state-based (`isFresh()` no time component) |
| Approvals | `ApprovalRegistryService` enforces capability per type + `permitWrite` barrier + atomic versioning |
| Draws | schema lacks publication/seed columns (ER-1); tickets have no `draw_id`; eligibility is time-window; **no code writes draw status** (seeder/tests only); `awardCoPrize` has no production caller (R-13) |
| Storage | `protected-media` disk pattern (env-switchable S3, private) |
| Auth | Google OAuth (mock default **true**) + email-only guest tokens; Sanctum expiry 43,200 min; no admin routes/UI exist |
| Frontend | single `[locale]/layout.tsx` with site chrome; `apiClient` JSON-only; localStorage token; `node:test` conventions; ar/en parity tests |
| Governance | Constitution v3.2.0; `DECISIONS.md` ends at DEC-006 (ER-7) |

### 2.2 Proposed (E5) vs Unknown
| Class | Item |
|---|---|
| Proposed | `AdminAuditContext` (service-owned audit transaction, GC-5), `admin.principal`, `payout-receipts` disk, `TestDatabaseGuard`, `reason_code`/`ip_hash`, optional `SHA2` CHECK (no MTCN uniqueness — GC-4/GC-15) |
| Unknown U-1 | whether production already contains real draws (backfill assumes none are private) |
| Unknown U-2 | exact DB engine/version in production (CHECK enforcement, `SHA2` in CHECK) — existing migrations already depend on CHECK |
| Unknown U-3 | GD/Imagick availability for receipt re-encode |
| Unknown U-4 | which component will create `draw_winners`/call `awardCoPrize` in production |
| Unknown U-5 | production data volumes (audit, ledger, users) |
| Unknown U-6 | malware scanning availability (none in stack) |

## 3. Architecture & Domain Ownership

| Operation | Business source of truth | Admin transport (F008) | Authorization | Persistence | Audit |
|---|---|---|---|---|---|
| Settings / commission rate | `PlatformSettingsService` → `platform_settings` | `AdminSettingsController` | `manage_platform_settings` | `platform_settings` | `settings.updated` |
| Attribution snapshot | `AffiliateAttributionService` | none (server-side at order) | n/a | `referral_attributions.commission_rate_bps` | n/a (immutable by design) |
| Affiliate overview | `AffiliateLedgerEntry` projections via `AffiliatePayoutService` | `AdminAffiliateController` (read-only) | any-of settings/settle | `affiliate_ledger_entries` (no writes) | none (reads) |
| Payout settle/reject | `AffiliatePayoutService` | `AdminPayoutController` + `ReceiptStorageService` | `settle_affiliate_payout` | `affiliate_payouts`, `affiliate_ledger_entries` | `payout.*` |
| Co-prize release/revoke | `AffiliateCoPrizeService` + `ApprovalRegistryService` | `AdminCoPrizeController` | `adjudicate_affiliate_coprize` | ledger (status flip / compensating entry) | `coprize.*` |
| KYC / draw-integrity approvals | `ApprovalRegistryService` | `AdminApprovalController` | `issue_kyc_approval` / `issue_draw_audit_approval` | `approval_records` | `approval.*` |
| Draw lifecycle, seed, prizes | **New** `DrawLifecycleService`, `DrawSeedService` | `AdminDrawController`, `AdminPrizeController`, `AdminDrawWinnerController` | `manage_platform_settings` | `draws`, `prizes`, `draw_winners` (metadata only) | `draw.*`,`prize.*`,`winner.*` |
| Promotional awards | **New** `PromotionalAwardService` | `AdminPromotionalAwardController` | `manage_platform_settings` | `promotional_awards` | `award.granted` |
| Capability grant/revoke | **New** `AdminCapabilityService` (wraps `User::grant/revokeCapability`) | `AdminCapabilityController` (+ CLI delegates) | `manage_admin_capabilities` | `admin_capabilities` | `capability.*` |
| User directory | `users` | `AdminUserController` (read-only) | `manage_admin_capabilities` | `users` | none |
| Audit | evidence, not domain truth | `AdminAuditLogController` (read-only) | `manage_admin_capabilities` | `admin_activity_logs` | n/a |

**Feature 008 owns**: transport, authorization composition, audit coupling, and the new draw/award/capability domains. It **does not** own balances, ledger, approvals, or tickets — those remain with their services. Financial truth = ledger; approval truth = `approval_records`; draw truth = draws/tickets/winners.

## 4. Authorization Plan

Exactly six capabilities, defined once in `App\Support\AdminCapabilities::ALL`; Gates generated from it; DB `CHECK` forbids a seventh; **no inheritance, no super-admin bypass** (no code path ORs capabilities except the explicit read-only any-of below).

| Operation | Capability | Enforcement layers |
|---|---|---|
| Read settings; update `commission_rate_bps`, `payout_min_cents` | `manage_platform_settings` | route middleware + `PlatformSettingsService` Gate |
| Draw create/edit/publish/transition/prizes/winner metadata | `manage_platform_settings` | route middleware + service Gate (`DrawLifecycleService`) |
| Promotional awards | `manage_platform_settings` | same |
| Affiliate overview/ledger/payout **read** | any-of `manage_platform_settings`, `settle_affiliate_payout` | route middleware (`admin.capability:a,b`); payout `recipient_details` only for `settle_affiliate_payout` |
| Payout settle / reject / receipt view | `settle_affiliate_payout` | route + `AffiliatePayoutService` Gate + anti-self-settlement |
| Co-prize release / revoke | `adjudicate_affiliate_coprize` | route + service (`adjudicateCoPrizeRelease/Revocation`) |
| KYC approval issue/revoke/supersede | `issue_kyc_approval` | route + `ApprovalRegistryService` |
| Draw-integrity approval issue/revoke/supersede | `issue_draw_audit_approval` | route + `ApprovalRegistryService` |
| User directory, capability grant/revoke, audit viewer | `manage_admin_capabilities` | route + `AdminCapabilityService` |

Principal rules (`admin.principal`): active, non-merged, verified Google account; ≥1 active capability; admin-token max age; non-local requires mock-auth off. Revocation is immediate (per-request DB check). **UI hiding is cosmetic; every route is enforced server-side**, proven by the route-coverage test (SC-001).

## 5. Backend / API Plan

- **Endpoints**: full list in [`contracts/admin-api.md`](./contracts/admin-api.md) (**30 routes** under `/api/v1/admin`, gate-review GC-8; each justified FR → capability → operation → service → source of truth, no generic-CRUD routes) + additive public draw fields ([`public-api-delta.md`](./contracts/public-api-delta.md)).
- **Controllers** are thin: FormRequest → authorization (route middleware + service Gate) → build `AdminAuditContext` → authoritative domain service (owns its `DB::transaction`, writes the `admin_activity_logs` row as its last statement) → resource. **No generic controller transaction wrapper / executor** (GC-5). Validation lives in `AdminFormRequest` subclasses whose `failedValidation` returns JSend 422 (existing controllers hand-roll JSend; Laravel's default JSON validation shape would break the FE `apiClient`).
- **Exception mapping** (single place, `bootstrap/app.php` renders): `AuthorizationException`/`AccessDeniedHttpException` → 403 `ERR_FORBIDDEN` (generic body); `AdminStateConflictException`, `LastAdminLockoutException`, `CoPrizeApprovalsIncompleteException` → 409; `ProtectedFieldException` → 422; unchanged existing 401/404/429 handlers.
- **Domain extensions** (extend, don't duplicate): `PlatformSettingsService` (typed-key validation); `AffiliateAttributionService` (read settings); `AffiliatePayoutService` (state guard + Gate + receipt + self-settlement; add `calculateLifetimeEarned`); `AffiliateCoPrizeService`(+Interface) (`adjudicateCoPrizeRelease`, revoke precondition); `AffiliateDashboardController` (dynamic rate/snapshot description); CLI grant/revoke delegate to `AdminCapabilityService` (messages preserved so `AdminPlatformSettingsAuthorizationTest` keeps passing).
- **Throttle**: `RateLimiter::for('admin')` 120/min per user-id|IP, applied before failure auditing.
- **Read endpoints perform zero writes** (no maturation sweep).

## 6. Database Plan

Authoritative detail: [`data-model.md`](./data-model.md). Summary:

| Migration | Table | Change | Deployment/rollback |
|---|---|---|---|
| M1 | `draws` | +`is_published` (default 1), `published_at/by`, seed hash/encrypted/committed/revealed/revealed_at; 4 CHECKs; `idx_draws_published_status_tier` | expand-only; down drops; **point of no return = first publish** |
| M2 | `affiliate_payouts` | +`receipt_path`, `receipt_sha256` (plain index on `admin_reference_number`, **no uniqueness**) | additive; down drops |
| M3 | `admin_activity_logs` | new, 5 indexes, append-only model | down drops |
| M4 | `promotional_awards` | new, FKs `restrictOnDelete`, indexes | down drops |
| M5 | `admin_capabilities` | `CHECK capability IN (six)` | pre-flight ⊆ five; down drops constraint |
| M6 | `affiliate_ledger_entries` | optional index for co-prize queue **only if EXPLAIN justifies** | additive |

No change to ledger data, attributions, tickets, approvals, or `platform_settings` rows. Existing relational/financial constraints are untouched (none weakened).

## 7. Financial Safety Plan

| Concern | Plan | Evidence |
|---|---|---|
| Commission snapshot | `recordAttribution` reads `PlatformSettingsService` (baseline 2500 via config fallback); persisted in `referral_attributions.commission_rate_bps`; fulfilment already uses snapshot; **no recalculation path exists or is added** | E2 |
| Rate change forward-only | test: change rate → old attribution/ledger byte-identical; new order = new rate; change *between* create and fulfil uses snapshot | E5 test |
| Ledger immutability | no admin write route touches `affiliate_ledger_entries` except through services that append or flip `status` (existing behavior); model guards unchanged | E2 |
| Payout settle | receipt validated+staged+hashed **before** the tx (GC-4) → service tx: payout row `lockForUpdate` → verify state (`requested` and `processing` preserved per `AffiliatePayout.php` L99) → Gate → anti-self-settlement → `markCompleted()` **result verified** (returns false if invalid state ⇒ abort tx with 409) → update exactly entry `payout_debit_{n}` (`available`→`cleared`), **affected rows === 1** → audit insert → commit; any failure rolls back, invalid transitions have zero financial side effects (GC-16) | R-11 |
| Payout reject | same guards (`requested` and `processing` preserved per `AffiliatePayout.php` L120) → `markRejected()` **result verified** (returns false if invalid state ⇒ abort tx with 409) → `reversal_credit` (idempotency key `payout_reversal_{n}`) → audit; rejected→reject = idempotent replay, completed→reject = 409 (GC-16) | E2+R-11 |
| Threshold | unchanged: live threshold governs new requests; `threshold_cents_at_request` immutable on existing | E2 (`requestPayout`) |
| Co-prize | release requires both current-valid approvals (state-based); winner 100% (`winner_deduction_cents: 0` in metadata); funding `marketing_pool`; revocation = compensating `reversal_debit` only when credit `available` | E2 |
| Idempotency | ledger `idempotency_key` uniqueness (existing) + status state machines; duplicates → 409 + failure audit | E2 |
| Concurrency | `lockForUpdate` on payout/ledger/draw/capability rows inside the owning service's single transaction; lock-ordering: audit insert is always last | R-04/R-14 |
| Promotional awards | no ledger writes (asserted) | R-15 |
| Post-payout revocation | existing semantics may drive projected balance below zero (display floor 0 via existing `max(0,…)`) — **D-5** | E2 |

## 8. Draw Plan

- **Draft → Publish**: `createDraft` ⇒ `is_published=0,status=upcoming`. `publish` ⇒ single transaction under `lockForUpdate`: guards (`now < starts_at`, not already committed; a missing prize is a UI warning only, not a server rule — GC-7) → `random_bytes(32)`→hex → `sha256` → encrypt → persist + provenance + `is_published=1` in **one** statement. A failure at any step rolls back, so no half-published draw can exist; plaintext seed is never logged or returned before the authorized reveal (GC-7.5). Commitment is thus public (`/draws/active.seed_commitment`) **before** the eligibility window `[starts_at, ends_at)` can admit any ticket (evidence: R-07).
- **Status machine**: stored status is forward-only. **Public effective status** is derived without persisting: `completed`→`completed`; `now >= ends_at`→`locked`; published ∧ `starts_at <= now < ends_at`→`active` (extension of `Draw::computeEffectiveStatus()`, verified non-breaking across 6 consumers — GC-7.1). `POST /draws/{id}/complete` **requires an already-existing canonical `draw_winners` row** (else `409 ERR_CANONICAL_RESULT_MISSING`); the Admin Panel never selects, invents or inserts a winner, and reveals the seed in the same tx (hash-verified) (GC-7.4).
- **Live editing** (gate-review GC-7.2/7.3 + data-model §3 win): `starts_at`/`ends_at` are Admin-editable in any state (no `ends_at` freeze). Only retained schedule checks: `ends_at > starts_at`; for a committed seed `starts_at >= seed_committed_at` (the constitutional "commit before accumulation" invariant kept under edits); read-only only while a `draw_winners` row exists (FR-014 canonical winner/ticket allocation + Constitution IX steps 3-4). `tier` rejected once `now >= starts_at` or stored status `completed` (spec FR-014/US6 AC4). Display fields and prize fields (incl. valuation, no winner freeze) editable while stored status is not `completed`; after `completed` only US6 AC5 metadata. Seed fields, derived counters and canonical winner evidence are never editable.
- **Admin cannot rewrite**: no endpoint accepts seed/ticket/winner-identity fields; model guard blocks even accidental writes; no ticket-minting route.
- **Public**: drafts hidden in all four consumers; additive `seed_commitment` / `seed_verification`; minimal FE display of hash/verification.
- **Dependency**: RNG execution/winner creation is outside F008 (spec §7); F008 exposes `reveal` + `complete` against a `draw_winners` row created elsewhere (**U-4/D-2**).

## 9. Promotional Award Plan

`promotional_awards` is a separate append-only table (M4). `PromotionalAwardService::grant` validates an active non-merged recipient and optional existing draw, writes one row + audit in the service-owned tx. It has **no dependency** on `DrawWinner`, `Ticket`, `AffiliateLedgerEntry`, or RNG code; tests assert canonical winner, ticket rows and ledger counts unchanged (SC-009). Taxonomy/eligibility beyond the spec's fields is **not** invented. Correction/void is not in the spec ⇒ **D-4**.

## 10. Audit Plan

- **Atomic (GC-5)**: controller → authorization → authoritative service → **service-owned `DB::transaction`** → domain mutation → `AdminAuditWriter` insert **last** (via `AdminAuditContext`) → commit. Invariant: protected mutation succeeds + mandatory audit succeeds = commit; otherwise rollback. Receipt file handling per GC-4 (`AmbiguousCommitException` keeps the file; any other exception deletes it).
- **Failure path**: terminating `AuditAdminFailures` (R-05), out-of-tx, never alters the response, throttled upstream.
- **Properties**: server-generated (`request_id`, `ip_hash`, actor from token, never from body), append-only model guards, per-action allow-listed snapshots + `AuditRedactor` deny-list, no hash chain/Merkle.
- **Viewer**: `manage_admin_capabilities`; filters actor/action/target/outcome/date; keyset pagination; `per_page ≤ 50`; default 30-day window; read-only.
- **Reads**: only receipt downloads are audited among reads (sensitive document); directory lookups are not (documented residual risk, throttled).

## 11. Admin User & Capability Plan

`AdminCapabilityService`: grant (actor holds `manage_admin_capabilities`; **no self-grant**; target active+verified; capability ∈ six), revoke (reason required; **last-admin lockout** via `lockForUpdate` over active `manage_admin_capabilities` rows then count), both inside the executor. Immediate effect (no cache). CLI commands delegate to the service (single invariant source; existing output strings preserved). **User Directory** is read-only (exact/prefix lookups, ≥3 chars, ≤25/page); no user mutation endpoint exists. Operational note: bootstrap grants 3 capabilities and self-grant is forbidden ⇒ ≥2 admin accounts are required to staff KYC/draw-audit/settle roles (**D-3**).

## 12. Frontend Plan

- **Routes** (`src/app/[locale]/admin/**`): `/admin` (capability launchpad), `settings`, `affiliates`(+`[userId]`), `payouts`(+`[payoutNumber]`), `coprizes`, `approvals`, `draws`(+`new`,`[id]`), `awards`, `users`(+`[id]`), `audit`.
- **Layout**: `SiteFrame` client wrapper hides site chrome on `/admin`; `AdminShell` (sidebar → bottom sheet on mobile) with `AdminGuard` calling `GET /admin/me` (401 → sign-in, 403 → forbidden page). Nav built by pure `buildAdminNav(capabilities)`; **display only**.
- **Auth**: existing `useAuth` + `apiClient` (Bearer); `apiClient` extended to skip JSON content-type for `FormData`. No parallel auth.
- **Components**: reuse `ui/dialog`, `ui/button`, `ui/badge`, `ui/tabs`, `ui/card`, `ui/dropdown-menu`; new `AdminDataTable` (table ≥ md → card list on mobile), `ConfirmDialog` / `ReasonDialog` (typed confirmation for rate change, payout settle/reject, co-prize release/revoke, draw publish/complete, capability revoke), `MoneyText`, `StatusBadge`.
- **i18n/RTL/a11y**: new `admin` namespace in `ar.json`/`en.json` (parity test); logical CSS only; `<bdi>` for emails/IDs/MTCN/amounts; ≥44 px targets; focus management in dialogs; loading/empty/error states per view; success/failure toasts via mutation state.
- **Existing-screen amendments**: dynamic commission rate in `affiliate/page.tsx` metadata copy, `AffiliateDashboardView`, `AffiliateLedgerTable`, `messages` (`{rate}` ICU); minimal seed-commitment display in `DrawCard`/`ConcludedDrawsList`.

## 13. Testing Plan

All new backend tests under `backend/tests/Feature/Admin/` unless noted; DB = `knzin_test`.

| Risk area | Tests (ID → file) | Key assertions |
|---|---|---|
| Authorization | **AZ** `AdminAuthorizationMatrixTest`; **PR** `AdminPrincipalGuardTest`; **RC** `AdminRoutesCapabilityCoverageTest` | each of 6 capabilities isolated: allowed on own routes, 403 on every other; no-capability 403; guest-provider/unverified/merged/deactivated 403; mock-mode non-local 503; stale token (> max age) 401/403; all protected admin routes have `admin.principal`; routes requiring a specific capability have `admin.capability:<cap>`; `GET /me` is the sole intentional exception to `admin.capability` as `admin.principal` requires ≥ 1 active approved capability; no `bootstrap` URI |
| Capabilities | **CA** `AdminCapabilityManagementTest` | grant/revoke; self-grant 403; immediate effect; revoked admin loses next request; last-admin 409; **two-admin mutual-revoke never yields zero holders** (second-connection lock test); DB CHECK rejects 7th; CLI parity preserved |
| Commission | **ST** `AdminSettingsAndCommissionSnapshotTest` (+ modify `AffiliateCommissionFulfillmentTest` if it asserts config) | default 2500; change→new attribution snapshots new rate; prior attribution/ledger unchanged; change between create & fulfil uses snapshot; `maturation_hours`/`co_prize_rate_bps` writes rejected; out-of-range 422; `0` honored; dashboard/ledger reflect rate, ledger row shows *its* snapshot |
| Payout | **PO** `AdminPayoutSettlementTest`; **PC** `AdminPayoutConcurrencyTest`; update `AffiliatePayoutLifecycleTest` | threshold eligibility + snapshot immutability; MTCN required; receipt required/type/size; private disk (not public, not in audit/API); settle success path; reject path; **reject-after-complete / settle-after-reject = 409 & zero ledger delta** (defect regression); duplicate settle/reject; self-settlement 403; reused MTCN 422; interleaving test proves row-lock serialization; recipient_details hidden from non-settle admins |
| Co-prize | **CP** `AdminCoPrizeAdjudicationTest` | missing KYC / missing draw-integrity / revoked / superseded ⇒ 409 & `pending`; both current-valid ⇒ `available`; winner 100%; 40% marketing_pool; release idempotent; revoke only when `available`; compensating `reversal_debit`; original credit row untouched |
| Approvals | **AP** `AdminApprovalsTest` | per-type capability; cross-type 403 on issue and revoke; on `POST /approvals/{id}/revoke`: resolves approval record, determines type (`kyc` vs `draw_integrity`), requires corresponding capability (`issue_kyc_approval` vs `issue_draw_audit_approval`), rejects other capability with 403 `ERR_FORBIDDEN`, calls `ApprovalRegistryService::revokeApproval`; new approval supersedes prior active version |
| Draw | **DL** `AdminDrawLifecycleTest`; **SC** `AdminDrawSeedCommitmentTest`; **DE** `AdminDrawEditingBoundariesTest`; **PV** `PublicDrawVisibilityTest` | draft private in all 4 consumers; public statuses unchanged; publish creates 64-hex hash, ciphertext never serialized, commit before `starts_at`; republish 409; seed fields immutable (model guard + endpoint 422); past-`starts_at` publish refused; active-draw operational edits succeed; tier/starts_at/protected fields enforced; winner identity & won-prize valuation immutable; complete requires winner and reveals verified seed; no un-publish |
| Promo awards | **PA** `AdminPromotionalAwardTest` | row + provenance; `draw_winners`/`tickets`/ledger counts unchanged; inactive/merged recipient 422 |
| Audit | **AA** `AdminAuditAtomicityTest`; **FA** `AdminFailureAuditTest`; **AV** `AdminAuditViewerTest`; Unit `AuditRedactorTest` | each mutating action writes exactly 1 success row in same tx; throwing writer ⇒ zero domain change (settings, payout, coprize, draw publish, capability) and receipt file removed; 401/403/409/422 produce failure rows; redaction of sensitive keys; model update/delete throws; viewer 403 for others; keyset + filters + cap on `per_page` |
| Affiliate read | **AR** `AdminAffiliateReadTest` | FR-003 admin overview is read-only: no maturation sweep/write on GET, balances equal ledger projections, pagination cap |
| Existing regression | full suite | 006/005/003 stay green (only the explicitly listed fixtures change) |
| Frontend | `AdminI18nParity`, `AdminNavigationCapability` (pure fn), `AdminRtlInvariants` (no physical-direction utilities in `components/admin`), `AdminConfirmationInvariants` (destructive actions wired to Confirm/Reason dialogs), `AdminClientUntrust` (no auth decision from client state), `AffiliateRateDisplay` (dynamic rate in affiliate screens), `PublicDrawSeedCommitment` (commitment hash rendered, raw seed unrendered, revealed verification rendered, absent data backward compatible) + scripted browser matrix (quickstart §3) | RTL/LTR, 1280/768/390, a11y, loading/empty/error, mutation feedback |

Performance checks: `EXPLAIN` on affiliate list, co-prize queue, audit filters, user search at synthetic volume; assert no unbounded query (`per_page` cap tests).

## 14. Migration / Deployment Plan

1. **Pre-flight (read-only)**: dup `admin_reference_number`; `admin_capabilities.capability` ⊆ five; count existing draws (U-1); confirm DB engine/version (U-2); `APP_KEY` stable & backed up (seed ciphertext depends on it); prod `GOOGLE_AUTH_MOCK=false`.
2. **Deploy order**: M1–M5 (expand-only) → backend (Gate for sixth capability, services, routes dark behind no UI) → run `knzin:grant-admin-capability …` for operators → frontend.
3. **Backfill**: none rewrites history; existing draws become `is_published=1` by column default; seed columns NULL (legacy, documented).
4. **Rollback**: safe `migrate:rollback` until the **first draw is published**; afterwards forward-fix only (rolling back M1 would destroy public commitments). M2–M5 rollback always safe (data loss limited to new fields/tables).
5. **Production concerns**: private `payout-receipts` bucket + IAM; `X-Request-Id` passthrough at the proxy; `throttle:admin`; optional DB-grant hardening (no UPDATE/DELETE on `admin_activity_logs`); runbook: ≥2 admin accounts; shorten `SANCTUM_EXPIRATION` optional; no queue/Redis dependency introduced.

## 15. File Change Inventory

**Totals: CREATE: 147 | MODIFY: 43 | DELETE: 0 | TOTAL: 190**

*(Only paths backed by evidence of need; `✱` = optional/contingent.)*

**Backend — new (63 code + 28 tests/support = 91)**
- Support (1): `backend/app/Support/AdminCapabilities.php`
- Exceptions (7): `backend/app/Exceptions/{AdminStateConflictException,ProtectedFieldException,LastAdminLockoutException,CoPrizeApprovalsIncompleteException,PayoutStateConflictException,AmbiguousCommitException,ImmutableAuditException}.php`
- Requests (18): `backend/app/Http/Requests/Admin/{AdminFormRequest,UpdateSettingsRequest,SettlePayoutRequest,RejectPayoutRequest,RevokeCoPrizeRequest,IssueKycApprovalRequest,IssueDrawIntegrityApprovalRequest,RevokeApprovalRequest,StoreDrawRequest,UpdateDrawRequest,StorePrizeRequest,UpdatePrizeRequest,UpdateWinnerMetadataRequest,StoreAwardRequest,ListUsersRequest,GrantCapabilityRequest,RevokeCapabilityRequest,ListAuditLogsRequest}.php`
- Services & VOs (9): `backend/app/Services/Admin/{AdminAuditContext,AdminAuditWriter,AuditRedactor,AdminCapabilityService,DrawLifecycleService,DrawSeedService,PrizeService,PromotionalAwardService,ReceiptStorageService}.php`
- Middleware (4): `backend/app/Http/Middleware/{EnsureAdminPrincipal,EnsureAdminCapability,AssignAdminRequestId,AuditAdminFailures}.php`
- Models (2): `backend/app/Models/{AdminActivityLog,PromotionalAward}.php`
- Controllers (13): `backend/app/Http/Controllers/Admin/{AdminSessionController,AdminSettingsController,AdminAffiliateController,AdminPayoutController,AdminCoPrizeController,AdminApprovalController,AdminDrawController,AdminPrizeController,AdminDrawWinnerController,AdminPromotionalAwardController,AdminUserController,AdminCapabilityController,AdminAuditLogController}.php`
- Resources (4): `backend/app/Http/Resources/Admin/{AdminDrawResource,AdminPayoutResource,AdminAuditLogResource,AdminUserResource}.php`
- Migrations (5): `backend/database/migrations/2026_10_03_00000{1..5}_*.php`
- Test Support & Tests (28): `backend/tests/Support/TestDatabaseGuard.php`; Unit `backend/tests/Unit/{TestDatabaseGuardTest,AuditRedactorTest,DrawSeedServiceTest}.php`; Feature `backend/tests/Feature/{TestDatabaseSmokeTest,PublicDrawVisibilityTest,DrawEffectiveStatusTest}.php`; Feature/Admin × 21 `backend/tests/Feature/Admin/{AdminAuthorizationMatrixTest,AdminRoutesCapabilityCoverageTest,AdminPrincipalGuardTest,AdminCapabilityManagementTest,AdminSettingsAndCommissionSnapshotTest,AdminPayoutSettlementTest,AdminPayoutStateTransitionTest,AdminPayoutConcurrencyTest,AdminReceiptStagingTest,AdminCoPrizeAdjudicationTest,AdminApprovalsTest,AdminDrawLifecycleTest,AdminDrawSeedCommitmentTest,AdminDrawEditingBoundariesTest,AdminPromotionalAwardTest,AdminUserDirectoryTest,AdminAuditCoverageTest,AdminAuditAtomicityTest,AdminFailureAuditTest,AdminAuditViewerTest,AdminAffiliateReadTest}.php`

**Frontend — new (49 code + 7 tests = 56)**
- Layout, Nav, Lib, Types (4): `frontend/src/components/layout/SiteFrame.tsx`, `frontend/src/types/admin.ts`, `frontend/src/lib/admin/nav.ts`, `frontend/src/lib/admin/format.ts`
- Pages (13): `frontend/src/app/[locale]/admin/{layout,page}.tsx` + `{settings,affiliates,payouts,coprizes,approvals,draws,draws/new,draws/[id],awards,users,audit}/page.tsx`
- Hooks (10): `frontend/src/hooks/admin/{useAdminSession,useAdminSettings,useAdminAffiliates,useAdminPayouts,useAdminCoPrizes,useAdminApprovals,useAdminDraws,useAdminAwards,useAdminUsers,useAdminAuditLogs}.ts`
- Components (22): `frontend/src/components/admin/{AdminShell,AdminNav,AdminGuard,AdminDataTable,AdminPagination,ConfirmDialog,ReasonDialog,StatusBadge,MoneyText,SettingsForm,PayoutSettleDialog,PayoutRejectDialog,CoPrizeCard,ApprovalForm,DrawForm,DrawLifecyclePanel,PrizeEditor,WinnerMetadataForm,AwardForm,CapabilityManager,UserDirectoryTable,AuditLogTable}.tsx`
- Tests (7): `frontend/src/tests/{AdminI18nParity,AdminNavigationCapability,AdminRtlInvariants,AdminConfirmationInvariants,AdminClientUntrust,AffiliateRateDisplay,PublicDrawSeedCommitment}.test.ts`

**Total CREATE: 91 + 56 = 147**

**Backend — modified (30)**
`backend/routes/api.php` · `backend/bootstrap/app.php` · `backend/app/Providers/AppServiceProvider.php` · `backend/app/Models/Draw.php` · `backend/app/Models/AffiliatePayout.php` · `backend/app/Services/PlatformSettingsService.php` · `backend/app/Services/AffiliateAttributionService.php` · `backend/app/Services/AffiliatePayoutService.php` · `backend/app/Services/AffiliateCoPrizeService.php` · `backend/app/Services/AffiliateCoPrizeServiceInterface.php` · `backend/app/Services/ApprovalRegistryService.php` · `backend/app/Http/Controllers/DrawController.php` · `backend/app/Http/Controllers/TicketController.php` · `backend/app/Http/Controllers/ActivityController.php` · `backend/app/Http/Controllers/AffiliateDashboardController.php` · `backend/app/Http/Resources/DrawResource.php` · `backend/app/Http/Resources/DrawWinnerResource.php` · `backend/app/Console/Commands/GrantAdminCapabilityCommand.php` · `backend/app/Console/Commands/RevokeAdminCapabilityCommand.php` · `backend/app/Console/Commands/BootstrapAdminCommand.php` · `backend/config/knzin.php` · `backend/config/filesystems.php` · `backend/phpunit.xml` · `backend/.env.example` · `backend/tests/TestCase.php` · `backend/tests/Feature/AffiliatePayoutLifecycleTest.php` · `backend/tests/Feature/AffiliateAcceptanceScenariosTest.php` · `backend/tests/Feature/DrawApiTest.php` · `backend/tests/Feature/AffiliateDashboardContractTest.php` · `backend/tests/Feature/AdminPlatformSettingsAuthorizationTest.php`

**Frontend — modified (13)**
`frontend/src/app/[locale]/layout.tsx` · `frontend/src/lib/api-client.ts` · `frontend/messages/ar.json` · `frontend/messages/en.json` · `frontend/src/app/[locale]/affiliate/page.tsx` · `frontend/src/components/affiliate/AffiliateDashboardView.tsx` · `frontend/src/components/affiliate/AffiliateLedgerTable.tsx` · `frontend/src/hooks/useAffiliateDashboard.ts` · `frontend/src/types/draws.ts` · `frontend/src/hooks/useDraws.ts` · `frontend/src/components/draws/DrawCard.tsx` · `frontend/src/components/draws/HeroGrandPrizeCountdown.tsx` · `frontend/src/components/draws/ConcludedDrawsList.tsx`

**Total MODIFY: 30 + 13 = 43**

**Total DELETE: 0**
**Total Files: 147 CREATE + 43 MODIFY + 0 DELETE = 190**

**Documentation**: `DECISIONS.md` — **not edited by this plan**; the proposed DEC-007… entries live in [`proposed-decisions.md`](proposed-decisions.md) (PROPOSED — not recorded until the project governance process records them) · `specs/008-admin-panel/spec.md` (errata ER-1…ER-9, applied via spec amendment **before tasks**) · `specs/006-affiliate-engine/spec.md` (note recording the approved commission-rate amendment) · `specs/008-admin-panel/tasks.md` (next command)

## 16. Dependency Graph

```text
CFG-1 → TST-1..TST-4 (TASK #1 gate)  knzin_test DB + TestDatabaseGuard in TestCase::createApplication + phpunit.xml override + connection verification — only THEN any RefreshDatabase test is run
    ↓
M1..M5 migrations ─────────────────────────────────────────────┐
    ↓                                                           │
Foundation: AdminCapabilities + Gates(6) + CHECK ; exception    │
renders ; admin.principal/.capability/request-id ; throttle ;   │
AdminAuditWriter + AdminAuditContext + failure middleware       │
    ↓                                                           │
Domain extensions (parallelizable after Foundation):            │
  3a commission wiring + dynamic display   3b payout hardening + receipts
  3c co-prize gated wrappers               3d capability service + CLI delegation
  3e draw lifecycle/seed/prize/winner + public-visibility filters
  3f promotional awards                                         │
    ↓                                                           │
Admin API controllers/requests/routes per domain  ◀─────────────┘
    ↓                          (backend tests land with each slice)
Frontend foundation (SiteFrame, apiClient FormData, admin shell/guard/nav, i18n ns)
    ↓
Frontend screens per domain (settings → payouts → coprize/approvals → draws → awards → users/capabilities → audit)
    ↓
Cross-layer verification (quickstart S1–S23, browser matrix) → /speckit-analyze → implement → /speckit-converge
```
**Blockers**: 006 merge/branch strategy; test DB; MariaDB running; spec errata + PO confirmations before `/speckit-tasks`. **Real dependency discovered**: audit foundation must precede *every* mutating endpoint; payout hardening (3b) must precede payout UI; public-visibility filters (3e) must land **with** M1 (or drafts could leak).

## 17. Risks & Mitigations

| # | Risk (real) | Evidence | Mitigation |
|---|---|---|---|
| R-1 | Running PHPUnit wipes dev DB | no `.env.testing`, sqlite lines commented | T-INFRA-1 first; CI guard asserts `DB_DATABASE` ends `_test` |
| R-2 | Guest/mock-auth takeover of admin accounts | `/auth/guest`, mock default true | `admin.principal`, grant refuses unverified, non-local mock = 503 |
| R-3 | Money creation via reject-after-complete | `rejectPayout` ignores `markRejected()` | state guard under lock + regression test |
| R-4 | FR-008 silently not implemented | config-sourced rate | wiring + test S3/S4 |
| R-5 | Draft leaks via one missed public consumer | 4 consumers found | `published()` in all four + `PublicDrawVisibilityTest` |
| R-6 | Audit coupling regressions (nested tx) | services own transactions | `AdminAuditAtomicityTest` (throwing writer ⇒ rollback) + `AdminAuditCoverageTest` per mutating route |
| R-7 | APP_KEY loss/rotation makes sealed seeds unrecoverable | `encrypted` storage | backup runbook; reveal verified; documented |
| R-8 | `DEFAULT 1` lets a future code path create a public uncommitted draw | R-08 | single creator (`createDraft`), test, noted in DEC |
| R-9 | Last-admin race | two admins revoke each other | row-lock count + interleaving test |
| R-10 | Admin co-prize queue empty in production | no `awardCoPrize` caller | D-2 (scope/roadmap) |
| R-11 | Orphan receipt file on crash between store and tx | R-04 | staged-file design (GC-4): file staged before tx, kept on ambiguous commit, deleted on definite failure; a completed payout without receipt reference cannot be committed; orphan sweep noted |
| R-12 | Token in `localStorage` for a privileged UI | existing pattern | max admin session age + CSP review note; no auth redesign (out of scope) |
| R-13 | 006 branch unmerged → 008 base instability | git state | stack on 006 or merge 006 first |
| R-14 | Existing 006 test edits perceived as scope creep | signature change | limited to 2 call sites, justified by Constitution X |

## 18. Requirement Traceability

`Requirement → Domain op → Service → Endpoint → DB → Authz → Audit → Tests`

| FR | Domain op | Service (E/N) | Endpoint | DB | Authz | Audit | Tests |
|---|---|---|---|---|---|---|---|
| FR-001 | authenticated admin session | `EnsureAdminPrincipal` (N) | all `/admin/*`, `GET /me` | — | principal+≥1 cap | failure rows | AZ, PR, RC |
| FR-002 | server-side capability check | `AdminCapabilities` + Gates (E/N) | all | M5 | six caps | failure rows | AZ, RC |
| FR-003 | affiliate overview (projection) | `AffiliatePayoutService` (E) | `GET /affiliates*` | none | any-of | — | AZ, `AdminAffiliateReadTest`† |
| FR-004 | read-only ledger | model scopes (E) | `GET …/ledger` | none (no write route) | any-of | — | RC (no mutation routes) |
| FR-005 | settle payout (MTCN+receipt) | `AffiliatePayoutService`(R) + `ReceiptStorageService`(N) | `POST /payouts/{n}/settle` | M2, `payout-receipts` disk | `settle_affiliate_payout` | `payout.settled` | PO, PC, AA |
| FR-006 | reject payout | `AffiliatePayoutService`(R) | `POST …/reject` | ledger append | same | `payout.rejected` | PO, PC |
| FR-007 | update settings | `PlatformSettingsService`(E) | `PATCH /settings` | `platform_settings` | `manage_platform_settings` | `settings.updated` | ST, AA |
| FR-008 | snapshot active rate | `AffiliateAttributionService`(E) | (order flow) | `referral_attributions` | n/a | n/a | ST, RD |
| FR-009 | KYC approvals | `ApprovalRegistryService`(E use) | `POST /approvals/kyc…` | `approval_records` | `issue_kyc_approval` | `approval.*` | AP |
| FR-010 | draw-integrity approvals | same | `POST /approvals/draw-integrity…` | same | `issue_draw_audit_approval` | `approval.*` | AP |
| FR-011 | co-prize release | `AffiliateCoPrizeService`(E) | `POST /coprizes/{s}/release` | ledger status | `adjudicate_affiliate_coprize` | `coprize.released` | CP |
| FR-012 | co-prize revocation | same | `POST …/revoke` | ledger append | same | `coprize.revoked` | CP |
| FR-013 | draw lifecycle + commitment | `DrawLifecycleService`/`DrawSeedService`(N) | `POST /draws`, `/publish`, `/complete` | M1 | `manage_platform_settings` | `draw.*` | DL, SC, PV |
| FR-014 | live operational editing | `DrawLifecycleService`/`PrizeService`(N) | `PATCH /draws/{id}`, prizes, winner | `draws`,`prizes`,`draw_winners` | same | `draw.updated` etc. | DE |
| FR-015 | promotional awards | `PromotionalAwardService`(N) | `POST /awards` | M4 | same | `award.granted` | PA |
| FR-016 | user directory | controller query (N) | `GET /users*` | `users` | `manage_admin_capabilities` | — | UD |
| FR-017 | capability grant/revoke | `AdminCapabilityService`(N) | `POST/DELETE …/capabilities` | `admin_capabilities` | same | `capability.*` | CA |
| FR-018 | atomic audit | `AdminAuditWriter`+`AdminAuditContext`(N), each owning service's tx | all mutations | M3 | — | itself | AA, FA |
| FR-019 | audit viewer + redaction | `AdminAuditLogController`, `AuditRedactor`(N) | `GET /audit-logs*` | M3 | `manage_admin_capabilities` | — | AV, AuditRedactorTest |
| FR-020 | no HTTP bootstrap | — | none | — | — | — | RC (no `bootstrap` URI), existing 404 test |
| FR-021 | integer cents, no balance column | existing | all | none added | — | — | PO, CP (`_cents` ints), schema assertion |
| FR-022 | bilingual UI | FE | all screens | — | — | — | FE parity/RTL tests + browser matrix |

†`AdminAffiliateReadTest` (read-only, no write/sweep, balances equal projections) is added to the §15 test list. Success criteria SC-001…SC-012 map as: SC-001 RC/AZ · SC-002 AA · SC-003 ST · SC-004/005 PO · SC-006 CP · SC-007 PV · SC-008 SC · SC-009 PA · SC-010 CA · SC-011 AdminAffiliateReadTest · SC-012 browser matrix.

## 19. Decision Points

Only genuine Product-Owner/governance items. **Each already has a conservative default implemented in this plan; none blocks starting implementation.**

| ID | Decision | Evidence | Recommendation (default planned) | Trade-off | Downstream |
|---|---|---|---|---|---|
| ~~D-1~~ | **WITHDRAWN as a PO question** — *already decided* by Feature 006 / spec §8 (24 h maturation frozen). Spec lines that list it as editable are **spec drift** (errata ER-8). Admin edits only `commission_rate_bps` and `payout_min_cents` (gate-review GC-1) | ER-8 | n/a | n/a | spec errata |
| **D-2** *(reclassified: repository evidence / dependency DP-2, not a PO decision — gate-review GC-7)* | Who owns RNG execution, `draw_winners` creation and the `awardCoPrize` call in production? No current feature does (roadmap: 007 payments, 009 notifications) | `awardCoPrize` callers = simulate command + tests | Name an owning feature/spec before launch; F008 ships `complete`/`reveal`/co-prize queue against externally created rows | Co-prize/Hall-of-Fame flows are inert in production until owned | Launch readiness, not F008 build |
| **D-3** *(reclassified: operational/security consequence of existing no-self-grant governance — runbook only)* | Initial staffing: bootstrap grants 3 capabilities and self-grant is forbidden ⇒ KYC/draw-audit/settle roles need a second admin | R-14 | Keep as-is (separation of duties); runbook requires ≥2 admins | One-person ops impossible | Operations runbook |
| **D-4** *(reclassified: **engineering proposal E5, NOT locked**; PO input only if a void is wanted)* | May a promotional award be corrected/voided? Not specified | R-15 | v1 **append-only**; add a `voided_at/void_reason` annotation later if needed | Wrong award can't be removed in v1 | Possible follow-up migration |
| **D-5** *(reclassified: repository/financial edge case; 006 semantics preserved; preview + confirmation — gate-review GC-6; escalate only if a different policy is wanted)* | Post-payout co-prize revocation can push projected balance negative (existing 006 behavior); is clawback/debt the intended policy? | `adjudicateCoPrizeRevocation` appends debit regardless of prior payout | Keep existing semantics, display negative "owed" clearly in Admin; confirm policy | Possible negative affiliate position | Finance policy, payout UI wording |

Informational (no decision needed): commission-rate validation is type/domain validity only (integer; 0–10000 bps is the domain of a percentage, **not** a business cap) plus a typed old→new confirmation; any narrower cap would be a PO call and none is imposed.

## 20. Plan Adversarial Review

| Check | Verdict | Basis |
|---|---|---|
| **Authority** — seventh capability? | ✅ No; DB `CHECK` makes it impossible; any-of reads only combine existing capabilities | §4, M5 |
| **Feature 006** — fixed 25% restored? | ✅ No; rate from settings, baseline only as fallback; 25% literals removed (ER-5) | R-10 |
| **Financial integrity** — rewrite balances/history? | ✅ No write route to ledger; reject/settle defects fixed and regression-tested | R-11 |
| **Draw integrity** — rewrite commitment/tickets/winner? | ✅ No endpoint, model guard, no create/delete for winners, no ticket route | R-07/R-09 |
| **Audit** — mutation without audit? | ✅ executor is the only mutation entry; CI route-coverage + per-action atomicity tests. *Residual*: CLI commands (out-of-band, trusted) are not audited to `admin_activity_logs` — documented; CLI is Feature 006 behavior | §10 |
| **Brownfield** — duplicated a service? | ✅ extends 6 services; new services only for domains with no existing implementation (searched `Draw*Service`, `*Award*`, `*Audit*` over `backend/app` ⇒ none) | §3 |
| **API** — public break? | ✅ additive only; one value-source change keeps type | public-api-delta |
| **Security** — frontend-only decisions? | ✅ none; `GET /me` is a hint; all routes server-enforced | §4 |
| **Privacy** — leaks? | ✅ `recipient_details` capability-scoped; receipts private/attachment/audited; audit allow-listed + redacted; seed never serialized; directory exposes minimal fields. *Residual*: directory reads unaudited (throttled) | R-12/R-16 |
| **Concurrency** — duplicate/concurrent admin requests? | ✅ row locks + state machines + idempotency keys + last-admin lock; proven by interleaving tests. *Limit*: no true parallel test runner on Windows | R-18 |
| **UX** — destructive actions confirmed? | ✅ typed Confirm/Reason dialogs enumerated; lint-style invariant test | §12 |
| **Performance** — unbounded queries? | ✅ `per_page ≤ 50`, keyset logs, indexed filters, min-length search, EXPLAIN task. *Unknown U-5 volumes* | §6 |
| **Maintainability** — speculative abstractions? | ✅ two additions, both tied to observed defects (scattered capability strings; nested-tx audit coupling) | Complexity Tracking |
| **Completeness** — every requirement has tasks+tests? | ✅ §18 covers FR-001…022 and SC-001…012; **action**: `/speckit-tasks` must create tasks for the §15 inventory and `/speckit-analyze` must verify | §18 |
| **Self-challenge: weakest points** | ⚠️ (1) `DEFAULT 1` fail-open schema default (accepted, R-8); (2) refactoring 006 payout signatures touches protected-feature tests (limited, Constitution X justifies); (3) draw-completion value depends on a not-yet-owned engine (D-2); (4) public `seed_commitment` display is a small UI addition beyond the literal spec text (needed by "publicly available") | — |

## 21. Final Planning Verdict

**READY FOR IMPLEMENTATION REVIEW** — and, after the final gate (`gate-review.md`): **READY FOR /speckit-tasks**.

*Conditions carried with the verdict (not blockers):* spec errata ER-1…ER-9 applied first; tasks obey `gate-review.md` GC-1…GC-16 (T-INFRA-1 with runtime test-DB guard is task #1); production enablement of the Admin Panel depends on real Google OAuth with mock mode off (DP-1); run `/speckit-analyze` as the mandatory gate before any code change.

> **Superseded statements in this file** (see `gate-review.md`): §8/§5 `POST /draws/{id}/status` → `POST /draws/{id}/complete` (GC-7); R-11/R-12 receipt ordering → stage-before-transaction (GC-4); R-2 mitigation → three-control remediation incl. token-name check (GC-2); anti-self-settlement is an approved-spec requirement, not an independent PO decision (GC-9).

---

## Project Structure

### Documentation (this feature)
```text
specs/008-admin-panel/
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── admin-api.md
│   └── public-api-delta.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (NOT created here)
```

### Source Code (repository root)
```text
backend/
├── app/
│   ├── Support/AdminCapabilities.php
│   ├── Http/{Middleware,Controllers/Admin,Requests/Admin,Resources/Admin}/
│   ├── Services/Admin/                # executor, audit writer/redactor, capability, draw, seed, prize, award, receipt
│   ├── Services/…(extended)           # PlatformSettings, AffiliateAttribution/Payout/CoPrize
│   ├── Models/{AdminActivityLog,PromotionalAward}.php
│   └── Exceptions/
├── database/migrations/2026_10_03_00000N_*.php
└── tests/{Feature/Admin,Feature,Unit}/

frontend/
├── src/app/[locale]/admin/**
├── src/components/{admin,layout/SiteFrame.tsx}
├── src/hooks/admin/ · src/lib/admin/ · src/types/admin.ts
├── messages/{ar,en}.json              # + admin namespace
└── src/tests/Admin*.test.ts
```
**Structure Decision**: existing web-application layout (Laravel `backend/`, Next.js `frontend/`); no new top-level projects.

## Complexity Tracking

| Addition | Why needed | Simpler alternative rejected because |
|---|---|---|
| `AdminAuditContext` + `AdminAuditWriter` (data object + one insert helper; **no executor**) | Services each own a transaction; the audit row must be written inside that same transaction as its last statement (GC-5) | Model observers can't know actor/capability/justification; queued audit violates "both or neither"; a generic executor/controller wrapper nests transactions and hides ownership |
| `TestDatabaseGuard` | `RefreshDatabase` wipes whatever DB is configured; no `.env.testing`/phpunit override exists today | Relying on convention reproduces the risk of tests → `knzin_db` |
| `AdminCapabilities` constant | The sixth capability was missing because strings were scattered across Gates/CLI/bootstrap | Leaving literals reproduces the defect; a config-driven registry is more than needed |
| `AdminCapabilityService` | Last-admin lock + verified-target + self-grant must be one invariant for both API and CLI | Duplicating rules in controller and CLI diverges (CLI already lacks last-admin guard) |
| `DrawLifecycleService`/`DrawSeedService`/`PrizeService`/`PromotionalAwardService`/`ReceiptStorageService` | Domains with **no** existing implementation (searched `backend/app`) | Putting logic in controllers would make the Admin panel a second business-logic implementation |
