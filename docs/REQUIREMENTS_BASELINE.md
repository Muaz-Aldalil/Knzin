# KNZiN Requirements Baseline

**Document Status:** Authoritative Source of Truth  
**Created:** September 2026  
**Roles & Governance:** Product Management, Architecture, UX Engineering & Technical Leadership  
**Primary Repository:** `D:\Work Projects\Knzin Project`

---

## 1. Product Definition

### 1.1 What KNZiN Is
**KNZiN (كنزين)** is an Arabic-first educational e-commerce platform that combines **practical vocational micro-learning** with **high-stakes promotional sweepstakes**.

The platform is powered by a **Dual-Engine Architecture**:
1. **The Educational Engine (المحرك التعليمي / المالي):** Users purchase focused, high-yield digital vocational micro-courses (organized into individual parts for $2.00 or full bundles for $10.00) covering monetizable, real-world trades (e.g., Auto Detailing, Phone Hardware Repair, Hybrid Solar Installation, Freelance Graphic Design, HVAC, CCTV, Barbering, Specialty Coffee).
2. **The Promotional Raffle Engine (محرك السحوبات والتمويل):** Every course purchase includes complimentary, zero-cost promotional draw tickets that automatically enter the customer into transparent, automated prize draws (hourly, daily, monthly, and seasonal) with prizes ranging from $100 cash up to $500,000 for startup funding and family security.

### 1.2 The Core Value Proposition
> *"نحن نؤمن بأن الشباب يحتاجون إلى المهارة ورأس المال معاً. لذلك، نحن نعلمك مهارات العمل الحر، ونمنحك فرصة لربح تمويل مشروعك في نفس الوقت."*  
> *(We believe youth need both skill and capital together. Therefore, we teach you freelance and vocational skills, while giving you the chance to win funding for your project at the same time.)*

### 1.3 The Problems Being Solved
1. **Severe Youth Unemployment & Capital Scarcity:** Across Iraq and the MENA region, young people lack modern vocational training for immediate self-employment and face prohibitive barriers to traditional bank credit or venture capital.
2. **E-Learning Abandonment:** Traditional digital courses suffer from near-zero completion rates because learners lack tangible, immediate incentives.
3. **Legal & Cultural Prohibitions on Gambling:** Direct lotteries and cash gambling are strictly prohibited culturally and legally across Arab jurisdictions. KNZiN operates under a compliant **promotional reward model**: customers pay strictly for digital educational assets, receiving raffle entries exclusively as free promotional gifts.

---

## 2. Confirmed Requirements

These requirements are firmly established across the project specification ([تفاصيل مشروع KNZiN 💰.md](file:///D:/Work%20Projects/Knzin%20Project/Project%20info/%D8%AA%D9%81%D8%A7%D8%B5%D9%8A%D9%84%20%D9%85%D8%B4%D8%B1%D9%88%D8%B9%20KNZiN%20%F0%9F%92%B0.md)), the foundational context ([PROJECT_CONTEXT.md](file:///D:/Work%20Projects/Knzin%20Project/PROJECT_CONTEXT.md)), and architectural decisions ([DECISIONS.md](file:///D:/Work%20Projects/Knzin%20Project/DECISIONS.md)):

### 2.1 Pricing & Promotional Ticket Ratios
* **Individual Course Part:** Exactly **$2.00 USD** (calculated at 2,620 IQD for gateway settlement; displayed as 2,000 IQD). Yields exactly **1 free promotional ticket**.
* **Full Course Bundle (All Parts):** Exactly **$10.00 USD** (calculated at 13,100 IQD for gateway settlement; displayed as 13,000 IQD). Yields exactly **15 free promotional tickets** (6 parts + 9 bonus tickets).
* **Exchange Rate:** Authoritatively frozen at **1.3100** (1 USD = 1,310 IQD) for consistent arithmetic.
* **Separation of Goods:** Tickets **cannot** be purchased standalone under any circumstances.

### 2.2 Canonical Legal Shield
Before order creation or payment execution, the user must explicitly accept a mandatory consent checkbox containing this **exact verbatim text**:
> « **أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل** »  
> *(I agree to the Terms and Conditions and Privacy Policy, and acknowledge that I am purchasing educational digital content, and that the attached draw ticket is a free, non-refundable, and non-exchangeable promotional gift.)*

* Backend validation must reject any request whose text deviates by even a single character (`ERR_LEGAL_SHIELD_MISMATCH`).
* Audit logs must record client IP, timestamp, and user ID upon consent.

### 2.3 Frictionless Guest Checkout
* Customers must be able to complete purchases using **only an email address**, without being forced to create an account, verify a password, or pass through an onboarding wall before payment.
* Accounts are created or resolved in the background by normalized lowercase email.
* Each order submission must supply an `idempotency_key` to prevent double-charging on network dropouts.

### 2.4 Psychological Anti-Piracy Profiler
* Before checkout, a 3-step vocational survey captures:
  1. Experience level (`experience_level`)
  2. Primary career goal (`learning_goal`)
  3. Weekly time/budget commitment (`weekly_hours`)
* A dynamic Personalization Stamp is displayed:  
  *« تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك »* (This programmed copy has been customized exclusively for your data).
* Purpose: Establish psychological ownership so learners believe the content is calibrated specifically to their profile and cannot be shared or pirated effectively.

### 2.5 Two-Tier Architecture & Data Integrity
* **Frontend:** Next.js 16 (App Router), TypeScript, TailwindCSS v4, shadcn/ui primitives.
* **Backend:** Laravel 11 REST API, MySQL 8+, Sanctum token authentication.
* **Database Ledger:** Immutable append-only ledger for all wallet transactions; all money stored in smallest integer units (`BIGINT` cents / IQD fils); no floating-point arithmetic.
* **Webhook Truth:** Order fulfillment, ticket generation, and course entitlement are driven exclusively by server-to-server gateway webhooks, never client-side redirects.

### 2.6 Localization & Identity
* Native bilingual support: **Arabic (`/ar`, RTL default)** and **English (`/en`, LTR)**.
* Primary brand color: Facebook Blue (`#1877F2`) with light mode (`#FFFFFF`, `#F8FAFC`) and dark mode (`#0F172A`).
* Typography: Tajawal font for Arabic.

---

## 3. Current Implementation

This section documents what is **actually committed, present, and verified** in the codebase today (Commit [`b7e7310`](file:///d:/Work%20Projects/Knzin%20Project)):

| Component / Subsystem | Implementation Location | Operational Status |
| :--- | :--- | :--- |
| **Bilingual App Router** | `frontend/src/app/[locale]/` | **100% Active** (`/ar` RTL, `/en` LTR via `next-intl`) |
| **Sticky Header HUD** | `frontend/src/components/layout/HeaderHUD.tsx` | **Active**: Logo, ticket count, wallet balance, language toggle, theme toggle, Google login dropdown, search trigger. |
| **In-Place Ctrl+K Search** | `frontend/src/components/search/SearchCommandDialog.tsx` | **Active**: Supabase-style dialog modal triggered by `Ctrl+K` without page reload. |
| **Navigation Progress Bar** | `frontend/src/components/layout/NavigationProgressBar.tsx` | **Active**: Trickling progress bar with RTL (`origin-right`) and LTR support. |
| **Catalog & Course Grid** | `frontend/src/components/catalog/CatalogClientView.tsx` | **Active**: Server data cache (5 min revalidate) with offline static fallback. |
| **Vocational Course Content** | `frontend/src/data/mock-courses.ts` & `additional-course-content.ts` | **Active**: 8 vocational trades seeded with bilingual titles, pricing, and syllabi. |
| **Course Detail & Outcomes** | `frontend/src/components/course/CourseDetailClientView.tsx` | **Active**: Bundle pricing card, modular parts list, tools/equipment checklist, career paths. |
| **Lesson Video Player** | `frontend/src/components/lesson/LessonPlayerClientView.tsx` | **Active**: YouTube embedded player with timecode jumps, notes tabs, and parts sidebar. |
| **Anti-Piracy Quiz Modal** | `frontend/src/components/quiz/AntiPiracyModal.tsx` | **Active**: 3-step modal with personalization badge before checkout. |
| **Guest Checkout Drawer** | `frontend/src/components/checkout/CheckoutBottomSheet.tsx` | **Active**: Slide-over drawer with email input, legal shield checkbox, and order dispatch. |
| **Order Summary Screen** | `frontend/src/app/[locale]/order-summary/[orderNumber]/page.tsx` | **Active**: Dual-currency receipt and ticket confirmation. |
| **Raffle Explanation Page** | `frontend/src/app/[locale]/raffle/page.tsx` | **Active**: Legal transparency, $2 vs $10 ticket rules, consumer protection references. |
| **Backend REST Endpoints** | `backend/routes/api.php` | **Active**: `/v1/auth/*`, `/v1/catalog/*`, `/v1/checkout/*`, `/v1/progress/*`. |
| **Legal Shield Verification** | `backend/app/Http/Requests/CreateOrderRequest.php` | **Active**: Exact verbatim string comparison, returns `ERR_LEGAL_SHIELD_MISMATCH` on error. |
| **Order & Pricing Service** | `backend/app/Services/OrderService.php` | **Active**: Dual currency calculation, guest user resolution, idempotency protection. |
| **Order Expiration Command** | `backend/app/Console/Commands/ExpirePendingOrdersCommand.php` | **Active**: Cancels pending orders older than 48 hours. |
| **Database Migrations** | `backend/database/migrations/` | **Active**: 7 core tables (`users`, `courses`, `course_parts`, `orders`, `order_items`, `lesson_progress`, `tokens`). |
| **Automated Test Suites** | `frontend/src/tests/` & `backend/tests/` | **Active**: 23 frontend unit/contract tests passing; 8 PHPUnit feature test classes. |

---

## 4. Incomplete Systems

These features are specified in [تفاصيل مشروع KNZiN 💰.md](file:///D:/Work%20Projects/Knzin%20Project/Project%20info/%D8%AA%D9%81%D8%A7%D8%B5%D9%8A%D9%84%20%D9%85%D8%B4%D8%B1%D9%88%D8%B9%20KNZiN%20%F0%9F%92%B0.md) but are **either partially implemented or entirely unbuilt**:

### 4.1 Unbuilt Marketing & Engagement UI (Front-of-House)
1. **Live Social Proof Ticker (شريط الإشعارات الحية):** Continuous marquee streaming live purchases and draw countdowns (e.g. *"علي اشترى كورس غسل السيارات وحصل على تذكرة! > تبقت ساعتان على سحب تمويل المصنع!"*).  
   *Status:* **0% Built.**
2. **Active Draws Arena (ساحة السحوبات النشطة):** Three live countdown cards on the homepage:
   * **Factory Funding ($100,000):** Ticking timer (e.g., `23:50:00`).
   * **Project of a Lifetime ($50,000):** Ticking timer (e.g., `01:45:00`).
   * **Family Security ($500,000):** Monthly mega-draw indicator.  
   *Status:* **0% Built** (only described in text inside `/raffle`).
3. **Hall of Fame (لوحة الفائزين):** Dynamic showcase displaying past winners, photos/avatars, prizes, and verifiable draw hashes.  
   *Status:* **0% Built.**
4. **"How It Works" 3-Step Header Modal (نافذة كيف تعمل كَنزين؟):** Direct header pop-up illustrating: `(اختر الكورس ➔ استلم تذكرتك المجانية ➔ تابع السحب)`.  
   *Status:* **0% Built.**
5. **The Hook Vision Narrative (قصة المنصة):** High-trust homepage section explaining the "skill + capital" philosophy.  
   *Status:* **0% Built.**
6. **Floating WhatsApp Customer Support:** Persistent floating WhatsApp button across all pages for instant pre-sales and payment inquiries.  
   *Status:* **0% Built.**
7. **Header "My Courses" Shortcut (كورساتي):** Direct access icon in `HeaderHUD.tsx` to the user's purchased library.  
   *Status:* **Missing** (header currently only links to public `/` catalog).

### 4.2 Unbuilt Business & Back-Office Engines (Operations)
1. **Affiliate & Influencer System (نظام الإحالة الذكي):**
   * Post-purchase viral trigger: *"شارك رابطك مع أصدقائك، وإذا فاز أحدهم بالجائزة الكبرى، ستحصل أنت على 40% من قيمة جائزته"*.
   * "Share & Earn" button and unique smart link generator with affiliate ID tracking.
   * **Influencer Dashboard:** Standalone portal showing unpaid balance, total earnings, clicks/sales per link, and withdrawal archives.  
   *Status:* **0% Built.**
2. **Admin Management Panel (لوحة التحكم الإدارية العُليا):**
   * `/admin` interface for managing courses, active draw timers, and revenue analytics.
   * Affiliates Management table with real-time "Unpaid Balance".
   * Manual Payout Zeroing workflow: "Mark as Paid" button, Western Union transaction number / receipt upload modal, automatic balance zeroing.
   * Electronic RNG draw trigger button (Provably Fair Commit-Reveal or administrative selection).  
   *Status:* **0% Built.**
3. **Real Payment Gateways & Reconciliation:**
   * Direct integrations with ZainCash, AsiaHawala, QiCard, or Visa/Mastercard.
   * Server-to-server webhook listeners.
   * Automated payment reconciliation (matching dropped user connections with gateway status via API check to auto-issue tickets).  
   *Status:* **10% Built** (only pending order simulation exists).
4. **Automated Notification & Recovery Engine:**
   * Abandoned Cart Recovery via WhatsApp/Email (*"تذكرتك لربح $50,000 لا تزال محجوزة، أكمل الدفع الآن"*).
   * Automated winner notification dispatchers.
   * Email broadcast updates with self-service unsubscribe option.  
   *Status:* **0% Built.**
5. **Individual Ticket Serial Codes & Winner KYC:**
   * Dedicated `promotional_tickets` table issuing serial codes (e.g. `KNZ-A15`) per purchase.
   * Winner KYC verification interface: government ID upload matching purchase email prior to grand prize release.  
   *Status:* **10% Built** (tickets are currently only tracked as an aggregate count on the order record).

---

## 5. Protected Decisions

These decisions are **non-negotiable product and architecture constraints**. They must **not** be modified without explicit written approval:

1. **Commercial Model:** Course part = $2.00 (1 ticket); Course bundle = $10.00 (15 tickets). Standalone ticket sales are strictly prohibited.
2. **Legal Invariant:** Orders are 100% course purchases. Tickets are legally zero-cost promotional marketing grants. The canonical legal text must be agreed to verbatim before payment.
3. **Frictionless Entry:** Guest checkout with email only. No mandatory password or registration wall prior to purchase.
4. **Database Stack:** MySQL 8+ / MariaDB is the mandatory primary database (DEC-001).
5. **Ledger Integrity:** Immutable append-only ledger for all wallet transactions; all money stored in `BIGINT` cents/fils.
6. **Payment Source of Truth:** Gateway server-to-server webhooks are the sole authority for payment confirmation and ticket issuance (DEC-003).
7. **Affiliate Reward:** Exactly 40% share of the grand prize won by a referred customer.
8. **Anti-Piracy Paradigm:** Social and psychological friction via dynamic personalization stamps, not heavy DRM or client-side encryption.
9. **Winner Verification:** Mandatory official ID matching purchase email before any grand prize is disbursed.

---

## 6. Design Constraints

These principles represent established requirements, not optional suggestions:

1. **Brand Aesthetic:**
   * Primary Color: Facebook Blue (`#1877F2`), hover (`#166FE5`), light surface (`#EFF6FF`).
   * Secondary / Navy: `#0B1E3A` / `#0F274A`.
   * Accent / Gold: `#F5B301` / `#D97706` for promotional tickets and prize badges.
   * Backgrounds: Light `#FFFFFF` / `#F8FAFC`; Dark `#0F172A` / `#1E293B`.
2. **Minimal Product Design Principle:**
   * *"Every element must have a reason to exist."*
   * Avoid decorative cards, visual noise, unnecessary iconography, and duplicate buttons.
   * Light and dark themes must feel like **two carefully designed modes of the same product**, maintaining identical contrast ratios and semantic roles.
3. **Component System:**
   * Exclusively use **shadcn/ui** and **Radix UI** primitives (`dialog`, `accordion`, `tabs`, `dropdown-menu`, `progress`, `sheet`, `tooltip`).
   * Search must remain an in-place modal (`Ctrl+K` Command Palette) rather than navigating to a disjointed search results page.
4. **Navigation & Progress:**
   * Sticky Header HUD with responsive mobile drawer sheet below `1024px` (`lg` breakpoint).
   * Thin top navigation progress bar that trickles smoothly during route transitions and respects directionality (`origin-right` in RTL, `origin-left` in LTR).

---

## 7. Localization Requirements

### 7.1 Arabic (`/ar` — Primary Default Locale)
* Comprehensive Arabic typography using Google Font **Tajawal**.
* Proper `dir="rtl"` layout: navbar items, text flow, drawer slide direction, and progress bar originate from the right.
* Arabic numbers and currency formatting (`2,000 د.ع`, `13,000 د.ع`).

### 7.2 English (`/en` — Secondary Locale)
* Clean English typography with `dir="ltr"` layout.
* Directional controls (drawers, back buttons, progress bar) mirror naturally to the left.
* Currency formatting in USD (`$2.00`, `$10.00`).

### 7.3 Directional Invariance Rule
> **Changing locale does NOT mean arbitrarily inverting the entire visual composition.**  
Components with universal logical symmetry (video players, media controls, numerical data tables, pricing badges) maintain standard layout integrity across both locales.

---

## 8. Reference Guidelines

| Reference Platform | What KNZiN Adopts | What KNZiN Must Reject |
| :--- | :--- | :--- |
| **Vertex** | Clean LMS architecture, server-cached data queries, active-learning progress APIs. | Enterprise LMS bloat, complex corporate hierarchies, heavy multi-tier grading rubrics. |
| **Scrimba** | Frictionless student continuation journey, bite-sized video lessons, `ResumeHeroCard.tsx` pattern. | Interactive browser code editors in vocational trades where hands-on physical mastery (e.g. car detailing, barbering, solar) is required. |
| **SyntaxPath** | shadcn/ui craftsmanship, restrained visual elegance, crisp border contrasts, clean spacing tokens. | Overriding KNZiN's unique gaming HUD, promotional sweepstakes identity, or business logic. |

---

## 9. Conflicts Requiring Resolution

The following contradictions between documentation, code, and audits must be resolved:

```
CONFLICT 1: Launch Catalog Scope (3 Courses vs 8 Courses)
• Source A: specs/002-auth-catalog-checkout/spec.md & Performance Audit (defines baseline as 3 courses).
• Source B: backend/database/seeders/CourseCatalogSeeder.php & frontend/src/data/mock-courses.ts (8 courses seeded).
• Why it matters: Determines launch scope, homepage layout density, search index sizing, and initial content production costs.
• Required clarification: Are all 8 seeded courses part of Day 1 launch, or are 3 flagship courses launched first with 5 reserved for post-launch drops?
```

```
CONFLICT 2: Catalog Display (Horizontal Strips with Inline Parts vs Vertical Grid)
• Source A: Project info/تفاصيل مشروع KNZiN 💰.md (specifies horizontal course strips with inline part icons: الجزء 1 ➔ 2 ➔ 3 and sales counters on the main page).
• Source B: frontend/src/components/catalog/CourseCard.tsx (implements a vertical card grid hiding individual parts until the course detail page).
• Why it matters: Direct impact on conversion rate. If parts appear on the homepage, a user can buy a $2 part in 1 click immediately without entering a subpage.
• Required clarification: Should the homepage be refactored into horizontal strips with inline part selectors, or should the vertical card grid remain?
```

```
CONFLICT 3: Ticket Representation (Integer Counter vs Individual Serial Records)
• Source A: Project info/تفاصيل مشروع KNZiN 💰.md (defines individual ticket serial formats like KNZ-A15).
• Source B: backend/app/Models/Order.php (stores only an integer count: promotional_tickets_granted on orders).
• Why it matters: Provably fair draws cannot select or display specific ticket numbers in the HUD wallet without individual database records.
• Required clarification: When should the dedicated promotional_tickets table and serial generator be migrated and activated?
```

```
CONFLICT 4: Affiliate Grand-Prize Share vs Course Commission
• Source A: Project info/تفاصيل مشروع KNZiN 💰.md (lines 149-151: "40% of the value of the grand prize won by referred users").
• Source B: Project info/تفاصيل مشروع KNZiN 💰.md (lines 165-175: describes sales commissions and unpaid balances per link).
• Why it matters: High financial risk. 40% of a $50,000 prize is $20,000 liability. Does the affiliate also earn a percentage on each $2/$10 course purchase?
• Required clarification: Does the affiliate earn (A) 40% of won grand prizes only, (B) % commission on course sales only, or (C) Both?
```

```
CONFLICT 5: Draw Execution Mechanism (Provably Fair RNG vs Admin Selection)
• Source A: DECISIONS.md (DEC-004: Commit-Reveal provably fair SHA-256 hash).
• Source B: Project info/تفاصيل مشروع KNZiN 💰.md (lines 187: "إطلاق زر السحب العشوائي أو تحديد الفائز بأنفسنا").
• Why it matters: Legal transparency vs administrative override. Selecting a winner manually creates catastrophic legal and reputational exposure.
• Required clarification: Is the draw strictly automated/provably fair, or is manual winner override permitted?
```

---

## 10. Open Questions

These strategic questions cannot be answered from the codebase and require explicit stakeholder decisions:

1. **Immediate Sprint Scope:** What is the exact scope of the immediate next phase?
   * **Option A (UI/Marketing Focus):** Complete the Front-of-House engagement layer (Live Ticker, Active Draws Countdown Cards, Hall of Fame, The Hook narrative, "How It Works" modal, WhatsApp button).
   * **Option B (Affiliate Focus):** Build the Influencer Portal, smart link generator, and 40% referral tracking.
   * **Option C (Backend/Payment Focus):** Integrate live Iraqi payment gateways (ZainCash, AsiaHawala) and ticket serial tables.
2. **Affiliate Payout Model:** What are the exact commissions on course purchases versus grand-prize co-shares?
3. **Live Stream Integration:** How will YouTube Live draw broadcasts be embedded or linked dynamically?
4. **Gateway Credentials:** What are the operational sandbox credentials and timelines for ZainCash and AsiaHawala?

---

## 11. Proposed Source-of-Truth Rules

When conflicts arise in future development, this **precedence hierarchy** strictly governs:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: Explicit Stakeholder / Owner Decisions                         │
│ Signed-off ADRs in DECISIONS.md and explicit project baseline updates. │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: Authoritative Project Specification                            │
│ Project info/تفاصيل مشروع KNZiN 💰.md (the original 14-page blueprint).│
├────────────────────────────────────────────────────────────────────────┤
│ TIER 3: Living Technical Architecture & Contracts                      │
│ PROJECT_CONTEXT.md and specs/*/contracts/ specifications.              │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 4: Active Codebase Implementation                                 │
│ Current code in frontend/ and backend/ (working reality, but must yield│
│ to higher tiers when a genuine requirement conflict is proven).        │
└────────────────────────────────────────────────────────────────────────┘
```
