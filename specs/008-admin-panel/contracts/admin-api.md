# Contract: Admin API — Feature 008

> **Corrected by `../gate-review.md` (normative, final)**: **30 admin routes**. Removed as redundant / unsupported by spec: `POST /approvals/{id}/supersede`, `GET /audit-logs/{id}`, `POST /draws/{id}/status` (→ `POST /draws/{id}/complete`), `GET /payouts/{n}`, `GET /affiliates/{userId}`, `GET /users/{id}` (list endpoints carry the same fields and accept `payout_number` / `user_id` / exact-UUID filters), `GET /payouts/{payoutNumber}/receipt` (storage of receipt metadata upon settlement verified; streaming download route removed as unsupported by US4), `GET /coprizes/{ticketSerial}` (merged into `GET /coprizes` list which carries full approval provenance and `net_after_reversal` preview), `GET /awards` (US9 defines granting promotional awards via `POST /awards`; no list endpoint required). Co-prize revoke is post-release only with a non-mutating `net_after_reversal` preview; draw-integrity approval has no "draw completed" precondition; settings allow-list = `commission_rate_bps`, `payout_min_cents` only (maturation is a fixed Feature 006 rule); `recipient_details` follows spec US3 AC3 via one `canViewRecipientDetails()` policy; payout `reference_number` has no uniqueness rule; audit is written inside each authoritative service's own transaction (no executor wrapper).

**Base**: `/api/v1/admin` · **Auth**: `Authorization: Bearer <Sanctum token>` · **Envelope**: existing JSend (`{status:'success',data}` / `{status:'fail',code,message,errors?}` / `{status:'error',…}`) via `App\Traits\ApiResponse`.
**Global middleware chain**: `auth:sanctum` → `admin.principal` → `throttle:admin` → `admin.request-id` → `admin.capability:<…>` → controller (builds `AdminAuditContext`) → authoritative service (Gate + own transaction + in-transaction audit) · terminating `AuditAdminFailures`.
**Evidence**: no admin route/controller/middleware exists today (grep `admin` over `backend/routes`, `backend/app/Http`: only a 404-asserting test) ⇒ all **New**.

## Conventions
- IDs: users/draws/prizes = UUID; payouts addressed by `payout_number`; co-prizes by winning ticket serial; ledger/audit by integer id.
- Money: integer cents only (`*_cents`); display strings are server-formatted projections.
- Pagination: lists accept `per_page` (default 25, **max 50**). Offset pagination only for bounded sets (affiliates, users); ledger/audit/payout lists use **cursor** pagination (`cursor`, response `next_cursor`).
- Every mutation accepts optional header `X-Request-Id` (UUID); otherwise generated; echoed in response header and audit row.
- Mutations accept `justification` (≤ 500 chars) where noted; **required** where marked `*`.

## Error semantics (all admin routes)
| HTTP | `code` | Meaning |
|---|---|---|
| 401 | `ERR_UNAUTHORIZED` | no/invalid/expired token (existing handler) |
| 403 | `ERR_FORBIDDEN` | principal invalid **or** capability missing — body never reveals which capability/route schema |
| 403 | `ERR_SELF_GRANT_FORBIDDEN` / `ERR_SELF_SETTLEMENT_FORBIDDEN` | anti-self rules |
| 404 | `ERR_NOT_FOUND` | existing handler |
| 409 | `ERR_STATE_CONFLICT` (+`data.reason`) | invalid/duplicate transition |
| 409 | `ERR_LAST_ADMIN_LOCKOUT` | would remove sole `manage_admin_capabilities` holder |
| 409 | `ERR_COPRIZE_APPROVALS_INCOMPLETE` (+`data.kyc`,`data.draw_integrity` provenance) | release refused |
| 409 | `ERR_CANONICAL_RESULT_MISSING` | draw completion refused: no canonical `draw_winners` row exists |
| 422 | `ERR_VALIDATION` (+`errors`) | validation (FormRequest → JSend) |
| 429 | `ERR_TOO_MANY_REQUESTS` | `throttle:admin` (existing handler) |
| 503 | `ERR_ADMIN_AUTH_UNSAFE_CONFIG` | non-local env with Google mock mode on |

## Session
| Method & Path | Capability | Notes |
|---|---|---|
| `GET /me` | Enforced by `EnsureAdminPrincipal` (requires ≥ 1 active capability of the approved six; no wildcard bypass) | `{user:{id,email,display_name}, capabilities:[…], server_time_utc}`; **UI hint only** — never trusted for authorization |

## Settings — `manage_platform_settings`
| `GET /settings` | → `{commission_rate_bps, commission_rate_percent, payout_min_cents, maturation_hours (read_only), co_prize_rate_bps (read_only), meta:{key:{updated_by_user_id,updated_at}}}` |
|---|---|
| `PATCH /settings` | body `{commission_rate_bps?: int 0..10000 (type/domain validity of a percentage, not a business cap), payout_min_cents?: int ≥0, justification?}`; **unknown/other keys ⇒ 422**; `maturation_hours` & `co_prize_rate_bps` rejected (frozen). Audit `settings.updated` (one row, per-key before/after). Effect: forward-only (see research R-10). |

## Affiliate oversight (read-only) — any-of `manage_platform_settings`,`settle_affiliate_payout`
| `GET /affiliates?search=&user_id=&page=&per_page=` | `{items:[{user_id,referral_code,pending_cents,available_cents,lifetime_earned_cents,pending_payout_count}], meta}`; balances via `AffiliatePayoutService` projections; **no sweep/write on GET**; `user_id` filter serves the affiliate detail page |
|---|---|
| `GET /affiliates/{userId}/ledger?type=&cursor=` | rows `{id,entry_type,amount_cents,status,funding_source,idempotency_key,matures_at,created_at}`; **no mutation routes exist for ledger** |

## Payouts
| `GET /payouts?status=&payout_number=&cursor=` | any-of `manage_platform_settings`,`settle_affiliate_payout` (spec US3). `recipient_details` per spec US3 AC3 via a single `canViewRecipientDetails()` policy (optional privacy tightening = PO call, not default); never in audit rows; also serves the payout detail view |
|---|---|
| `POST /payouts/{payoutNumber}/settle` | `settle_affiliate_payout`. `multipart/form-data`: `reference_number*` (string ≤128, **no uniqueness rule**), `receipt*` (jpg/jpeg/png/webp ≤ 5 MB — engineering limits), `notes?`. Staged to private disk, verified, and referenced in DB. 403 on own payout (security control). Same reference on an already-completed payout ⇒ 200 idempotent replay (`idempotent_replay:true`, zero writes); different reference / rejected payout ⇒ 409. Audit `payout.settled`. (Receipt streaming download removed as unsupported by US4). |
| `POST /payouts/{payoutNumber}/reject` | `settle_affiliate_payout`. JSON `{reason*}` (≤500). Appends `reversal_credit`. Already `rejected` ⇒ 200 idempotent replay; `completed` ⇒ 409. Audit `payout.rejected`. |

## Co-prize — `adjudicate_affiliate_coprize`
| `GET /coprizes?status=&cursor=` | credits of `entry_type=co_prize_credit` with complete approval state provenance (`kyc`,`draw_integrity`: approval_id, version, status, approved_by, revoked_at, superseded_at) and `net_after_reversal` preview |
|---|---|
| `POST /coprizes/{ticketSerial}/release` | → `AffiliateCoPrizeService::adjudicateCoPrizeRelease`; 409 `ERR_COPRIZE_APPROVALS_INCOMPLETE` if refused; idempotent when already `available`. Audit `coprize.released` |
| `POST /coprizes/{ticketSerial}/revoke` | `{justification*, confirm*}` → `adjudicateCoPrizeRevocation` (**post-release only**: requires credit `available`, matches 006 contract); response/preview exposes `net_after_reversal`, `withdrawn_exposure`; appends `reversal_debit`. Audit `coprize.revoked` |

## Approvals
| `GET /approvals?type=kyc|draw_integrity&subject_id=` | per-type capability (`issue_kyc_approval` for kyc, `issue_draw_audit_approval` for draw_integrity) |
|---|---|
| `POST /approvals/kyc` | `issue_kyc_approval`; `{subject_user_id*, status: approved\|rejected}` → `ApprovalRegistryService::issueApproval('kyc','user',…,source:'admin_panel',authorizer)` |
| `POST /approvals/draw-integrity` | `issue_draw_audit_approval`; `{draw_id*, status}`; draw must exist (registry rule; **no completion precondition**) |
| `POST /approvals/{approvalId}/revoke` | Dynamic per-type capability enforced before action: resolves approval record, determines `type` (`kyc` → requires `issue_kyc_approval`; `draw_integrity` → requires `issue_draw_audit_approval`); rejects cross-type callers with 403 `ERR_FORBIDDEN`; calls `ApprovalRegistryService::revokeApproval` | `{reason*}` |
| *(no `/supersede` route: issuing a new approval already supersedes via `ApprovalRegistryService`)* | |
Audit: `approval.issued|revoked|superseded`. Co-prize adjudicators do **not** inherit these capabilities.

## Draws — `manage_platform_settings`
| `GET /draws?published=&status=&cursor=` | includes private drafts |
|---|---|
| `POST /draws` | creates **private draft** (`is_published=0,status=upcoming`); `{tier,execution_type,title_ar,title_en,starts_at,ends_at,broadcast_url?}` |
| `GET /draws/{id}` | incl. prizes, winner, `seed_commitment{hash,committed_at}`; **never** returns seed ciphertext/plaintext before reveal |
| `PATCH /draws/{id}` | only fields permitted by data-model §3 for the current state; protected/derived fields ⇒ 422 (`errors.field=protected`) |
| `POST /draws/{id}/publish` | one service-owned tx: lock → CSPRNG seed → SHA-256 → encrypt → single UPDATE (commitment + `is_published=1`) → self-check → audit → commit; any failure ⇒ still a private draft, no seed persisted. Requires `now < starts_at`. 409 if already published. ("No prize" is a UI warning, not a server rule.) |
| `POST /draws/{id}/complete` | **records completion of an already-established canonical result**: requires an existing `draw_winners` row for the draw, else `409 ERR_CANONICAL_RESULT_MISSING` with zero writes; sets stored `completed` and reveals the seed (if committed) in the same tx; already-completed ⇒ 200 replay. Never creates a winner. Stored `active`/`locked` are not admin-writable (window-derived; gate-review GC-7) |
| `POST /draws/{id}/prizes` · `PATCH /prizes/{id}` · `DELETE /prizes/{id}` | per data-model §3 (operational editing under `manage_platform_settings` while draw is not completed; `draw_winners` table has no `prize_id` column; no invented winner-bound lock) |
| `PATCH /draws/{id}/winner` | `{winner_masked_name?,winner_governorate?,prize_delivered?,stream_recording_url?}` only; no create/delete |
Audit: `draw.created|updated|published|status_changed|completed`, `prize.*`, `winner.metadata_updated`, `draw.seed_revealed`.

## Promotional awards — `manage_platform_settings`
| `POST /awards` | `{recipient_user_id*, draw_id?, award_title*, award_details?, valuation_usd_cents?, reason*}`; recipient must be active/non-merged. No update/delete. Audit `award.granted` (No list endpoint required by US9). |
|---|---|

## Users & capabilities — `manage_admin_capabilities`
| `GET /users?search=&page=` | search ≥ 3 chars; email **prefix**, exact UUID, exact `learner_code`; ≤25/page; each row carries profile, verification status, `orders_count`, active capabilities (spec US7 AC) — also serves the user detail page |
|---|---|
| `POST /users/{id}/capabilities` | `{capability* ∈ six, justification?}` → `AdminCapabilityService::grant`; self ⇒ 403; unverified target ⇒ 422; audit `capability.granted` |
| `DELETE /users/{id}/capabilities/{capability}` | `{reason*}`; last holder ⇒ 409; audit `capability.revoked`. Effective on the target's **next request** (DB re-evaluated per request via `hasCapability`) |
| *(no `PATCH/PUT/DELETE /users/{id}`)* | directory is not a CRUD surface |

## Audit viewer — `manage_admin_capabilities`
| `GET /audit-logs?actor=&action=&target_type=&target_id=&outcome=&from=&to=&cursor=` | keyset by `id DESC`; default `from = now-30d`; max `per_page` 50; redacted payloads only |
|---|---|
| *(no `GET /audit-logs/{id}`: list rows are already complete and redacted)* | |
| *(no write/delete routes)* | |

## Route-coverage invariant (automated)
`AdminRoutesCapabilityCoverageTest` iterates `Route::getRoutes()` for URIs starting `api/v1/admin`:
1. **All protected admin routes** must have `admin.principal`.
2. **Routes requiring a specific capability** must have `admin.capability:<specific>`.
3. **`GET /me` is the sole intentional exception** to `admin.capability`: `admin.principal` itself requires $\ge 1$ active approved capability.
4. Fails if any URI matches `bootstrap`.
