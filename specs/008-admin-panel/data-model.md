# Data Model: Feature 008 — Admin Panel (Phase 1)

**Convention**: all migrations are **additive (expand-only)**, reversible, InnoDB, `utf8mb4_unicode_ci`, explicit FKs, named indexes/constraints (Constitution *Database Migration Gate*). File names use the `2026_10_03_0000NN_*` series. CHECK constraints follow the pattern already relied upon by existing migrations (`DB::statement('ALTER TABLE … ADD CONSTRAINT … CHECK …')`).

---

## 1. Migration Inventory (ordered)

| # | Migration | Change | Existing data |
|---|---|---|---|
| M1 | `2026_10_03_000001_add_publication_and_seed_commitment_to_draws_table` | add draw publication + commitment columns, CHECKs, index | additive; existing rows get `is_published = 1`, seed columns `NULL` |
| M2 | `2026_10_03_000002_add_receipt_columns_to_affiliate_payouts_table` | `receipt_path`, `receipt_sha256`, plain (non-unique) index on `admin_reference_number` | additive; nullable |
| M3 | `2026_10_03_000003_create_admin_activity_logs_table` | new audit table | n/a |
| M4 | `2026_10_03_000004_create_promotional_awards_table` | new table | n/a |
| M5 | `2026_10_03_000005_constrain_admin_capabilities_to_approved_set` | `CHECK capability IN (six)` | pre-flight: existing rows ⊆ the five defined; passes |
| M6 | `2026_10_03_000006_add_ledger_indexes_for_admin_queues` *(optional, only if EXPLAIN justifies)* | `(entry_type, status, created_at)` on `affiliate_ledger_entries` for co-prize queue | n/a |

No migration touches `affiliate_ledger_entries` data, `referral_attributions`, `tickets`, `draw_winners` rows, `approval_records`, or `platform_settings` rows. **No backfill rewrites any financial or historical row.**

---

## 2. Table changes

### 2.1 `draws` (M1) — *Extend Existing*

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `is_published` | `BOOLEAN` | NO | **1** | Private Draft = `0`. Default `1` preserves current public behavior for every existing row and existing fixtures (see research R-08). |
| `published_at` | `TIMESTAMP` | YES | NULL | provenance; NULL for legacy rows |
| `published_by_user_id` | `CHAR(36)` FK→`users.id` `nullOnDelete` | YES | NULL | provenance |
| `server_seed_hash` | `CHAR(64)` | YES | NULL | public commitment (hex SHA-256) |
| `server_seed_encrypted` | `TEXT` | YES | NULL | `Crypt` ciphertext of 64-char hex seed; hidden from all serialization |
| `seed_committed_at` | `TIMESTAMP` | YES | NULL | commitment time |
| `server_seed_revealed` | `CHAR(64)` | YES | NULL | set once, post-conclusion |
| `seed_revealed_at` | `TIMESTAMP` | YES | NULL | |

Constraints / indexes:
- `chk_draws_draft_is_upcoming`: `CHECK (is_published = 1 OR status = 'upcoming')`
- `chk_draws_seed_atomic`: `CHECK ((server_seed_hash IS NULL AND server_seed_encrypted IS NULL AND seed_committed_at IS NULL) OR (server_seed_hash IS NOT NULL AND server_seed_encrypted IS NOT NULL AND seed_committed_at IS NOT NULL))`
- `chk_draws_seed_hash_len`: `CHECK (server_seed_hash IS NULL OR CHAR_LENGTH(server_seed_hash) = 64)`
- `chk_draws_reveal_requires_commit`: `CHECK (server_seed_revealed IS NULL OR server_seed_hash IS NOT NULL)`
- `idx_draws_published_status_tier (is_published, status, tier)` — serves public queries.
- *Optional hardening (verify on target engine, U-2)*: `CHECK (server_seed_revealed IS NULL OR SHA2(server_seed_revealed,256) = server_seed_hash)`. Service-level `hash_equals` verification + test is the **required** control.
- *Deliberately not added*: `published ⇒ commitment NOT NULL` — would reject legacy published rows; enforced by `DrawLifecycleService::publish` + model guard + tests instead.

Model changes: `Draw::$fillable` += `is_published`; seed columns **not** fillable, in `$hidden`; `casts`: `is_published bool`, `published_at/seed_committed_at/seed_revealed_at datetime`, `server_seed_encrypted` **not** auto-decrypted (decrypted only inside `DrawSeedService`); `scopePublished`; `updating` guard on commitment columns; **`computeEffectiveStatus()` extended (gate-review GC-7): stored `upcoming` + published + `starts_at <= now < ends_at` ⇒ `active`** (value-level change inside the existing enum; fixtures/frontend verification required).

Rollback: `down()` drops columns/constraints. **Point of no return = first publication** (commitments would be destroyed) ⇒ after that, forward-fix only (see plan §14).

### 2.2 `affiliate_payouts` (M2) — *Extend Existing*

| Column | Type | Null | Notes |
|---|---|---|---|
| `receipt_path` | `VARCHAR(255)` | YES | private-disk key, never exposed in APIs/audit |
| `receipt_sha256` | `CHAR(64)` | YES | file-identity evidence, audit-safe |
| plain index `idx_affiliate_payouts_admin_reference (admin_reference_number)` | | | lookup only; **no uniqueness rule** (a reused reference is not a PO rule; surfaced as an audit warning — gate-review GC-16/GC-15) |

Add `CHECK ((status <> 'completed') OR (admin_reference_number IS NOT NULL AND receipt_path IS NOT NULL))` **only for rows created after M2** is not expressible without breaking legacy completed rows ⇒ enforced in `AffiliatePayoutService::settlePayout` (required params) + test. Model `$fillable` += `receipt_path`, `receipt_sha256`; both in `$hidden`.

### 2.3 `admin_activity_logs` (M3) — **New**

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `BIGINT UNSIGNED` PK AI | NO | keyset pagination key |
| `request_id` | `CHAR(36)` | NO | from `X-Request-Id` or generated |
| `actor_user_id` | `CHAR(36)` FK→`users.id` `nullOnDelete` | YES | NULL for 401 |
| `capability_used` | `VARCHAR(64)` | YES | one of the six or NULL |
| `action` | `VARCHAR(64)` | NO | e.g. `payout.settled` |
| `target_type` | `VARCHAR(64)` | YES | `payout`,`draw`,`user`,`setting`,… |
| `target_id` | `VARCHAR(64)` | YES | |
| `outcome` | `VARCHAR(16)` | NO | `success`,`denied`,`rejected`,`conflict`,`failed`,`replay` (idempotent no-op) |
| `reason_code` | `VARCHAR(64)` | YES | e.g. `ERR_FORBIDDEN` *(ER-9)* |
| `administrative_justification` | `VARCHAR(500)` | YES | operator-supplied reason |
| `before_state` | `JSON` | YES | allow-listed + redacted |
| `after_state` | `JSON` | YES | allow-listed + redacted |
| `ip_hash` | `CHAR(64)` | YES | salted SHA-256 (same salt scheme as `referral_attributions`) *(ER-9)* |
| `created_at` | `TIMESTAMP` | NO | server-generated; no `updated_at` |

Indexes: `idx_aal_created (created_at)`, `idx_aal_actor_created (actor_user_id, created_at)`, `idx_aal_action_created (action, created_at)`, `idx_aal_target (target_type, target_id)`, `idx_aal_outcome_created (outcome, created_at)`, `uq_aal_request_success (request_id, outcome)` is **not** used (a request may legitimately log one row only; enforced in code).
Model: `updating`/`deleting` throw `ImmutableAuditException`; `$timestamps = false`; no `$fillable` exposure through any request path (rows built only by `AdminAuditWriter`).

### 2.4 `promotional_awards` (M4) — **New**

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `BIGINT UNSIGNED` PK AI | NO | |
| `recipient_user_id` | FK→`users.id` `restrictOnDelete` | NO | |
| `draw_id` | FK→`draws.id` `restrictOnDelete` | YES | optional provenance |
| `award_title` | `VARCHAR(150)` | NO | |
| `award_details` | `TEXT` | YES | |
| `valuation_usd_cents` | `BIGINT UNSIGNED` | YES | integer cents; `CHECK >= 0` |
| `reason` | `VARCHAR(500)` | NO | administrative reason |
| `awarded_by_admin_id` | FK→`users.id` `restrictOnDelete` | NO | |
| `created_at` | `TIMESTAMP` | NO | append-only (no `updated_at`) |

Indexes: `idx_promo_awards_recipient (recipient_user_id, created_at)`, `idx_promo_awards_draw (draw_id)`.
Isolation: **no FK to `draw_winners`/`tickets`/`affiliate_ledger_entries`**; service has no write path to them; test asserts row counts unchanged.

### 2.5 `admin_capabilities` (M5) — *Extend Existing*
`chk_admin_capabilities_approved_set`: `CHECK (capability IN ('manage_admin_capabilities','manage_platform_settings','adjudicate_affiliate_coprize','issue_kyc_approval','issue_draw_audit_approval','settle_affiliate_payout'))`. Down: drop constraint.

### 2.6 Tables **not** changed (explicit)
`platform_settings` (rows only, via service), `referral_attributions` (column default left at 2500; values snapshotted by app), `affiliate_ledger_entries` (append-only; zero schema/data change), `approval_records`, `draw_winners` (schema unchanged), `prizes` (schema unchanged), `tickets`, `ticket_sequences`, `users`.

---

## 3. Draw & Prize Field Classification (evidence for every restriction)

Legend: **OE** operationally editable · **CP** cryptographically protected · **IH** immutable historical evidence · **DS** derived/system-controlled · **FA** financially authoritative · **TC** transition-controlled.

### `draws`
| Field | Class | Rule | Evidence |
|---|---|---|---|
| `id`, `created_at` | IH | never | PK/provenance |
| `tier` | SPEC-FROZEN | rejected when stored status `completed` or `now >= starts_at` (stored schedule, pre-edit) | spec FR-014 ("active draw `tier`") + US6 AC4 |
| `execution_type` | OE | stored status ≠ `completed` | spec FR-014 scope; display (`DrawResource` badge only) |
| `title_ar/en`, `broadcast_url` | OE | stored status ≠ `completed` | spec US6 AC3 (titles, URLs) |
| `starts_at` | OE | editable in any state incl. active/locked. Checks: `starts_at < ends_at`; if a seed is committed, `starts_at >= seed_committed_at` (same invariant as "commit before accumulation"); read-only only while a `draw_winners` row exists (**gate-review GC-7.2 wins**) | Constitution IX step 1; FR-014 "ticket allocations/canonical winner records"; eligibility = `[starts_at, ends_at)` |
| `ends_at` | OE | editable in any state incl. active/locked. Checks: `ends_at > starts_at`; read-only only while a `draw_winners` row exists. No other freeze (earlier "frozen once `now >= ends_at`" deleted). Audit records affected-ticket count | eligibility window + `computeEffectiveStatus`; Constitution IX steps 3-4 (**gate-review GC-7.2 wins**) |
| `status` | TC | Stored enum in DB already contains `['upcoming', 'active', 'locked', 'completed']` (migration `2026_09_29_000007_create_draws_table.php`). Preserved without schema modification. Admin API allows transition `upcoming` (create) → `completed` via `POST /draws/{id}/complete` (requires canonical winner). Dynamic effective status `computeEffectiveStatus()` derives `locked` when `ends_at <= now` and derives `active` when published and `starts_at <= now < ends_at`. | `Draw::computeEffectiveStatus`, migration 2026_09_29_000007 |
| `is_published` | TC | one-way `0→1` via publish | commitment already public ⇒ no un-publish |
| `published_at/by` | IH | set once | provenance |
| `total_eligible_tickets` | DS | not writable by admin | no writer in app; read by `DrawResource` |
| `server_seed_hash`, `server_seed_encrypted`, `seed_committed_at` | CP | set once in publish tx; never editable | Constitution IX |
| `server_seed_revealed`, `seed_revealed_at` | CP/DS | set once by `DrawSeedService::reveal` after completion + winner | Constitution IX step 4 |

### `prizes`
| Field | Class | Rule | Evidence |
|---|---|---|---|
| `title_*`, `description_*`, `display_iqd_label`, `image_url` | OE | until draw `completed` | display |
| `valuation_usd_cents`, `category` | OE | stored draw status ≠ `completed`; **no winner-based freeze** (removed: `awardCoPrize` takes the valuation as a parameter, no repository coupling to `prizes`) | `AffiliateCoPrizeService::awardCoPrize` L23/L68; `Prize.php` |
| `draw_id` | IH | never | FK |
| delete | OE | Deletable under `manage_platform_settings` per broad operational editing authority (FR-014). (`draw_winners` table has no `prize_id` column; no winner-bound restriction exists in schema or spec). | spec FR-014 broad operational editing; migration 2026_09_29_000008 |

### `draw_winners`
| Field | Class | Rule | Evidence |
|---|---|---|---|
| `winning_ticket_serial`, `draw_id`, `drawn_at`, `id` | IH | never editable; **no create endpoint** (no arbitrary winner minting; production winner ownership not proven by repository evidence) | unique `uq_draw_winners_*`; `DatabaseCoPrizeApprovalProvider` keys off serial/draw |
| `winner_masked_name`, `winner_governorate`, `prize_delivered`, `stream_recording_url` | OE | editable after draw conclusion | spec US6 AC5; display/logistics metadata |

---

## 4. State Machines

### 4.1 Draw lifecycle
```
Private Draft (is_published=0, status=upcoming)
   └─ publish [manage_platform_settings; tx: lock → seed → hash → commit → is_published=1]
Public Upcoming (is_published=1, status=upcoming)
   └─ time passes (starts_at) → Active   (effective status via extended `computeEffectiveStatus`; eligibility window opens; no admin write)
Active ── time passes (ends_at) ──▶ Locked   (existing derived behavior: now ≥ ends_at ⇒ effective 'locked')
Locked ── complete [requires draw_winners row; reveals seed in same tx] ──▶ Completed
```
Admin read model exposes computed `lifecycle_stage` (`draft|upcoming|active|locked|completed`); the public status enum is unchanged. Invalid transitions ⇒ `409 ERR_STATE_CONFLICT`. Backward transitions do not exist. *(Corrected by gate-review GC-7: manual `activate`/`lock` removed.)*

### 4.2 Payout (existing, hardened)
Existing valid payout states (`requested` and `processing`) are preserved per `AffiliatePayout.php` (L99, L120). The confirmed defect is ignored transition results in `AffiliatePayoutService`, not the existence of the `processing` state. Both `markCompleted()` and `markRejected()` accept `requested` and `processing`.
- `requested | processing ─(settle: MTCN + receipt)→ completed`
- `requested | processing ─(reject: reason)→ rejected`
- Terminal states (`completed`, `rejected`) reject further transitions (model returns `false` ⇒ service aborts transaction with `409 ERR_PAYOUT_STATE_CONFLICT`). Concurrent settle/reject operations are serialized under `lockForUpdate`. Idempotent replay returns HTTP 200 with `idempotent_replay: true`.

### 4.3 Co-prize ledger credit (existing)
`pending ─(release: KYC ✓ + draw-integrity ✓)→ available`; post-release revoke ⇒ append `reversal_debit` (original untouched). `cancelled` remains a system path (out of admin scope).

### 4.4 Capability
`absent/revoked ─grant→ active ─revoke→ revoked` (row reused; history in audit log).

---

## 5. Audit snapshot allowlists (per action)

| Action | `before_state` / `after_state` keys |
|---|---|
| `settings.updated` | `{key, value}` per changed key |
| `payout.settled` | `{payout_number, status, amount_cents, threshold_cents_at_request}` → `+ {admin_reference_number, receipt_sha256, processed_by_admin_id}` |
| `payout.rejected` | same base → `+ {reason}` ; `reversal_ledger_entry_id` |
| `coprize.released/revoked` | `{ticket_serial, ledger_entry_id, status, amount_cents}` + approval ids/versions |
| `approval.*` | `{approval_id, type, subject_id, status, version}` |
| `draw.*`, `prize.*`, `winner.*` | changed operational fields only; **never** seed material; publish logs `{server_seed_hash, seed_committed_at}` (public by design) |
| `award.granted` | `{award_id, recipient_user_id, draw_id, valuation_usd_cents}` |
| `capability.*` | `{target_user_id, capability, status}` |
Never present in any snapshot: `recipient_details`, `receipt_path`, seeds, tokens, passwords, raw IP/UA.
