# Quickstart & Developer Walkthrough: Feature 006 — Multi-Tier Affiliate & Referral Engine

**Feature**: [specs/006-affiliate-engine/spec.md](spec.md)  
**Branch**: `006-affiliate-engine`  
**Date**: 2026-10-02  

---

## 1. Prerequisites & Environment Setup

Verify the local development environment is running:
* **Database**: MySQL/MariaDB active on `127.0.0.1:3306` (`knzin_db`).
* **Backend**: `php artisan serve --port=8000` active on `http://127.0.0.1:8000`.
* **Frontend**: `npm run dev` active on `http://localhost:3000`.

---

## 2. Core Validation Scenarios (1 through 8)

### Scenario 1: Referred $2 Course Part Purchase
* **Goal**: Prove that Buyer B receives their course part entitlement and exactly 1 promotional ticket, while Referrer A receives an authoritative 25% sales commission ($0.50 / 50 cents).
```bash
# 1. Resolve Referrer A's referral code
curl -X GET "http://127.0.0.1:8000/api/v1/referrals/resolve/LRN-7K2M" \
  -H "Accept: application/json"

# 2. Buyer B checks out $2 part with referral_code
curl -X POST "http://127.0.0.1:8000/api/v1/checkout/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer_b@example.com",
    "course_id": "a2e220d0-8bc2-43bb-a53d-3685c4b82dc1",
    "item_type": "part",
    "course_part_id": 2,
    "referral_code": "LRN-7K2M",
    "idempotency_key": "chk_scen1_part2"
  }'

# 3. Simulate order fulfillment (triggers EntitlementService + GenerateTicketsJob + AffiliateCommissionService)
php artisan knzin:simulate-fulfillment KNZ-ORD-XXXXXX

# 4. Verify Database State:
# - Buyer B has 1 course_entitlement row for part 2
# - Buyer B has 1 ticket row in tickets table
# - Referrer A has 1 row in affiliate_ledger_entries: amount_cents = 50, entry_type = 'sales_commission', status = 'pending'
```

---

### Scenario 2: Referred $10 Course Bundle Purchase
* **Goal**: Prove that Buyer B receives full-course bundle access and exactly 15 promotional tickets, while Referrer A receives 25% commission ($2.50 / 250 cents).
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/checkout/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer_c@example.com",
    "course_id": "a2e220d0-8bc2-43bb-a53d-3685c4b82dc1",
    "item_type": "bundle",
    "referral_code": "LRN-7K2M",
    "idempotency_key": "chk_scen2_bundle"
  }'

# Expected Outcome:
# - Buyer C: bundle entitlement created + 15 tickets minted
# - Referrer A: affiliate_ledger_entries row with amount_cents = 250, status = 'pending'
```

---

### Scenario 3: 24h Commission Maturation & Scheduled Sweep
* **Goal**: Verify that pending sales commissions mature into available balances exactly after 24 hours via scheduled sweep.
```bash
# Execute maturation artisan command:
php artisan knzin:mature-commissions

# Expected Outcome:
# - All sales_commission ledger entries with matures_at <= now() transition from 'pending' to 'available'
# - Reflected immediately in /api/v1/affiliate/dashboard under unpaid_available_cents
```

---

### Scenario 4: Grand-Prize 40% Co-Share Resolution (Option C)
* **Goal**: Prove that when Buyer B's ticket wins a draw, Referrer A receives 40% of the prize valuation from the marketing pool without deducting anything from Buyer B.
```bash
# Execute internal test harness command:
php artisan knzin:test-co-prize-award --ticket=KNZ-26-XXXX-YYYY --prize-cents=1000000 --release

# Expected Outcome:
# - Winner retains full $10,000 prize
# - Referrer A receives +400,000 cents ($4,000.00) in affiliate_ledger_entries with entry_type = 'co_prize_credit'
# - Status is initially 'pending' (Option C: held pending winner KYC & draw audit approval)
# - With --release flag, simulates Admin approval and transitions status to 'available'
```

---

### Scenario 5: Anti-Self-Referral Enforcement
* **Goal**: Prove that User A cannot earn commission by using their own referral code, either authenticated or via guest email match.
```bash
# Authenticated as User A (bearer token):
curl -X POST "http://127.0.0.1:8000/api/v1/checkout/orders" \
  -H "Authorization: Bearer <UserA_Token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user_a@example.com",
    "course_id": "a2e220d0-8bc2-43bb-a53d-3685c4b82dc1",
    "item_type": "bundle",
    "referral_code": "LRN-USERA",
    "idempotency_key": "chk_self_ref"
  }'

# Expected Outcome:
# - Server detects referrer_id === buyer_id (or normalized email match)
# - Attribution is rejected
# - Order succeeds organically; zero commission ledger entry created
```

---

### Scenario 6: Duplicate Webhook / Fulfillment Replay Idempotency
* **Goal**: Prove that duplicate webhook delivery produces exactly one commission credit.
```bash
# Call fulfillOrder twice on the same order:
php artisan knzin:simulate-fulfillment KNZ-ORD-XXXXXX
php artisan knzin:simulate-fulfillment KNZ-ORD-XXXXXX

# Expected Outcome:
# - Second run detects unique constraint uq_affiliate_ledger_order_commission
# - Exactly 1 ledger row exists; zero duplicate funds credited
```

---

### Scenario 7: Dynamic Payout Threshold, Snapshotting & Pending Invariance
* **Goal**: Verify active threshold enforcement, snapshot recording (`threshold_cents_at_request`), pending payout immutability after threshold increases, and zero-balance double-spend locks.
```bash
# 1. Attempt payout with $30 available when active threshold is $50 (5,000 cents)
# Expected: Rejected with HTTP 422 ERR_PAYOUT_THRESHOLD_UNMET
curl -X POST "http://127.0.0.1:8000/api/v1/affiliate/payouts/request" \
  -H "Authorization: Bearer <AffiliateToken>" \
  -H "Content-Type: application/json" \
  -d '{ "amount_cents": 3000, "payout_method": "zain_cash", "recipient_details": { "phone": "07801234567" } }'

# 2. Payout with $65 available (Accepted: HTTP 201)
curl -X POST "http://127.0.0.1:8000/api/v1/affiliate/payouts/request" \
  -H "Authorization: Bearer <AffiliateToken>" \
  -H "Content-Type: application/json" \
  -d '{ "amount_cents": 6500, "payout_method": "zain_cash", "recipient_details": { "phone": "07801234567", "account_name": "Ali F.", "governorate": "بغداد" } }'

# Expected Outcome:
# - affiliate_payouts row created (status = 'requested', threshold_cents_at_request = 5000)
# - payout_debit row inserted in ledger (-6500 cents)
# - Available balance immediately drops by $65, rendering concurrent withdrawal impossible

# 3. Admin raises active threshold to $100 (10,000 cents)
php artisan knzin:set-setting affiliate.payout_min_cents 10000

# Expected Outcome for Pending Payout:
# - The existing $65 payout remains valid and pending in status = 'requested'
# - The snapshot threshold_cents_at_request (5000) proves the request was valid when submitted
# - New requests for $60 from any affiliate are rejected (requires $100)

# 4. Admin lowers active threshold to $25 (2,500 cents)
php artisan knzin:set-setting affiliate.payout_min_cents 2500

# Expected Outcome for Threshold Lowering:
# - Zero automatic payouts are created for affiliates with $25+ balance
# - Affiliates must explicitly submit a withdrawal request to initiate a payout
```

---

### Scenario 8: Payout Rejection & Compensating Reversal with Zero History Deletion
* **Goal**: Verify that when Admin rejects a payout, a compensating `reversal_credit` entry restores available balance without deleting historical debit rows.
```bash
# Execute rejection via AffiliatePayoutService
# Expected Outcome:
# - Payout transitions to status = 'rejected'
# - Original payout_debit row (-$50) remains in ledger
# - New reversal_credit row (+$50) is appended to ledger
# - Available balance is restored to previous value
```
