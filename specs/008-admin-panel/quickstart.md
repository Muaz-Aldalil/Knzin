# Quickstart: Feature 008 — Validation Guide

Validation/run guide only. Implementation detail lives in `tasks.md` (not yet generated). Contracts: [`contracts/admin-api.md`](./contracts/admin-api.md), [`contracts/public-api-delta.md`](./contracts/public-api-delta.md). Schema: [`data-model.md`](./data-model.md).

## 0. Prerequisites
1. MariaDB/MySQL running (XAMPP) and reachable at `127.0.0.1:3306`.
2. **Dedicated test DB (Task #1, before anything else)**: operator creates an empty `knzin_test` (`utf8mb4_unicode_ci`); `phpunit.xml` forces `DB_DATABASE=knzin_test`; `TestDatabaseGuard` runs in `tests/TestCase::createApplication()` (before `RefreshDatabase` can wipe anything) and aborts unless the resolved DB name ends with `_test`; verify with the unit guard test + read-only `SELECT DATABASE()` smoke test **before** running any `RefreshDatabase` test. *Never run PHPUnit against `knzin_db`.* Dev DB credentials are not changed.
3. Branch `008-admin-panel` cut from `006-affiliate-engine@c0042c5`.
4. `.env`: `GOOGLE_AUTH_MOCK=true` is acceptable **only** for local/testing; any other environment must be `false` or admin routes return 503.
5. Two seeded verified admin accounts (needed because self-grant is forbidden): `admin-a` (bootstrap via `knzin:bootstrap-admin`), `admin-b` (granted by A).
6. `PAYOUT_RECEIPTS_DISK=local` (private) for local runs.

## 1. Commands
```powershell
# backend
php artisan test --filter=TestDatabaseGuard             # Task #1 verification FIRST (pure unit, touches no DB)
php artisan test --filter=Admin                          # new admin suites
php artisan test                                         # full regression (006/005/003 must stay green)
php artisan route:list --path=api/v1/admin               # eyeball capability middleware column
# frontend
cd frontend; npm test; npm run lint; npm run build
```

## 2. Scenario checklist (each maps to tests in plan §13)
| # | Scenario | Expected |
|---|---|---|
| S1 | Account with only `manage_platform_settings` calls `/payouts/{n}/settle`, `/coprizes/*`, `/users`, `/audit-logs` | 403 each; nav shows only Settings/Draws/Awards/Affiliates(read) |
| S2 | Guest-provider account holding a capability calls any admin route | 403 (`admin.principal`) |
| S3 | `PATCH /settings {commission_rate_bps:3000}` → create referred order → fulfil | new `referral_attributions.commission_rate_bps = 3000`; earlier attribution still 2500; earlier ledger rows untouched |
| S4 | Change rate **between** order creation and fulfilment | commission uses the **snapshot** |
| S5 | Settle payout with reference + receipt | payout `completed`, exactly the `payout_debit_{n}` entry `cleared`, file on private disk, audit `payout.settled`; same call again (same reference) ⇒ 200 idempotent replay, no 2nd ledger/audit success row (replay audit outcome `replay`); different reference ⇒ 409 |
| S6 | Settle without receipt / without MTCN | 422, zero state change |
| S7 | Reject completed payout / settle rejected payout | 409, zero ledger change (regression of Confirmed Defect); settle-completed and reject-rejected are idempotent replays; concurrent settle/reject ⇒ exactly one wins |
| S8 | Reject requested payout | `reversal_credit` appended; original `payout_debit` row intact; available balance restored |
| S9 | Force `AdminAuditWriter` to throw during settle | payout still `requested`, ledger unchanged, receipt file deleted, 5xx |
| S10 | Release co-prize with only KYC approved | 409 `ERR_COPRIZE_APPROVALS_INCOMPLETE`; entry `pending` |
| S11 | Both approvals current-valid → release | `available`; winner prize untouched |
| S12 | Revoke approval then release | 409; supersede with new approved version ⇒ release succeeds |
| S13 | Create draw | `is_published=0`; absent from `/draws/active`, `/draws/concluded`, `/user/tickets`, `/activity/recent` |
| S14 | Publish | `server_seed_hash` present & public, `seed_committed_at < starts_at`; second publish ⇒ 409; `PATCH` seed fields ⇒ 422 |
| S15 | Publish with `starts_at` in the past | 409/422 (commitment must precede accumulation); a failure injected mid-publish leaves the draw an unpublished draft with no seed columns set |
| S16 | Edit title/broadcast URL/prize text on an **active** draw | succeeds + audit |
| S17 | Edit `tier` after `starts_at`; edit `winning_ticket_serial`; edit `starts_at`/`ends_at` while a `draw_winners` row exists | rejected; whereas editing `starts_at`/`ends_at` on a live draw with no winner (subject only to `ends_at > starts_at`, `starts_at >= seed_committed_at`) succeeds + audit |
| S18 | Complete draw without an existing canonical winner row | 409 `ERR_CANONICAL_RESULT_MISSING`, nothing created; with an externally created winner row ⇒ completed + seed revealed; `sha256(revealed) == hash`; the Admin Panel never inserts a `draw_winners` row |
| S18b | Published draw with `starts_at <= now < ends_at` on public/admin reads | effective status `active` on `/draws/active`, `/user/tickets`, admin list; stored column unchanged; `now >= ends_at` ⇒ `locked`; `completed` ⇒ `completed` |
| S19 | Grant promotional award | `promotional_awards` row; `draw_winners`, `tickets`, `affiliate_ledger_entries` counts unchanged |
| S20 | Admin grants capability to self | 403 `ERR_SELF_GRANT_FORBIDDEN` |
| S21 | Revoke `manage_admin_capabilities` from the only holder; two admins revoking each other concurrently | 409 `ERR_LAST_ADMIN_LOCKOUT`; never zero holders |
| S22 | Open Audit Viewer as non-`manage_admin_capabilities` | 403; as holder: filtered, paginated, redacted (no `recipient_details`, receipt path, seeds) |
| S23 | `route:list` | no URI containing `bootstrap` under admin |

## 3. UI verification matrix (scripted browser pass at implementation)
Viewports **1280 / 768 / 390 px** × locales **ar (RTL) / en (LTR)** × themes **light/dark** for: Dashboard, Settings, Payouts (list + settle dialog), Co-prizes, Approvals, Draws (list/edit/publish), Awards, Users, Audit. Pass criteria: zero horizontal overflow, no physical `left/right/ml/mr/pl/pr` utilities in admin components, `<bdi>` around emails/IDs/MTCN/amounts, ≥44 px touch targets, visible focus rings, dialogs trap focus and close on Esc, loading/empty/error states present, destructive actions require explicit confirmation.

## 4. Done criteria
All S1–S23 green; full backend + frontend suites green; migrations reversible on `knzin_test` (`migrate:rollback --step=5` then `migrate`); `/speckit-converge` shows zero unbuilt requirements.
