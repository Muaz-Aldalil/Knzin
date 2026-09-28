# Implementation Plan: Auth, Catalog & Checkout (MVP Scope)

**Branch**: `002-auth-catalog-checkout` | **Date**: 2026-09-29 | **Spec**: [spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/002-auth-catalog-checkout/spec.md)

**Input**: Feature specification from `/specs/002-auth-catalog-checkout/spec.md`

---

## Summary

Implement the core MVP purchasing journey for KNZiN:
1. **Catalog & Micro-Pricing**: Educational vocational courses with individual parts ($2.00 / 1 promotional ticket) and full 6-part bundles ($10.00 / 15 promotional tickets).
2. **Anti-Piracy Psychological Profiler**: 3-step questionnaire prior to checkout with client-side personalization stamp (*"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"*), unlimited retakes before order confirmation, and zero server scoring.
3. **Checkout Bottom-Sheet & Canonical Legal Shield**: Frictionless guest email checkout requiring affirmative acceptance of the exact canonical legal verbatim text (`FR-008`), rejected strictly on the backend if modified (HTTP 422).
4. **Order Creation & Invariants**: Creation in `pending` state with dual-currency separation (`total_amount_cents` in USD cents, `exchange_rate` frozen at 1.3100, `paid_amount_gateway` in IQD, `display_price_label` e.g. "2,000 IQD" for UI only), 10-minute client idempotency deduplication window, and 48-hour TTL auto-expiration.
5. **Authentication & One-Way Identity Merging**: Guest token issuance and Google OAuth sign-in with dev-mock driver; one-way merge of guest orders into verified Google accounts upon exact email match.
6. **Explicit Scope Lock**: Webhooks, ticket minting (`KNZ-A15-...`), RNG draws, wallet ledger writes, and referral payouts are strictly out-of-scope and deferred to Phase 3.

---

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.3+, Node.js 20+
- Backend: PHP 8.2+, Laravel 11.x

**Primary Dependencies**:
- Frontend: Next.js 14+ (App Router), Tailwind CSS, `next-intl` (RTL/LTR dual-locale), `@tanstack/react-query`, `lucide-react`.
- Backend: Laravel 11, Laravel Sanctum, Laravel Socialite.

**Storage**:
- Database: MySQL 8.0+ / MariaDB (`InnoDB`, `utf8mb4_unicode_ci`).
- Caching & Queues: Redis 7.0+.

**Testing**:
- Backend: PHPUnit / Pest for HTTP API contracts, idempotency, and legal shield validation tests.
- Frontend: Vitest + React Testing Library for component rendering and quiz state.

**Target Platform**:
- Responsive web: Mobile-first (375px+ viewport) up to high-DPI desktop displays (1920px+).
- Regional optimization: High tolerance for latent 3G/4G Iraqi telecom connections.

**Project Type**: Full-stack web application (Two-Tier Architecture).

**Performance Goals**:
- Initial page load (LCP) < 1.2s on mobile 4G.
- Order creation endpoint p95 latency < 200ms.
- Zero cumulative layout shift (CLS < 0.05) when toggling Arabic &harr; English.

**Constraints**:
- **Strict Legal Decoupling**: Invoices and orders are 100% educational course purchases; tickets are zero-value complimentary promotional gifts.
- **Fintech Single Truth**: Zero floating-point math; all monetary amounts stored in `BIGINT` minor units.
- **RTL-First Typography**: Arabic primary using Google Fonts `Tajawal` font family.

**Scale/Scope**:
- 3 initial vocational courses (18 course parts).
- Modular design ready for 50,000+ simultaneous checkout requests during promotional campaigns.

---

## Constitution Check

*GATE: Checked against `.specify/memory/constitution.md` (v2.0.0).*

| Constitution Principle | Status | Architectural Compliance |
| :--- | :---: | :--- |
| **I. Full-Stack Production Stack Lock** | **PASS** | Monorepo separated into `/frontend` (Next.js 14 App Router, TypeScript, Tailwind, `next-intl`) and `/backend` (Laravel 11, Sanctum, MySQL 8+, Redis). |
| **II. RTL Arabic-First & Dual-Locale** | **PASS** | Arabic is primary (`dir="rtl"`) with Tajawal font; English secondary (`dir="ltr"`) via `next-intl` dictionary routing. |
| **III. Strict Legal Decoupling & Promotional Gift** | **PASS** | Order line items represent course parts ($2) and bundles ($10). Tickets recorded as zero-value grants (`promotional_tickets_granted`). Mandatory canonical legal shield text strictly verified on backend. |
| **IV. Fintech Dual-Ledger & Zero Floating-Point** | **PASS** | `total_amount_cents` stored as `BIGINT`. Frozen `exchange_rate` (1.3100) and `paid_amount_gateway` (IQD) separated from marketing string (`display_price_label`). |
| **V. Webhook Source-of-Truth & Async Ticket Minting** | **PASS** | Scope locked: Orders remain in `pending` state; live webhooks and ticket minting strictly deferred to Phase 3. |
| **VI. Provably Fair Draws & Cryptographic Transparency** | **PASS** | Draw RNG and commit-reveal logic deferred to Phase 3. |
| **VII. Server-Enforced AuthZ & KYC Gates** | **PASS** | Order submission, legal verbatim checking, and identity merging enforced strictly on Laravel backend. |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-catalog-checkout/
├── spec.md              # Feature specification with clarifications encoded
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 architectural decisions & technology choices
├── data-model.md        # Phase 1 database schema, entity models & order lifecycle
├── quickstart.md        # Phase 1 test and verification scenarios
├── contracts/           # Phase 1 OpenAPI 3.0 REST API specification
│   └── api.yaml
└── checklists/
    └── requirements.md  # Requirements completeness checklist
```

### Source Code Layout

```text
d:/Work Projects/Knzin Project/
├── backend/
│   ├── app/
│   │   ├── Enums/
│   │   │   ├── OrderStatus.php
│   │   │   └── AuthProvider.php
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── CatalogController.php
│   │   │   │   └── CheckoutController.php
│   │   │   ├── Requests/
│   │   │   │   ├── CreateOrderRequest.php
│   │   │   │   └── GuestAuthRequest.php
│   │   │   └── Resources/
│   │   │       ├── CourseResource.php
│   │   │       └── OrderResource.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Course.php
│   │   │   ├── CoursePart.php
│   │   │   ├── Order.php
│   │   │   └── OrderItem.php
│   │   └── Services/
│   │       ├── AuthService.php
│   │       └── OrderService.php
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 2026_09_29_000001_create_users_table.php
│   │   │   ├── 2026_09_29_000002_create_courses_table.php
│   │   │   ├── 2026_09_29_000003_create_course_parts_table.php
│   │   │   ├── 2026_09_29_000004_create_orders_table.php
│   │   │   └── 2026_09_29_000005_create_order_items_table.php
│   │   └── seeders/
│   │       ├── DatabaseSeeder.php
│   │       └── CourseCatalogSeeder.php
│   ├── routes/
│   │   └── api.php
│   └── tests/
│       └── Feature/
│           ├── AuthMergeTest.php
│           ├── LegalShieldTest.php
│           └── OrderIdempotencyTest.php
│
├── frontend/
│   ├── messages/
│   │   ├── ar.json
│   │   └── en.json
│   ├── public/
│   │   └── images/courses/
│   ├── src/
│   │   ├── app/
│   │   │   └── [locale]/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── courses/
│   │   │       │   └── [slug]/page.tsx
│   │   │       └── order-summary/
│   │   │           └── [orderNumber]/page.tsx
│   │   ├── components/
│   │   │   ├── catalog/
│   │   │   │   ├── CourseCard.tsx
│   │   │   │   ├── CoursePartList.tsx
│   │   │   │   └── PricingBadge.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── CheckoutBottomSheet.tsx
│   │   │   │   ├── LegalShieldCheckbox.tsx
│   │   │   │   └── OrderSummaryCard.tsx
│   │   │   ├── quiz/
│   │   │   │   ├── AntiPiracyModal.tsx
│   │   │   │   ├── QuizStep.tsx
│   │   │   │   └── PersonalizationBadge.tsx
│   │   │   └── layout/
│   │   │       ├── HeaderHUD.tsx
│   │   │       └── LanguageToggle.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCatalog.ts
│   │   │   └── useCheckout.ts
│   │   ├── lib/
│   │   │   └── api-client.ts
│   │   └── types/
│   │       └── index.ts
│   └── tailwind.config.ts
│
└── prototype/                 # Preserved static reference prototype
    ├── index.html
    └── js/app.js
```

**Structure Decision**: Clean two-tier monorepo with separate `backend/` and `frontend/` roots. This directly fulfills Constitution Principle I, eliminates cross-framework dependency pollution, and enables independent backend contract testing and frontend SSR performance.

---

## Complexity Tracking

*No constitutional violations identified. Standard two-tier architecture is mandated by Constitution Principle I.*

| Component | Standard Approach | Justification |
| :--- | :--- | :--- |
| **Two-Tier Monorepo** | Mandated by Constitution Principle I | Ensures separation of concern between Next.js SSR and Laravel ACID transactions. |
| **Dev-Mock Google OAuth** | Local simulated callback driver | Prevents blocking local development on external Google Cloud console setup. |

---

## Implementation Phases & Next Steps

### Phase 0: Research & Clarifications *(Completed)*
- Documented technology choices, guest authentication flow, and one-way account merging rules in `research.md`.

### Phase 1: Data Model, Contracts & Quickstart *(Completed)*
- Detailed MySQL 8+ database schema and order lifecycle in `data-model.md`.
- OpenAPI 3.0 specification in `contracts/api.yaml`.
- Runnable test scenarios in `quickstart.md`.

### Phase 2: Tasks Breakdown (`speckit-tasks`) *(Next Step)*
- Execute `/speckit-tasks` to generate actionable, dependency-ordered tasks in `specs/002-auth-catalog-checkout/tasks.md` broken into:
  1. Backend database migrations & authentic course seeders.
  2. Backend REST API controllers, Sanctum auth, and legal shield validation.
  3. Frontend Next.js foundation, RTL Tajawal typography, and `next-intl` setup.
  4. Course catalog exploration UI (parts $2 & bundle $10).
  5. 3-step Anti-Piracy Quiz with retake handling and personalization badge.
  6. Mobile checkout bottom-sheet with canonical legal shield and pending order submission.
  7. Google OAuth login and one-way guest order merging.
  8. End-to-end integration and test suite validation.
