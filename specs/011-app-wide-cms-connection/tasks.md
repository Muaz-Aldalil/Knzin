# Tasks: App-Wide Dynamic CMS Integration

**Branch**: `011-app-wide-cms-connection`  
**Input**: Design documents from `specs/011-app-wide-cms-connection/`  
**Prerequisites**: [plan.md](file:///d:/Work%20Projects/Knzin%20Project/specs/011-app-wide-cms-connection/plan.md), [spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/011-app-wide-cms-connection/spec.md), [data-model.md](file:///d:/Work%20Projects/Knzin%20Project/specs/011-app-wide-cms-connection/data-model.md), [contracts/api.md](file:///d:/Work%20Projects/Knzin%20Project/specs/011-app-wide-cms-connection/contracts/api.md)

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Parent user story (US1, US2, US3, US4, US5)
- Every task description cites the exact target file path.

---

## Phase 1: Setup & Baseline Verification

- [x] T001 Verify backend CMS test suite integrity by running `php artisan test --filter=SiteWideCmsTest` in `backend/`
- [x] T002 [P] Inspect `frontend/src/types/cms.ts` to ensure all 20 section types match the backend data contract

---

## Phase 2: User Story 1 - Global Shell & Landing Page Dynamic Coverage (Priority: P1) 🎯 MVP

- [x] T003 [P] [US1] Wire header announcement badge and header CTA button to `site_shell` in `frontend/src/components/layout/HeaderHUD.tsx`
- [x] T004 [P] [US1] Wire secondary CTA button, price display override, and timer title to `hero` CMS in `frontend/src/components/catalog/CatalogClientView.tsx`
- [x] T005 [P] [US1] Verify that `ActivityTicker.tsx` correctly applies `ticker_enabled`, `ticker_speed`, and custom announcements in `frontend/src/components/layout/ActivityTicker.tsx`
- [x] T006 [P] [US1] Verify that `FloatingWhatsAppButton.tsx` correctly applies `whatsapp_enabled`, `whatsapp_url`, and custom greeting in `frontend/src/components/layout/FloatingWhatsAppButton.tsx`
- [x] T007 [P] [US1] Verify that `HowItWorksModal.tsx` renders dynamic titles and step lists in `frontend/src/components/layout/HowItWorksModal.tsx`
- [x] T008 [P] [US1] Verify that `Footer.tsx` renders dynamic copyright and disclaimer text in `frontend/src/components/layout/Footer.tsx`
- [x] T009 [P] [US1] Verify that `TheHookSection.tsx` founder narrative renders dynamic quote and author title in `frontend/src/components/home/TheHookSection.tsx`
- [x] T010 [P] [US1] Wire promotional banner special event badge, referral card labels, ladder rates, and FAQ accordion items in `frontend/src/components/catalog/CatalogClientView.tsx`

---

## Phase 3: User Story 2 - Course Detail & Learning Hub Dynamic Coverage (Priority: P2)

- [x] T011 [P] [US2] Wire dynamic course key highlights and learning outcomes header to `course_detail` in `frontend/src/components/course/CourseDetailClientView.tsx`
- [x] T012 [P] [US2] Wire video paywall lock screen perks list (`paywall_perks_*`), legal shield disclaimer, and completion celebration banner to `lesson_player` in `frontend/src/components/lesson/LessonVideoPlayer.tsx`
- [x] T013 [P] [US2] Wire welcome banner, empty enrollments state, and unauthenticated gate to `learner_dashboard` in `frontend/src/components/dashboard/LearnerDashboardView.tsx`

---

## Phase 4: User Story 3 - Draws Arena, Raffle Transparency & Co-Prize Dynamic Coverage (Priority: P3)

- [x] T014 [P] [US3] Wire grand draw hero marquee badge and subtitle override to `HeroGrandPrizeCountdown.tsx` in `frontend/src/components/draws/HeroGrandPrizeCountdown.tsx`
- [x] T015 [P] [US3] Verify that single part perks, bundle perks, and supervisory note render dynamically in `frontend/src/components/draws/RaffleArenaCmsContent.tsx`
- [x] T016 [P] [US3] Verify that marketer onboarding points, compliance notices, and co-prize 40% rule render dynamically in `frontend/src/components/affiliate/AffiliateDashboardView.tsx`

---

## Phase 5: User Story 4 - Cart, Checkout, Search & Error Recovery Dynamic Coverage (Priority: P4)

- [x] T017 [P] [US4] Wire trust guarantee badge and free promotional ticket reassurance notice to `checkout_cart` in `frontend/src/components/checkout/CheckoutBottomSheet.tsx`
- [x] T018 [P] [US4] Wire order celebration title, description, and ticket reassurance notice to `checkout_cart` in `frontend/src/components/checkout/OrderSummaryCard.tsx` and `frontend/src/app/[locale]/order-summary/[orderNumber]/page.tsx`
- [x] T019 [P] [US4] Wire search hero, suggested query chips, search tips, and zero-results state to `search_page` in `frontend/src/app/[locale]/search/page.tsx`
- [x] T020 [P] [US4] Verify that 404 Not Found page title, description, and action buttons render from `system_notices` in `frontend/src/app/[locale]/not-found.tsx`
- [x] T021 [P] [US4] Verify that 500 runtime error boundary title, description, retry button, and home button render from `system_notices` in `frontend/src/app/[locale]/error.tsx`

---

## Phase 6: User Story 5 - Bidirectional Target Setting Navigation in Admin CMS Hub (Priority: P5)

- [x] T022 [P] [US5] Add `targetRoute` metadata and public preview URL badges to all section cards in `frontend/src/app/[locale]/admin/landing/page.tsx`
- [x] T023 [P] [US5] Add a "View Live Surface" external link action button in the header toolbar of `frontend/src/components/admin/cms/CmsFormLayout.tsx`
- [x] T024 [P] [US5] Pass target route props from each individual section page (`hero`, `course-detail`, `search-page`, etc.) into `CmsFormLayout` across `frontend/src/app/[locale]/admin/landing/*/page.tsx`

---

## Phase 7: Verification & Integrity Audit

- [x] T025 Run full TypeScript build check `npm run build` in `frontend/` to confirm zero type errors or missing props
- [x] T026 Run full backend feature test suite `php artisan test --filter=SiteWideCmsTest` in `backend/`
- [x] T027 Conduct RTL and LTR visual verification across modified pages to ensure zero layout regressions
- [x] T028 Perform cross-artifact convergence audit against `spec.md`, `plan.md`, and `checklist.md`
