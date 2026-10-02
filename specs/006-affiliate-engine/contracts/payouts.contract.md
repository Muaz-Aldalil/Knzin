# API Contract: Affiliate Payouts & Settlement

**Service**: Affiliate & Referral Engine  
**Contract Version**: 1.0.0  
**Feature**: [specs/006-affiliate-engine/spec.md](../spec.md)  
**Security Level**: Authenticated via Laravel Sanctum (`auth:sanctum`)  

---

## 1. Request Payout Withdrawal

Submits a formal cash withdrawal request. The backend atomically validates that the requested amount meets or exceeds the currently active Admin-configured minimum withdrawal threshold and does not exceed the affiliate's current available mature balance. A `payout_debit` entry is immediately inserted into the ledger inside the database transaction to prevent double-spending.

### Payout Threshold Policies:
* **Active Threshold Enforcement**: Evaluated dynamically server-side against the threshold active at the exact moment of request submission. The backend is authoritative; frontend display values only guide the user.
* **Pending Payouts Invariance**: Once accepted (`status = 'requested'`), subsequent Admin threshold adjustments (increases or decreases) MUST NOT invalidate, cancel, or alter this pending payout. It remains valid and continues through settlement under the terms active when requested.
* **No Auto-Payout on Lowering**: Lowering the threshold never automatically generates payouts; affiliates must submit explicit withdrawal requests.
* **Audit Trail**: The effective active threshold is permanently captured in `threshold_cents_at_request` on the created payout record.

* **Endpoint**: `POST /api/v1/affiliate/payouts/request`
* **Auth**: `Bearer <SanctumToken>`
* **Middleware**: `auth:sanctum`

### 1.1 Request Payload
```json
{
  "amount_cents": 6500,
  "payout_method": "zain_cash",
  "recipient_details": {
    "phone_number": "07801234567",
    "account_name": "علي فرج حسين",
    "governorate": "بغداد"
  }
}
```

### 1.2 Response (Success: Payout Created)
* **HTTP Status**: `201 Created`
* **Payload**:
```json
{
  "status": "success",
  "data": {
    "payout_number": "KNZ-PAY-2026-881204",
    "amount_cents": 6500,
    "amount_formatted": "$65.00",
    "amount_iqd": 85150,
    "threshold_cents_at_request": 5000,
    "payout_method": "zain_cash",
    "status": "requested",
    "status_label_ar": "قيد المراجعة والتحويل",
    "status_label_en": "Pending Review & Transfer",
    "recipient_details": {
      "phone_number": "07801234567",
      "account_name": "علي فرج حسين",
      "governorate": "بغداد"
    },
    "remaining_available_cents": 0,
    "created_at": "2026-10-02T10:00:00Z"
  }
}
```

### 1.3 Response (Fail: Below Active Admin Minimum Threshold)
* **HTTP Status**: `422 Unprocessable Entity`
```json
{
  "status": "fail",
  "code": "ERR_PAYOUT_THRESHOLD_UNMET",
  "message": "مبلغ السحب المطلوب أقل من الحد الأدنى المسموح به حالياً للسحب.",
  "data": {
    "requested_amount_cents": 3000,
    "minimum_threshold_cents": 5000,
    "minimum_threshold_formatted": "$50.00",
    "minimum_threshold_iqd": 65500
  }
}
```

### 1.4 Response (Fail: Insufficient Mature Available Balance)
* **HTTP Status**: `422 Unprocessable Entity`
```json
{
  "status": "fail",
  "code": "ERR_INSUFFICIENT_AVAILABLE_BALANCE",
  "message": "رصيدك المتاح للسحب حالياً غير كافٍ. قد تكون بعض العمولات ما زالت في فترة التعليق (24 ساعة).",
  "data": {
    "requested_amount_cents": 6500,
    "available_balance_cents": 4000,
    "pending_balance_cents": 2500
  }
}
```

---

## 2. List Past Payouts

Returns the history of past withdrawal requests, settlement statuses, snapshot thresholds at request time, and administrator payment tracking numbers.

* **Endpoint**: `GET /api/v1/affiliate/payouts`
* **Auth**: `Bearer <SanctumToken>`

### 2.1 Response (Success)
* **HTTP Status**: `200 OK`
* **Payload**:
```json
{
  "status": "success",
  "data": {
    "payouts": [
      {
        "payout_number": "KNZ-PAY-2026-881204",
        "amount_cents": 6500,
        "amount_formatted": "$65.00",
        "amount_iqd": 85150,
        "threshold_cents_at_request": 5000,
        "payout_method": "zain_cash",
        "status": "requested",
        "admin_reference_number": null,
        "created_at": "2026-10-02T10:00:00Z",
        "processed_at": null
      },
      {
        "payout_number": "KNZ-PAY-2026-448102",
        "amount_cents": 5000,
        "amount_formatted": "$50.00",
        "amount_iqd": 65500,
        "threshold_cents_at_request": 5000,
        "payout_method": "zain_cash",
        "status": "completed",
        "admin_reference_number": "ZC-TX-99381024",
        "created_at": "2026-09-28T09:15:00Z",
        "processed_at": "2026-09-28T14:22:00Z"
      }
    ]
  }
}
```
