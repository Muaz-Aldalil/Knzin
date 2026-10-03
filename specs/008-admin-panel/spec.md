# Feature Specification: Feature 008 — Admin Panel

**Feature Branch**: `008-admin-panel`

**Created**: 2026-10-02

**Updated**: 2026-10-03 (Post-Grill Reconciliation & Gate Ratification)

**Status**: Draft (Specification Phase — Reconciled Baseline)

**Input**: Product Roadmap Feature 008: "Admin Panel — operational interface for platform governance, affiliate oversight, co-prize adjudication, draw management, and payout settlement. Consumer and operator of Feature 006 business contract with approved dynamic commission amendment. Must not redefine Feature 006 core invariants."

**Contract Boundary**: Feature 006 (Affiliate & Referral Engine, branch `006-affiliate-engine`, commit `c0042c5`) is an authoritative business contract. As formally amended by the Product Owner, the **commission rate configuration is dynamic** via `PlatformSettingsService` under `manage_platform_settings` and snapshotted at qualifying order/attribution creation time. All other Feature 006 contractual invariants (single-tier attribution, 30-day last-click window, 24-hour maturation hold, 40% co-prize from marketing pool, dual approval prerequisites, append-only ledger, and financial immutability) remain strictly frozen and binding.

---

## 1. Feature Overview & Administrative Model

Feature 008 establishes the **KNZiN Admin Panel** — a secure, server-authoritative operational interface that:

1. **Governs platform operational settings** (minimum payout threshold and dynamic commission percentage) via `platform_settings` and `PlatformSettingsService`. The 24-hour commission maturation hold is a **fixed Feature 006 rule and is not an Admin-configurable setting**.
2. **Oversees affiliate operations** (read-only ledger history, payout monitoring, balance projections projected directly from `affiliate_ledger_entries`).
3. **Settles and rejects affiliate payouts** (recording MTCN and mandatory physical receipt upload for completion, or appending compensating reversal credits upon rejection) via `AffiliatePayoutService`.
4. **Adjudicates co-prize release and post-release revocation** through `ApprovalRegistryService` and `AffiliateCoPrizeService::releaseCoPrize()` / `adjudicateCoPrizeRevocation()`, strictly gated by dual current-valid approvals.
5. **Manages draw lifecycle, prizes, and operational editing** (draft creation, publication with cryptographic seed pre-commitment before ticket accumulation, broad live operational data editing, and post-draw status updates) via `PlatformSettingsService` and draw domain services.
6. **Grants administrative promotional awards** independently of canonical RNG draw winners with full provenance.
7. **Administers users and delegated capabilities** (global user directory lookup, capability provisioning and revocation with anti-self-grant and last-admin lockout prevention).
8. **Enforces centralized, immutable activity audit logging** (synchronous in-transaction auditing for state-changing mutations, out-of-transaction auditing for rejected access, and a full audit log viewer).

### Exactly Six Independent Administrative Capabilities

Administrative authorization is capability-based, non-inheritable, and orthogonal. No generic `super_admin` role exists, and no capability collapses into another:

| Administrative Capability | Approved Domain Scope |
|---|---|
| `manage_admin_capabilities` | User directory lookup, delegated capability provisioning/revocation, full admin audit log viewer. |
| `manage_platform_settings` | Platform operational settings, dynamic commission rate, draw lifecycle management, prize configuration, live operational draw editing, administrative promotional awards. |
| `adjudicate_affiliate_coprize` | Authoritative co-prize release to `available` (strictly gated by dual current-valid approvals) and post-release revocation via compensating debit. |
| `issue_kyc_approval` | Issuance, supersession, and revocation of structured KYC verification records via `ApprovalRegistryService`. |
| `issue_draw_audit_approval` | Post-draw forensic RNG draw-integrity audit certification and revocation via `ApprovalRegistryService`. |
| `settle_affiliate_payout` | Payout settlement (recording MTCN and mandatory physical receipt upload) and payout rejection (triggering compensating reversal credit). |

### What Feature 008 Is
The Admin Panel is an authorized operational consumer and manager of platform domain services. It presents capability-gated interfaces and executes domain operations under strict transactional boundaries.

### What Feature 008 Is Not
- It does NOT introduce a 7th capability or generic super-admin authorization bypass.
- It does NOT rewrite, recalculate, or retroactively mutate historical commissions, attribution records, or ledger entries.
- It does NOT bypass `ApprovalRegistryService` or `AffiliatePayoutService` with direct Eloquent table writes.
- It does NOT alter canonical RNG draw outcomes, winning ticket serials, or replace canonical draw winners with promotional recipients.
- It does NOT implement payment gateway transaction execution (belongs to Feature 007).
- It does NOT create an independent financial ledger or secondary balance column.
- It does NOT expose an HTTP endpoint for initial administrator bootstrap (remains strictly out-of-band CLI `knzin:bootstrap-admin`).

---

## 2. Repository Reality & Brownfield Baseline

### 2.1 Existing Infrastructure Consumed by Feature 008

| Component | Status | Feature 008 Role |
|---|---|---|
| `admin_capabilities` table | **Existing** (migration `2026_10_02_000006`) | Persistent capability storage; queried via `User::hasCapability()`. |
| `platform_settings` table | **Existing** (migration `2026_10_02_000001`) | Key-value settings storage updated via `PlatformSettingsService`. |
| `approval_records` table | **Existing** (migration `2026_10_02_000007`) | Written exclusively via `ApprovalRegistryService` under `permitWrite` barrier. |
| `affiliate_ledger_entries` table | **Existing** (migration `2026_10_02_000005`) | Append-only financial source of truth; read-only projections in Admin UI. |
| `affiliate_payouts` table | **Existing** (migration `2026_10_02_000003`) | Payout records updated via `AffiliatePayoutService`. |
| `affiliate_profiles` table | **Existing** (migration `2026_10_02_000002`) | Read-only affiliate metadata views. |
| `referral_attributions` table | **Existing** (migration `2026_10_02_000004`) | Stores locked attribution and snapshotted `commission_rate_bps`. |
| `draws` table | **Existing** (migration `2026_09_29_000007`) | Draw records managed across lifecycle via `manage_platform_settings`. |
| `prizes` table | **Existing** (migration `2026_09_29_000008`) | Prize records configured and edited under `manage_platform_settings`. |
| `draw_winners` table | **Existing** (migration `2026_09_29_000009`) | Canonical winning ticket records; post-draw operational metadata editing. |
| `ApprovalRegistryService` | **Existing** | Domain service enforcing capability checks for KYC and draw-integrity approvals. |
| `AffiliateCoPrizeService` | **Existing** | Domain service executing co-prize release and compensating revocation debits. |
| `AffiliatePayoutService` | **Existing** | Domain service handling payout requests (debiting ledger), settlements, and rejections (compensating reversal). |
| `PlatformSettingsService` | **Existing** | Domain service handling atomic setting upserts gated by `manage_platform_settings`. |
| `GrantAdminCapabilityCommand` | **Existing** | CLI command establishing delegated capability provisioning rules and anti-self-grant. |
| `BootstrapAdminCommand` | **Existing** | Out-of-band initial admin bootstrap CLI; locks out once provisioned. |
| `User::hasCapability()` | **Existing** | Server-side authorization check method; authoritative gate for all admin routes. |

### 2.2 System Invariants Binding Feature 008

1. **Six-Capability Orthogonality**: The six admin capabilities remain independent and non-inheritable.
2. **Transactional Synchronous Auditing**: Every state-changing administrative domain mutation and its corresponding `admin_activity_logs` entry must be executed within the same database transaction (`DB::transaction`). If audit log insertion fails, the protected mutation must roll back.
3. **Out-of-Band Root Bootstrap**: `knzin:bootstrap-admin` remains strictly out-of-band CLI. No HTTP endpoint may trigger bootstrapping.
4. **Append-Only Financial Ledger**: Direct database updates to balances or amounts in `affiliate_ledger_entries` are strictly prohibited. Corrections use compensating entries only (`reversal_debit`, `reversal_credit`).
5. **Physical Receipt Compliance**: Payout settlement requires external transaction reference (MTCN) and mandatory physical receipt image upload stored on private protected storage per Constitution Section X.
6. **Integer-Cent Monetary Math**: All monetary amounts are handled and stored as integer cents (`BIGINT` / `INT UNSIGNED`). Display formatting is a read-only projection.
7. **Bilingual Localization**: Arabic RTL is the primary layout direction; English LTR is fully supported with zero horizontal overflow (Constitution Section V).

---

## 3. User Scenarios & Acceptance Criteria *(mandatory)*

### User Story 1 — Secure Admin Authentication & Capability-Gated Navigation (Priority: P1)

As a provisioned KNZiN administrator,  
I want to sign in to the Admin Panel using my credentials and see only the operational sections I am authorized to access based on my active capabilities,  
So that I can operate the platform safely within my authorized scope without exposure to unauthorized controls.

**Why this priority**: Foundational security boundary for the entire administrative interface.

**Independent Test**: Sign in with an account holding only `manage_platform_settings`; verify settings and draw controls are accessible, while affiliate adjudication, KYC approvals, payout settlement, user management, and full audit logs return server-side HTTP 403 and are hidden/disabled in navigation.

**Acceptance Scenarios**:
1. **Given** an admin with active `manage_platform_settings` signs in,  
   **When** they access the Admin Panel,  
   **Then** they see navigation links for Settings and Draws,  
   **And** links for Payout Settlement, Co-Prize Adjudication, KYC Approvals, User Directory, and Audit Logs are omitted or disabled,  
   **And** direct HTTP requests to unauthorized endpoints return HTTP 403.
2. **Given** a user with no active administrative capabilities,  
   **When** they attempt to access any admin endpoint,  
   **Then** the server returns HTTP 403,  
   **And** no administrative data or schema is leaked in the response.
3. **Given** an administrator's capability is revoked mid-session,  
   **When** they submit their next request requiring that capability,  
   **Then** the server re-evaluates database authorization and rejects the request with HTTP 403.

---

### User Story 2 — Platform Settings & Dynamic Commission Governance (Priority: P1)

As a provisioned administrator with `manage_platform_settings` capability,  
I want to view and update platform configuration parameters — limited to the active affiliate commission percentage and the minimum payout threshold — through a validated form,  
So that I can adjust operational business parameters without requiring code deployments.

**Why this priority**: Enables approved dynamic commission governance and operational payout flexibility.

**Independent Test**: Update `affiliate.commission_rate_bps` from 2500 (25%) to 3000 (30%). Verify that a new qualifying order created thereafter snapshots 3000 bps into `referral_attributions.commission_rate_bps`, while pre-existing attributions and ledger entries retain their historical snapshot.

**Acceptance Scenarios**:
1. **Given** an admin with `manage_platform_settings` views the Settings dashboard,  
   **When** the page loads,  
   **Then** the active commission rate (basis points and percentage) and minimum payout threshold (cents and display dollars) are displayed from `PlatformSettingsService`,  
   **And** the fixed 24-hour maturation hold is shown, if at all, only as a read-only informational note with no input control.
2. **Given** the admin updates the commission rate to 2000 bps (20.00%),  
   **When** the form is submitted,  
   **Then** `PlatformSettingsService` atomically upserts the setting in `platform_settings` recording the admin's user ID,  
   **And** an immutable audit record is written synchronously within the transaction,  
   **And** subsequent qualifying orders snapshot 2000 bps into `referral_attributions.commission_rate_bps` at order creation time,  
   **And** all prior orders, attributions, pending commissions, and ledger entries remain completely untouched.
3. **Given** the admin updates the minimum payout threshold,  
   **When** the form is submitted,  
   **Then** new payout requests evaluate against the new threshold,  
   **And** existing accepted payout requests retaining their snapshotted `threshold_cents_at_request` are unaffected.
4. **Given** an admin without `manage_platform_settings` attempts to update a setting,  
   **When** the request is submitted,  
   **Then** the server returns HTTP 403 and no setting or audit record is created.

---

### User Story 3 — Affiliate Ledger & Payout Oversight (Priority: P1)

As a provisioned administrator with `manage_platform_settings` or `settle_affiliate_payout` capability,  
I want to view affiliate profiles, their full ledger transaction history, and submitted payout requests in a read-only audit dashboard,  
So that I can monitor financial operations and inspect requests ready for settlement.

**Why this priority**: Required operational visibility prior to executing financial settlements.

**Independent Test**: Navigate to an affiliate profile; verify that available and pending balances are computed on-the-fly as projections of `affiliate_ledger_entries`. Verify that individual ledger rows contain zero inline edit or delete controls.

**Acceptance Scenarios**:
1. **Given** an authorized admin views the Affiliates overview,  
   **When** the view loads,  
   **Then** a paginated list of affiliates is shown with referral code, pending balance, available balance, lifetime earnings, and pending payout count.
2. **Given** an authorized admin selects a specific affiliate,  
   **When** the detail view loads,  
   **Then** the complete chronological ledger history is rendered (`entry_type`, `amount_cents`, `status`, `idempotency_key`, `created_at`),  
   **And** balances are derived projections of ledger rows (no independent mutable balance column exists),  
   **And** individual ledger entries have zero edit or delete actions.
3. **Given** an authorized admin views the Payout Requests list,  
   **When** the view loads,  
   **Then** requests are filterable by status (`requested`, `completed`, `rejected`),  
   **And** each row displays requested amount, recipient payout details, `threshold_cents_at_request`, and submission timestamp.

---

### User Story 4 — Affiliate Payout Settlement & Rejection (Priority: P1)

As a provisioned administrator with `settle_affiliate_payout` capability,  
I want to settle an approved payout request by entering the payment reference (MTCN) and uploading the physical payment receipt, or reject an invalid request with a documented reason,  
So that financial obligations are discharged with auditable proof or returned to the affiliate via an authoritative compensating reversal.

**Why this priority**: Discharges the platform's monetary obligations to affiliates while maintaining strict financial proof and anti-money-laundering compliance.

**Independent Test**: Select a payout in `status = 'requested'`; submit settlement with MTCN and receipt file; verify payout status transitions to `completed`, receipt is saved on protected storage, and debit ledger entry transitions to `cleared`. In a separate test, reject a payout with reason; verify payout status transitions to `rejected` and a compensating `reversal_credit` entry is appended to the ledger.

**Acceptance Scenarios**:
1. **Given** a payout request in `status = 'requested'`,  
   **When** an admin with `settle_affiliate_payout` enters the MTCN, uploads a valid physical receipt image, and confirms settlement,  
   **Then** the receipt file is stored securely on the private disk,  
   **And** `AffiliatePayoutService::settlePayout()` executes in a transaction marking the payout `completed` and the associated `payout_debit` entry `cleared`,  
   **And** an immutable audit record is persisted synchronously in the same transaction,  
   **And** an admin cannot settle their own personal payout request (anti-self-settlement guard).
2. **Given** a settlement submission missing either the MTCN or receipt image,  
   **When** the admin submits the form,  
   **Then** the server rejects the request with HTTP 422 validation failure,  
   **And** no financial status or ledger changes occur.
3. **Given** a payout request in `status = 'requested'`,  
   **When** an admin with `settle_affiliate_payout` rejects the request with a mandatory reason,  
   **Then** `AffiliatePayoutService::rejectPayout()` executes in a transaction marking the payout `rejected`,  
   **And** a compensating `reversal_credit` ledger entry is appended restoring the affiliate's available balance,  
   **And** the original `payout_debit` entry remains untouched in historical records.
4. **Given** an admin without `settle_affiliate_payout` attempts to settle or reject a payout,  
   **When** the request is submitted,  
   **Then** the server returns HTTP 403.

---

### User Story 5 — Co-Prize Approval Verification & Adjudication (Priority: P2)

As a provisioned administrator with `issue_kyc_approval`, `issue_draw_audit_approval`, or `adjudicate_affiliate_coprize` capability,  
I want to issue and revoke structured KYC and draw-integrity approvals and adjudicate the release or revocation of 40% affiliate co-prizes,  
So that qualifying referrers receive their marketing co-share strictly upon forensic verification, and fraud cases can be corrected with compensating entries.

**Why this priority**: Governs the release of high-value grand prize co-shares under strict dual-approval verification.

**Independent Test**: Seed a winning ticket for a referred user with a pending co-prize credit. Issue KYC approval for the winner and draw-integrity audit approval for the draw. With `adjudicate_affiliate_coprize`, trigger release; verify the ledger entry transitions to `available`. Attempt release when either approval is revoked; verify release is blocked.

**Acceptance Scenarios**:
1. **Given** an admin with `issue_kyc_approval` reviews a grand-prize winner's identity documents,  
   **When** they submit an approval,  
   **Then** `ApprovalRegistryService::issueApproval('kyc', 'user', winner_id, 'approved', ...)` creates a versioned approval record,  
   **And** the action is synchronously audited.
2. **Given** an admin with `issue_draw_audit_approval` certifies a concluded draw's RNG integrity,  
   **When** they submit an approval,  
   **Then** `ApprovalRegistryService::issueApproval('draw_integrity', 'draw', draw_id, 'approved', ...)` creates a versioned approval record,  
   **And** the action is synchronously audited.
3. **Given** both winner KYC and draw-integrity approval records are current-valid (`status = 'approved'`, `revoked_at IS NULL`, `superseded_at IS NULL`),  
   **When** an admin with `adjudicate_affiliate_coprize` triggers co-prize release,  
   **Then** `AffiliateCoPrizeService::releaseCoPrize()` transitions the referrer's co-prize ledger entry from `pending` to `available`,  
   **And** the winner retains 100% of their prize (zero deduction from winner).
4. **Given** either approval is pending, revoked, or superseded,  
   **When** co-prize release is attempted,  
   **Then** the service refuses release,  
   **And** the ledger entry remains in `pending` status.
5. **Given** a post-release revocation is adjudicated by an admin with `adjudicate_affiliate_coprize`,  
   **When** revocation is submitted with justification,  
   **Then** `AffiliateCoPrizeService::adjudicateCoPrizeRevocation()` appends a compensating `reversal_debit` entry to the ledger,  
   **And** the original co-prize credit entry is preserved intact.

---

### User Story 6 — Draw Lifecycle, Pre-Commitment & Broad Operational Editing (Priority: P2)

As a provisioned administrator with `manage_platform_settings` capability,  
I want to create private draft draws, publish them to public countdowns with cryptographic pre-commitments, and broadly edit operational details (including live draws),  
So that promotional campaigns are operated dynamically while strictly protecting cryptographic and historical integrity.

**Why this priority**: Manages the platform's promotional draw schedule and public transparency.

**Independent Test**: Create a draw; verify it is in private draft (`is_published = false`) and hidden from public APIs. Publish the draw; verify `is_published = true`, server seed hash is committed, and public countdowns display it. Edit operational fields while live (title, broadcast URL, end time); verify updates succeed. Attempt to modify `server_seed_hash` or live `tier`; verify rejection.

**Acceptance Scenarios**:
1. **Given** an admin creates a draw with titles, prize details, schedule, and tier,  
   **When** the form is saved,  
   **Then** a `draws` record is created in private draft state (`is_published = false`),  
   **And** the draw is invisible to public queries (`/api/v1/draws/active`).
2. **Given** a draw in private draft state,  
   **When** the admin triggers "Publish Draw",  
   **Then** the system generates a 256-bit CSPRNG server seed and commits `server_seed_hash = hash('sha256', seed)` before ticket accumulation opens,  
   **And** sets `is_published = true`,  
   **And** the draw becomes publicly visible in `upcoming` status,  
   **And** `server_seed_hash` becomes strictly immutable.
3. **Given** a draw is upcoming or active,  
   **When** the admin updates operational fields (`title_ar`, `title_en`, `broadcast_url`, `starts_at`, `ends_at`, prize descriptions, display labels, prize images),  
   **Then** the updates are committed and synchronously audited,  
   **And** the live countdown and stream player reflect the updated data.
4. **Given** an active draw with tickets already accumulated,  
   **When** an edit attempts to alter `server_seed_hash` or change `tier`,  
   **Then** the server rejects the edit to protect cryptographic fairness and ticket eligibility window invariants.
5. **Given** a concluded draw,  
   **When** winner selection is verified,  
   **Then** the admin may update post-draw operational metadata (`winner_masked_name`, `winner_governorate`, `prize_delivered`, `stream_recording_url`),  
   **And** the canonical `winning_ticket_serial` and `drawn_at` timestamp remain strictly immutable.

---

### User Story 7 — Global User Directory & Capability Delegation (Priority: P3)

As a provisioned administrator with `manage_admin_capabilities` capability,  
I want to look up users in a global directory, inspect their profiles and account status, and grant or revoke administrative capabilities with anti-self-grant and lockout protections,  
So that the operational team's access is managed securely without requiring direct database or CLI intervention.

**Why this priority**: Operational team management and security governance.

**Independent Test**: Look up a user by learner code; grant `issue_kyc_approval`; verify active capability row created. Attempt to grant a capability to yourself; verify server rejection. Attempt to revoke `manage_admin_capabilities` from the sole remaining admin; verify lockout protection rejection.

**Acceptance Scenarios**:
1. **Given** an admin with `manage_admin_capabilities` accesses the User Directory,  
   **When** they search by email, UUID, or learner code,  
   **Then** matching user profiles are returned with verification status, order counts, and active admin capabilities,  
   **And** the directory is strictly read-only with respect to customer profile data.
2. **Given** an admin grants a capability (`manage_platform_settings`) to another user,  
   **When** the grant is confirmed,  
   **Then** an `admin_capabilities` record is activated with `granted_by_user_id` and timestamp,  
   **And** the grant takes effect immediately on the user's next request,  
   **And** the action is synchronously audited.
3. **Given** an admin attempts to grant any capability to themselves,  
   **When** the request is submitted,  
   **Then** the server rejects the request with an anti-self-grant authorization violation.
4. **Given** a platform with only one active administrator possessing `manage_admin_capabilities`,  
   **When** an admin attempts to revoke that capability from that user,  
   **Then** the server rejects the request with a last-admin lockout prevention error.

---

### User Story 8 — Centralized Activity Audit Logging & Viewer (Priority: P2)

As a provisioned administrator with `manage_admin_capabilities` capability,  
I want to browse a centralized, filterable log of all administrative actions and security-relevant events,  
So that operational transparency, compliance verification, and forensic accountability are fully maintained.

**Why this priority**: Mandatory compliance and security governance requirement per [DEC-008-03].

**Independent Test**: Perform a settings change, a payout settlement, and an approval; open the Audit Viewer with `manage_admin_capabilities`; verify that each action appears with actor, capability, action name, target reference, outcome, and timestamp. Verify that an admin without `manage_admin_capabilities` receives HTTP 403.

**Acceptance Scenarios**:
1. **Given** any state-changing administrative action is executed,  
   **When** the domain transaction executes,  
   **Then** an `admin_activity_logs` record is inserted synchronously within the same transaction (`actor_user_id`, `capability_used`, `action`, `target_type`, `target_id`, `outcome`, `before_state`, `after_state`),  
   **And** if logging fails, the domain transaction rolls back.
2. **Given** an unauthorized or rejected admin request (HTTP 401, 403, 422),  
   **When** the request terminates,  
   **Then** a failure record is logged out-of-transaction via terminating middleware/exception handler.
3. **Given** an admin with `manage_admin_capabilities` opens the Audit Viewer,  
   **When** the view loads,  
   **Then** paginated audit logs are displayed, filterable by actor, action type, target entity, date range, and outcome,  
   **And** sensitive data (passwords, tokens, credentials) is strictly redacted.
4. **Given** an admin without `manage_admin_capabilities` attempts to access the Audit Viewer,  
   **When** the request is submitted,  
   **Then** the server returns HTTP 403.

---

### User Story 9 — Administrative Promotional Awards (Priority: P3)

As a provisioned administrator with `manage_platform_settings` capability,  
I want to record a promotional award recipient independently of the canonical draw winner,  
So that special promotional gifts, marketing prizes, or honorary recognitions can be officially granted with full administrative provenance.

**Why this priority**: Fulfills the client promotional marketing requirement while preserving canonical RNG draw integrity.

**Independent Test**: Create a promotional award for a user associated with a draw; verify that the award is recorded in `promotional_awards` with recipient, reason, award details, and admin ID. Verify that the canonical `draw_winners` record and the 40% affiliate co-prize loop are unaffected.

**Acceptance Scenarios**:
1. **Given** an admin with `manage_platform_settings` selects an eligible user for a promotional award,  
   **When** they submit the award with title, description/valuation, and administrative reason,  
   **Then** a `promotional_awards` record is created linking the recipient, optional draw reference, award details, and `awarded_by_admin_id`,  
   **And** the action is synchronously audited.
2. **Given** a promotional award is granted,  
   **When** draw results and affiliate co-prizes are evaluated,  
   **Then** the canonical RNG draw outcome, winning ticket, and `draw_winners` table remain completely unchanged,  
   **And** the promotional award does not trigger or affect the 40% affiliate co-prize workflow,  
   **And** no unbacked cash entries are written to the affiliate cash ledger.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

* **FR-001**: System MUST require an authenticated session and at least one active administrative capability for all Admin Panel routes; unauthenticated or capability-free requests return HTTP 401/403.
* **FR-002**: System MUST enforce authorization server-side on every request using `User::hasCapability()` against the six independent capabilities (`manage_admin_capabilities`, `manage_platform_settings`, `adjudicate_affiliate_coprize`, `issue_kyc_approval`, `issue_draw_audit_approval`, `settle_affiliate_payout`).
* **FR-003**: System MUST provide a read-only affiliate overview dashboard with balances computed exclusively as projections of `affiliate_ledger_entries`.
* **FR-004**: System MUST provide a read-only chronological affiliate ledger view with zero inline edit or delete actions.
* **FR-005**: System MUST allow authorized admins (`settle_affiliate_payout`) to settle payout requests by recording the MTCN and uploading a physical receipt image stored on private protected disk, transitioning the payout to `completed` and the debit entry to `cleared`.
* **FR-006**: System MUST allow authorized admins (`settle_affiliate_payout`) to reject payout requests with a documented reason, appending a compensating `reversal_credit` entry to restore available balance.
* **FR-007**: System MUST allow authorized admins (`manage_platform_settings`) to update exactly two platform settings — `affiliate.commission_rate_bps` and `affiliate.payout_min_cents` — via `PlatformSettingsService`. The 24-hour maturation hold is a fixed Feature 006 rule: the system MUST NOT expose any setting key, form field, or Admin API endpoint that changes it.
* **FR-008**: System MUST snapshot the currently active `commission_rate_bps` into `referral_attributions.commission_rate_bps` at the exact moment the qualifying order / referral attribution is created and locked; subsequent commission fulfillment MUST use this snapshotted rate.
* **FR-009**: System MUST allow authorized admins (`issue_kyc_approval`) to issue, supersede, and revoke structured KYC approval records exclusively via `ApprovalRegistryService`.
* **FR-010**: System MUST allow authorized admins (`issue_draw_audit_approval`) to issue, supersede, and revoke forensic draw-integrity audit approval records exclusively via `ApprovalRegistryService`.
* **FR-011**: System MUST allow authorized admins (`adjudicate_affiliate_coprize`) to release co-prizes via `AffiliateCoPrizeService::releaseCoPrize()`, which strictly validates that both winner KYC approval and draw-integrity approval are current-valid (`status = 'approved'`, unrevoked, unsuperseded).
* **FR-012**: System MUST allow authorized admins (`adjudicate_affiliate_coprize`) to adjudicate post-release co-prize revocations exclusively by appending compensating `reversal_debit` ledger entries without modifying original credit records.
* **FR-013**: System MUST provide draw lifecycle management (`manage_platform_settings`): initial creation in private draft (`is_published = false`), explicit publication generating cryptographic server seed hash commitment before ticket accumulation, and status progression (`upcoming`, `active`, `locked`, `completed`).
* **FR-014**: System MUST allow authorized admins (`manage_platform_settings`) broad operational editing authority over upcoming and active draws (titles, URLs, schedule dates, prize descriptions, display labels, images), while strictly prohibiting modification of `server_seed_hash`, active draw `tier`, ticket allocations, and canonical winner records.
* **FR-015**: System MUST allow authorized admins (`manage_platform_settings`) to grant administrative promotional awards recorded in `promotional_awards` with provenance, strictly segregated from canonical `draw_winners` records.
* **FR-016**: System MUST provide a read-only Global User Directory under `manage_admin_capabilities`.
* **FR-017**: System MUST allow authorized admins (`manage_admin_capabilities`) to grant and revoke capabilities with anti-self-grant enforcement and last-admin lockout prevention.
* **FR-018**: System MUST synchronously insert an immutable record into `admin_activity_logs` within the same database transaction for every state-changing administrative mutation; failure to insert the audit record MUST roll back the domain mutation.
* **FR-019**: System MUST provide a centralized Admin Audit Log Viewer under `manage_admin_capabilities` with sensitive data redaction.
* **FR-020**: System MUST NOT expose an HTTP route for administrator bootstrap; `knzin:bootstrap-admin` remains strictly out-of-band CLI.
* **FR-021**: System MUST display all monetary values as integer-cent projections; no independent financial balance column may be created.
* **FR-022**: System MUST render bilingual interfaces (Arabic RTL primary, English LTR supported) consistent with the platform design tokens and `next-intl`.

---

## 5. Key Entities

- **AdminCapability**: Existing `admin_capabilities` table (`user_id`, `capability`, `status`, `granted_by_user_id`, `revoked_by_user_id`, `revocation_reason`).
- **PlatformSetting**: Existing `platform_settings` table (`key`, `value`, `updated_by_user_id`, `description`).
- **AffiliateLedgerEntry**: Existing `affiliate_ledger_entries` table (immutable append-only source of financial truth).
- **AffiliatePayout**: Existing `affiliate_payouts` table (`payout_number`, `user_id`, `amount_cents`, `threshold_cents_at_request`, `status`, `admin_reference_number`, `receipt_path`).
- **ApprovalRecord**: Existing `approval_records` table (`approval_id`, `approval_type`, `subject_type`, `subject_id`, `status`, `version`, `approved_by`, `revoked_by`, `superseded_at`).
- **Draw**: Existing `draws` table with `is_published` attribute (`tier`, `execution_type`, `title_ar`, `title_en`, `status`, `starts_at`, `ends_at`, `broadcast_url`, `server_seed_hash`, `server_seed_encrypted`, `server_seed_revealed`).
- **Prize**: Existing `prizes` table (`draw_id`, `title_ar`, `title_en`, `category`, `valuation_usd_cents`, `display_iqd_label`, `image_url`).
- **DrawWinner**: Existing `draw_winners` table (`draw_id`, `winning_ticket_serial`, `winner_masked_name`, `winner_governorate`, `prize_delivered`, `stream_recording_url`, `drawn_at`).
- **PromotionalAward**: Dedicated administrative table (`id`, `recipient_user_id`, `draw_id`, `award_title`, `award_details`, `valuation_usd_cents`, `reason`, `awarded_by_admin_id`, `created_at`).
- **AdminActivityLog**: Centralized audit table (`id`, `actor_user_id`, `capability_used`, `action`, `target_type`, `target_id`, `outcome`, `administrative_justification`, `request_id`, `before_state`, `after_state`, `created_at`).

---

## 6. Success Criteria *(mandatory)*

* **SC-001**: 100% of admin endpoints strictly enforce server-side capability authorization; unauthorized requests return HTTP 403 without data leakage.
* **SC-002**: 100% of state-changing administrative operations persist an `admin_activity_logs` entry within the same database transaction; simulated audit write failures trigger 100% rollback of the domain mutation.
* **SC-003**: Dynamic commission rate updates take effect forward-only; qualifying orders snapshot the active rate at attribution creation time, and 0% of historical attributions or commissions are recalculated.
* **SC-004**: Payout settlements require both MTCN and physical receipt upload, transitioning the payout debit entry to `cleared` with zero discrepancy.
* **SC-005**: Payout rejections append a compensating `reversal_credit` entry restoring available balance with 100% mathematical accuracy.
* **SC-006**: Co-prize release succeeds if and only if both winner KYC and draw-integrity approvals are current-valid (`status = 'approved'`, unrevoked, unsuperseded); winner retains 100% of prize value with zero deduction.
* **SC-007**: Private draft draws (`is_published = false`) are 100% invisible to public active and upcoming draw queries.
* **SC-008**: Draw publication generates and commits `server_seed_hash` before ticket accumulation opens; committed seed hash is 100% immutable thereafter.
* **SC-009**: Administrative promotional awards are recorded with complete provenance and produce zero side-effects on canonical `draw_winners` or the 40% affiliate co-prize loop.
* **SC-010**: Last-admin lockout protection prevents 100% of attempts to revoke `manage_admin_capabilities` from the sole remaining administrator.
* **SC-011**: Zero direct SQL balance mutations exist; 100% of balance values displayed in the Admin UI match the derived projection of `affiliate_ledger_entries`.
* **SC-012**: Admin Panel renders correctly in both Arabic RTL and English LTR viewports with zero horizontal overflow.

---

## 7. System Boundaries & Integration Contracts

### In Scope for Feature 008 — Admin Panel
* Admin authentication middleware and capability-based route guards.
* Admin Panel frontend (Next.js App Router, Arabic RTL primary, English LTR supported).
* Backend Admin API controllers under Sanctum authentication.
* Platform settings management (commission rate and payout minimum only).
* Read-only affiliate overview and ledger projections.
* Payout settlement (MTCN + receipt upload) and rejection (compensating reversal) via `AffiliatePayoutService`.
* KYC approval issuance/revocation via `ApprovalRegistryService`.
* Draw-integrity audit approval issuance/revocation via `ApprovalRegistryService`.
* Co-prize release and post-release compensating revocation via `AffiliateCoPrizeService`.
* Draw lifecycle management: private draft creation, publication with seed pre-commitment, broad operational editing, post-draw metadata editing.
* Administrative promotional awards with provenance.
* Global User Directory lookup.
* Delegated capability provisioning and revocation with anti-self-grant and last-admin lockout prevention.
* Centralized activity audit logging and Admin Audit Viewer.

### Out of Scope for Feature 008 (Strict Boundaries)
* **Payment Gateway Integration**: Belongs to Feature 007. Feature 008 records settlement facts (receipt, MTCN), not automated payment gateway execution.
* **RNG Draw Algorithm & Execution Engine**: The automated winner selection RNG engine belongs to the draw engine domain. Feature 008 manages draw metadata, lifecycle transitions, and post-draw audit certification.
* **Automated Identity Document OCR / KYC Analysis**: Belongs to KYC subsystem. Feature 008 records human admin verification decisions.
* **Customer Notification Dispatch**: Belongs to Feature 009. Feature 008 emits domain events.
* **Multi-Level Marketing (MLM)**: Feature 006 is single-tier only. Feature 008 introduces zero downline hierarchy.
* **Direct Ledger Mutation**: Admin cannot directly modify balance figures or ledger amounts.
* **HTTP Admin Bootstrap**: Initial bootstrap remains CLI-only (`knzin:bootstrap-admin`).

---

## 8. Locked Integration Rules (Feature 006 Contract)

| Rule | Contract Status | Binding Constraint on Feature 008 |
|---|---|---|
| Commission Rate | **Amended** | Dynamic via `PlatformSettingsService` under `manage_platform_settings`; snapshotted at order/attribution creation time. Forward-only effect. |
| Attribution Model | **Frozen** | Single-tier, 30-day last-click cookie/code window. Locked at order creation. Admin cannot reassign. |
| Maturation Hold | **Frozen** | 24-hour holding period for sales commissions. Admin cannot bypass. |
| Co-Prize Percentage | **Frozen** | Exactly 40% of grand prize valuation funded by KNZiN marketing pool. |
| Winner Prize | **Frozen** | 100% retained by winner. Zero deduction for referrer's co-share. |
| Ledger Immutability | **Frozen** | Append-only. Corrections use compensating entries only (`reversal_debit`, `reversal_credit`). |
| Approval Gateway | **Frozen** | Winner KYC + draw-integrity approvals both required for co-prize release. |
| Anti-Self-Referral | **Frozen** | Check constraint `chk_ref_attr_anti_self_referral` enforced at database layer. |
| Capability Model | **Frozen** | Exactly six capabilities; non-inheritable; anti-self-grant enforced. |
| Financial Truth | **Frozen** | Append-only ledger is authoritative; balance display is derived projection. |

---

*This specification establishes the canonical baseline for Feature 008 — Admin Panel, fully reconciled against all approved Product Owner decisions and project governance rules.*
