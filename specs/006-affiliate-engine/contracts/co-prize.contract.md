# Domain Service Contract: Grand-Prize 40% Co-Share Resolution

**Domain**: Feature 006 — Affiliate & Referral Engine  
**Subledger**: Append-Only Affiliate Financial Subledger  
**Service**: `App\Services\AffiliateCoPrizeService`  
**Contract Version**: 2.0.0  
**Feature**: [specs/006-affiliate-engine/spec.md](../spec.md)  
**Boundary**: Invoked by Feature 008 (Draw Engine / Winner Declaration) & Compliance Integration  

---

## 1. Service Definition

The `AffiliateCoPrizeService` is an internal domain service responsible for determining whether a winning draw ticket possesses a locked referral attribution, and if so, allocating exactly 40% of the grand prize valuation to the referrer from the platform marketing pool under the **Append-Only Affiliate Financial Subledger**.

```php
namespace App\Services;

use App\Models\AffiliateLedgerEntry;
use App\Models\User;

interface AffiliateCoPrizeServiceInterface
{
    /**
     * Resolve winning ticket attribution and create pending 40% co-prize ledger entry for the referrer.
     *
     * @param string $winningTicketSerial Serial number of the winning ticket
     * @param int $grandPrizeValuationCents Total grand prize valuation in integer cents
     * @param int|string $winnerUserId UUID or ID of the winning user
     * @return AffiliateLedgerEntry|null Returns the created pending ledger entry or null if direct organic purchase
     */
    public function awardCoPrize(string $winningTicketSerial, int $grandPrizeValuationCents, int|string $winnerUserId): ?AffiliateLedgerEntry;

    /**
     * Release pending 40% co-prize to available balance upon verified fresh KYC and Draw Audit approvals (Option C).
     *
     * @param string $winningTicketSerial
     * @return AffiliateLedgerEntry|null Returns the updated ledger entry or current pending entry if unapproved
     */
    public function releaseCoPrize(string $winningTicketSerial): ?AffiliateLedgerEntry;

    /**
     * Cancel pending co-prize if winner fails identity verification or is disqualified prior to release.
     *
     * @param string $winningTicketSerial
     * @param string $reason
     * @param string|null $actorId
     * @return AffiliateLedgerEntry|null
     */
    public function cancelCoPrize(string $winningTicketSerial, string $reason, ?string $actorId = null): ?AffiliateLedgerEntry;

    /**
     * Adjudicate a post-release approval revocation with an authorized Admin creating a compensating reversal.
     * Preserves original financial ledger entry untouched.
     *
     * @param string $winningTicketSerial
     * @param string $reason
     * @param User $adminUser
     * @return AffiliateLedgerEntry|null
     * @throws \Illuminate\Auth\Access\AuthorizationException if adminUser lacks capability
     */
    public function adjudicateCoPrizeRevocation(string $winningTicketSerial, string $reason, User $adminUser): ?AffiliateLedgerEntry;
}
```

---

## 2. Invariants & Execution Flow

```text
Feature 008 (Draw Winner Declared)
        │
        ▼  passes winningTicketSerial, valuation, winnerUserId
AffiliateCoPrizeService::awardCoPrize(...)
        │
        ├── 1. Resolve Ticket by serial (Ticket::where('serial_number', $winningTicketSerial))
        ├── 2. Resolve originating Order via ticket.order_id
        ├── 3. Query referral_attributions where order_id = order.id
        │
        ├── If NO referral attribution exists:
        │     └── Log [INFO] "Organic winner ticket {$serial} - zero co-prize allocated"
        │     └── Return null
        │
        └── If valid referral attribution exists (referrer_id = User A):
              ├── 4. Compute 40% integer cents: intdiv($grandPrizeValuationCents * 4000, 10000)
              ├── 5. Construct unique idempotency key: "co_prize_ticket_{$winningTicketSerial}"
              ├── 6. Atomically insert row into affiliate_ledger_entries (Append-Only):
              │        user_id = User A
              │        order_id = order.id
              │        entry_type = 'co_prize_credit'
              │        amount_cents = $coPrizeCents
              │        status = 'pending' (Option C: held pending winner KYC & draw audit approval)
              │        matures_at = null (no auto-timer maturation; requires external approval evidence)
              │        idempotency_key = "co_prize_ticket_{$winningTicketSerial}"
              └── 7. Return created pending AffiliateLedgerEntry

Option C Approval & Release Phase:
        │
        ▼  Invoked manually or via automated compliance workflow
AffiliateCoPrizeService::releaseCoPrize($winningTicketSerial)
        │
        ├── 1. Query CoPrizeApprovalProviderInterface::getApprovalState($winningTicketSerial)
        ├── 2. Evaluate State/Version Freshness Invariant:
        │        - KYC approval exists for exact winner user ID, status = 'approved', not revoked, not superseded
        │        - Draw Integrity audit exists for exact draw ID, status = 'approved', not revoked, not superseded
        │
        ├── If approvals NOT fully fresh and approved:
        │     └── Return current entry (remains 'pending')
        │
        └── If both approvals valid, fresh, and non-revoked:
              └── Transition entry status: 'pending' -> 'available'
              └── Return released entry
```

---

## 3. Financial & Accounting Invariants

1. **Zero Deduction from Winner & Marketing Pool Semantics**:
   * Winner User B receives $100\%$ of prize valuation.
   * Referrer User A receives $+40\%$ in `affiliate_ledger_entries`.
   * Funding is recorded with `funding_source = 'marketing_pool'` as an auditable domain classification (rather than a live treasury account movement, prior to Feature 008 treasury integration), with zero deduction from the winner.
2. **KYC & Draw Audit Maturation Hold (Option C)**:
   * Co-prize entries are initially created in `status = 'pending'` and are **NOT immediately withdrawable**.
   * Funds transition to `status = 'available'` strictly after both KYC and Draw Integrity approvals are verified fresh.
3. **Strict Idempotency**:
   * If `awardCoPrize()` or `releaseCoPrize()` is called multiple times, unique constraint on `idempotency_key` guarantees idempotency without duplicate entries.
4. **Post-Release Revocation & Append-Only Financial Invariance**:
   * Historical financial entries are strictly immutable.
   * Original `amount_cents` is NEVER mutated. Original entry is NEVER deleted.
   * If approvals are revoked after release, an authorized administrator must adjudicate the revocation via `adjudicateCoPrizeRevocation()`.
   * Adjudication creates a compensating `reversal_debit` entry (`amount_cents = -originalAmount`), bringing net subledger balance to 0 while preserving complete audit provenance.
