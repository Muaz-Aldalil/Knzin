# Integration Security Contract: Approval Records & Freshness Contract

**Domain**: Feature 006 — Affiliate & Referral Engine  
**Subledger**: Append-Only Affiliate Financial Subledger  
**Document**: Approval Records Contract & Option C Freshness Rules  
**Contract Version**: 1.0.0  

---

## 1. Context & Purpose

Under Option C for Grand Prize 40% Co-Prize rewards, release of funds from `pending` to `available` requires two independent external verifications:
1. **KYC Approval**: Verification of the winning ticket holder's physical identity.
2. **Draw Integrity Audit Approval**: Verification that the draw execution, RNG seeding, and ticket eligibility were untampered.

This contract defines the authoritative data structure, freshness rules, domain boundaries, and revocation handling for these approval records. Caller-supplied booleans (e.g. `kycApproved=true`) are strictly rejected.

---

## 2. Common Approval Record Contract

All approval evidence consumed across the platform must conform to the universal `approval_records` specification:

| Field | Type | Description |
| :--- | :--- | :--- |
| `approval_id` | `VARCHAR(64)` | Unique deterministic or UUID identifier for the approval record (Primary Key). |
| `approval_type` | `VARCHAR(32)` | Domain type: `kyc` or `draw_integrity`. |
| `subject_type` | `VARCHAR(32)` | Target entity type: `user` (for KYC) or `draw` (for draw integrity). |
| `subject_id` | `VARCHAR(64)` | Target identifier: `user_id` of winner or `draw_id` of winning event. |
| `status` | `VARCHAR(24)` | Current state: `pending`, `approved`, `rejected`, `revoked`, `superseded`. |
| `approved_at` | `TIMESTAMP NULL` | Exact UTC timestamp of authorization. |
| `approved_by` | `VARCHAR(64) NULL`| Identifier of the authorizing agent, officer, or service principal. |
| `source` | `VARCHAR(64)` | Authoritative origin subsystem (e.g. `compliance_kyc_subsystem`, `draw_audit_engine`). |
| `version` | `INT UNSIGNED` | Monotonic schema or audit revision counter (default `1`). |
| `revoked_at` | `TIMESTAMP NULL` | Timestamp if approval was subsequently revoked. |
| `revoked_by` | `VARCHAR(64) NULL`| Administrator or officer revoking the approval. |
| `revocation_reason`| `TEXT NULL` | Auditable narrative justification for revocation. |
| `superseded_at` | `TIMESTAMP NULL` | Timestamp if approval was replaced by newer revision. |
| `superseded_by_approval_id` | `VARCHAR(64) NULL` | Reference to replacing approval ID. |

### Provenance Checklist
Every approval record provides complete provenance for external auditors to answer:
1. **What was approved?** (`subject_type`, `subject_id`, `approval_type`)
2. **Who approved it?** (`approved_by`, `source`)
3. **When was it approved?** (`approved_at`)
4. **Under what version/state?** (`version`, `status`)
5. **Has it since been revoked or superseded?** (`revoked_at`, `revoked_by`, `revocation_reason`, `superseded_at`)

---

## 3. Approval Freshness Contract

Freshness is **state/version-based**, not based on arbitrary time-to-live (TTL) counters.

### 3.1 KYC Approval Freshness
A KYC approval is fresh and valid if and only if:
* **Identity Match**: `subject_type = 'user'` and `subject_id` matches the exact winner `user_id` of the winning ticket.
* **Status**: `status = 'approved'` and `approved_at IS NOT NULL`.
* **Not Revoked**: `revoked_at IS NULL` and `revocation_reason IS NULL`.
* **Not Superseded**: `superseded_at IS NULL` and `superseded_by_approval_id IS NULL`.
* **Provenance**: Provenance fields (`approved_by`, `source`) are populated.

### 3.2 Draw Integrity Audit Freshness
A Draw Integrity audit approval is fresh and valid if and only if:
* **Draw Match**: `subject_type = 'draw'` and `subject_id` matches the exact `draw_id` of the winning ticket's draw.
* **Status**: `status = 'approved'` and `approved_at IS NOT NULL`.
* **Not Revoked**: `revoked_at IS NULL` and `revocation_reason IS NULL`.
* **Not Superseded**: `superseded_at IS NULL` and `superseded_by_approval_id IS NULL`.
* **Provenance**: Provenance fields (`approved_by`, `source`) are populated.

---

## 4. Release Decision Rule

At the moment `releaseCoPrize($winningTicketSerial)` is executed:

$$\text{KYC is Fresh} \land \text{Draw Audit is Fresh} \implies \text{Release Permitted} (\text{pending} \to \text{available})$$

If either approval is missing, pending, rejected, revoked, superseded, or mismatched to another subject:
* Release is **denied**.
* Co-prize ledger entry remains in `status = 'pending'`.
* The operation is server-side verified and idempotent.

---

## 5. Revocation Rules

### 5.1 Pre-Release Revocation
If either KYC or Draw Audit approval is revoked while the co-prize is in `status = 'pending'`:
* The entry remains in `pending`.
* Release is strictly blocked.
* If winner is formally disqualified, `cancelCoPrize()` transitions the entry to `cancelled`.

### 5.2 Post-Release Revocation & Subledger Preservation
Under the **Append-Only Affiliate Financial Subledger**:
* Historical ledger records are permanent financial history and must **NEVER** be deleted or updated in place.
* The original `amount_cents` is **NEVER** mutated.
* Revocation event is recorded in `approval_records`.
* Financial clawback/reversal requires explicit authorized administrative adjudication (`adjudicateCoPrizeRevocation()`).
* Adjudication appends a new compensating entry:
  * `entry_type = 'reversal_debit'`
  * `amount_cents = -originalAmount`
  * `status = 'cleared'`
  * `idempotency_key = "co_prize_reversal_{$serial}"`
* This brings the net affiliate subledger to zero while maintaining complete append-only subledger audit-trail integrity.

---

## 6. Domain Integration Boundary

```text
┌─────────────────────────────────┐
│     KYC / Identity Domain       │  Owns winner identification, document checks,
│                                 │  national ID validation, and KYC approval records.
└────────────────┬────────────────┘
                 │ emits ApprovalRecord (type='kyc')
                 ▼
┌─────────────────────────────────┐
│       Draw / Audit Domain       │  Owns RNG verification, draw execution,
│                                 │  winner selection, and draw integrity approval records.
└────────────────┬────────────────┘
                 │ emits ApprovalRecord (type='draw_integrity')
                 ▼
┌─────────────────────────────────┐
│   Feature 006: Affiliate Engine │  Consumes trusted approval evidence via provider.
│   Append-Only Financial Subledger│  Enforces release freshness server-side.
└─────────────────────────────────┘  Owns affiliate ledger state and compensating reversals.
```

Feature 006 does **NOT** own or store raw KYC identity documents or draw RNG telemetry. It consumes trusted approval records through `CoPrizeApprovalProviderInterface`.

---

## 7. Trusted Application Boundary & Subsystem Authentication

To guarantee that untrusted callers or compromised client input cannot manufacture or alter approval records:

### 7.1 Single Trusted Application Write Boundary (`permitWrite` Barrier)
* Direct writes via Eloquent (`ApprovalRecord::create`, `$record->save()`, `$record->delete()`) or raw queries are strictly blocked at runtime.
* The Eloquent lifecycle hooks (`creating`, `updating`, `deleting`) in `ApprovalRecord` enforce a re-entrancy token guard (`ApprovalRecord::permitWrite(callable $callback)`). Any mutation attempted outside `permitWrite` throws `UnauthorizedApprovalWriteException`.
* Only `ApprovalRegistryService` executes inside `ApprovalRecord::permitWrite(...)`.

### 7.2 Subsystem Secret Verification
* Dedicated subsystem identities (`compliance_kyc_subsystem`, `draw_audit_engine`) cannot be spoofed by string declaration.
* When issuing or modifying approval records on behalf of a subsystem principal, the caller MUST provide a matching shared secret (`$systemSecret`) verified using constant-time `hash_equals` against `config('knzin.subsystems.{principal}_secret')`.
* Requests lacking the secret, with invalid secrets, or mismatching principals are rejected immediately with `UnauthorizedApprovalWriteException`.

### 7.3 Human Admin Capability Verification
* When an approval is issued by a human administrator, the caller MUST possess the exact, non-inheritable capability:
  * `issue_kyc_approval` for KYC approvals.
  * `issue_draw_audit_approval` for Draw Integrity audit approvals.
* Administrative capabilities such as `manage_admin_capabilities` or `manage_platform_settings` do NOT implicitly grant approval issuance authority.

