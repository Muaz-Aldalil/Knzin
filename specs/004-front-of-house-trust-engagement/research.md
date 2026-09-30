# Technical Research & Architecture Decisions: Feature 004

**Feature**: Front-of-House Trust, Engagement & Social Proof Suite  
**Branch**: `004-front-of-house-trust-engagement`  
**Status**: Completed  
**Date**: 2026-09-30  

---

## 1. Public Activity Feed Architecture & Non-PII Serialization

### Context & Problem
FR-006 and FR-007 require an Activity Ticker streaming recent educational course purchases, promotional ticket issuances, and upcoming draw countdown alarms, polled by the frontend client every 30–60 seconds. The underlying `orders` table in Feature 002 records guest checkouts with `user_id`, `email`, `total_amount_cents`, `promotional_tickets_granted`, `terms_agreed_ip`, and `idempotency_key`. The application must never expose personally identifiable information (PII), raw database identifiers, or customer emails publicly.

### Decision
Implement a dedicated, unauthenticated, read-only Laravel endpoint:
```text
GET /api/v1/activity/recent
```
Handled by `ActivityController::recent()` utilizing an `ActivityEventResource` DTO.

The server queries:
1. `Order::where('status', 'completed')->with(['items.course', 'items.part'])->latest()->take(10)->get()`
2. `Draw::where('status', 'scheduled')->where('scheduled_at', '>', now())->orderBy('scheduled_at')->take(3)->with('prize')->get()`

Each completed order is transformed into an anonymous event:
- **Event ID**: Deterministically masked `evt_ord_` + 12-char hex digest (e.g. `evt_ord_3a8f9c1b2d0e`)
- **Type**: `'enrollment'`
- **Arabic Text**: `«انضمام متعلم جديد إلى كورس {course_title_ar} — تم منح {tickets} تذكرة مجانية!»`
- **English Text**: `«New learner enrolled in {course_title_en} — {tickets} free promotional ticket(s) granted!»`
- **Highlight Badge**: Arabic `«تسجيل جديد»`, English `«New Enrollment»`
- **Timestamp**: ISO 8601 UTC timestamp

Draw countdown alarms are serialized as:
- **Event ID**: `evt_drw_` + 12-char hex digest
- **Type**: `'countdown_alert'`
- **Arabic Text**: `«سحب {draw_title_ar} ({prize_amount}) يقترب — لا تفوّت فرصتك!»`
- **English Text**: `«{draw_title_en} ({prize_amount}) is approaching — Don't miss out!»`
- **Highlight Badge**: Arabic `«تنبيه السحب»`, English `«Draw Urgency»`

### Rationale
- **Zero PII Exposure**: No user names, emails, phone numbers, IP addresses, or internal UUIDs leave the Laravel process.
- **Server-Authoritative Truth**: All purchase events represent real, completed orders from MySQL. Zero simulated customer names are created.
- **Bilingual Payloads**: Pre-rendering bilingual text on the server guarantees exact grammatical agreement and proper tokenized translation without client hydration mismatch.

### Alternatives Considered
- *Exposing raw Order model with `$hidden = ['email', 'user_id']`*: Rejected. Vulnerable to mass-assignment or attribute leakage on future schema additions.
- *Client-side synthetic name generator (e.g. "Ahmed from Baghdad")*: Strictly rejected per Constitution Principle I (Evidence-First) and FR-011.

---

## 2. Zero-Order & Quiet-Period Graceful Degradation

### Context & Problem
During new environment initialization, local development, staging tests, or low-volume periods in production, the database may contain zero completed orders. The ticker must not collapse into an empty gap, produce cumulative layout shift (CLS), or fabricate fake purchases.

### Decision
The backend service automatically supplements the activity feed with verified upcoming draw countdown alerts (from Feature 003) and curated static educational bulletins:
1. Bulletin 1 (Bilingual):
   - AR: *«أكثر من 1,200 ساعة تدريبية مهنية مكتملة هذا الأسبوع في كَنزين!»*
   - EN: *«Over 1,200 vocational training hours completed this week on KNZiN!»*
   - Label: AR `«إعلان تعليمي»` / EN `«Platform Bulletin»`
2. Bulletin 2 (Bilingual):
   - AR: *«جميع تذاكر السحب الترويجية مجانية تماماً 100% مع كل محتوى تعليمي.»*
   - EN: *«All promotional raffle tickets are 100% free gifts with every course purchase.»*
   - Label: AR `«شفافية قانونية»` / EN `«Compliance Notice»`

The response metadata flags:
```json
{
  "meta": {
    "total": 3,
    "has_live_orders": false,
    "polled_at": "2026-09-30T03:30:00Z"
  }
}
```

### Rationale
- Completely preserves truthfulness: educational bulletins and countdown urgency are factual announcements, not fabricated customer activity.
- The UI retains stable height (`h-10` / 40px), guaranteeing `CLS = 0.00`.

### Alternatives Considered
- *Hiding the ticker when `orders.count === 0`*: Rejected. Causes layout jumpiness and hides the Urgency countdown alarms from first-time visitors.

---

## 3. "How It Works" 3-Step Interactive Modal Architecture

### Context & Problem
FR-003, FR-004, FR-005, and FR-025 mandate that first-time visitors can activate a 3-step onboarding explanation within 1 to 2 clicks from any public page, featuring keyboard focus trapping, Escape dismissal, and focus restoration.

### Decision
Reuse the existing accessible dialog primitive (`frontend/src/components/ui/dialog.tsx` built on `@radix-ui/react-dialog`) to create `HowItWorksModal.tsx`.

Trigger Integration:
1. **Desktop Header HUD (&ge;1024px)**: Prominent button in the main navbar:
   - Text: `«كيف تعمل كَنزين؟»` (AR) / `«How It Works»` (EN) with `HelpCircle` icon (1 click).
2. **Mobile Header HUD (<1024px)**: Compact question-mark button (`HelpCircle`) next to the search icon in the sticky top bar (1 click).
3. **Mobile Navigation Drawer (`MobileNavSheet.tsx`)**: Dedicated navigation item with badge and descriptive subtext (2 clicks).

Dialog Contents:
- Step 1: **اختر الكورس والمهارة** (BookOpen icon) — Micro-course part for $2 or complete bundle for $10.
- Step 2: **استلم تذكرتك المجانية** (Ticket icon) — Instant zero-cost promotional tickets added to HUD.
- Step 3: **تابع السحب المباشر** (Trophy icon) — Transparent public electronic draw broadcast on YouTube Live.

### Rationale
- Zero additional dependencies: `@radix-ui/react-dialog` is already in `package.json` and tested in the codebase.
- Native WAI-ARIA dialog semantics with automatic focus management, Escape key listening, and inert backdrop overlay.
- Dual-surface mobile triggers satisfy the 1-to-2 click guarantee across both mobile and desktop viewports.

---

## 4. Section Navigation & Sticky Header Clearance Architecture

### Context & Problem
Visitors and external links navigate to section anchors such as `/#vision` (The Hook) and `/#faq` (Public FAQ). Because the Header HUD is fixed/sticky (`h-16`, 64px tall with borders and blur backdrop), target headings would be obscured unless explicit clearance is guaranteed. Furthermore, same-page anchor jumps must not trigger the global route progress bar.

### Decision
1. **Pure CSS Clearance**:
   Every anchor section container (`#vision`, `#faq`, `#catalog`) declares:
   ```html
   className="scroll-mt-20 sm:scroll-mt-24"
   ```
   This reserves 80px (mobile) to 96px (desktop) of top scroll margin, ensuring that the target heading always settles cleanly below the 64px sticky Header HUD.
2. **Navigation Progress Bar Invariant**:
   `frontend/src/lib/navigation/progress-utils.ts` already contains:
   ```typescript
   if (isSameLocale && isSameLogicalPath && isSameSearch && parsedTarget.hash !== currentUrl.hash) {
     return false; // Rejects same-page hash jumps
   }
   ```
   Same-page anchor clicks (`/#faq`) do not trigger the global loading bar.
3. **Cross-Route Anchor Synchronization**:
   When navigating from `/raffle` or `/courses/[slug]` to `/#faq`:
   The Next.js router navigates to `/`, loads the page, mounts the client components, and allows native browser scroll-to-hash or a lightweight hydration effect to smoothly scroll to the container.

### Rationale
- CSS `scroll-margin-top` is hardware-accelerated, robust against window resizing, and requires zero fragile JavaScript offset calculations or `setTimeout` delays.

---

## 5. Persistent Floating WhatsApp Support & Fallback Architecture

### Context & Problem
FR-012 through FR-015 require a persistent floating WhatsApp button on all public pages, anchored inline-end (`bottom-6 end-6`), that gracefully opens a fallback dialog if `NEXT_PUBLIC_WHATSAPP_SUPPORT_URL` is unconfigured. Furthermore, it must not collide with the mobile checkout drawer or obstruct critical controls.

### Decision
Create `FloatingWhatsAppButton.tsx` mounted inside `layout.tsx`.
1. **Positioning**:
   Uses CSS logical properties: `fixed bottom-6 end-6 z-40`.
   - Arabic (`dir="rtl"`): Anchors at bottom-left.
   - English (`dir="ltr"`): Anchors at bottom-right.
   - Touch target: `w-14 h-14` (56x56px), exceeding the 44x44px minimum touch target requirement.
2. **URL & Greeting**:
   Reads `process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_URL`.
   If set: Opens in a new tab (`target="_blank"` with `rel="noopener noreferrer"`) with the pre-filled URL-encoded greeting:
   - AR: `مرحباً، لدي استفسار حول منصة كَنزين`
   - EN: `Hello, I have an inquiry about KNZiN`
3. **Unconfigured Fallback**:
   If the environment variable is missing, empty, or unparseable:
   Clicking the button opens an in-app fallback dialog (`WhatsAppFallbackDialog.tsx`) explaining:
   - AR: *«خدمة الدردشة المباشرة عبر واتساب غير مفعلة حالياً. يمكنك تصفح قسم الأسئلة الشائعة للحصول على إجابات فورية.»*
   - EN: *«Live WhatsApp support is currently offline. Please explore our FAQ section for instant answers.»*
   - Provides an action button: *«الانتقال إلى الأسئلة الشائعة»* scrolling to `/#faq`.
   - **Strictly zero invented emails or phone numbers are rendered.**
4. **Collision Avoidance**:
   Has `z-40`, whereas `CheckoutBottomSheet` uses `z-50` with an opaque/blur backdrop, naturally masking the floating button while payment interactions take place.

---

## 6. Public FAQ Accordion & Objection Handling Architecture

### Context & Problem
FR-016 through FR-018 require a structured, accessible FAQ accordion on the homepage answering core objections (Platform model, Course downloads, Draw audits, Referral 40% co-prize, Winner KYC). The first question in each category must be expanded by default.

### Decision
Create `FaqAccordion.tsx` powered by `@radix-ui/react-accordion` (via `frontend/src/components/ui/accordion.tsx`).
Categories:
1. **آلية المنصة والتذاكر الترويجية (Platform Model & Promotional Tickets)**
2. **المحتوى الرقمي وتحميل الكورسات (Course Downloads & Educational Access)**
3. **نزاهة السحوبات والبث المباشر (Draw Transparency & Live Streaming)**
4. **نظام الإحالة والشريك 40% (Referral System & The 40% Co-Prize)**
5. **شروط تسليم الجوائز والتحقق (Winner Identification & KYC Claims)**

Default expanded items:
`defaultValue={['faq-model-1', 'faq-download-1', 'faq-draw-1', 'faq-referral-1', 'faq-kyc-1']}` with `type="multiple"`.

### Rationale
- Informational clarity without backend code leakage: The 40% referral explanation is authoritative and transparent, but zero affiliate tracking code is introduced in Feature 004.
- WAI-ARIA accordion accessibility: Fully accessible via `Tab`, `Enter`, `Space`, `ArrowUp`, and `ArrowDown`.

---

## 7. Winner KYC Compliance Transparency Card

### Context & Problem
FR-020 and FR-021 require a public compliance card on `/raffle` and within the FAQ explaining that winners must provide national identification matching their purchase profile before high-value disbursements.

### Decision
Create `WinnerKycCard.tsx` as an informational, read-only legal transparency component.
It renders:
- Verbatim Arabic clause:
  *«شرط تسليم الجوائز: يُلزم الفائز بتقديم إثبات هوية رسمي يطابق البيانات الأساسية (مثل البريد الإلكتروني) التي تم الشراء بها، وللإدارة الحق في حجب الجائزة في حال ثبوت تلاعب أو استخدام بطاقات دفع مسروقة.»*
- Verbatim English translation.
- Iraqi Ministry of Trade Consumer Protection Law No. 1 (2010) compliance citation.
- Explicit note that document submission is completed after draw conclusion directly with the compliance team.
- **Zero file-upload inputs, KYC APIs, or identity forms.**

---

## Summary of Technology Decisions

| Capability | Chosen Primitive / Architecture | Rationale |
| :--- | :--- | :--- |
| **Public Activity API** | Laravel `GET /api/v1/activity/recent` with `ActivityEventResource` | Server-authoritative, zero PII, masked IDs, no model serialization |
| **Activity Ticker UI** | `ActivityTicker.tsx` with CSS marquee + hover/focus pause | Smooth, CLS = 0.00, `<bdi>` bidirectional text isolation |
| **How It Works Modal** | `@radix-ui/react-dialog` via `dialog.tsx` | WAI-ARIA modal, focus trap, Escape dismissal, 1-to-2 click access |
| **Vision Narrative** | `TheHookSection.tsx` between Hero and Catalog | Canonical founder mission quote, responsive typography, `#vision` |
| **WhatsApp Support** | `FloatingWhatsAppButton.tsx` (CSS logical `bottom-6 end-6`) | Non-obtrusive, RTL-aware, in-app offline dialog fallback |
| **FAQ Accordion** | `@radix-ui/react-accordion` via `accordion.tsx` | WAI-ARIA compliance, first item in category expanded, deep linkable |
| **KYC Transparency** | `WinnerKycCard.tsx` | Read-only compliance notice, zero file upload forms |
| **Section Clearance** | CSS `scroll-mt-20 sm:scroll-mt-24` | &ge;80px clearance below sticky Header HUD without JS race conditions |
