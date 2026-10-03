# Feature 008 — Evidence & Repository Reference Index (plan appendix)

> **Final gate addendum — see [gate-review.md](./gate-review.md) (LOCAL ONLY — NO REMOTE PERMALINK AVAILABLE).** Additional E1/E2 evidence at `c0042c5`: `phpunit.xml` (no DB override, SQLite lines commented) · `backend/.env` (`DB_DATABASE=knzin_db`, `APP_ENV=local`, `GOOGLE_AUTH_MOCK=true`) · 34 test files use `RefreshDatabase` · `Draw::computeEffectiveStatus`/`DrawResource`/`TicketController` (window-derived status; tickets not draw-bound) · no writer of `draw_winners` in `backend/app` · `AuthController::guest`, `GoogleAuthService`, Grant/Bootstrap commands (no target validation) · spec L153/L173/L193. Where this index and gate-review disagree, gate-review wins.

> **Planning artifact only.** Companion to [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/). No application code, migration, test or config was modified. Git was used read-only (`status`, `rev-parse`, `remote`, `branch`, `ls-files`, `grep`, `ls-remote`, `diff --stat`). No commit / reset / checkout / stash / clean / fetch was run.

---

## 0. Repository Baseline (actual command output, captured 2026-10-03 ~07:48 +02:00)

| Item | Value | Source |
|---|---|---|
| Repository | `Muaz-Aldalil/Knzin` (workspace `d:\Work Projects\Knzin Project`) | `git remote -v` |
| Remote (fetch/push) | `origin  https://github.com/Muaz-Aldalil/Knzin.git` — only remote | `git remote -v` |
| Current branch | `006-affiliate-engine` (**no upstream tracking configured**: `fatal: no upstream configured`) | `git branch --show-current`, `rev-parse @{u}` |
| HEAD SHA | `c0042c52741a4943fef3442af9b9ad7a5b098d56` — "feat(affiliate): complete Feature 006 remediation, maturation sweep, and account merge continuity" | `git rev-parse HEAD` |
| **Remote verification of HEAD (E1)** | `git ls-remote origin refs/heads/006-affiliate-engine` → `c0042c52741a4943fef3442af9b9ad7a5b098d56` ⇒ **HEAD is on the remote; permalinks are valid** | `git ls-remote` |
| Local `main` | `b23d9febf1d1fa4a26173d7ad306e2cbfac1b461` (docs(governance): Section 32…) — local, **15 commits ahead of its tracking ref** | `git rev-parse main`, `branch -vv` |
| `merge-base main HEAD` | `b23d9febf1d1fa4a26173d7ad306e2cbfac1b461` ⇒ HEAD = `main` + 3 Feature-006 commits (`a134580`, `3e1ef2f`, `c0042c5`) | `git merge-base` |
| **Remote `main` (E1)** | `git ls-remote origin refs/heads/main` → `2e84e656a988d661c423abd517af71a0498a6734` (Feature 004 tip). **Remote `main` contains neither Feature 005 nor 006.** | `git ls-remote` |
| Remote `005-learner-hub` | `0a7693a96ad910cede639de33033383407880ca2` (≠ local 005 tip `b23d9fe`); all 005 code needed by 008 is an **ancestor of the pushed 006 tip**, therefore reachable via the pinned SHA | `git ls-remote` |
| Feature 006 baseline planned against | branch `origin/006-affiliate-engine` @ `c0042c5…` (pushed, unmerged) | above |
| Feature 008 branch | **does not exist yet** (`008-admin-panel` absent from `git branch -a`); plan = cut from `c0042c5` | `git branch -a -vv` |
| Working tree (`git status --short`) | `?? "Project report/KNZiN_Feature_006_Status_Report_AR.{html,md,pdf}"`, `?? "Project report/OpenCode_Prompt_Feature_006_Status_AR_PDF.md"`, `?? "Project report/generate_arabic_pdf_006.py"`, `?? specs/008-admin-panel/` — **no tracked file modified** (`git diff --stat HEAD -- backend frontend DECISIONS.md AGENTS.md .specify` empty) | `git status`, `git diff --stat` |
| Feature 008 spec files | **UNTRACKED** — `git ls-files specs/008-admin-panel` → 0 files | `git ls-files` |
| `AGENTS.md`, `DECISIONS.md`, `.specify/memory/constitution.md` | tracked, unmodified ⇒ identical to `c0042c5` | `git ls-files` |
| `backend/.env` | **git-ignored** (`backend/.gitignore:8:.env`) — never linked; only key *presence* inspected | `git check-ignore -v` |

**Link base (B)** used throughout: `https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/`

> **Caveats stated honestly:** (1) Remote `main` is *behind* local `main`, so "a link on `main`" would be wrong; every link below is **pinned to the SHA**, never a branch. (2) Line numbers are *definition-start anchors* captured with grep at `c0042c5`; ranges are given only where both ends were directly observed. Single-line anchors (`#Lnn`) mark the line of the symbol/statement. Where a range end was not observed, no range is claimed. (3) Frontend/PHP files that I did not line-pin in this pass are linked at file level and flagged `pin in tasks`.

---

## 1. LOCAL ONLY — NO REMOTE PERMALINK AVAILABLE

| Path | Git state | Relevant lines | Reason no permalink |
|---|---|---|---|
| `specs/008-admin-panel/spec.md` | `?? specs/008-admin-panel/` (untracked) | FR-001…FR-022 at L362–L383; user stories L95–L335; §8 locked 006 rules L448; §7 scope L419–L447 | untracked, never committed/pushed |
| `specs/008-admin-panel/checklists/requirements.md` | untracked | — | same |
| `specs/008-admin-panel/plan.md` | untracked | §1–§21 (this plan) | same |
| `specs/008-admin-panel/research.md` | untracked | errata ER-1…ER-9, R-01…R-18 | same |
| `specs/008-admin-panel/data-model.md` | untracked | M1–M6, field classification §3 | same |
| `specs/008-admin-panel/contracts/admin-api.md`, `contracts/public-api-delta.md` | untracked | — | same |
| `specs/008-admin-panel/quickstart.md` | untracked | S1–S23 | same |
| `specs/008-admin-panel/evidence-index.md` | untracked | this file | same |
| `backend/.env` | ignored (`!!`) | `DB_DATABASE`, `GOOGLE_AUTH_MOCK`, `APP_ENV` keys present | gitignored, contains secrets; values deliberately not read into this document |
| `Project report/*` | untracked, unrelated to 008 | — | out of scope, not referenced |

**Consequence for review:** the spec under review is only reviewable from the local working tree until it is committed. *Recommendation (E5):* commit the 008 planning artifacts on the new `008-admin-panel` branch before handing to a second engineer; I have not done so (Git Safety §13).

---

## 2. Evidence Table

Levels: **E1** runtime/command · **E2** direct source · **E3** corroborated repository · **E4** historical · **E5** agent proposal.

| # | Claim / Decision | Evidence | Lvl | Exact file | Lines | Repository link | Why it matters |
|---|---|---|---|---|---|---|---|
| 1 | Only **5** Gates exist; the sixth (`settle_affiliate_payout`) is absent | 5 `Gate::define` calls; `git grep -l settle_affiliate_payout` over 163 tracked files in `backend/{app,routes,database,config,tests}` = **0** | E2+E1 | `backend/app/Providers/AppServiceProvider.php` | L37, L41, L45, L49, L53 | [AppServiceProvider.php#L37-L53](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Providers/AppServiceProvider.php#L37-L53) | ER-3: sixth capability must be introduced as part of the *approved six*, not a seventh |
| 2 | Capability check is a per-call DB lookup ⇒ revocation is immediate | `hasCapability()` queries `adminCapabilities()->active()->where(...)->exists()` | E2 | `backend/app/Models/User.php` | L173 (relation), L181 (method), L192 (`grantCapability`), L227 (`revokeCapability`) | [User.php#L173-L192](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/User.php#L173-L192) | Satisfies "immediate effectiveness" without a cache layer |
| 3 | "Verified user" = Google provider + verified e-mail | `isVerified()` body checks `email_verified_at` and `auth_provider === 'google'` | E2 | `backend/app/Models/User.php` | L135 | [User.php#L135](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/User.php#L135) | Basis for `admin.principal` and "refuse grant to unverified" |
| 4 | **Guest tokens can be minted for any e-mail** (including a capability holder's) | `/auth/guest` creates/reuses a user and issues a Sanctum token; guarded only when user is Google/verified (L34) | E2 | `backend/app/Http/Controllers/AuthController.php` + `routes/api.php` | `guest` L21, guard L34, create L46, token L51; route L25 | [AuthController.php#L21-L51](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/AuthController.php#L21-L51) · [api.php#L25](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L25) | Security finding R-2 → `admin.principal` is **required**, not optional |
| 5 | Mock Google login exists (`mock_email`) | `googleRedirect` reads `mock_email` | E2 | `AuthController.php` | L71–L74, callback L81 | [AuthController.php#L71-L81](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/AuthController.php#L71-L81) | Non-local mock must yield 503 for admin routes |
| 6 | Token lifetime is 43,200 min (30 days) | `'expiration' => env('SANCTUM_EXPIRATION', 43200)` | E2 | `backend/config/sanctum.php` | L53 | [sanctum.php#L53](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/config/sanctum.php#L53) | Justifies admin-specific max token age (E5 mitigation) |
| 7 | **Payout settle/reject have no capability gate, no state guard, no receipt** | `settlePayout` L121 calls `markCompleted` L127 and ignores result; clears debit L131. `rejectPayout` L141 calls `markRejected` L147 and ignores result; appends `reversal_credit` L153 key L157. No `Gate`/`hasCapability` in file (grep over the file = 0) | E2 | `backend/app/Services/AffiliatePayoutService.php` | L121–L157 | [AffiliatePayoutService.php#L121-L157](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliatePayoutService.php#L121-L157) | **Confirmed defect**: reject-after-complete can mint a `reversal_credit` |
| 8 | The model transition methods *do* return `false` on illegal transitions (caller ignores it) | `markCompleted()` L97 guard L99; `markRejected()` L118 guard L120; both return bool | E2 | `backend/app/Models/AffiliatePayout.php` | L97–L124 | [AffiliatePayout.php#L97-L124](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/AffiliatePayout.php#L97-L124) | Fix = honor return value under row lock; no new state machine needed |
| 9 | Request path: user row lock, threshold snapshot, negative `payout_debit` | `lockForUpdate` L57; settings read L64; `threshold_cents_at_request` L96; `payout_debit` L107, key L111 | E2 | `AffiliatePayoutService.php` | L49–L111 | [AffiliatePayoutService.php#L49-L111](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliatePayoutService.php#L49-L111) | Existing model preserved; no second balance/ledger |
| 10 | Threshold snapshot column exists (immutable per request) | `threshold_cents_at_request` unsigned bigint | E2 | `backend/database/migrations/2026_10_02_000003_create_affiliate_payouts_table.php` | L15–L34 (col L20, CHECK L34) | […000003…#L15-L34](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000003_create_affiliate_payouts_table.php#L15-L34) | Satisfies threshold rule with no migration |
| 11 | **No receipt storage exists** | `git grep -l receipt_path` = 0 in 163 files; payouts table has `admin_reference_number` (L25), `admin_notes` (L26), `processed_by_admin_id` (L27) but no receipt col | E3 | same migration | L15–L34 | (same as #10) | M2 is justified |
| 12 | Commission-rate **snapshot column exists**, default 2500 | `commission_rate_bps` unsigned int default 2500 | E2 | `…2026_10_02_000004_create_referral_attributions_table.php` | L22 (col), L33 (anti-self-referral CHECK) | […000004…#L22](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000004_create_referral_attributions_table.php#L22) | No schema change for FR-008 |
| 13 | **Defect vs amendment:** snapshot is written from `config()`, not `PlatformSettingsService` | `'commission_rate_bps' => config('knzin.affiliate.commission_rate_bps', 2500)` | E2 | `backend/app/Services/AffiliateAttributionService.php` | `recordAttribution` L100; config read L134 | [AffiliateAttributionService.php#L100-L134](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateAttributionService.php#L100-L134) | Changing the Admin setting would be a **no-op** ⇒ ER-4 |
| 14 | Attribution is created inside the order transaction (timing already matches PO decision) | `createOrder` L23; `DB::transaction` L25; `recordAttribution` call L111 | E2 | `backend/app/Services/OrderService.php` | L23–L111 | [OrderService.php#L23-L111](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/OrderService.php#L23-L111) | Only the *source* of the rate must change, not the timing |
| 15 | Fulfilment already uses the stored snapshot | `creditSalesCommission` L24, passes `$attribution->commission_rate_bps` L45 | E2 | `backend/app/Services/AffiliateCommissionService.php` | L24–L45 | [AffiliateCommissionService.php#L24-L45](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCommissionService.php#L24-L45) | No recalculation path to remove |
| 16 | `calculateCommission` falls back to `config()` only when no rate is passed | `$rate = $rateBps ?? config(...)` | E2 | same file | L15–L17 | [AffiliateCommissionService.php#L15-L17](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCommissionService.php#L15-L17) | Fallback is acceptable only as *baseline*, not as live source |
| 17 | Ledger is append-only at model level | `booted()` L58: `updating` rejects `amount_cents/currency/idempotency_key`; `deleting` L83 always throws | E2 | `backend/app/Models/AffiliateLedgerEntry.php` | L58–L83 | [AffiliateLedgerEntry.php#L58-L83](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/AffiliateLedgerEntry.php#L58-L83) | `status` remains the only mutable field ⇒ settle/release legitimately flip status |
| 18 | Ledger idempotency key is unique | `idempotency_key` string(128) unique | E2 | `…2026_10_02_000005_create_affiliate_ledger_entries_table.php` | L26 (L14–L32 table) | […000005…#L26](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000005_create_affiliate_ledger_entries_table.php#L26) | Duplicate-request protection already enforced by DB |
| 19 | Co-prize award/release/cancel/revoke exist; **release has no capability check; revoke does** | `releaseCoPrize` L83 (approval check L108, `isFullyApproved` L111); `adjudicateCoPrizeRevocation` L153 with `hasCapability('adjudicate_affiliate_coprize')` L158; `reversal_debit` L186 | E2 | `backend/app/Services/AffiliateCoPrizeService.php` | L83–L111, L153–L186 | [AffiliateCoPrizeService.php#L83-L111](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeService.php#L83-L111) · [#L153-L186](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeService.php#L153-L186) | Admin wrapper `adjudicateCoPrizeRelease` must be added, not a second service |
| 20 | Co-prize funded by `marketing_pool`, winner deduction 0 | `funding_source => marketing_pool` L65/L71; `winner_deduction_cents => 0` L72 | E2 | same | L65–L72 | [AffiliateCoPrizeService.php#L65-L72](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeService.php#L65-L72) | Matches "winner keeps 100%" |
| 21 | **`awardCoPrize` has no production caller** | `git grep "awardCoPrize("` in `backend/app backend/routes` → only the definition, the interface, and `SimulateCoPrizeAwardCommand` L52 | E1+E2 | `backend/app/Console/Commands/SimulateCoPrizeAwardCommand.php` | L52 | [SimulateCoPrizeAwardCommand.php#L52](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Console/Commands/SimulateCoPrizeAwardCommand.php#L52) | D-2: co-prize queue is inert in production |
| 22 | Approval issue/revoke/supersede enforce per-type capability and versioning | `issueApproval` L27; `revokeApproval` L129; `supersedeApproval` L176; `verifyIssuerAuthorization` L243 (`issue_kyc_approval` L250, `issue_draw_audit_approval` L261) | E2 | `backend/app/Services/ApprovalRegistryService.php` | L27, L129, L176, L243–L261 | [ApprovalRegistryService.php#L243-L261](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/ApprovalRegistryService.php#L243-L261) | Admin approvals = pure transport over this service |
| 23 | Approval validity is state/version-based, no time | `ApprovalRecord::isFresh()` L121; `CoPrizeApprovalState::isFullyApproved()` L34; provider `getApprovalState` L14 | E2 | `ApprovalRecord.php`, `CoPrizeApprovalState.php`, `DatabaseCoPrizeApprovalProvider.php` | L121 / L34 / L14 | [ApprovalRecord.php#L121](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/ApprovalRecord.php#L121) · [CoPrizeApprovalState.php#L34](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/CoPrizeApprovalState.php#L34) · [DatabaseCoPrizeApprovalProvider.php#L14](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/DatabaseCoPrizeApprovalProvider.php#L14) | No "freshness expiry" invented |
| 24 | Settings service is gated, nested-safe, un-audited, no key allow-list | `get` L17, `set` L36, Gate `manage_platform_settings` L46, `DB::transaction` L51 | E2 | `backend/app/Services/PlatformSettingsService.php` | L17–L51 | [PlatformSettingsService.php#L36-L51](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/PlatformSettingsService.php#L36-L51) | Extend with typed validation; reuse the gate |
| 25 | Settings row is unique by key, with `updated_by_user_id` | key unique L16; json value L17; `updated_by_user_id` nullable FK L19 | E2 | `…2026_10_02_000001_create_platform_settings_table.php` | L14–L20 | […000001…#L14-L20](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000001_create_platform_settings_table.php#L14-L20) | No migration needed for settings |
| 26 | **`draws` has no publication/seed columns** | columns: tier, execution_type, titles, `status` enum(4), starts/ends, broadcast_url, total_eligible_tickets; indexes `idx_draws_starts_at/ends_at/status_tier` | E2 | `…2026_09_29_000007_create_draws_table.php` | L14–L27 | […000007…#L14-L27](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000007_create_draws_table.php#L14-L27) | ER-1: spec wrongly calls them "existing"; M1 required |
| 27 | `is_published` is **not** a draws concept anywhere; sole repo hit is `Course::where('is_published', …)` | `git grep -i is_published` (163 files) → 1 hit, `SimulateFulfillmentCommand.php:53`, concerning `Course` | E1 | `backend/app/Console/Commands/SimulateFulfillmentCommand.php` | L53 | [SimulateFulfillmentCommand.php#L53](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Console/Commands/SimulateFulfillmentCommand.php#L53) | No collision for the new draws column. *Observation (unverified, out of scope):* the courses migrations I grepped contain no `is_published` — possible latent defect in that command; not part of 008 |
| 28 | Tickets have **no `draw_id`**; eligibility is time-window based | `tickets` columns L14–L27: user, order, order_item, serial, `issued_at`; indexes/uniques only on serial/order/user | E2 | `…2026_10_01_000002_create_tickets_table.php` | L14–L27 | […000002…#L14-L27](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_01_000002_create_tickets_table.php#L14-L27) | "Commitment before accumulation" ⇒ commit before `starts_at` (derivation in research R-07, E3) |
| 29 | Draw winners: unique per draw and per serial; `prize_id` FK nullOnDelete | `uq_draw_winners_draw_id` L52, `uq_draw_winners_serial` L53, `prize_id` L51 | E2 | `…2026_09_30_000001_enforce_financial_and_draw_invariants.php` | L50–L53 | […enforce…#L50-L53](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_30_000001_enforce_financial_and_draw_invariants.php#L50-L53) | Canonical winner is DB-unique; Admin must never create/delete one |
| 30 | **No code path writes draw status or creates `DrawWinner`** | `git grep -E "DrawWinner::(create|insert)|->status = '(active|locked|completed)'|Draw::create"` in `backend/app backend/routes` → only unrelated `User` and `AffiliatePayout` statuses | E1 | (negative; scope = `backend/app`, `backend/routes`) | — | — | D-2/U-4: RNG & winner creation are un-owned; F008 must not silently own RNG |
| 31 | Public draw consumers that need the visibility filter | `DrawController::active` (`Draw::with('prize')` L22), `::concluded` (L39); `TicketController::index` (`Draw::whereIn…` L39); `ActivityController::recent` (`Draw::whereIn…` L35) | E2 | three controllers | L18/L22, L37/L39; L39–L42; L35 | [DrawController.php#L18-L45](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/DrawController.php#L18-L45) · [TicketController.php#L39-L42](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/TicketController.php#L39-L42) · [ActivityController.php#L35](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/ActivityController.php#L35) | A missed consumer would leak private drafts (R-5) |
| 32 | `Draw` model: fillable L22, casts L39, scopes `locked` L91 / `concluded` L99 / `rollingWindow` L108 / `tier` L118, `computeEffectiveStatus` L126 | read-time status derivation | E2 | `backend/app/Models/Draw.php` | L22–L126 | [Draw.php#L22-L126](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/Draw.php#L22-L126) | Public status is *computed*; stored `status` must remain enum-compatible |
| 33 | Prize carries valuation (`valuation_usd_cents`) FK→draws cascadeOnDelete | prizes cols L14–L25 | E2 | `…2026_09_29_000008_create_prizes_table.php` | L14–L25 (valuation L22; FK L16) | […000008…#L14-L25](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000008_create_prizes_table.php#L14-L25) | `cascadeOnDelete` ⇒ draw delete would erase prizes; plan forbids draw deletion after publish |
| 34 | `admin_capabilities`: unique `(user_id,capability)`, no capability enum/CHECK | `uq_user_admin_capability` L27; `capability` string(64) L17 | E2 | `…2026_10_02_000006_create_admin_capabilities_table.php` | L14–L29 | […000006…#L14-L29](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000006_create_admin_capabilities_table.php#L14-L29) | M5 CHECK(six) is justified; **re-grant after revoke must reuse the unique row** (design implication) |
| 35 | Grant CLI: allow-list, authorizer capability, anti-self-grant | `ALLOWED_CAPABILITIES` check L48; authorizer check L80; self-grant L87; `grantCapability` L91 | E2 | `backend/app/Console/Commands/GrantAdminCapabilityCommand.php` | L48–L91 | [GrantAdminCapabilityCommand.php#L41-L98](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Console/Commands/GrantAdminCapabilityCommand.php#L41-L98) | Delegation rules already exist; service extracts them for API+CLI |
| 36 | Revoke CLI has no last-admin guard | handler L31: authorizer check L63, `revokeCapability` L68, no count/lock | E2 | `backend/app/Console/Commands/RevokeAdminCapabilityCommand.php` | L31–L68 | [RevokeAdminCapabilityCommand.php#L31-L75](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Console/Commands/RevokeAdminCapabilityCommand.php#L31-L75) | Last-admin safeguard is a real, evidenced gap |
| 37 | Bootstrap grants only 3 capabilities, refuses if an admin exists | `AdminCapability::active()->exists()` L59 → throws L61; grants L76–L78 | E2 | `backend/app/Console/Commands/BootstrapAdminCommand.php` | L59–L78 | [BootstrapAdminCommand.php#L59-L78](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Console/Commands/BootstrapAdminCommand.php#L59-L78) | D-3: ≥2 admins required for separation of duties |
| 38 | `/api/admin/bootstrap` is asserted 404 in existing tests (no HTTP bootstrap) | test posts to `/api/admin/bootstrap` | E2 | `backend/tests/Feature/AdminPlatformSettingsAuthorizationTest.php` | L267 | [AdminPlatformSettingsAuthorizationTest.php#L267](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/tests/Feature/AdminPlatformSettingsAuthorizationTest.php#L267) | FR-020 already has a regression test to keep green |
| 39 | **No admin routes exist** | `git grep "/admin"` over backend app/routes/database/config/tests → 1 hit (the test above); `routes/api.php` has only `v1/*` public/`auth:sanctum` routes | E1+E2 | `backend/routes/api.php` | L23 (`v1` group)…L87 | [api.php#L23-L87](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L23-L87) | All admin routes are **New** |
| 40 | Existing private-storage pattern (env-switchable S3, private) | `protected-media` disk | E2 | `backend/config/filesystems.php` | L59–L71 | [filesystems.php#L59-L71](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/config/filesystems.php#L59-L71) | `payout-receipts` follows this pattern (E5 proposal) |
| 41 | 25% is hardcoded in server copy & UI | `'sales_commission_rate_percent' => 25` L131; Arabic/English ledger descriptions L211–L212 | E2 | `backend/app/Http/Controllers/AffiliateDashboardController.php` | L130–L131, L211–L212 | [AffiliateDashboardController.php#L130-L131](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/AffiliateDashboardController.php#L130-L131) · [#L211-L212](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/AffiliateDashboardController.php#L211-L212) | ER-5: amendment requires "reflected wherever displayed" |
| 42 | Same 25% in FE | `AffiliateDashboardView.tsx` L63–L64; `AffiliateLedgerTable.tsx` L77; `affiliate/page.tsx` L17–L18; `messages/{ar,en}.json` L224 | E2 | four FE files | as listed | [AffiliateDashboardView.tsx#L63-L64](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/affiliate/AffiliateDashboardView.tsx#L63-L64) · [AffiliateLedgerTable.tsx#L77](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/affiliate/AffiliateLedgerTable.tsx#L77) · [page.tsx#L17-L18](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/app/%5Blocale%5D/affiliate/page.tsx#L17-L18) · [en.json#L224](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/messages/en.json#L224) · [ar.json#L224](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/messages/ar.json#L224) | Display surfaces that must read the dynamic rate |
| 43 | The affiliate GET endpoints **write** (maturation sweep) | `dashboard` L21 → sweep L26; `ledger` L145 → sweep L150 | E2 | `AffiliateDashboardController.php` | L21–L26, L145–L150 | [AffiliateDashboardController.php#L21-L26](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/AffiliateDashboardController.php#L21-L26) | Admin read endpoints must **not** reuse this controller (FR-003/004 read-only) |
| 44 | **Test DB hazard (E1):** `phpunit.xml` has sqlite lines commented out; no `backend/.env.testing` (`Test-Path` = False; only `backend/.env.example` is tracked) | commented `DB_CONNECTION`/`DB_DATABASE` | E1 | `backend/phpunit.xml` | L25–L26 | [phpunit.xml#L25-L26](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/phpunit.xml#L25-L26) | `RefreshDatabase` would wipe the dev DB ⇒ T-INFRA-1 is a hard blocker |
| 45 | Exception rendering lives in `bootstrap/app.php` (auth, model-not-found, throttle) | renders at L18, L26, L34 | E2 | `backend/bootstrap/app.php` | L14–L34 | [app.php#L14-L34](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/bootstrap/app.php#L14-L34) | Single, existing place to add 403/409/422 JSend renders |
| 46 | Frontend: single `[locale]/layout.tsx` wraps all routes with site chrome and sets `dir` | `<html dir={isRtl ? 'rtl':'ltr'}>` L49; `HeaderHUD` L55; `Footer` L60; `NextIntlClientProvider` L51 | E2 | `frontend/src/app/[locale]/layout.tsx` | L49–L64 | [layout.tsx#L49-L64](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/app/%5Blocale%5D/layout.tsx#L49-L64) | `SiteFrame` wrapper is the least invasive way to hide chrome on `/admin` (E5) |
| 47 | `apiClient` forces JSON content-type; token from `localStorage` | `'Content-Type': 'application/json'` L53; `localStorage.getItem('knzin_auth_token')` L49; Bearer L58 | E2 | `frontend/src/lib/api-client.ts` | L45–L58 | [api-client.ts#L45-L58](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/lib/api-client.ts#L45-L58) | Receipt upload needs `FormData` support (extend, don't fork) |
| 48 | Auth state = localStorage keys `knzin_auth_token`, `knzin_user` | useAuth L25–L26, set L55–L56, remove L63–L64 | E2 | `frontend/src/hooks/useAuth.ts` | L16–L64 | [useAuth.ts#L16-L64](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/hooks/useAuth.ts#L16-L64) | Reuse; no parallel auth. FE state is a *hint*; server decides |
| 49 | Locales `ar`,`en`; default `ar`; middleware uses next-intl | routing L5–L6; middleware L5–L35 | E2 | `frontend/src/i18n/routing.ts`, `frontend/src/middleware.ts` | L5–L6 / L5–L35 | [routing.ts#L5-L6](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/i18n/routing.ts#L5-L6) · [middleware.ts#L5-L35](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/middleware.ts#L5-L35) | Admin lives at `/[locale]/admin` under existing i18n |
| 50 | Frontend test convention = `node --import tsx --test src/tests/*.test.ts` (no Playwright) | `package.json` script | E2 | `frontend/package.json` | L10 | [package.json#L10](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/package.json#L10) | FE test plan uses source/dictionary invariants + scripted browser pass |
| 51 | Governance: Constitution v3.2.0; Principles VII/VIII/IX/X relevant | headings L67, L74, L84, L92; version L160 | E2 | `.specify/memory/constitution.md` | L67–L98, L160 | [constitution.md#L67-L98](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/.specify/memory/constitution.md#L67-L98) | Receipt-before-zeroing, provably-fair draws, server-authoritative finance |
| 52 | `DECISIONS.md` ends at DEC-006; spec's "DEC-008-03" is not a repository decision | headings L11…L84 | E2 | `DECISIONS.md` | L11–L84 | [DECISIONS.md#L84](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/DECISIONS.md#L84) | ER-7 |
| 53 | Doc/PDF delegation rule | `AGENTS.md` §32 | E2 | `AGENTS.md` | §32 (heading line not pinned) | [AGENTS.md](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/AGENTS.md) | No PDF produced by this plan |
| 54 | **Proposals, not facts** — `AdminAuditContext` (replaces the withdrawn executor, GC-5), `admin.principal`, `payout-receipts` disk, `TestDatabaseGuard` (no MTCN uniqueness, GC-4), `reason_code`/`ip_hash`, optional `SHA2` CHECK, `SiteFrame`, `DEFAULT 1` for `is_published` | engineering design | **E5** | n/a | n/a | n/a | Listed so no reviewer mistakes them for repository facts |

---

## 3. Existing Service Ownership (reuse / extend / replace)

| Operation | Current authority | File | Method @ line | Link | Feature 008 role |
|---|---|---|---|---|---|
| Commission attribution (snapshot) | `AffiliateAttributionService` | `backend/app/Services/AffiliateAttributionService.php` | `recordAttribution` L100 (config read L134) | [L100-L134](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateAttributionService.php#L100-L134) | **Extend** — swap rate source to `PlatformSettingsService` (baseline fallback 2500) |
| Order-time attribution trigger | `OrderService` | `backend/app/Services/OrderService.php` | `createOrder` L23, call L111 | [L23-L111](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/OrderService.php#L23-L111) | **Reuse** unchanged |
| Commission creation | `AffiliateCommissionService` | `…/AffiliateCommissionService.php` | `creditSalesCommission` L24 (snapshot L45) | [L24-L45](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCommissionService.php#L24-L45) | **Reuse** unchanged |
| Maturation sweep | `AffiliateCommissionService` | same | `sweepMaturedCommissionsForUser` L110 | [L110](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCommissionService.php#L110) | **Reuse**; Admin reads never invoke it |
| Payout request | `AffiliatePayoutService` | `…/AffiliatePayoutService.php` | `requestPayout` L49 | [L49-L111](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliatePayoutService.php#L49-L111) | **Reuse** unchanged |
| Payout settlement | `AffiliatePayoutService` | same | `settlePayout` L121 | [L121-L139](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliatePayoutService.php#L121-L139) | **Refactor existing** (state guard, Gate, receipt, self-settlement) — *not replaced* |
| Payout rejection | `AffiliatePayoutService` | same | `rejectPayout` L141 | [L141-L157](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliatePayoutService.php#L141-L157) | **Refactor existing** (honor `markRejected()`; keep `payout_reversal_{n}` key) |
| Co-prize award | `AffiliateCoPrizeService` | `…/AffiliateCoPrizeService.php` | `awardCoPrize` L21 | [L21-L80](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeService.php#L21-L80) | **Reuse**; not exposed by Admin (no producer yet — D-2) |
| Co-prize release | same | same | `releaseCoPrize` L83 | [L83-L111](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeService.php#L83-L111) | **Extend** — new gated `adjudicateCoPrizeRelease` wrapper; domain logic stays here |
| Co-prize revoke | same | same | `adjudicateCoPrizeRevocation` L153 | [L153-L186](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeService.php#L153-L186) | **Extend** — add `available` precondition |
| Approval issue/revoke/supersede | `ApprovalRegistryService` | `…/ApprovalRegistryService.php` | L27 / L129 / L176 | [L27](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/ApprovalRegistryService.php#L27) · [L129](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/ApprovalRegistryService.php#L129) · [L176](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/ApprovalRegistryService.php#L176) | **Reuse** unchanged (transport only) |
| Approval state read | `DatabaseCoPrizeApprovalProvider` | `…/DatabaseCoPrizeApprovalProvider.php` | `getApprovalState` L14 | [L14](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/DatabaseCoPrizeApprovalProvider.php#L14) | **Reuse** |
| Platform settings | `PlatformSettingsService` | `…/PlatformSettingsService.php` | `get` L17 / `set` L36 | [L17-L51](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/PlatformSettingsService.php#L17-L51) | **Extend** (typed key validation); keep Gate |
| Capability check | `User::hasCapability` | `backend/app/Models/User.php` | L181 | [L181](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/User.php#L181) | **Reuse** (single resolution path) |
| Capability grant/revoke | `User::grantCapability` / `revokeCapability` | same | L192 / L227 | [L192](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/User.php#L192) · [L227](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/User.php#L227) | **Reuse** inside new `AdminCapabilityService` (adds last-admin/verified-target rules) |
| Draw queries (public) | `DrawController`, `TicketController`, `ActivityController` | `backend/app/Http/Controllers/…` | L18/L37; L39; L35 | see Evidence #31 | **Extend** with `published()` scope; response shape unchanged |
| Draw lifecycle / seed / prize edit | **none exists** (searched `backend/app`: no `Draw*Service`) | — | — | — | **New** (justified in §4) |
| Tickets | `TicketMintingService`, `Ticket` model | `backend/app/Services/TicketMintingService.php`, `backend/app/Models/Ticket.php` | file-level (not line-pinned) | [TicketMintingService.php](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/TicketMintingService.php) · [Ticket.php](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/Ticket.php) | **Reuse, untouched** — no Admin ticket route (pin symbols in tasks) |
| Audit | decentralized provenance only (`processed_by_admin_id`, `granted_by_user_id`, approval `approved_by`) | migrations #10, #34, approvals L14–L34 | — | see §5 | **New** `admin_activity_logs` (evidence, not truth) |

**No existing domain authority is replaced.** The only replaced artifact is the *scattered capability strings* (consolidated into `AdminCapabilities::ALL`, E5).

---

## 4. Implementation Gap Evidence (`Requirement → Existing → Behavior → Gap → Addition`)

Search scope for every negative claim below: `git grep -l -i <term>` over **163 tracked files** in `backend/app`, `backend/routes`, `backend/database`, `backend/config`, `backend/tests` at `c0042c5` (E1 command evidence), plus the cross-checks named in the row. "0" means *no match in that scope* — it does **not** prove absence outside it (frontend scope handled separately).

| # | Requirement | Existing capability | Existing behavior | Gap (search result) | Planned addition |
|---|---|---|---|---|---|
| G1 | FR-018 centralized audit | decentralized provenance columns | per-domain `*_by` columns only | `admin_activity_logs` = **0** matches | New migration M3 + `AdminActivityLog` + `AdminAuditContext`/`AdminAuditWriter` (service-owned tx) |
| G2 | FR-015 promo awards | none | — | `promotional_award` = **0** | New M4 + `PromotionalAward` + `PromotionalAwardService` |
| G3 | FR-013 private draft + commitment | `draws.status` enum(4) | public status only | `is_published` on draws **0**; `server_seed` = **0** | M1 + `DrawLifecycleService` + `DrawSeedService` |
| G4 | FR-005 receipt | MTCN `admin_reference_number` exists | settle takes MTCN only | `receipt_path` = **0**; `payout-receipts` = **0** | M2 + `ReceiptStorageService` + private disk |
| G5 | FR-002 six capabilities | 5 Gates | CLI allow-list (5) | `settle_affiliate_payout` = **0** | Add 6th Gate/CLI entry via `AdminCapabilities::ALL` |
| G6 | FR-001/002 admin routes | none | — | `/admin` route hits = **0** (1 test-only 404 assertion) | `routes/api.php` admin group + middleware |
| G7 | FR-008 live rate | `PlatformSettingsService` + snapshot column | snapshot from `config()` | settings→attribution link absent (source read, Evidence #13) | Extend `recordAttribution` |
| G8 | FR-005/006 safety | `markCompleted/markRejected` return bool | return ignored (Evidence #7–#8) | no state guard / Gate / lock | Refactor `settlePayout`/`rejectPayout` |
| G9 | FR-017 last-admin safeguard | revoke CLI | no count/lock (Evidence #36) | guard absent | `AdminCapabilityService` |
| G10 | FR-013 "who creates winners" | `draw_winners` schema | no writer | writers = **0** (Evidence #30) | **No addition** — flagged D-2 |
| G11 | FR-003/004 read-only admin views | user-facing dashboard/ledger | GET performs sweep (Evidence #43) | no admin-read endpoints | New read-only `Admin*Controller`s (no sweep) |
| G12 | FR-016/019 directory & viewer | `users`, new log table | none | no endpoints | New read controllers, bounded queries |
| G13 | FR-001 frontend admin area | none | — | `frontend/src` "admin" hits are copy/unrelated (git grep, first 8 shown: no admin route/component) — *search scope limited to `frontend/src`; `frontend/messages` and `public` not searched for admin* | New `[locale]/admin/**` |
| G14 | Test isolation | phpunit config | no DB set | Evidence #44 | T-INFRA-1 `knzin_test` |

---

## 5. Database Evidence → Required Change → Compatibility

Migration ordering: latest existing = `2026_10_02_000007_create_approval_records_table.php` (E2 via `git ls-files`). New set = `2026_10_03_00000{1..5}_*` (+`…000006` optional) ⇒ strictly after all existing (E5 proposal).

| New | Existing schema (link) | Required change | Compatibility impact |
|---|---|---|---|
| **M1** `draws` (+ columns) | [draws L14–L27](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000007_create_draws_table.php#L14-L27): `uuid id`, `tier`, `status` enum(4), `starts_at`/`ends_at` indexed, `idx_draws_status_tier` | +`is_published` (DEFAULT **1**), `published_at`, `published_by`, `server_seed_hash` (CHAR 64, UNIQUE), `server_seed_encrypted`, `seed_committed_at`, `seed_revealed`/`seed_revealed_at`; CHECKs (publish⇒hash; reveal⇒hash; hash shape); `idx_draws_published_status_tier` | Expand-only; existing rows become published (default 1) ⇒ **zero public behavior change**; `down()` drops (point-of-no-return = first publish). Status enum untouched |
| **M2** `affiliate_payouts` | [L15–L34](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000003_create_affiliate_payouts_table.php#L15-L34): `admin_reference_number` string(128) nullable, no index; CHECK `amount_cents>0` | +`receipt_path`, `receipt_sha256` (nullable); UNIQUE on `admin_reference_number` (nulls allowed) | Pre-flight dup query required; legacy completed rows w/o receipt tolerated (nullable) |
| **M3** `admin_activity_logs` (new) | no analogue (G1); FK style reference: `users.id` uuid ([users L14–L26](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000001_create_users_table.php#L14-L26)) | new table, `restrictOnDelete` actor FK, 5 indexes, append-only model | Additive; no existing table touched |
| **M4** `promotional_awards` (new) | no analogue (G2); draws/prizes/users FKs per Evidence #26/#33 | new table, `restrictOnDelete`, indexes; **no FK to `draw_winners`/`tickets`/ledger** | Additive; structural isolation from canonical winner |
| **M5** `admin_capabilities` | [L14–L29](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000006_create_admin_capabilities_table.php#L14-L29): `capability` string(64), unique `(user_id,capability)` | `CHECK capability IN (6)` | Pre-flight: existing rows ⊆ five; the CHECK permits the sixth; follows the repository's existing CHECK practice ([`…2026_09_30_000001…` L20–L47](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_30_000001_enforce_financial_and_draw_invariants.php#L20-L47)) |
| **M6** (optional ✱) `affiliate_ledger_entries` | [L14–L32](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000005_create_affiliate_ledger_entries_table.php#L14-L32): indexes `idx_affiliate_ledger_{order_type, user_status_matures, user_created, payout}` | index for co-prize queue **only if `EXPLAIN` shows need** | Additive; **not** in the execution plan until EXPLAIN evidence exists (goes to *Possible*) |

**Not changed (explicitly):** `referral_attributions` ([L15–L33](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000004_create_referral_attributions_table.php#L15-L33)), `platform_settings` ([L14–L20](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000001_create_platform_settings_table.php#L14-L20)), `approval_records` ([L14–L34](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000007_create_approval_records_table.php#L14-L34)), `tickets` ([L14–L27](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_01_000002_create_tickets_table.php#L14-L27)), `draw_winners` ([L14–L23](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000009_create_draw_winners_table.php#L14-L23) + uniques [L50–L53](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_30_000001_enforce_financial_and_draw_invariants.php#L50-L53)), `prizes` ([L14–L25](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000008_create_prizes_table.php#L14-L25)), all ledger data. No financial/relational constraint is weakened.

**Schema observations that constrain the design (E2):**
- `affiliate_ledger_entries.payout_id` is `foreignId` (bigint → `affiliate_payouts.id`), not a UUID ([L18](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000005_create_affiliate_ledger_entries_table.php#L18)) ⇒ admin API identifies payouts by `payout_number` (unique, [L17](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_10_02_000003_create_affiliate_payouts_table.php#L17)), never by raw id.
- `users.email` is **indexed, not unique** ([L16](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000001_create_users_table.php#L16)); uniqueness is `(auth_provider, provider_id)` ([L26](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000001_create_users_table.php#L26)). Same e-mail can exist as guest *and* Google user ⇒ directory/grant must key on user id and verified provider, not e-mail.
- `draw_winners` has `restrictOnDelete` to draws but `prizes` has `cascadeOnDelete` ([L16](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/database/migrations/2026_09_29_000008_create_prizes_table.php#L16)) ⇒ plan forbids physical draw/prize delete once published or won.

---

## 6. API Evidence

### 6.1 Existing endpoints touched or preserved (E2, `backend/routes/api.php`)

| Route | Method | Controller@method | Current behavior | Route line | 008 impact | Link |
|---|---|---|---|---|---|---|
| `/api/v1/draws/active` | GET | `DrawController@active` L18 | rolling-window draws + prize; no publication filter | L34 | add `published()`; **additive** `seed_commitment` field | [api.php#L34](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L34) · [DrawController.php#L18-L33](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/DrawController.php#L18-L33) |
| `/api/v1/draws/concluded` | GET | `DrawController@concluded` L37 | last 20 concluded with winner | L35 | add `published()`; additive `seed_verification` | [api.php#L35](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L35) · [DrawController.php#L37-L45](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/DrawController.php#L37-L45) |
| `/api/v1/user/tickets` | GET | `TicketController@index` L19 | draw windows incl. non-completed draws | L49 | add `published()` (L39–L42) — **no shape change** | [api.php#L49](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L49) |
| `/api/v1/activity/recent` | GET | `ActivityController@recent` L20 | cached feed incl. upcoming/active draws (L35) | L38 | add `published()` (draft must not appear in feed) | [api.php#L38](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L38) |
| `/api/v1/affiliate/dashboard` | GET | `AffiliateDashboardController@dashboard` L21 | **sweeps (write) on GET**; `commission_policy.sales_commission_rate_percent = 25` (L131) | L52 | value source → dynamic rate; **type unchanged** (number); sweep behavior preserved | [api.php#L52](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L52) |
| `/api/v1/affiliate/ledger` | GET | `…@ledger` L145 | sweep L150; 25% copy L211–L212 | L53 | description text uses entry's snapshot rate | [api.php#L53](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L53) |
| `/api/v1/affiliate/payouts/request`, `/payouts` | POST/GET | `AffiliatePayoutController` | request & history | L56–L57 | **unchanged**; service signature change for settle/reject does not affect these | [api.php#L56-L57](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L56-L57) |
| `/api/v1/auth/guest`, `/auth/google/*` | POST/GET | `AuthController` | see Evidence #4–#5 | L25–L27 | **unchanged**; admin protection is a *new middleware on admin routes*, not an auth redesign | [api.php#L25-L27](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L25-L27) |

**API compatibility verdict:** no breaking change identified; every public change is additive or a value-source change with the same type. *(E5 conclusion from E2 evidence; to be re-proved by `DrawApiTest` / `AffiliateDashboardContractTest` staying green.)*

### 6.2 New Admin endpoints — **PROPOSED (not existing)**

Authoritative, complete list with capability, authoritative service, request/response contract, error codes: [contracts/admin-api.md](./contracts/admin-api.md) (**LOCAL ONLY**). Summary of the proposal (all under `/api/v1/admin`, all behind `auth:sanctum` + `admin.principal` + `admin.capability:<cap>` + `throttle:admin`):

| PROPOSED route group | Controller (new) | Capability | Authoritative service |
|---|---|---|---|
| `GET /me` | `AdminSessionController` | any admin principal (hint only) | `AdminCapabilities` |
| `GET/PATCH /settings` | `AdminSettingsController` | `manage_platform_settings` | `PlatformSettingsService` (extended) |
| `GET /affiliates*` | `AdminAffiliateController` | any-of settings/settle (read) | ledger projections (no write) |
| `GET /payouts*`, `POST /payouts/{n}/settle|reject`, receipt download | `AdminPayoutController` | `settle_affiliate_payout` | `AffiliatePayoutService` (refactored) + `ReceiptStorageService` |
| `GET /coprizes`, `POST …/release|revoke` | `AdminCoPrizeController` | `adjudicate_affiliate_coprize` | `AffiliateCoPrizeService` (extended) |
| `…/approvals/kyc*`, `…/approvals/draw-integrity*` | `AdminApprovalController` | `issue_kyc_approval` / `issue_draw_audit_approval` | `ApprovalRegistryService` |
| `…/draws*`, `…/prizes*`, `…/winner` (metadata) | `AdminDrawController`, `AdminPrizeController`, `AdminDrawWinnerController` | `manage_platform_settings` | `DrawLifecycleService`, `DrawSeedService`, `PrizeService` (new) |
| `…/awards*` | `AdminPromotionalAwardController` | `manage_platform_settings` | `PromotionalAwardService` (new) |
| `GET /users*` | `AdminUserController` | `manage_admin_capabilities` | read query only |
| `POST/DELETE …/capabilities` | `AdminCapabilityController` | `manage_admin_capabilities` | `AdminCapabilityService` (new) |
| `GET /audit-logs*` | `AdminAuditLogController` | `manage_admin_capabilities` | read query only |

---

## 7. Frontend Evidence (what is reused/extended vs. new)

| Concern | Existing pattern (pinned) | Decision | Justification |
|---|---|---|---|
| Layout / chrome | [`[locale]/layout.tsx#L49-L64`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/app/%5Blocale%5D/layout.tsx#L49-L64) — one layout renders `HeaderHUD` + `Footer` for every route | **Extend**: wrap chrome in client `SiteFrame` that returns children only on `/admin` | Alternative (moving every route dir into route groups) rewrites many unrelated paths; `HeaderHUD` is `'use client'` ([L1](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/layout/HeaderHUD.tsx#L1)) so a client wrapper is consistent (E5) |
| Auth / session | [`useAuth.ts#L16-L64`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/hooks/useAuth.ts#L16-L64) (localStorage token/user) | **Reuse** | No parallel auth; server `GET /admin/me` is a hint |
| API client | [`api-client.ts#L45-L58`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/lib/api-client.ts#L45-L58) (forces JSON header, Bearer) | **Extend**: skip content-type for `FormData` | Required by receipt upload; smallest change |
| Dialogs | [`ui/dialog.tsx`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/ui/dialog.tsx) (Radix, L8–L52+) | **Reuse** as base of `ConfirmDialog`/`ReasonDialog` | existing primitive |
| Buttons/badges/tabs/cards/dropdown/sheet | `components/ui/{button,badge,tabs,card,dropdown-menu,sheet}.tsx` (tracked) | **Reuse** | `sheet.tsx` supports mobile nav sheet |
| Tables | **no generic table component exists** (tracked `components/ui/*` list contains none) | **New** `AdminDataTable` | Existing affiliate table is feature-specific: [`AffiliateLedgerTable.tsx`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/affiliate/AffiliateLedgerTable.tsx) |
| Forms | no shared form library in tracked UI; `zod` present in `package.json` (E2) | Use plain controlled forms + zod (no new dep) | consistent with [`PayoutRequestModal.tsx`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/affiliate/PayoutRequestModal.tsx) pattern |
| Data hooks | [`useAffiliateDashboard.ts#L58`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/hooks/useAffiliateDashboard.ts#L58), [`useDraws.ts#L8`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/hooks/useDraws.ts#L8) (TanStack Query + `apiClient`) | **Reuse** pattern for `hooks/admin/*` | |
| i18n/RTL | [`routing.ts#L5-L6`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/i18n/routing.ts#L5-L6), [`middleware.ts#L5-L35`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/middleware.ts#L5-L35), `dir` at layout L49; messages [`ar.json`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/messages/ar.json) / [`en.json`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/messages/en.json) | **Extend** with `admin` namespace | |
| Draw types | [`types/draws.ts#L10`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/types/draws.ts#L10) `DrawStatus` = 4 values | **Preserve**; add optional fields only | public status compatibility |
| Draw UI | [`DrawCard.tsx#L19`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/draws/DrawCard.tsx#L19), [`ConcludedDrawsList.tsx#L14`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/draws/ConcludedDrawsList.tsx#L14) | **Extend** minimally (show commitment hash / verification) | needed for "publicly available" commitment |
| Tests | [`package.json#L10`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/package.json#L10) → `node --import tsx --test src/tests/*.test.ts`; conventions: [`ClientUntrustInvariants.test.ts`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/tests/ClientUntrustInvariants.test.ts), [`NavigationInvariants.test.ts`](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/tests/NavigationInvariants.test.ts) (imports `messages/ar.json`) | **Follow** convention (new `Admin*.test.ts`); browser matrix is scripted (no Playwright installed — E2 `package.json`) | |

---

## 8. Plan-to-Requirement Traceability (FR → …)

Local-only: spec FR lines in `specs/008-admin-panel/spec.md` (LOCAL ONLY). Existing evidence = Evidence-Table # (links there).

| FR (spec line) | User story (spec line) | Existing evidence | Planned files (new/extend) | Domain operation | Authz | DB | API (PROPOSED) | Frontend | Tests |
|---|---|---|---|---|---|---|---|---|---|
| FR-001 (L362) | US1 (L95) | #4,#5,#6,#39,#48 | `EnsureAdminPrincipal`, `AdminSessionController`, `routes/api.php` | admin session validation | principal+≥1 cap | — | `GET /admin/me` | `AdminGuard`, `AdminShell`, `SiteFrame` | AZ, PR, RC, `AdminClientUntrust` |
| FR-002 (L363) | US1 | #1,#2,#34,#35 | `AdminCapabilities`, `AppServiceProvider`, `EnsureAdminCapability` | six-capability enforcement | six caps | M5 | all | `buildAdminNav` (display only) | AZ, RC |
| FR-003 (L364) | US3 (L151) | #9,#17,#43 | `AdminAffiliateController` | read-only projection | any-of | — | `GET /affiliates*` | affiliates pages | AR |
| FR-004 (L365) | US3 | #17,#18 | same | read-only ledger | any-of | — | `GET …/ledger` | ledger view | RC, AR |
| FR-005 (L366) | US4 (L177) | #7–#11 | `AffiliatePayoutService`, `AffiliatePayout`, `ReceiptStorageService`, `AdminPayoutController` | settle (MTCN+receipt) | `settle_affiliate_payout` | M2 | `POST /payouts/{n}/settle` | `PayoutSettleDialog` | PO, PC, AA |
| FR-006 (L367) | US4 | #7,#8 | `AffiliatePayoutService` | reject → compensating `reversal_credit` | same | — | `POST …/reject` | `PayoutRejectDialog` | PO, PC |
| FR-007 (L368) | US2 (L121) | #24,#25 | `PlatformSettingsService`, `AdminSettingsController` | typed settings update | `manage_platform_settings` | — | `PATCH /settings` | `SettingsForm` | ST, AA |
| FR-008 (L369) | US2 | #12–#16,#41,#42 | `AffiliateAttributionService`, `AffiliateDashboardController`, FE copy | snapshot at order creation | n/a | — (col exists) | (order flow) | dynamic rate display | ST, RD |
| FR-009 (L370) | US5 (L209) | #22,#23 | `AdminApprovalController` | KYC approval ops | `issue_kyc_approval` | — | `POST /approvals/kyc…` | `ApprovalForm` | AP |
| FR-010 (L371) | US5 | #22,#23 | same | draw-integrity ops | `issue_draw_audit_approval` | — | `POST /approvals/draw-integrity…` | `ApprovalForm` | AP |
| FR-011 (L372) | US5 | #19,#20,#21,#23 | `AffiliateCoPrizeService(+Interface)`, `AdminCoPrizeController` | release | `adjudicate_affiliate_coprize` | — | `POST /coprizes/{s}/release` | `CoPrizeCard` | CP |
| FR-012 (L373) | US5 | #19 | same | revoke (compensating) | same | — | `POST …/revoke` | `CoPrizeCard` | CP |
| FR-013 (L374) | US6 (L243) | #26–#33 | `DrawLifecycleService`, `DrawSeedService`, `Draw`, `DrawController`, `TicketController`, `ActivityController` | draft/publish/commit/transition | `manage_platform_settings` | M1 | `POST /draws`, `/publish`, `/status` | `DrawForm`, `DrawLifecyclePanel` | DL, SC, PV |
| FR-014 (L375) | US6 | #26,#29,#32,#33 | `PrizeService`, `DrawLifecycleService` | operational live edit | same | — | `PATCH /draws/{id}`, prizes, winner metadata | `PrizeEditor`, `WinnerMetadataForm` | DE |
| FR-015 (L376) | US9 (L335) | #30 (isolation) | `PromotionalAwardService`, `PromotionalAward` | append-only award | same | M4 | `POST /awards` | `AwardForm` | PA |
| FR-016 (L377) | US7 (L278) | #3, users schema §5 | `AdminUserController` | read-only directory | `manage_admin_capabilities` | — | `GET /users*` | `UserDirectoryTable` | UD |
| FR-017 (L378) | US7 | #34–#37 | `AdminCapabilityService`, Grant/Revoke commands | grant/revoke + last-admin | same | M5 | `POST/DELETE …/capabilities` | `CapabilityManager` | CA |
| FR-018 (L379) | US8 (L307) | #24,#7 (nested tx), G1 | `AdminAuditContext` (service-owned tx, GC-5), `AdminAuditWriter`, `AdminActivityLog` | atomic audit | — | M3 | all mutations | — | AA, FA |
| FR-019 (L380) | US8 | G12 | `AdminAuditLogController`, `AuditRedactor` | read-only viewer | `manage_admin_capabilities` | M3 | `GET /audit-logs*` | `AuditLogTable/Filters` | AV, AuditRedactorTest |
| FR-020 (L381) | US1 | #37,#38 | none (must stay absent) | no HTTP bootstrap | — | — | none | — | RC + existing #38 test |
| FR-021 (L382) | all | #9,#17 | none | integer cents | — | none added | all | `MoneyText` | PO, CP |
| FR-022 (L383) | all | #46–#49 | `messages/{ar,en}.json`, admin pages | bilingual UI | — | — | — | all screens | I18nParity, RtlInvariants, browser matrix |

---

## 9. Exact File Change Inventory

`Evidence` column = Evidence-Table row #. All paths relative to repo root. Links pinned at `c0042c5` (**existing files only**; new files have no remote presence → *NEW — no existing link*).

### 9.1 Confirmed changes (evidence proves these must change)

| File | Status | Why (requirement → evidence) | Depends on | Evidence link |
|---|---|---|---|---|
| `backend/app/Services/AffiliateAttributionService.php` | **Modified** — `recordAttribution` L100, rate at L134 | FR-008: rate from settings, not `config()` (#13) | `PlatformSettingsService` | [L100-L134](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateAttributionService.php#L100-L134) |
| `backend/app/Services/AffiliatePayoutService.php` | **Refactor** — `settlePayout` L121, `rejectPayout` L141 | FR-005/006 + Constitution X: state guard, row lock, Gate, receipt, MTCN (#7) | M2, `ReceiptStorageService`, `AffiliatePayout` | [L121-L157](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliatePayoutService.php#L121-L157) |
| `backend/app/Models/AffiliatePayout.php` | **Modified** — fillable L26 (+receipt fields), transitions L97/L118 reused | FR-005 receipt columns (#8,#11) | M2 | [L26-L124](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/AffiliatePayout.php#L26-L124) |
| `backend/app/Services/AffiliateCoPrizeService.php` (+`…Interface.php`) | **Modified** — `releaseCoPrize` L83; `adjudicateCoPrizeRevocation` L153 | FR-011/012: gated release wrapper, `available` precondition (#19) | `ApprovalRegistryService` read-only use | [L83-L186](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeService.php#L83-L186) · [Interface](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/AffiliateCoPrizeServiceInterface.php) |
| `backend/app/Services/PlatformSettingsService.php` | **Modified** — `set` L36 | FR-007: typed key validation (no allow-list today) (#24) | — | [L17-L51](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Services/PlatformSettingsService.php#L17-L51) |
| `backend/app/Providers/AppServiceProvider.php` | **Modified** — Gates L37–L53 | FR-002: sixth Gate from `AdminCapabilities::ALL`; `RateLimiter::for('admin')` (#1) | `AdminCapabilities` | [L34-L53](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Providers/AppServiceProvider.php#L34-L53) |
| `backend/routes/api.php` | **Modified** — `v1` group L23 | 30 admin routes under `/api/v1/admin` (#39) | controllers, middleware | [L23-L87](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/routes/api.php#L23-L87) |
| `backend/bootstrap/app.php` | **Modified** — middleware L14, exceptions L17–L34 | middleware aliases; 403/409/422 JSend renders (#45) | new exceptions | [L14-L34](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/bootstrap/app.php#L14-L34) |
| `backend/app/Models/Draw.php` | **Modified** — fillable L22, casts L39, scopes L91–L126 | FR-013: `published()` scope, new columns, seed immutability guard (#26,#32) | M1 | [L22-L126](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Models/Draw.php#L22-L126) |
| `backend/app/Http/Controllers/DrawController.php` | **Modified** — L22, L39 | hide drafts (#31) | M1, `Draw::published` | [L18-L45](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/DrawController.php#L18-L45) |
| `backend/app/Http/Controllers/TicketController.php` | **Modified** — L39–L42 | hide drafts (#31) | M1 | [L39-L42](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/TicketController.php#L39-L42) |
| `backend/app/Http/Controllers/ActivityController.php` | **Modified** — L35 | hide drafts (#31) | M1 | [L35](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/ActivityController.php#L35) |
| `backend/app/Http/Controllers/AffiliateDashboardController.php` | **Modified** — L131, L211–L212 | FR-008 display (#41) | `PlatformSettingsService` | [L130-L131](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Controllers/AffiliateDashboardController.php#L130-L131) |
| `backend/app/Http/Resources/DrawResource.php`, `DrawWinnerResource.php` | **Modified** — `toArray` L15 / L15 | additive `seed_commitment` / `seed_verification` (public delta) | M1 | [DrawResource.php#L15-L36](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Resources/DrawResource.php#L15-L36) · [DrawWinnerResource.php#L15](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Http/Resources/DrawWinnerResource.php#L15) |
| `backend/app/Console/Commands/GrantAdminCapabilityCommand.php` / `RevokeAdminCapabilityCommand.php` | **Modified** — L26–L91 / L31–L68 | delegate to `AdminCapabilityService`; sixth capability; last-admin guard (#35,#36) | `AdminCapabilityService` | [Grant#L41-L98](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Console/Commands/GrantAdminCapabilityCommand.php#L41-L98) · [Revoke#L31-L75](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/app/Console/Commands/RevokeAdminCapabilityCommand.php#L31-L75) |
| `backend/phpunit.xml` | **Modified** — L25–L26 | T-INFRA-1 test DB isolation (#44) | `knzin_test` DB (operator action) | [L25-L26](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/phpunit.xml#L25-L26) |
| `backend/config/filesystems.php` | **Modified** — after L59–L71 | `payout-receipts` private disk (#40) | — | [L59-L71](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/config/filesystems.php#L59-L71) |
| `backend/tests/Feature/AffiliatePayoutLifecycleTest.php` | **Test (modified)** — 2 call sites | settle/reject signature (actor+receipt) | payout refactor | [L138](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/tests/Feature/AffiliatePayoutLifecycleTest.php#L138) (`settlePayout(...)`) · [L193](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/backend/tests/Feature/AffiliatePayoutLifecycleTest.php#L193) (`rejectPayout(...)`) — the 2 call sites (verified by grep) |
| `backend/database/migrations/2026_10_03_000001…000005_*.php` | **Migration (NEW)** | M1–M5 (§5) | existing schema per §5 | *NEW — no existing link* |
| `backend/app/Support/AdminCapabilities.php`; `Http/Middleware/{EnsureAdminPrincipal,EnsureAdminCapability,AssignAdminRequestId,AuditAdminFailures}.php`; `Services/Admin/{AdminAuditContext,AdminAuditWriter,AuditRedactor,AdminCapabilityService,DrawLifecycleService,DrawSeedService,PrizeService,PromotionalAwardService,ReceiptStorageService}.php`; `Models/{AdminActivityLog,PromotionalAward}.php`; `Http/Controllers/Admin/*`; `Http/Requests/Admin/*`; `Http/Resources/Admin/*`; `Exceptions/{AdminStateConflict,LastAdminLockout,CoPrizeApprovalsIncomplete,ProtectedField,ImmutableAudit,PayoutStateConflict}Exception.php` | **New** | gaps G1–G6, G9, G11, G12 (§4); each justified in plan Complexity Tracking | per §16 graph | *NEW — no existing link* |
| `backend/tests/Feature/Admin/*` (17 files) + `tests/Feature/PublicDrawVisibilityTest.php` + `tests/Unit/{AuditRedactorTest,DrawSeedServiceTest}.php` + `AdminAffiliateReadTest` | **Test (new)** | plan §13 mapping | features above | *NEW* |
| `frontend/src/lib/api-client.ts` | **Modified** — L45–L58 | `FormData` support (#47) | — | [L45-L58](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/lib/api-client.ts#L45-L58) |
| `frontend/src/app/[locale]/layout.tsx` | **Modified** — L49–L64 | `SiteFrame` wrapper (#46) | `SiteFrame` | [L49-L64](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/app/%5Blocale%5D/layout.tsx#L49-L64) |
| `frontend/messages/{ar,en}.json` | **Modified** — L224 + new `admin` ns | remove hardcoded 25% (ICU `{rate}`); admin copy (#42) | — | [ar#L224](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/messages/ar.json#L224) · [en#L224](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/messages/en.json#L224) |
| `frontend/src/components/affiliate/AffiliateDashboardView.tsx`; `AffiliateLedgerTable.tsx`; `frontend/src/app/[locale]/affiliate/page.tsx`; `frontend/src/hooks/useAffiliateDashboard.ts` | **Modified** | dynamic rate (#41–#42) | dashboard `commission_policy` | [View#L63-L64](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/affiliate/AffiliateDashboardView.tsx#L63-L64) · [Ledger#L77](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/components/affiliate/AffiliateLedgerTable.tsx#L77) · [page#L17-L18](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/app/%5Blocale%5D/affiliate/page.tsx#L17-L18) · [hook#L28-L54](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/frontend/src/hooks/useAffiliateDashboard.ts#L28-L54) |
| `frontend/src/app/[locale]/admin/**`, `src/components/admin/*`, `src/components/layout/SiteFrame.tsx`, `src/hooks/admin/*`, `src/lib/admin/*`, `src/types/admin.ts`, `src/tests/Admin*.test.ts` | **Frontend (NEW)** | G13; FR-001/022 | backend admin API | *NEW* |
| `DECISIONS.md` | **Documentation (Modified)** | record DEC-007+ (authorization, audit, commitment, rate amendment); fixes ER-7 (#52) | — | [L84](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/DECISIONS.md#L84) |
| `specs/008-admin-panel/spec.md` | **Documentation (Modified, LOCAL ONLY)** | apply errata ER-1…ER-9 before tasks | — | LOCAL ONLY |
| `specs/006-affiliate-engine/spec.md` | **Documentation (Modified)** | record the single approved commission-rate amendment | — | [L314-L317](https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/specs/006-affiliate-engine/spec.md#L314-L317) — "Ratified Policy: 25%" and `intdiv($cents * 2500, 10000)` (tracked: `git ls-files` confirms `specs/006-affiliate-engine/spec.md`) |

### 9.2 Likely changes (strong reason; may be absorbed elsewhere)

| File | Reason | What decides the final path |
|---|---|---|
| `backend/tests/Feature/DrawApiTest.php`, `AffiliateDashboardContractTest.php` | additive-field / rate assertions may require fixture or assertion updates | run existing suite on `knzin_test` after M1/dynamic-rate; edit only if red |
| `backend/tests/Feature/AffiliateCommissionFulfillmentTest.php` | only if it asserts the config-sourced rate | read the test during task execution |
| `backend/config/knzin.php` (L32–L37) | add `admin.session_max_age_minutes`; `commission_rate_bps` stays as *baseline* | may be solved with `config('sanctum.expiration')` + env only |
| `backend/.env.example` | document new env keys (`PAYOUT_RECEIPTS_DISK`, admin session age) | only if env keys are introduced |
| `frontend/src/types/draws.ts`, `frontend/src/hooks/useDraws.ts`, `frontend/src/components/draws/{DrawCard,ConcludedDrawsList}.tsx` | show public commitment/verification | depends on whether product wants it on the card vs. a dedicated verify page (**PO preference**, not a decision blocker) |

### 9.3 Possible changes — **not in the execution plan**

| Item | Investigation that decides |
|---|---|
| **M6** ledger index | `EXPLAIN` on the co-prize queue at synthetic volume (U-5); add only if a full scan is shown |
| `promotional_awards` void columns | PO decision D-4 |
| Making `maturation_hours` editable | Excluded — Feature 006 frozen 24 h rule (already decided; not a PO question; gate-review GC-1/GC-9) |
| A production owner for `awardCoPrize`/winner creation | PO decision D-2 / future feature |
| DB-grant hardening on `admin_activity_logs` | production DBA capability (U-2) |
| Malware scanning of receipts | availability in hosting stack (U-6) |

---

## 10. Final Evidence Quality Check

| Check | Result |
|---|---|
| Major architectural claims have evidence | ✅ Evidence Table #1–#54; proposals explicitly tagged **E5** |
| Existing-file references have pinned permalinks | ✅ SHA-pinned; **remaining file-level-only links** (symbols not line-pinned; pin in `/speckit-tasks`): `TicketMintingService`/`Ticket`, `AffiliateCoPrizeServiceInterface`, `AGENTS.md` §32, several `components/ui/*` files |
| Untracked/local-only files identified | ✅ §1 (all of `specs/008-admin-panel/**`, `backend/.env`) |
| No fabricated URLs/SHAs | ✅ owner/repo from `git remote -v`; SHA from `git rev-parse`; **remote presence of the SHA proven with `git ls-remote`** |
| No fabricated line numbers | ✅ every anchor taken from grep/`Select-String` output on 2026-10-03 at HEAD `c0042c5` with a clean tracked tree; ranges only where both ends observed (a few range *ends* are the next observed symbol, e.g. #7 `L121-L157`) |
| No unsupported "doesn't exist" claims | ✅ §4 states search scope (163 tracked files in 5 backend dirs; frontend scope stated separately) |
| Planned file has a reason | ✅ §9 |
| High-risk ops point to authoritative existing implementation | ✅ §3 (payouts, co-prize, approvals, settings, attribution) |
| Requirement has test path | ✅ §8 + plan §13/§18 |

**Known limitations of this index (disclosed, not hidden):**
1. Remote `main` (`2e84e65`) lacks Feature 005/006; the SHA pin is the **only** valid link target until 006 is merged.
2. Line ranges for ER-1…ER-9 rationales that depend on code *not re-opened this pass* (e.g., eligibility predicate in R-07, `DrawController` helper traits) remain documented in [research.md](./research.md) at E3, not re-pinned here.
3. `backend/.env` values were not read; `GOOGLE_AUTH_MOCK`'s runtime value is therefore **Unknown** in this pass (only key presence confirmed). The plan's non-local 503 rule does not depend on it.
4. Tests were not run (test-DB hazard, Evidence #44).

---

# Evidence & Repository Reference Index

Base `B = https://github.com/Muaz-Aldalil/Knzin/blob/c0042c52741a4943fef3442af9b9ad7a5b098d56/` — Commit for every entry: `c0042c52741a4943fef3442af9b9ad7a5b098d56`.

```
 1. backend/app/Providers/AppServiceProvider.php          Purpose: 5 Gates (6th missing)           Lines: 34-53
    URL: B + backend/app/Providers/AppServiceProvider.php#L34-L53
 2. backend/app/Models/User.php                           Purpose: hasCapability/grant/revoke/isVerified  Lines: 135,173-227
    URL: B + backend/app/Models/User.php#L173-L227
 3. backend/app/Models/AdminCapability.php                Purpose: capability record model          Lines: 10,26 (class, fillable)
    URL: B + backend/app/Models/AdminCapability.php
 4. backend/app/Services/PlatformSettingsService.php      Purpose: settings get/set + Gate          Lines: 17-51
 5. backend/app/Services/AffiliateAttributionService.php  Purpose: attribution + snapshot (config defect) Lines: 100-134
 6. backend/app/Services/AffiliateCommissionService.php   Purpose: commission calc/credit/sweep     Lines: 15-45,110
 7. backend/app/Services/AffiliatePayoutService.php       Purpose: payout request/settle/reject     Lines: 49-157
 8. backend/app/Models/AffiliatePayout.php                Purpose: payout state transitions         Lines: 26-124
 9. backend/app/Services/AffiliateCoPrizeService.php      Purpose: co-prize award/release/revoke    Lines: 21-186
10. backend/app/Services/AffiliateCoPrizeServiceInterface.php  Purpose: contract (file-level)       Lines: n/a
11. backend/app/Services/ApprovalRegistryService.php      Purpose: approvals by capability          Lines: 27,129,176,243-261
12. backend/app/Models/ApprovalRecord.php                 Purpose: approval write barrier + isFresh Lines: 22,121
13. backend/app/Services/CoPrizeApprovalState.php         Purpose: isFullyApproved                  Lines: 34
14. backend/app/Services/DatabaseCoPrizeApprovalProvider.php Purpose: approval state provider      Lines: 14
15. backend/app/Services/OrderService.php                 Purpose: order+attribution transaction    Lines: 23-111
16. backend/app/Models/AffiliateLedgerEntry.php           Purpose: append-only ledger guards        Lines: 58-83
17. backend/app/Models/ReferralAttribution.php            Purpose: snapshot model                   Lines: 25-45
18. backend/app/Models/{Draw,Prize,DrawWinner,Ticket}.php Purpose: draw domain models               Lines: Draw 22-126; Prize 19-36; DrawWinner 19-35
19. backend/app/Http/Controllers/DrawController.php       Purpose: public draws API                 Lines: 18-45
20. backend/app/Http/Controllers/TicketController.php     Purpose: user tickets/draw windows        Lines: 39-42
21. backend/app/Http/Controllers/ActivityController.php   Purpose: activity feed                    Lines: 35
22. backend/app/Http/Controllers/AffiliateDashboardController.php Purpose: dashboard/ledger (sweep, 25%) Lines: 21-26,130-131,145-150,211-212
23. backend/app/Http/Controllers/AuthController.php       Purpose: guest + Google(mock) auth        Lines: 21-51,71-81
24. backend/app/Console/Commands/{Grant,Revoke,Bootstrap}AdminCapabilityCommand.php  Lines: 41-98 / 31-75 / 59-78
25. backend/app/Console/Commands/SimulateCoPrizeAwardCommand.php Purpose: sole awardCoPrize caller  Lines: 52
26. backend/routes/api.php                                Purpose: routes (no admin)                Lines: 23-87
27. backend/bootstrap/app.php                             Purpose: middleware/exception wiring      Lines: 14-34
28. backend/config/{filesystems,sanctum,knzin}.php        Purpose: private disk / token TTL / affiliate baseline  Lines: 59-71 / 53 / 32-37
29. backend/phpunit.xml                                   Purpose: test DB hazard                   Lines: 25-26
30. backend/database/migrations/2026_09_29_000001_create_users_table.php            Lines: 14-26
31. backend/database/migrations/2026_09_29_000007_create_draws_table.php            Lines: 14-27
32. backend/database/migrations/2026_09_29_000008_create_prizes_table.php           Lines: 14-25
33. backend/database/migrations/2026_09_29_000009_create_draw_winners_table.php     Lines: 14-23
34. backend/database/migrations/2026_09_30_000001_enforce_financial_and_draw_invariants.php  Lines: 20-53
35. backend/database/migrations/2026_10_01_000002_create_tickets_table.php          Lines: 14-27
36. backend/database/migrations/2026_10_02_000001_create_platform_settings_table.php Lines: 14-20
37. backend/database/migrations/2026_10_02_000003_create_affiliate_payouts_table.php Lines: 15-34
38. backend/database/migrations/2026_10_02_000004_create_referral_attributions_table.php Lines: 15-33
39. backend/database/migrations/2026_10_02_000005_create_affiliate_ledger_entries_table.php Lines: 14-32
40. backend/database/migrations/2026_10_02_000006_create_admin_capabilities_table.php Lines: 14-29
41. backend/database/migrations/2026_10_02_000007_create_approval_records_table.php Lines: 14-34
42. backend/tests/Feature/AdminPlatformSettingsAuthorizationTest.php                Lines: 267 (no HTTP bootstrap)
43. frontend/src/app/[locale]/layout.tsx  (URL-encode as %5Blocale%5D)               Lines: 49-64
44. frontend/src/lib/api-client.ts                        Lines: 45-58
45. frontend/src/hooks/{useAuth,useAffiliateDashboard,useDraws}.ts                  Lines: 16-64 / 28-58 / 8
46. frontend/src/i18n/routing.ts, frontend/src/middleware.ts                        Lines: 5-6 / 5-35
47. frontend/src/components/ui/dialog.tsx, sheet.tsx, button.tsx, badge.tsx, tabs.tsx, card.tsx  (file-level)
48. frontend/src/components/affiliate/{AffiliateDashboardView:63-64, AffiliateLedgerTable:77, PayoutRequestModal}.tsx
49. frontend/src/components/draws/{DrawCard:19, ConcludedDrawsList:14}.tsx ; frontend/src/types/draws.ts:10
50. frontend/messages/{ar,en}.json                         Lines: 224
51. frontend/package.json                                 Lines: 10 (test script)
52. .specify/memory/constitution.md                       Lines: 67-98 (VII-X), 160 (v3.2.0)
53. DECISIONS.md                                          Lines: 11-84 (DEC-001…DEC-006)
54. AGENTS.md                                             Purpose: engineering/authority rules, §32 delegation
    (all: URL = B + path [+ #Lstart-Lend])

LOCAL ONLY
Path: specs/008-admin-panel/{spec.md, plan.md, research.md, data-model.md, quickstart.md, evidence-index.md, contracts/*, checklists/requirements.md}
Reason no remote permalink exists: untracked (`?? specs/008-admin-panel/`; `git ls-files specs/008-admin-panel` = 0)

LOCAL ONLY
Path: backend/.env
Reason no remote permalink exists: git-ignored (`backend/.gitignore:8:.env`); contains secrets; never linked or quoted
```
