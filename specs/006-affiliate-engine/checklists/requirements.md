# Specification Quality Checklist: Feature 006 — Multi-Tier Affiliate & Referral Engine

**Purpose**: Validate specification completeness, domain consistency, and requirements quality before proceeding to technical planning  
**Last Updated**: 2026-10-02 (Initial Specification Quality Pass)  
**Feature**: [specs/006-affiliate-engine/spec.md](../spec.md)  
**Branch**: `006-affiliate-engine`

---

## 1. Canonical Model & Business Invariants

- [x] **Buyer Protection Invariant**: Referred customers receive normal course entitlements and promotional ticket gifts ($2 part = 1 ticket, $10 bundle = 15 tickets) with zero ticket loss, price surcharge, or conversion to commission.
- [x] **Two Independent Triggering Events Explicitly Modeled**:
  - Purchase fulfillment → Authoritative Sales Commission
  - Grand prize draw win → 40% Co-Prize from platform marketing pool
- [x] **Marketing Pool Funding Invariant**: Grand prize winner retains 100% of their prize; the 40% co-prize is funded by KNZiN marketing pool, never deducted from the winner.
- [x] **Ratified Commission Rate**: Sales commission rate confirmed and locked by Product Owner at 25% ($0.50 on $2 part, $2.50 on $10 bundle); speculative numbers eliminated.
- [x] **Feature 005 Integration**: Preserves existing `User.learner_code`, `orders`, `CourseEntitlement`, and `Ticket` serials without creating redundant parallel tables.

---

## 2. Requirement Completeness & Scenarios

- [x] All 8 mandatory acceptance scenarios from the Product Owner instruction explicitly represented in User Stories (P1–P3):
  - Scenario 1: Referred $2 purchase ($2 part + 1 ticket for buyer, sales commission for referrer).
  - Scenario 2: Referred $10 bundle purchase ($10 bundle + 15 tickets for buyer, sales commission for referrer).
  - Scenario 3: Referred winner (100% prize to winner, 40% co-prize to referrer from marketing pool held pending winner KYC approval).
  - Scenario 4: Referred winner who also purchased (coexistence of purchase commission and draw co-prize).
  - Scenario 5: Self-referral attempt (strict rejection of attribution and commission).
  - Scenario 6: Duplicate fulfillment replay (idempotent, exactly one sales commission and ledger entry).
  - Scenario 7: Duplicate grand-prize reward event (idempotent, exactly one 40% co-prize credit).
  - Scenario 8: Refund/cancellation/reversal (explicit ledger debit entries without history erasure).
- [x] **Financial Integrity Compliance**: Zero floating-point math; integer cents; append-only affiliate financial subledger under DEC-002.
- [x] **Admin-Controlled Payout Threshold & Invariance**:
  - Enforced dynamically server-side against active Admin setting in integer minor units at the exact moment of request submission.
  - Transparently displayed in affiliate UI (`commission_policy.minimum_payout_cents`) before withdrawal request.
  - Database check constraint enforces positive amount (`CHECK (amount_cents > 0)`); zero hardcoded DB threshold limits.
  - Pending payout immutability: threshold changes never invalidate, cancel, or alter accepted pending payouts.
  - Audit requirement: `threshold_cents_at_request` captured on each payout record for historical compliance.
  - Zero auto-payout generation: lowering threshold never auto-creates payouts without explicit affiliate request.
- [x] **Single User Identity**: One underlying `users` record; optional affiliate profile capabilities; multi-level downlines strictly excluded.
- [x] **Anti-Self-Referral Guard**: Hard deterministic rejection where `referrer_user_id === referred_user_id` or matching normalized emails.

---

## 3. Specification Review Summary

* **Checklist Items Reviewed**: 15
* **Total Checked `[x]`**: 15
* **Total Left Unchecked**: 0
* **Status**: Specification complete; all product decisions (25% sales commission, 30-day last-click, Admin-controlled minimum payout threshold with pending invariance and audit snapshots, 24h sales hold, Option C co-prize KYC hold) ratified and locked by Product Owner. Ready for implementation planning and tasks generation.
