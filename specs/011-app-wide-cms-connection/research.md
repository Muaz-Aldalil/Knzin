# Technical Research & Brownfield Analysis: App-Wide Dynamic CMS Integration

**Feature**: `011-app-wide-cms-connection`  
**Date**: 2026-10-08  
**Status**: Completed  

---

## 1. Existing Backend CMS Architecture

### 1.1 Model & Storage
- **Model**: `App\Models\PlatformSetting`
- **Table**: `platform_settings`
- **Columns**: `id` (bigint), `key` (varchar 191 unique), `value` (json), `type` (varchar), `is_public` (boolean), `updated_by_user_id` (bigint nullable), `created_at`, `updated_at`.
- **Key Convention**: `landing.{section}` for all 20 sections (e.g. `landing.site_shell`, `landing.hero`, `landing.course_detail`).

### 1.2 Endpoints & Caching
- **Public API**: `GET /api/v1/content/site-wide`
  - Controller: `App\Http\Controllers\Content\PublicContentController@siteWide`
  - Service: `App\Services\LandingCmsService@getAllCmsSections`
  - Cache: Redis/File cache with key `cms_sections_{md5}` and TTL of 300 seconds. Invalidation occurs automatically on any section update in `LandingCmsService@updateSection`.
- **Admin Management API**:
  - `GET /api/v1/admin/cms/landing/{section}`
  - `PUT /api/v1/admin/cms/landing/{section}`
  - Controller: `App\Http\Controllers\Admin\AdminLandingCmsController`
  - Guard: `auth:sanctum` + `CheckAdminCapability:manage_platform_settings`
  - Audit Logging: Every edit is written to `audit_logs` with before/after state via `AdminAuditWriter`.

### 1.3 Validation & Completeness
- All 20 sections have formal validation rules and canonical defaults defined in `LandingCmsService::CANONICAL_DEFAULTS`:
  1. `hero`
  2. `skill_capital`
  3. `courses_display`
  4. `promotional_banner`
  5. `promotional_referral`
  6. `free_referral_card`
  7. `legal_compliance`
  8. `referral_faq`
  9. `ticket_ladder`
  10. `affiliate_referral`
  11. `draw_content`
  12. `site_shell`
  13. `raffle_arena`
  14. `course_detail`
  15. `lesson_player`
  16. `affiliate_portal`
  17. `learner_dashboard`
  18. `checkout_cart`
  19. `search_page`
  20. `system_notices`

---

## 2. Frontend CMS Consumer Infrastructure

### 2.1 State & Hooks
- `useSiteWideCms()` (`frontend/src/hooks/admin/useAdminCms.ts`):
  - Fetches `/content/site-wide` using React Query (`['public', 'site-wide', 'cms']`).
  - Stale time: 10 seconds.
  - Background poll interval: 15 seconds.
  - Supports live content change detection with `hasUpdate` banner (`ContentUpdateNotification.tsx`).
- `useAdminCmsSection<T>(section)`:
  - Fetches and mutates `/admin/cms/landing/{section}` with automatic cache invalidation of public queries.

### 2.2 Detailed Surface Audit & Gap Identification

| Surface / Component | Current Status | Specific Missing Link / Defect |
| :--- | :--- | :--- |
| **Site Shell: Header** (`Navbar.tsx` / `Header.tsx`) | Partially connected | Header announcement badge and header CTA button (`header_cta_label`, `header_cta_url`) defined in `site_shell` types but NOT rendered in Header. |
| **Site Shell: ActivityTicker** | Connected | Correctly consumes `ticker_enabled`, `ticker_speed`, `ticker_announcements`. |
| **Site Shell: FloatingWhatsApp** | Connected | Consumes `whatsapp_enabled`, `whatsapp_url`, `whatsapp_button_label_*`, `whatsapp_greeting_*`. |
| **Site Shell: HowItWorksModal** | Connected | Consumes `how_it_works_title_*`, `how_it_works_subtitle_*`, and `how_it_works_steps`. |
| **Site Shell: Footer** | Connected | Consumes `footer_copyright_*` and `footer_disclaimer_*`. |
| **Landing: Hero** (`CatalogClientView.tsx`) | Partially connected | Renders primary CTA, but completely ignores `secondary_cta_label_*`, `secondary_cta_url`, and `price_display_override_*`. |
| **Landing: Narrative** (`TheHookSection.tsx`) | Connected | Consumes quote, author name, author title, and visibility. |
| **Landing: Course Grid** (`CatalogClientView.tsx`) | Connected | Consumes `section_title_*`, `section_subtitle_*`, `bundle_badge_text_*`. |
| **Landing: Promo Banner** (`CatalogClientView.tsx`) | Connected | Consumes headline, subheadline, CTA label, URL, visibility. |
| **Landing: Promo Referral** (`CatalogClientView.tsx`) | Connected | Consumes title, description, commission badge, coprize badge, CTA. |
| **Landing: Free Referral Card** (`CatalogClientView.tsx`) | Connected | Consumes card title, card text, badge text, visibility. |
| **Landing: Ticket Ladder** (`CatalogClientView.tsx`) | Connected | Consumes title, part rate text, bundle rate text, disclaimer. |
| **Landing: FAQ Accordion** (`CatalogClientView.tsx` / `FaqAccordion.tsx`) | Connected | Consumes title, items array, visibility. |
| **Landing: Legal Shield** (`LegalShieldCmsSection.tsx`) | Connected | Consumes legal statement, Iraqi consumer protection citations, KYC notice. |
| **Course Detail** (`CourseDetailClientView.tsx`) | Connected | Consumes guarantee badge, headline, description, bundle promo badge, title, desc. Learning outcomes header connected. |
| **Lesson Player** (`LessonVideoPlayer.tsx`) | Connected | Consumes paywall headline, subheadline, perks list, CTA label, and completion celebration banner. |
| **Learner Dashboard** (`LearnerDashboardView.tsx`) | Connected | Consumes welcome title, subtitle, empty state title/desc/CTA, unauthenticated gate. |
| **Draws / Raffle Arena** (`RaffleArenaCmsContent.tsx`) | Connected | Consumes hero, next draw teasers, perks lists, draw FAQs. |
| **Cart & Quick Checkout** (`CheckoutBottomSheet.tsx`, `OrderSummaryCard.tsx`) | Connected | Consumes trust badge, headline, description, free ticket notice. |
| **Order Summary Confirmation** (`OrderSummaryPage.tsx`) | Partially connected | `OrderSummaryPage.tsx` delegates to `OrderSummaryCard`, but celebratory header text can directly reflect `order_celebration_title_*` and `order_celebration_desc_*`. |
| **Affiliate Portal** (`AffiliateDashboardView.tsx`) | Connected | Consumes onboarding title/desc/points, promo banner, policy notice, coprize rules. |
| **Smart Search Hub** (`search/page.tsx`) | Connected | Consumes hero headline/subheadline, placeholder, query chips, search tips, empty state. |
| **System Notices: 404** (`not-found.tsx`) | Connected | Consumes title, description, home button label, search button label. |
| **System Notices: 500** (`error.tsx`) | Connected | Consumes error title, description, retry button label, home button label. |
| **Admin CMS Hub** (`/admin/landing/page.tsx`) | UI Enhancement needed | Needs explicit "Target: /[route]" badges on each section card and a "View Live Surface" external link button in `CmsFormLayout.tsx`. |

---

## 3. Engineering Decisions & Strategy

1. **Zero Breaking Schema Changes**: The existing 20 CMS section schemas in `LandingCmsService.php` and `frontend/src/types/cms.ts` already encompass all required fields. We do NOT need to alter database tables or break API contracts.
2. **Re-use `useSiteWideCms()` Everywhere**: Public views MUST continue to use `useSiteWideCms()` to take advantage of the unified 15-second background polling, client-side caching, and live `ContentUpdateNotification` toasts.
3. **Strict Fallback Protocol**: Every component MUST use the coalescing operator pattern:
   ```typescript
   const label = (isAr ? cmsSection?.label_ar : cmsSection?.label_en) || t('fallbackKey');
   ```
   This guarantees that if the CMS payload has not loaded or a field is empty, the application never breaks or renders blank voids.
4. **Header Integration**: Connect `site_shell.header_announcement_badge_*` and `header_cta_*` to `frontend/src/components/layout/Navbar.tsx` or Header component so marketing promos can be announced in the platform navbar.
5. **Bidirectional Admin Navigation**: Add a `targetRoute` property to `ALL_CMS_SECTIONS` in `/admin/landing/page.tsx` and a "View Live Page" link button in `CmsFormLayout.tsx` so administrators can jump immediately between editing a section and previewing it in the public app.
