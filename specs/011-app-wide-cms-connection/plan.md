# Implementation Plan: 011-app-wide-cms-connection

**Branch**: `011-app-wide-cms-connection` | **Date**: 2026-10-08 | **Spec**: [specs/011-app-wide-cms-connection/spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/011-app-wide-cms-connection/spec.md)

---

## 1. Summary

Connect every page, route, section, and sub-element across the entire KNZiN application to its target setting in the Admin CMS. Provide bidirectional linkage between the Admin CMS editor and public route surfaces, eliminating hardcoded strings and un-rendered CMS fields while maintaining fail-safe resilience and Arabic/English bilingual fidelity.

---

## 2. Technical Context & Constraints

- **Frontend**: Next.js 15+ App Router, React 19, TypeScript, Tailwind CSS, TanStack Query (`useSiteWideCms`), `next-intl`.
- **Backend**: Laravel 11, PHP 8.3/8.4, MySQL `platform_settings` table, `LandingCmsService`, Redis/File Cache.
- **Bi-Directional RTL/LTR**: CSS logical properties (`start`, `end`, `ms-`, `me-`) enforced throughout.
- **Performance**: Zero extra network waterfalls. Public pages fetch all 20 sections in a single background query `/content/site-wide` cached for 300s on the server and 10s on the client, with live background polling every 15s.
- **Fail-Safe Integrity**: Strict `|| t('fallbackKey')` null coalescing on every dynamic field ensures zero runtime crashes if settings are blank or pending.

---

## 3. Constitution & Architecture Checklist

- [x] **No Phantom Abstractions**: Re-use existing `LandingCmsService` and `useSiteWideCms()` infrastructure without inventing new tables.
- [x] **Separation of Concerns**: CMS controls presentation and copy; business logic (course pricing, draw eligibility, affiliate percentages) remains authoritatively enforced by backend services.
- [x] **Security**: All CTA URLs passed through `sanitizeCtaUrl` to prevent `javascript:` XSS vectors.
- [x] **Auditing**: Every update to any CMS section records a before/after audit log in `audit_logs` table via `AdminAuditWriter`.

---

## 4. File Modification Blueprint

### 4.1 Global Shell & Navigation
- `frontend/src/components/layout/HeaderHUD.tsx`:
  - Connect `site_shell.header_announcement_badge_*`
  - Connect `site_shell.header_cta_label_*` and `site_shell.header_cta_url`

### 4.2 Landing Page & Catalog (`CatalogClientView.tsx`)
- Bind Hero secondary CTA (`secondary_cta_label_*`, `secondary_cta_url`)
- Bind custom price display override (`price_display_override_*`)
- Ensure all sections (`hero`, `promotional_banner`, `skill_capital`, `courses_display`, `promotional_referral`, `free_referral_card`, `ticket_ladder`, `referral_faq`, `legal_compliance`) render all CMS fields dynamically with fallback.

### 4.3 Course Detail & Lesson Player
- `frontend/src/components/course/CourseDetailClientView.tsx`:
  - Bind course highlight bullet points (guarantee, outcomes, features) dynamically with fallback.
- `frontend/src/components/lesson/LessonVideoPlayer.tsx`:
  - Ensure all paywall perks (`paywall_perks_*`), completion banner texts, and CTA labels are completely dynamic.

### 4.4 Draws, Cart, Search & System Notices
- `frontend/src/components/draws/HeroGrandPrizeCountdown.tsx`:
  - Wire marquee badge and subtitle to `promotional_banner` or `raffle_arena` overrides.
- `frontend/src/components/checkout/OrderSummaryCard.tsx` & `OrderSummaryPage.tsx`:
  - Wire celebratory header copy to `checkout_cart.order_celebration_title_*` and `order_celebration_desc_*`.
- `frontend/src/app/[locale]/search/page.tsx`:
  - Wire `suggested_queries_*` and `search_tips_*` array to `search_page` CMS.
- `frontend/src/app/[locale]/not-found.tsx` & `error.tsx`:
  - Ensure all action buttons and descriptions map directly to `system_notices` CMS.

### 4.5 Admin CMS Hub & Form Layout
- `frontend/src/app/[locale]/admin/landing/page.tsx`:
  - Add `targetRoute` to each entry in `ALL_CMS_SECTIONS`.
  - Render a prominent pill badge: `Target: /[route]` with an external link icon.
- `frontend/src/components/admin/cms/CmsFormLayout.tsx`:
  - Add a "View Live Surface" external link action button in the header toolbar, opening the corresponding public route in a new tab.

---

## 5. Verification & Testing Protocol

1. **Backend Unit & Feature Tests**:
   - Run `php artisan test --filter=SiteWideCmsTest` to verify that all 20 sections pass validation, update correctly, and invalidate caches.
2. **Frontend Build & Type Checks**:
   - Run `npm run build` inside `frontend/` to ensure zero TypeScript errors, broken imports, or missing props.
3. **End-to-End Verification Check**:
   - Verify that editing each of the 20 CMS sections via the admin UI persists to the database and appears in the target public component.
