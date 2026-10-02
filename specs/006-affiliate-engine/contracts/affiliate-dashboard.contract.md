# API Contract: Affiliate Dashboard & Ledger Reporting

**Service**: Affiliate & Referral Engine  
**Contract Version**: 1.0.0  
**Feature**: [specs/006-affiliate-engine/spec.md](../spec.md)  
**Security Level**: Authenticated via Laravel Sanctum (`auth:sanctum`)  

---

## 1. Get Affiliate Dashboard Summary

Retrieves real-time affiliate KPI cards, commission balances, referral link metadata, active promotional draw co-prize eligibility count, and the currently active Admin-defined minimum withdrawal threshold (`commission_policy.minimum_payout_cents`).

### Payout Threshold Presentation & Authority:
* **Active Setting Representation**: `commission_policy.minimum_payout_cents` reflects the current Admin-controlled setting in integer minor units (e.g. `5000` = $50.00).
* **UI Transparency**: The affiliate frontend uses this value to display the required minimum withdrawal balance, render progress toward eligibility, and inform the user before submission.
* **Server Authority**: The backend remains the sole authoritative arbiter at request submission time; client display values never bypass server validation.
* **No Retroactive Effect**: Admin threshold updates take effect dynamically in dashboard responses immediately, without modifying existing pending or historical payouts.

* **Endpoint**: `GET /api/v1/affiliate/dashboard`
* **Auth**: `Bearer <SanctumToken>`
* **Middleware**: `auth:sanctum`

### 1.1 Response (Success)
* **HTTP Status**: `200 OK`
* **Payload**:
```json
{
  "status": "success",
  "data": {
    "referral_info": {
      "learner_code": "LRN-7K2M",
      "custom_slug": "alifaraj",
      "canonical_url": "https://knzin.com?ref=LRN-7K2M",
      "vanity_url": "https://knzin.com/alifaraj",
      "is_influencer": true
    },
    "kpis": {
      "unpaid_available_cents": 6500,
      "unpaid_available_formatted": "$65.00",
      "unpaid_available_iqd": 85150,
      "unpaid_pending_cents": 500,
      "unpaid_pending_formatted": "$5.00",
      "total_earned_cents": 12000,
      "total_earned_formatted": "$120.00",
      "total_withdrawn_cents": 5000,
      "total_withdrawn_formatted": "$50.00",
      "total_referred_orders_count": 8,
      "active_co_prize_tickets_count": 45
    },
    "commission_policy": {
      "sales_commission_rate_percent": 25,
      "minimum_payout_cents": 5000,
      "minimum_payout_formatted": "$50.00",
      "maturation_hold_hours": 24,
      "co_prize_share_percent": 40
    },
    "recent_conversions": [
      {
        "order_number": "KNZ-ORD-2026-X9B21",
        "course_title_ar": "صيانة وبرمجة الهواتف الذكية",
        "course_title_en": "Smartphone Hardware & Software Repair",
        "purchase_type": "bundle",
        "buyer_name": "أحمد ع.",
        "order_total_formatted": "$10.00",
        "commission_cents": 250,
        "commission_formatted": "$2.50",
        "tickets_granted_to_buyer": 15,
        "status": "available",
        "matures_at": "2026-10-02T14:30:00Z",
        "created_at": "2026-10-01T14:30:00Z"
      }
    ]
  }
}
```

---

## 2. Get Paginated Affiliate Ledger History

Returns an append-only audit trail of all ledger transactions (sales commissions, co-prize credits, payout debits, reversals).

* **Endpoint**: `GET /api/v1/affiliate/ledger`
* **Auth**: `Bearer <SanctumToken>`
* **Query Parameters**:
  * `page` (`integer`, optional, default: 1)
  * `per_page` (`integer`, optional, default: 15, max: 50)
  * `type` (`string`, optional: `all`, `sales_commission`, `co_prize_credit`, `payout_debit`)

### 2.1 Response (Success)
* **HTTP Status**: `200 OK`
* **Payload**:
```json
{
  "status": "success",
  "data": {
    "entries": [
      {
        "id": 104,
        "entry_type": "sales_commission",
        "amount_cents": 250,
        "amount_formatted": "+$2.50",
        "currency": "USD",
        "status": "available",
        "order_number": "KNZ-ORD-2026-X9B21",
        "description_ar": "عمولة مبيعات 25% من شراء باقة دورة صيانة الهواتف",
        "description_en": "25% sales commission from Smartphone Repair Course Bundle purchase",
        "matures_at": "2026-10-02T14:30:00Z",
        "created_at": "2026-10-01T14:30:00Z"
      },
      {
        "id": 98,
        "entry_type": "payout_debit",
        "amount_cents": -5000,
        "amount_formatted": "-$50.00",
        "currency": "USD",
        "status": "cleared",
        "payout_number": "KNZ-PAY-2026-448102",
        "description_ar": "سحب أرباح عبر زين كاش (تم التحويل)",
        "description_en": "Payout withdrawal via ZainCash (Completed)",
        "created_at": "2026-09-28T09:15:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total_entries": 2,
      "total_pages": 1
    }
  }
}
```
