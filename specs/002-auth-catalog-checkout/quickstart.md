# Phase 1 Quickstart & Validation Guide

**Feature**: Auth, Catalog & Checkout (MVP Scope)  
**Branch**: `002-auth-catalog-checkout`  
**Date**: 2026-09-29  

---

## Prerequisites & Local Environment

1. **PHP 8.2+** with PDO MySQL, OpenSSL, and BCMath extensions.
2. **Node.js 20+** & npm.
3. **MySQL 8.0+** running locally (or Docker).
4. **Redis 7+** running locally (or Docker).

---

## Setup Commands

### 1. Backend (`/backend`)
```bash
cd backend
composer install
cp .env.example .env
# Configure DB_DATABASE=knzin_db, DB_USERNAME, DB_PASSWORD
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev -- -p 3000
```

---

## Validation Scenarios

### Scenario 1: Unauthenticated Guest Checkout for $2 Course Part
**Goal**: Verify that a first-time guest user can browse a course part, take the quiz, accept the legal agreement, and create an order in `pending` state.

1. Navigate browser to `http://localhost:3000/ar/courses/auto-detailing`.
2. Click **"شراء الجزء الأول (2$ / تذكرة سحب واحدة)"**.
3. **Verify**: Anti-piracy questionnaire modal appears. Select answers for all 3 questions and click "متابعة للدفع".
4. **Verify**: Dynamic personalization stamp appears: *"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"*.
5. **Verify**: Checkout bottom-sheet slides up displaying:
   - Item: "الجزء الأول: أساسيات غسيل وتفكيك السيارات"
   - Price: "$2.00 (~2,000 IQD)"
   - Promotional Gift: "1 تذكرة سحب مجانية"
   - Checkbox is **UNCHECKED** by default.
6. Enter email `test-guest@example.com`.
7. Attempt clicking "تأكيد الطلب" without checking the box.
   - **Expected**: Form is blocked with validation warning.
8. Tick the legal checkbox and click "تأكيد الطلب".
   - **Expected**: HTTP 201 Created. Redirects to order confirmation screen showing order number `KNZ-ORD-2026-XXXX`, status `قيد الانتظار (Pending)`, and instructions for Zain Cash / Qi Card offline completion.

---

### Scenario 2: Canonical Legal Shield Verbatim Tamper Protection
**Goal**: Verify backend strictly rejects modified legal shield strings (HTTP 422).

Execute via cURL or Postman:
```bash
curl -X POST http://localhost:8000/api/v1/checkout/orders \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: 11111111-2222-3333-4444-555555555555" \
  -d '{
    "email": "tamper@example.com",
    "course_id": "VALID_COURSE_UUID",
    "course_part_id": "VALID_PART_UUID",
    "item_type": "part",
    "legal_terms_agreed": true,
    "legal_terms_verbatim": "أوافق على الشروط والأحكام وأشتري محتوى تعليمي"
  }'
```
- **Expected Outcome**: `HTTP 422 Unprocessable Entity`
- **Response**:
```json
{
  "status": "fail",
  "code": "ERR_LEGAL_SHIELD_MISMATCH",
  "message": "The legal terms verbatim agreement does not match the canonical text.",
  "errors": {
    "legal_terms_verbatim": ["Canonical verbatim agreement text required."]
  }
}
```

---

### Scenario 3: 10-Minute Idempotency Deduplication Window
**Goal**: Verify that sending the same order submission twice returns the original order without creating duplicate rows.

1. Send initial order request with `X-Idempotency-Key: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`.
   - **Expected**: `HTTP 201 Created`, order `KNZ-ORD-2026-0001` created.
2. Send identical request within 10 minutes with the same `X-Idempotency-Key`.
   - **Expected**: `HTTP 200 OK`, returns `KNZ-ORD-2026-0001` with zero duplicate database rows created.

---

### Scenario 4: Google OAuth & One-Way Account Merging
**Goal**: Verify that an existing guest user's orders are safely re-attributed when logging in with Google.

1. Create a guest order using email `iraq.learner@gmail.com`.
   - **Verify in DB**: `users` record exists with `email = 'iraq.learner@gmail.com'`, `auth_provider = 'guest'`, `status = 'active'`. Order points to this guest user ID.
2. Trigger Google OAuth login (using dev-mock driver `mock_email=iraq.learner@gmail.com`):
   - Navigate to `http://localhost:8000/api/v1/auth/google/redirect?mock_email=iraq.learner@gmail.com`.
3. **Verify in DB**:
   - Google user record created with `auth_provider = 'google'`, `email_verified_at` set.
   - Previous guest user has `status = 'deactivated'` and `merged_into_user_id = google_user.id`.
   - Previous guest order `user_id` is updated to the Google user ID.
   - Verified account is never merged into an unverified account.

---

### Scenario 5: Dual-Currency Financial Reconciliation
**Goal**: Verify database records accurately preserve accounting truth and marketing display isolation.

Inspect database record for created order:
```sql
SELECT order_number, total_amount_cents, currency, exchange_rate, paid_amount_gateway, display_price_label 
FROM orders WHERE order_number = 'KNZ-ORD-2026-XXXX';
```
- **Expected Results**:
  - `total_amount_cents`: `200` ($2.00)
  - `currency`: `'USD'`
  - `exchange_rate`: `1.3100`
  - `paid_amount_gateway`: `2620` (IQD)
  - `display_price_label`: `'2,000 IQD'` (isolated from math)
