# Specification Quality Checklist: Feature 008 — Admin Panel

**Purpose**: Validate specification completeness, governance compliance, and contract safety before proceeding to planning  
**Created**: 2026-10-02  
**Updated**: 2026-10-03 (Post-Gate Reconciled Baseline)  
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details leaking into business requirements
- [x] Focused on user value, operational safety, and administrative workflows
- [x] Written with clear, testable acceptance criteria
- [x] All mandatory specification sections completed

## Requirement Completeness

- [x] Zero [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable, unambiguous, and mathematically specific
- [x] Success criteria are measurable and verifiable via automated tests
- [x] All primary and failure acceptance scenarios are defined
- [x] Edge cases are identified and bounded
- [x] Scope boundaries are strictly delineated

## Feature Readiness

- [x] All functional requirements (FR-001 through FR-022) have corresponding acceptance criteria
- [x] User scenarios cover all six administrative capability domains
- [x] Feature meets measurable outcomes defined in Success Criteria (SC-001 through SC-012)
- [x] Technical proposals (publication flag, last-admin lockout check) distinguished from business rules

## Six-Capability Authorization Model

- [x] Exactly six independent capabilities defined (`manage_admin_capabilities`, `manage_platform_settings`, `adjudicate_affiliate_coprize`, `issue_kyc_approval`, `issue_draw_audit_approval`, `settle_affiliate_payout`)
- [x] Zero generic `super_admin` shortcuts or capability inheritance
- [x] Draw lifecycle + prize management mapped to `manage_platform_settings`
- [x] Global User Directory mapped to `manage_admin_capabilities`
- [x] Full Admin Audit Log Viewer mapped to `manage_admin_capabilities`
- [x] Anti-self-grant and last-admin lockout protections specified
- [x] Server-side gate evaluation via `User::hasCapability()` required for all protected endpoints

## Feature 006 Contract Safety & Approved Amendments

- [x] Dynamic commission rate configuration enabled under `manage_platform_settings` (amended)
- [x] Commission rate snapshotted into `referral_attributions.commission_rate_bps` at order creation time (amended)
- [x] Historical commissions, attributions, and ledger entries strictly immutable (zero recalculation)
- [x] Single-tier attribution architecture preserved (no MLM)
- [x] 30-day last-click attribution window preserved
- [x] 24-hour maturation hold preserved as a fixed Feature 006 rule — not an Admin-editable setting; no setting key, form field, or Admin API endpoint changes it (FR-007 limited to `affiliate.commission_rate_bps` and `affiliate.payout_min_cents`)
- [x] 40% co-prize percentage funded from marketing pool preserved
- [x] 100% winner prize retention preserved (zero deduction for co-prize)
- [x] Dual current-valid approvals (KYC + draw integrity) required for co-prize release
- [x] Co-prize release and compensating revocation gated exclusively under `adjudicate_affiliate_coprize`
- [x] Payout requests reserve funds via negative `payout_debit` ledger entries
- [x] Payout settlement requires MTCN and mandatory physical receipt upload (`settle_affiliate_payout`)
- [x] Payout rejection appends compensating `reversal_credit` entry to restore available balance
- [x] Append-only ledger preserved; zero direct balance column mutations

## Draw Governance & Integrity

- [x] Private Draft state (`is_published = false`) completely hidden from public queries
- [x] Cryptographic pre-commitment: 256-bit CSPRNG seed and SHA-256 hash committed at publication before ticket accumulation
- [x] `server_seed_hash` strictly immutable once published
- [x] Broad operational editing permitted for upcoming and active draws (titles, URLs, schedule, prize details)
- [x] Active draw tier, ticket allocations, and canonical winner records strictly protected
- [x] Administrative promotional awards recorded with provenance, separate from canonical `draw_winners`

## Audit Trail & Security Governance

- [x] Centralized `admin_activity_logs` entity defined
- [x] Mandatory synchronous in-transaction audit persistence for all state-changing domain mutations
- [x] Domain mutation rolls back if audit persistence fails
- [x] Out-of-transaction failure logging for rejected requests (HTTP 401, 403, 422)
- [x] Sensitive credentials and tokens redacted before log persistence
- [x] Initial admin bootstrap remains strictly out-of-band CLI (`knzin:bootstrap-admin`)

## Notes

- All checklist items pass.
- Specification reflects 100% alignment with Product Owner decisions from grilling.
- Ready for plan generation (`/speckit-plan`).
