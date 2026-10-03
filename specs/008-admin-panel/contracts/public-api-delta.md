# Contract: Public API Delta — Feature 008

All changes are additive or visibility-only **except two value-level changes inside existing fields** (both type-compatible, both flagged): `sales_commission_rate_percent` source (§4) and effective draw `status` `active` for in-window published draws (gate-review GC-7/GC-11, requires fixture + frontend verification). No existing public field is removed, renamed, or re-typed. Evidence base: `DrawController`, `DrawResource`, `DrawWinnerResource`, `AffiliateDashboardController`, `TicketController`, `ActivityController`, `specs/003-draws-arena-countdown/contracts/*.json`, `DrawApiTest`.

## 1. Draw visibility (behavioral, non-breaking)
Private drafts (`is_published = 0`) are excluded from **all four** public consumers:

| Consumer | File (evidence) | Change |
|---|---|---|
| `GET /api/v1/draws/active` | `DrawController::active` | `Draw::published()->rollingWindow()` |
| `GET /api/v1/draws/concluded` | `DrawController::concluded` | `Draw::published()->concluded()…` |
| `GET /api/v1/user/tickets` (draw selection) | `TicketController` ~L39 | add `->published()` (else a draft would win `firstWhere('tier')`) |
| `GET /api/v1/activity/recent` | `ActivityController` ~L35 | add `->published()` |

Legacy/seeded draws default to `is_published = 1` ⇒ **no observable change** for existing data.

## 2. `GET /draws/active` — additive field
Each draw object gains:
```json
"seed_commitment": { "server_seed_hash": "<64-hex>", "committed_at": "<ISO-8601>" }   // null for legacy uncommitted draws
```
Verification recipe (published in the Hall-of-Fame help text): `server_seed_hash == SHA256(server_seed_revealed)` where the seed is the **64-character lowercase hex string** (ASCII), per Constitution IX.

## 3. `GET /draws/concluded` — additive field
```json
"seed_verification": { "server_seed_hash": "<hex>", "server_seed_revealed": "<64-hex>|null", "revealed_at": "<ISO>|null" }
```
`server_seed_revealed` is non-null **only** after `DrawSeedService::reveal` (status `completed` + canonical winner). `server_seed_encrypted` is never serialized anywhere.

## 4. `GET /affiliate/dashboard` — value source change (field retained)
`data.commission_policy.sales_commission_rate_percent` changes from the literal `25` to the **active** rate (`commission_rate_bps / 100`, number). Type unchanged. `maturation_hold_hours` unchanged (frozen, config).

## 5. `GET /affiliate/ledger` — description text
`sales_commission` rows: `description_ar/en` render that entry's **snapshotted** rate (from `referral_attributions.commission_rate_bps` via `order_id`), not the live rate, and fall back to a rate-less wording if no attribution is found. Field names/types unchanged.

## 6. Compatibility test obligations
`DrawApiTest` + contract JSON schemas updated to *permit* the new optional fields; new `PublicDrawVisibilityTest` asserts drafts are absent from all four consumers; `AffiliateDashboardContractTest` asserts the field exists with numeric type.
