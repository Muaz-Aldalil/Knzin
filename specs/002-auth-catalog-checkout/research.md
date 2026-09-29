# Phase 0 Research & Technology Decisions

**Feature**: Auth, Catalog & Checkout (MVP Scope)  
**Branch**: `002-auth-catalog-checkout`  
**Date**: 2026-09-29  
**Status**: Completed  

---

## 1. Project Organization: Two-Tier Monorepo

### Decision
Structure the repository as a clean two-tier workspace:
- `/frontend`: Next.js 14+ (App Router), TypeScript, Tailwind CSS, `next-intl`, `@tanstack/react-query`, Lucide React icons.
- `/backend`: Laravel 11 REST API, PHP 8.2+, Laravel Sanctum (stateful/bearer tokens), MySQL 8+, Redis 7+.

### Rationale
- **SEO & SSR**: The educational course catalog, lesson outlines, and public landing pages must be pre-rendered with high performance (LCP < 1.2s) and flawless Arabic typography (`Tajawal`), which Next.js App Router delivers out of the box.
- **Transactional & Audit Integrity**: Order creation, legal shield record-keeping, future fintech dual-ledger writes, and asynchronous ticket minting require an isolated backend framework with robust database migration tools, ACID transactions, and queue workers (Laravel 11).
- **Clear Separation of Concerns**: Isolates untrusted client code from business rules and legal compliance validation.

### Alternatives Considered
- *Full-stack Next.js with Prisma/Drizzle*: Rejected because Laravel provides built-in first-class background queue workers, enterprise migration tooling, Sanctum token management, and direct compatibility with regional payment gateway SDKs and webhook architectures.
- *Laravel Blade monolith*: Rejected because client-side interactive flows (anti-piracy questionnaire, dynamic bottom-sheet, bilingual RTL/LTR layout switching without reload, and live countdown timers) demand a modern component framework.

---

## 2. Authentication Architecture & Guest-to-Google Merging

### Decision
- **Guest Identity**: When an unauthenticated user enters an email during checkout, the server checks if an active user exists with that email. If none exists, an unverified user record is provisioned with `auth_provider = 'guest'` and `email_verified_at = null`. A short-lived guest session token (Sanctum) is returned to the client to authorize tracking that specific checkout.
- **Google OAuth**: Implemented via Laravel Socialite with standard OpenID Connect.
- **Dev-Mock Driver**: For local development and automated testing without external Google Cloud credentials, provide a mock driver enabled via `GOOGLE_AUTH_MOCK=true`. When active, `GET /api/v1/auth/google/redirect` routes directly to a simulated callback returning configurable test profiles (e.g. `mock-google-user@example.com`).
- **One-Way Account Merging (`FR-003`)**:
  - When a user logs in via Google with a verified email matching an existing `guest` record:
    1. Re-attribute all `orders` (`WHERE user_id = guest.id`) to the verified Google user ID.
    2. Set `guest.status = 'deactivated'` and append an audit marker (`merged_into = google_user.id`).
    3. Revoke all active guest tokens.
    4. Only the verified Google account remains active.
  - **Invariants**:
    - A verified Google account is NEVER merged into an unverified guest record.
    - Google login with an email not matching any guest simply creates a new verified user.

### Rationale
Ensures zero friction for first-time buyers on mobile networks while guaranteeing account integrity, order history continuity, and defense against account takeover.

---

## 3. Mandatory Legal Shield Validation & Invariants

### Decision
The backend validation strictly enforces the exact canonical verbatim legal shield:
> `"أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل"`

- **Validation Rules**:
  - `legal_terms_agreed`: Required, boolean, must be strictly `true`.
  - `legal_terms_verbatim`: Required, string, exact character match with canonical string.
- If missing, false, or modified by even one character (e.g., draft variants lacking `"وسياسة الخصوصية"` or `"أو قابلة للتبديل"`), the backend rejects the request immediately with `HTTP 422 Unprocessable Entity` and error code `ERR_LEGAL_SHIELD_MISMATCH`.
- Checkbox on the client is strictly non-pre-checked.
- On valid acceptance, the server records:
  - `legal_terms_agreed = true`
  - `terms_agreed_ip = request()->ip()`
  - `terms_agreed_at = now()`

### Rationale
Protects the platform under commercial trade gift regulations in Iraq by strictly decoupling educational course purchases from promotional sweepstakes tickets.

---

## 4. Dual-Currency Financial Separation (Single Source of Truth)

### Decision
Every created order isolates accounting math from marketing display:
1. `total_amount_cents` (BIGINT, USD cents): **Single source of truth** for all financial and ledger math (e.g., $2.00 = `200`, $10.00 = `1000`).
2. `currency`: `CHAR(3)`, frozen to `'USD'`.
3. `exchange_rate`: `DECIMAL(10,4)`, frozen at order creation to `1.3100` (representing 1 USD = 1,310 IQD).
4. `paid_amount_gateway`: `BIGINT`, integer Iraqi Dinars for payment gateway capture (e.g. `2620` IQD for $2.00, calculated as `(total_amount_cents * exchange_rate) / 100 * 1000` or exact dinar integer math).
5. `display_price_label`: `VARCHAR(50)`, marketing display string (e.g. `"2,000 IQD"` for part, `"13,000 IQD"` for bundle). **Strictly display-only; forbidden from any arithmetic or ledger calculations.**

### Rationale
Prevents ledger drift, rounding discrepancies, and currency reconciliation bugs when marketing campaigns advertise round numbers while bank/gateway transfers settle on official central bank rates.

---

## 5. Pending Order Lifecycle, Idempotency & TTL

### Decision
- **Client Idempotency Key**: Generated on the client using UUIDv4 per checkout intent, permanently unique in MySQL (`uq_orders_idempotency`). Starting a new checkout intent requires a new client idempotency key.
- **Deduplication Semantics (`FR-011`)**:
  - Enforced via permanent database unique constraint on `orders.idempotency_key` combined with a Redis atomic lock: `checkout:idempotency:{key}` with a 10-minute TTL to handle sub-second rapid double-clicks.
  - Re-submitting an identical idempotency key replays and returns the existing order reference with `HTTP 200 OK` without creating a duplicate database row.
- **Multiple Pendings**: Users are permitted to create multiple distinct pending orders (with distinct idempotency keys) to allow purchasing multiple course parts or gifts.
- **48-Hour TTL Expiry (`FR-012`)**:
  - `expires_at` is set to `created_at + 48 hours`.
  - A scheduled artisan command (`orders:expire-pending`) runs hourly to mark orders whose `expires_at < now()` and `status = 'pending'` as `status = 'failed'`.
  - Expired pending orders can NEVER mint tickets and can NEVER mutate wallet balances.

### Rationale
Accommodates offline Iraqi cash payment realities (Zain Cash / AsiaHawala cash-in agents often take hours) while protecting promotional inventory and preventing dangling orders.

---

## 6. Anti-Piracy Quiz & Personalization Stamp

### Decision
- **Client Flow**: 3-step interactive questionnaire before opening checkout:
  1. Primary vocational goal (e.g., Car Detailing Shop, Mobile Repair Freelancing, UI/UX Agency).
  2. Weekly study commitment (e.g., 2-4 hours, 5-10 hours, 10+ hours).
  3. Knowledge level (e.g., Absolute Beginner, Intermediate, Advanced).
- **Retake Policy**: Unlimited retakes allowed prior to order confirmation. The last completed answer set overwrites previous attempts in client state.
- **Order Association**: Completed answers are submitted alongside checkout as `quiz_answers` JSON and `quiz_completed_at`.
- **Watermark Stamp**: Client dynamically displays: *"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"* with the user's name/email and unique checkout reference.
- **Server Grading**: Zero server-side scoring or pass/fail evaluation; strictly serves as psychological commitment and customization metadata.

---

## 7. Educational Course Catalog Seed Data

### Decision
Provide realistic, culturally authentic vocational micro-courses in Iraq:
1. **Course 1**: *فن العناية بالسيارات والنانو سيراميك الاحترافي* (Auto Detailing & Nano Ceramic Mastery) — 6 Parts @ $2 each, Full Bundle @ $10 (15 tickets).
2. **Course 2**: *صيانة وبرمجة الهواتف الذكية المتقدمة* (Advanced Smartphone Software & Hardware Repair) — 6 Parts @ $2 each, Full Bundle @ $10 (15 tickets).
3. **Course 3**: *احتراف العمل الحر والتصميم الرقمي في السوق العراقي* (Freelance Design & Digital Business in Iraq) — 6 Parts @ $2 each, Full Bundle @ $10 (15 tickets).

Each part contains syllabus outline, duration, resource types (Video, PDF, Audio), and individual $2 / 1-ticket purchase intent.

---

## 8. API Response Standards & Client State

### Decision
- **JSend Envelope**: All API endpoints return a standardized JSON structure:
  ```json
  {
    "status": "success",
    "data": { ... },
    "message": null
  }
  ```
  On failure:
  ```json
  {
    "status": "fail",
    "data": { "errors": { "field": ["Specific message"] } },
    "code": "ERR_VALIDATION"
  }
  ```
- **Frontend State**: `@tanstack/react-query` handles server state, catalog caching, and mutation lifecycle. Client UI state (quiz step, bottom-sheet open/close, selected part/bundle) is managed using lightweight React hooks.
- **RTL & Localization**: Handled via `next-intl` with dictionary files (`ar.json`, `en.json`), switching `document.documentElement.dir` cleanly between `rtl` and `ltr`.
