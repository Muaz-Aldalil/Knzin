# API Contract: Referral Resolution & Attribution Capture

**Service**: Affiliate & Referral Engine  
**Contract Version**: 1.0.0  
**Feature**: [specs/006-affiliate-engine/spec.md](../spec.md)  
**Security Level**: Public with rate limiting (60 req/min)  

---

## 1. Resolve Referral Code or Vanity Slug

Validates incoming referral codes (`learner_code` e.g. `LRN-7K2M` or custom vanity slug e.g. `alifaraj`), checks anti-self-referral shields, and returns public affiliate metadata for the landing experience.

* **Endpoint**: `GET /api/v1/referrals/resolve/{codeOrSlug}`
* **Auth**: None (Optional Bearer token if user is already logged in to evaluate self-referral)
* **Middleware**: `throttle:60,1`

### 1.1 Request
* **Path Parameter**:
  * `codeOrSlug` (`string`, required): Alphanumeric code or slug (regex: `^[A-Za-z0-9_-]{3,64}$`).

### 1.2 Response (Success: Valid Referral)
* **HTTP Status**: `200 OK`
* **Payload**:
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "referral_code": "LRN-7K2M",
    "referrer": {
      "display_name": "علي فرج",
      "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      "is_verified_creator": true
    },
    "campaign": {
      "campaign_id": "tiktok_launch",
      "custom_headline_ar": "تعلم مهنة المستقبل وسجل في السحب الترويجي مجاناً",
      "custom_headline_en": "Learn modern vocational skills and enter our promotional draw for free"
    },
    "incentives": {
      "buyer_promotional_tickets_part": 1,
      "buyer_promotional_tickets_bundle": 15,
      "buyer_surcharge": false,
      "notice_ar": "ستحصل على جميع مميزات الدورة وتذاكر السحب الترويجي كاملة دون أي نقصان."
    }
  }
}
```

### 1.3 Response (Self-Referral Detected)
* **HTTP Status**: `422 Unprocessable Entity`
```json
{
  "status": "fail",
  "code": "ERR_SELF_REFERRAL_FORBIDDEN",
  "message": "لا يمكنك استخدام رابط الإحالة الخاص بحسابك لتسجيل مشترياتك الشخصية.",
  "data": {
    "valid": false,
    "is_self_referral": true
  }
}
```

### 1.4 Response (Invalid or Inactive Code)
* **HTTP Status**: `404 Not Found`
```json
{
  "status": "fail",
  "code": "ERR_REFERRAL_CODE_NOT_FOUND",
  "message": "رمز الإحالة غير صالح أو غير نشط.",
  "data": {
    "valid": false
  }
}
```

---

## 2. Order Checkout Attribution Payload

During checkout creation, the frontend includes the active referral code in the order request payload.

* **Endpoint**: `POST /api/v1/checkout/orders`
* **Request Body Additions**:
```json
{
  "email": "student@example.com",
  "course_id": "a2e220d0-8bc2-43bb-a53d-3685c4b82dc1",
  "item_type": "bundle",
  "idempotency_key": "chk_idem_99887766",
  "referral_code": "LRN-7K2M",
  "campaign_tag": "tiktok_launch"
}
```

### 2.1 Server Validation Rules:
1. `referral_code`: Optional string; if present, server verifies referrer exists and `referrer.id !== buyer.id` and `referrer.email !== email`.
2. If self-referral or invalid, the server ignores the referral code and proceeds with a direct organic order (does not abort the purchase).
3. If valid, server attaches `referral_attributions` row inside the order creation database transaction.
