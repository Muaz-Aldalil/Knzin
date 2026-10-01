# Checkpoint: Phase 07 — Frontend Learner Hub & UI Hardening

## Tasks Completed
- [x] **T030**: Created `useLearnerDashboard` data hook in `frontend/src/hooks/useLearnerDashboard.ts` fetching `GET /api/v1/user/dashboard` with React Query caching, unauthenticated state handling, and locale awareness.
- [x] **T031**: Created `useLearnerTickets` data hook in `frontend/src/hooks/useLearnerTickets.ts` fetching `GET /api/v1/user/tickets`, computing client-to-server clock skew from `server_time_utc`, managing synchronized countdown tick intervals, and discarding stale out-of-order responses.
- [x] **T032**: Created `useLessonPlayback` hook in `frontend/src/hooks/useLessonPlayback.ts` calling `POST /playback-auth`, handling `ERR_PART_LOCKED` paywall triggers, scheduling token refresh at 14 minutes, and managing watermark state.
- [x] **T033**: Created `EnrolledCourseCard` component in `frontend/src/components/dashboard/EnrolledCourseCard.tsx` with progress meter, completed parts badge, continue learning button, and locked module upgrade CTA with bilingual RTL/LTR logical CSS.
- [x] **T034**: Created `JumpBackInHero` component in `frontend/src/components/dashboard/JumpBackInHero.tsx` rendering last watched vocational module with resume playback button.
- [x] **T035**: Created `LearnerDashboardView` component in `frontend/src/components/dashboard/LearnerDashboardView.tsx` assembling metrics summary, JumpBackIn hero, enrolled course grid, and empty state with catalog CTA.
- [x] **T036**: Created dedicated dashboard page route in `frontend/src/app/[locale]/dashboard/page.tsx` mounting `LearnerDashboardView` with SSR/CSR auth boundary.
- [x] **T037**: Created `TicketLedgerDrawer` component in `frontend/src/components/layout/TicketLedgerDrawer.tsx` utilizing Radix UI Dialog primitive, sliding from layout inline-end, displaying ticket count badge, ticket cards with canonical Crockford serials (`KNZ-YY-XXXX-YYYY`), dynamic tier eligibility badges, and live countdown timers.
- [x] **T038**: Integrated `TicketLedgerDrawer` trigger into `frontend/src/components/layout/HeaderHUD.tsx` wiring ticket counter badge to open drawer without page navigation.
- [x] **T039**: Created `LessonWatermarkOverlay` component in `frontend/src/components/lesson/LessonWatermarkOverlay.tsx` rendering an HTML5 Canvas layer floating over the video player with non-blocking click-through (`pointer-events-none`), dynamically drifting purchaser's full email, `learner_code`, and playback timestamp.
- [x] **T040**: Updated `LessonVideoPlayer` in `frontend/src/components/lesson/LessonVideoPlayer.tsx` consuming signed streaming URLs, mounting `LessonWatermarkOverlay`, and handling dynamic paywall pricing.
- [x] **T041**: Hardened `LessonPlayerClientView` in `frontend/src/components/lesson/LessonPlayerClientView.tsx`:
  - Completely stripped `localStorage` fake purchase reads (`knzin_purchased_parts_*`, eliminating `DEF-05B`).
  - Delegated authorization to `useLessonPlayback` hook.
  - Mounted locked paywall state with purchase triggers when `ERR_PART_LOCKED` is returned.
- [x] **T042**: Updated `LessonTabs` in `frontend/src/components/lesson/LessonTabs.tsx` to fetch expiring signed download URLs via `POST /downloads/...` instead of static URLs, and render locked triggers on unpurchased parts.
- [x] **T043**: Cleaned `frontend/src/lib/course-content.ts` removing all direct paid YouTube video URLs and static resource links for Part 2 and beyond (`DEF-05C`). Part 1 preview link remains public.
- [x] **T044**: Cleaned `frontend/src/lib/progress.ts` completely removing `DEMO_ACTIVE_LEARNING` and hardcoded progress mock fallbacks (`DEF-05D`).

## Files Changed
- `frontend/src/hooks/useLearnerDashboard.ts` (created)
- `frontend/src/hooks/useLearnerTickets.ts` (created)
- `frontend/src/hooks/useLessonPlayback.ts` (created)
- `frontend/src/components/dashboard/EnrolledCourseCard.tsx` (created)
- `frontend/src/components/dashboard/JumpBackInHero.tsx` (created)
- `frontend/src/components/dashboard/LearnerDashboardView.tsx` (created)
- `frontend/src/app/[locale]/dashboard/page.tsx` (created)
- `frontend/src/components/layout/TicketLedgerDrawer.tsx` (created)
- `frontend/src/components/lesson/LessonWatermarkOverlay.tsx` (created)
- `frontend/src/components/layout/HeaderHUD.tsx` (modified)
- `frontend/src/components/lesson/LessonVideoPlayer.tsx` (modified)
- `frontend/src/components/lesson/LessonPlayerClientView.tsx` (modified)
- `frontend/src/components/lesson/LessonTabs.tsx` (modified)
- `frontend/src/lib/course-content.ts` (modified)
- `frontend/src/lib/progress.ts` (modified)
- `frontend/src/lib/api-client.ts` (modified)
- `specs/005-learner-hub/tasks.md` (modified)

## Verification Performed
- Ran TypeScript compilation:
  ```bash
  npx tsc --noEmit
  ```
  Result: Clean exit (code 0), zero type errors.
- Ran Node.js test suite:
  ```bash
  npm test
  ```
  Result: 52 passed across 18 suites, zero failures.

## Security Verification
- **Fake Client Ownership Stripped**: `localStorage` purchases (`knzin_purchased_parts_*`) eliminated. Client cannot spoof ownership.
- **Paywall Invariant**: Paid parts (parts 2+) strictly require server playback authorization. No static YouTube links exposed in client bundle for paid parts.
- **Watermark Invariant**: High-value video playback overlays canvas watermark with learner email, Crockford learner code, and timestamp to deter screen recordings.
- **Download Invariant**: Attachments are served only via 15-minute expiring signed URLs generated upon verifying active entitlement.

## Known Issues / Blockers
- None.

## Current Working-Tree State
- All changes remain uncommitted in the working tree on branch `005-learner-hub`.

## Next Task / Phase
- **Phase 8: Automated Test Suite & Verification (T045–T057)**
  - T045–T052: PHPUnit backend feature tests
  - T053–T057: Frontend integration tests
