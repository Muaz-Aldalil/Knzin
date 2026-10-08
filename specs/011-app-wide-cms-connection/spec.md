# Feature Specification: 011-app-wide-cms-connection

**Feature Branch**: `011-app-wide-cms-connection`  
**Created**: 2026-10-08  
**Status**: Specification Approved / Ready for Review  
**Input**: "connect every element of the app with the admin CMS, every section and inside every section every element, and every page/route should connect to its target setting in the admin CMS"

---

## 1. Executive Summary & Intent

KNZiN is an education-first, sweepstakes-incentivized vocational learning platform operating primarily in Iraq. The platform requires 100% dynamic presentation agility across both Arabic (`ar`) and English (`en`) locales. 

Currently, the backend platform provides a 20-section CMS structure backed by `PlatformSetting` models and served via `/content/site-wide` and `/admin/cms/landing/{section}`. The admin panel houses editing interfaces for each section. However, across the frontend application, multiple UI surfaces contain hardcoded text, static translation fallbacks, un-rendered CMS fields (e.g. secondary CTA buttons, custom price display overrides, dynamic feature bullet points, FAQ headers, and reassurance disclaimers), and fragmented route navigation between the admin CMS hub and the actual public routes.

This specification mandates that:
1. **Every page and route** in KNZiN connects deterministically to its target admin CMS setting.
2. **Every section** on every page is governed by the CMS (including title, subtitle, badges, visibility toggles, action URLs, and background assets).
3. **Every element within each section** (labels, secondary CTAs, list items, FAQs, guarantee pills, disclaimers, empty states, and error screens) derives its displayed text and behavior dynamically from the CMS with zero hardcoded omissions.
4. **Target Setting Linkage**: The Admin CMS provides bidirectional visual linkage, letting administrators preview the target route directly and jump directly from preview to edit.
5. **Fail-Safe Resilience**: When CMS fields are blank or null, strict, verified bilingual fallbacks render instantly, ensuring zero layout shifts, zero undefined text, and zero broken render trees.

---

## 2. Route & Section Target Map

The application routes and their authoritative CMS target settings are mapped as follows:

| Route / Surface | Target Admin CMS Section | Managed Elements & Granular Fields |
| :--- | :--- | :--- |
| **Global Layout & Shell** (`/*`) | `site_shell` | Ticker announcements, speed, toggle, WhatsApp floating concierge (URL, greeting, button label, toggle), How-It-Works modal (title, subtitle, 4 dynamic steps with badges), Header CTA button & badge, Footer copyright & legal disclaimer. |
| **Landing Page** (`/[locale]`) | `hero`, `promotional_banner`, `skill_capital`, `courses_display`, `promotional_referral`, `free_referral_card`, `ticket_ladder`, `referral_faq`, `legal_compliance` | Hero headline, subheading, badge, primary CTA, secondary CTA, price display override, countdown timer; Grand prize banner; Founder quote & author; Course grid titles & bundle badge; Referral perks; Free ticket reward card; Ladder rates; Accordion FAQs; Iraqi Consumer Protection citations. |
| **Catalog & Courses** (`/[locale]/courses`, `/[locale]`) | `courses_display` | Section headline, section subtitle, bundle discount badge toggle & text, featured course pinning, visibility toggle. |
| **Course Detail** (`/[locale]/courses/[slug]`) | `course_detail` | Golden guarantee badge, headline, description; Full bundle promotion badge, title, description; Curriculum learning outcomes section header; 3-tier key course highlight points. |
| **Lesson & Course Player** (`/[locale]/lessons/[slug]`) | `lesson_player` | Video paywall lock headline, subheadline, 3 unlocked perks list items, unlock CTA button label; Course completion celebration card title, description, and action button. |
| **Learner Hub & Dashboard** (`/[locale]/dashboard`) | `learner_dashboard` | Authenticated welcome banner title, motivational subtitle; Empty enrollments headline, description, catalog CTA button; Unauthenticated access gate title, description, and login prompt. |
| **Raffle Arena & Draws** (`/[locale]/raffle`, `/[locale]/draws`) | `raffle_arena`, `draw_content` | Arena hero badge, title, description; Next draw announcement title, date text, supervisory note; Single course participation title, description, perks list; Bundle participation title, description, perks list, bonus badge; Raffle transparency FAQ accordion; Hall of Fame title, subtitle, podcast description, livestream embed link. |
| **Cart & Quick Checkout** (`CheckoutBottomSheet`, `order-summary`) | `checkout_cart` | Security & trust guarantee badge, headline, description; Free promotional sweepstakes ticket gift reassurance notice; Order confirmation celebration title, description, and live ticket sync notice. |
| **Affiliate & Partner Portal** (`/[locale]/affiliate`) | `affiliate_portal`, `affiliate_referral` | Marketer onboarding hero title, description, 4 onboarding advantage points; Promotional campaign banner title & subtitle; Iraqi compliance marketing policy notice title & text; Co-prize 40% rule explanation title & description. |
| **Smart Search Hub** (`/[locale]/search`) | `search_page` | Search hero headline, subtitle, input placeholder; Suggested search query chips array; Vocational search guidelines title & bullet points; Zero-results empty state headline & guidance description. |
| **System Notices & Error Boundaries** (`not-found.tsx`, `error.tsx`) | `system_notices` | 404 Not Found headline, description, Return Home button label, Go to Search button label; 500 Runtime Error headline, description, Try Again button label, Go Home button label. |

---

## 3. User Scenarios & Prioritized User Stories

### User Story 1 - Complete Landing Page & Global Shell Dynamic Coverage (Priority: P1) 🎯 MVP

As a Platform Administrator and Marketing Manager,  
I want every single element on the public landing page and the global shell (header, ticker, footer, WhatsApp, how-it-works, hero, narrative, courses, banners, ladder, referral, and FAQs) to reflect CMS settings immediately,  
So that our team can run promotions, update Iraqi legal disclosures, and tweak messaging without any code deployments.

**Why this priority**: The public landing page and global shell are seen by 100% of incoming prospective students and regulators. Zero hardcoded text can exist here.

**Independent Test**: Update every text input and toggle in `site_shell`, `hero`, `promotional_banner`, and `referral_faq` via the Admin CMS, then inspect `/[locale]` in both Arabic and English to verify that every rendered DOM element matches the updated CMS data.

**Acceptance Scenarios**:
1. **Given** an admin toggles `ticker_enabled` to `false` in `site_shell`, **When** any public page loads, **Then** the `ActivityTicker` is completely omitted from the layout.
2. **Given** an admin enters a secondary CTA label and URL in `hero`, **When** the landing page loads, **Then** both primary and secondary CTA buttons render with proper styling, sanitized URLs, and correct bidirectional arrow icons.
3. **Given** an admin modifies the 4 steps in `how_it_works_steps`, **When** a user clicks "How It Works" in the header, **Then** the modal displays all updated step badges, titles, and descriptions in the active locale.
4. **Given** an admin adds, reorders, or updates FAQ items in `referral_faq`, **When** viewing the landing page FAQ section, **Then** all questions and answers expand and collapse correctly with the new CMS content.

---

### User Story 2 - Course Detail & Learning Player Dynamic Coverage (Priority: P2)

As a Student and Course Viewer,  
I want course sales pages, guarantee notices, paywall lock screens, and course completion celebrations to display clear, administrator-configured promises and perks,  
So that I understand exactly what value, schematics, and promotional tickets I am receiving.

**Why this priority**: Directly drives conversion from free previews to part or bundle purchases.

**Independent Test**: Edit `course_detail` and `lesson_player` CMS settings in the admin panel, then navigate to `/courses/automotive-nanoceramics` and `/lessons/automotive-nanoceramics?part=2` while locked to verify paywall and guarantee texts.

**Acceptance Scenarios**:
1. **Given** an admin modifies `guarantee_headline_ar` and `guarantee_description_ar` in `course_detail`, **When** an Arabic learner views any course detail page, **Then** the golden guarantee card displays the exact updated text.
2. **Given** an admin updates `paywall_perks_ar` (array of bullet strings) in `lesson_player`, **When** an unsubscribed user reaches a locked video part, **Then** the lock screen lists all updated perk items with checkmark icons and the dynamic part price.
3. **Given** an admin updates `completion_banner_title` in `lesson_player`, **When** a student finishes watching 100% of all course parts, **Then** the celebration banner reflects the CMS congratulations copy.

---

### User Story 3 - Draws Arena, Raffle Transparency & Co-Prize Dynamic Coverage (Priority: P3)

As a Sweepstakes Participant and Compliance Auditor,  
I want the Raffle Arena (`/raffle` & `/draws`) and Affiliate Portal (`/affiliate`) to clearly reflect the licensed terms, draw schedule notes, perks comparison, and co-prize guidelines configured in the CMS,  
So that marketing claims are 100% transparent, legally compliant, and aligned with Iraqi Consumer Protection laws.

**Why this priority**: Protects KNZiN from regulatory non-compliance and ensures complete trust in draw fairness and affiliate payouts.

**Independent Test**: Modify `raffle_arena` single-part perks, bundle perks, and supervisory notes, then inspect `/draws` to verify that both tiers render the updated comparison pills and notes.

**Acceptance Scenarios**:
1. **Given** an admin customizes `next_draw_note_ar` to "تحت إشراف غرفة تجارة بغداد", **When** visiting `/draws`, **Then** the next draw countdown card immediately renders this supervisory note.
2. **Given** an admin updates `single_part_perks_ar` and `bundle_perks_ar`, **When** inspecting the perks breakdown, **Then** each list item dynamically maps from the CMS array with zero hardcoded entries.
3. **Given** an admin updates `coprize_rules_desc_ar` in `affiliate_portal`, **When** an affiliate accesses their portal, **Then** the 40% co-prize rule disclosure displays the updated legal copy.

---

### User Story 4 - Cart, Checkout, Search & Error Recovery Dynamic Coverage (Priority: P4)

As a Buyer, Searcher, or User encountering a broken link,  
I want the checkout bottom sheet, order summary, search page tips, and 404/500 recovery pages to display friendly, administrator-guided messages and actionable buttons,  
So that my purchasing experience is reassuring and unexpected navigation issues are smoothly recovered.

**Why this priority**: Maximizes checkout completion rates and prevents user drop-off on broken links or network glitches.

**Independent Test**: Update `checkout_cart`, `search_page`, and `system_notices` in the CMS, then trigger checkout, perform an empty search at `/search?q=xyzxyz`, and visit `/nonexistent-url` to verify copy.

**Acceptance Scenarios**:
1. **Given** an admin updates `ticket_gift_notice_ar` in `checkout_cart`, **When** the `CheckoutBottomSheet` opens for any course or bundle, **Then** the gift notice pill prominently displays this reassurance copy.
2. **Given** an admin updates `suggested_queries_ar` and `search_tips_items_ar` in `search_page`, **When** a user visits `/search`, **Then** the search input chips and tips list display the exact CMS strings.
3. **Given** an admin updates `not_found_title_ar` and button labels in `system_notices`, **When** an invalid route is visited, **Then** the 404 page renders the custom title, description, and navigation buttons.

---

### User Story 5 - Bidirectional Target Setting Navigation in Admin CMS Hub (Priority: P5)

As an Administrator in the Admin CMS,  
I want every CMS section editor to include a direct "View Live Target Page" button, and the CMS Hub (`/admin/landing`) to clearly display the target route for each section,  
So that I know precisely which public page each setting affects and can test my changes immediately.

**Why this priority**: Eliminates administrator confusion regarding which setting belongs to which route.

**Independent Test**: Navigate to `/admin/landing`, verify that each section card displays its target URL, click into an editor (e.g. `course_detail`), and click the live preview link to navigate to `/courses/phone-board-repair`.

**Acceptance Scenarios**:
1. **Given** an admin is viewing `/admin/landing`, **When** viewing the section cards, **Then** each card displays a badge showing its public route target (e.g. `Target: /courses/[slug]`, `Target: /search`).
2. **Given** an admin is editing any CMS section in `CmsFormLayout`, **When** looking at the header action bar, **Then** a "View Live Surface" external link button is present and navigates directly to the corresponding route in a new tab.

---

## 4. Edge Cases & Resilience Rules

1. **Empty/Null CMS Fields**: If an admin saves an empty string or removes a field, the component MUST gracefully fall back to canonical default translations without crashing or displaying `undefined` or blank layout gaps.
2. **Network/Backend Outage**: If `/content/site-wide` returns 500 or fails to fetch, the client components MUST utilize initial SSR data or canonical fallback constants, maintaining full visual structure.
3. **Array Mutation Invariants**: When editing array-based CMS sections (`ticker_announcements`, `how_it_works_steps`, `single_part_perks`, `bundle_perks`, `search_tips_items`, `suggested_queries`, `faq_items`), adding or removing items MUST validate that each item has a unique key and non-empty values.
4. **HTML / XSS Injection Prevention**: All CMS text strings MUST be rendered as sanitized text nodes or sanitized URLs (`sanitizeCtaUrl`). Rich text must not execute arbitrary script tags.
5. **Bidirectional Layout (RTL/LTR)**: All dynamic elements (CTAs, badges, list bullets, accordion triggers) MUST use CSS logical properties (`start`, `end`, `ms-`, `me-`) so layouts flip cleanly between Arabic and English.

---

## 5. Functional Requirements (FR-001 to FR-030)

### Global Shell & Layout
- **FR-001**: System MUST bind `ActivityTicker` to `site_shell.ticker_enabled`, `ticker_speed`, and `ticker_announcements`.
- **FR-002**: System MUST bind `FloatingWhatsAppButton` to `site_shell.whatsapp_enabled`, `whatsapp_url`, `whatsapp_button_label_*`, and `whatsapp_greeting_*`.
- **FR-003**: System MUST bind `HowItWorksModal` to `site_shell.how_it_works_title_*`, `how_it_works_subtitle_*`, and `how_it_works_steps` array.
- **FR-004**: System MUST bind `Footer` to `site_shell.footer_copyright_*` and `footer_disclaimer_*`.
- **FR-005**: System MUST bind `HeaderHUD` navigation bar to `site_shell.header_announcement_badge_*` and `header_cta_*`.

### Landing Page & Catalog
- **FR-006**: System MUST bind Hero section to `hero.badge_*`, `heading_*`, `subheading_*`, `primary_cta_*`, `secondary_cta_*`, `price_display_override_*`, and `timer_*`.
- **FR-007**: System MUST bind `TheHookSection` to `skill_capital.title_*`, `quote_*`, `author_name_*`, `author_title_*`, and `is_visible`.
- **FR-008**: System MUST bind `CoursesDisplaySection` to `courses_display.section_title_*`, `section_subtitle_*`, `bundle_badge_text_*`, and `show_bundle_discount_badge`.
- **FR-009**: System MUST bind `PromotionalBanner` to `promotional_banner.headline_*`, `subheadline_*`, `banner_image_url`, `cta_label_*`, `cta_url`, and `is_visible`.
- **FR-010**: System MUST bind `PromotionalReferral` to `promotional_referral.title_*`, `description_*`, `commission_badge_*`, `coprize_badge_*`, `cta_label_*`, `cta_url`, and `is_visible`.
- **FR-011**: System MUST bind `FreeReferralRewardCard` to `free_referral_card.card_title_*`, `card_text_*`, `badge_text_*`, and `is_visible`.
- **FR-012**: System MUST bind `TicketLadder` to `ticket_ladder.title_*`, `part_rate_text_*`, `bundle_rate_text_*`, `disclaimer_text_*`, and `is_visible`.
- **FR-013**: System MUST bind `FaqAccordion` to `referral_faq.title_*`, `items` array (question/answer pairs), and `is_visible`.
- **FR-014**: System MUST bind `LegalCompliance` / `LegalShield` to `legal_compliance.legal_statement_*`, `consumer_protection_law_*`, `kyc_notice_*`, and `is_visible`.

### Course Detail & Learning Hub
- **FR-015**: System MUST bind `CourseDetailClientView` guarantee card to `course_detail.guarantee_badge_*`, `guarantee_headline_*`, `guarantee_description_*`, and `is_visible`.
- **FR-016**: System MUST bind `CourseDetailClientView` bundle promotion card to `course_detail.bundle_promo_badge_*`, `bundle_promo_title_*`, and `bundle_promo_desc_*`.
- **FR-017**: System MUST bind `LearningOutcomes` section header to `course_detail.learning_outcomes_header_*`.
- **FR-018**: System MUST bind `LessonVideoPlayer` paywall lock card to `lesson_player.paywall_headline_*`, `paywall_subheadline_*`, `paywall_perks_*` array, `paywall_cta_label_*`, and `is_visible`.
- **FR-019**: System MUST bind `LessonPlayer` completion celebration card to `lesson_player.completion_banner_title_*` and `completion_banner_desc_*`.
- **FR-020**: System MUST bind `LearnerDashboardView` greeting banner to `learner_dashboard.welcome_title_*` and `welcome_subtitle_*`.
- **FR-021**: System MUST bind `LearnerDashboardView` empty enrollments state to `learner_dashboard.empty_headline_*`, `empty_desc_*`, and `empty_cta_label_*`.
- **FR-022**: System MUST bind `LearnerDashboardView` unauthenticated gate to `learner_dashboard.unauthenticated_title_*` and `unauthenticated_desc_*`.

### Draws, Cart, Search & System Notices
- **FR-023**: System MUST bind `RaffleArenaCmsContent` hero, next draw teasers, and perks to `raffle_arena.hero_*`, `next_draw_*`, `single_part_*`, `bundle_*`, and `faq_items`.
- **FR-024**: System MUST bind `CheckoutBottomSheet` and `OrderSummaryCard` to `checkout_cart.trust_badge_*`, `trust_headline_*`, `trust_description_*`, and `ticket_gift_notice_*`.
- **FR-025**: System MUST bind `OrderSummaryPage` post-order confirmation to `checkout_cart.order_celebration_title_*`, `order_celebration_desc_*`, and `order_ticket_reassurance_*`.
- **FR-026**: System MUST bind `AffiliateDashboardView` to `affiliate_portal.onboarding_*`, `banner_*`, `policy_notice_*`, and `coprize_rules_*`.
- **FR-027**: System MUST bind `SearchResultsContent` to `search_page.hero_*`, `search_placeholder_*`, `suggested_queries_*`, `search_tips_*`, and `empty_*`.
- **FR-028**: System MUST bind `LocalizedNotFound` (404) to `system_notices.not_found_title_*`, `not_found_desc_*`, and navigation button labels.
- **FR-029**: System MUST bind `ErrorBoundary` (500) to `system_notices.error_title_*`, `error_desc_*`, retry button label, and home button label.
- **FR-030**: System MUST provide bidirectional links between each editor in `/admin/landing/*` and its corresponding live public page.

---

## 6. Success Criteria (SC-001 to SC-006)

- **SC-001**: 100% of the 20 CMS sections are wired to live public UI components with zero orphan sections.
- **SC-002**: Modifying any field in `/admin/landing/{section}` and clicking Save results in that exact element updating on the target public page within 15 seconds (or immediately upon refresh/poll).
- **SC-003**: Zero hardcoded English or Arabic strings remain in any managed section component where a corresponding CMS field exists.
- **SC-004**: When any CMS setting is cleared or null, components display verified canonical defaults with zero runtime JS errors or layout breaks.
- **SC-005**: All modified components pass automated TypeScript type checks (`npm run build`) and linting with zero errors.
- **SC-006**: Existing automated test suites for both backend CMS (`SiteWideCmsTest.php`) and frontend components pass with 100% green status.
