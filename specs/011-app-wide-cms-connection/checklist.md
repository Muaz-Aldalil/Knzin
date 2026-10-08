# Acceptance & Quality Checklist: App-Wide Dynamic CMS Integration

**Feature**: `011-app-wide-cms-connection`  
**Date**: 2026-10-08  

---

## 1. Global Shell & Navigation (US1)
- [x] `ActivityTicker` hides when `site_shell.ticker_enabled` is set to `false`.
- [x] `ActivityTicker` renders custom announcements from `site_shell.ticker_announcements`.
- [x] `FloatingWhatsAppButton` hides when `site_shell.whatsapp_enabled` is set to `false`.
- [x] `FloatingWhatsAppButton` links to `site_shell.whatsapp_url` and sends `whatsapp_greeting_*`.
- [x] `HowItWorksModal` displays `how_it_works_title_*`, `how_it_works_subtitle_*`, and all dynamic steps.
- [x] `Footer` displays `footer_copyright_*` and `footer_disclaimer_*`.
- [x] `Navbar` renders `site_shell.header_announcement_badge_*` and header CTA if configured.

## 2. Landing Page & Catalog (US1)
- [x] Hero displays `hero.badge_*`, `heading_*`, `subheading_*`.
- [x] Hero renders primary CTA button with `primary_cta_label_*` and sanitized `primary_cta_url`.
- [x] Hero renders secondary CTA button with `secondary_cta_label_*` and sanitized `secondary_cta_url`.
- [x] Founder quote in `TheHookSection` displays `skill_capital.quote_*` and `author_name_*`.
- [x] Promotional banner displays `promotional_banner.headline_*` and `cta_label_*`.
- [x] Promotional referral section displays dynamic commission and co-prize share badges.
- [x] Free referral card displays dynamic gift text and badge.
- [x] Ticket ladder displays dynamic tickets per part and bundle rates.
- [x] FAQ section renders dynamic accordion items from `referral_faq.items`.
- [x] Legal compliance section renders Iraqi Consumer Protection law text.

## 3. Course Detail & Learning Hub (US2)
- [x] Course detail page displays golden guarantee badge and headline from `course_detail`.
- [x] Bundle promo card on course detail displays custom badge and title.
- [x] Learning outcomes section uses `learning_outcomes_header_*`.
- [x] Lesson player paywall lock screen displays `paywall_headline_*` and `paywall_perks_*` array.
- [x] Lesson player completion banner displays congratulations title and description.
- [x] Learner dashboard displays welcome title and motivational subtitle.
- [x] Learner dashboard empty state displays `empty_headline_*` and catalog action button.

## 4. Draws Arena, Cart, Search & System Notices (US3, US4)
- [x] Raffle Arena displays hero title, description, and next draw supervisory note.
- [x] Single part vs bundle perks breakdown maps from CMS array without hardcoded strings.
- [x] Checkout bottom sheet displays trust badge and free ticket reassurance notice.
- [x] Order summary confirmation page displays celebratory order title and reassurance text.
- [x] Search hub displays suggested query chips and search tips from `search_page` CMS.
- [x] 404 page renders custom title, description, and navigation button labels from `system_notices`.
- [x] 500 error boundary renders custom error title, description, and retry button label.

## 5. Admin CMS Hub & Linkage (US5)
- [x] Each section card in `/admin/landing` displays its target public route badge.
- [x] `CmsFormLayout` includes a "View Live Surface" external link button.
- [x] Clicking the live link navigates directly to the target route in a new tab.

## 6. Resilience & Code Health
- [x] When any CMS field is null or empty, component displays canonical fallback with zero errors.
- [x] TypeScript compilation (`npm run build`) passes with zero errors.
- [x] Backend tests (`php artisan test --filter=SiteWideCmsTest`) pass with 100% green status.
- [x] RTL and LTR layouts flip properly with zero misaligned icons or text clipping.
