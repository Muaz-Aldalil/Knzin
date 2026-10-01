# Checkpoint: Phase 06 — API Controller Layer & Contract Conformance

## Tasks Completed
- [x] **T026**: Created `DashboardController` in `backend/app/Http/Controllers/DashboardController.php` implementing `GET /api/v1/user/dashboard` returning summary metrics, active learning continuation item, and enrolled courses array with progress calculations conforming to `dashboard.contract.md`.
- [x] **T027**: Created `LessonPlaybackController` in `backend/app/Http/Controllers/LessonPlaybackController.php` implementing `POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/playback-auth` (with optional Sanctum for Part 1 preview and mandatory entitlement check for parts > 1) and `POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/downloads/{resourceId}` (with signed 15-minute download tokens) conforming to `playback-auth.contract.md` and `downloads.contract.md`.
- [x] **T028**: Created `TicketController` in `backend/app/Http/Controllers/TicketController.php` implementing `GET /api/v1/user/tickets` returning total ticket count, canonical serials, dynamic eligibility evaluation against hourly, daily, and monthly draws, and triggering async re-dispatch of pending ticket orders conforming to `tickets.contract.md`.
- [x] **T029**: Registered all new endpoints in `backend/routes/api.php` under `Route::prefix('v1')`.

## Files Changed
- `backend/app/Http/Controllers/DashboardController.php` (created)
- `backend/app/Http/Controllers/LessonPlaybackController.php` (created)
- `backend/app/Http/Controllers/TicketController.php` (created)
- `backend/routes/api.php` (modified)
- `specs/005-learner-hub/tasks.md` (modified)

## Verification Performed
- Ran `php artisan route:list --path=api` to verify all 20 routes are cleanly registered.
- Ran full PHPUnit test suite:
  ```bash
  php artisan test
  ```
  Result: 27 passed (527 assertions), zero regressions.

## Security Verification
- **Sanctum Authentication**: Protected routes (`/user/dashboard`, `/user/tickets`, `/lessons/.../downloads/...`) strictly enforce `auth:sanctum`.
- **Media Authorization**: Paid playback strictly gates access through `MediaProtectionService::generatePlaybackToken` with 15-minute expiring signed URLs and user-specific watermark payloads.
- **Data Isolation**: All queries explicitly filter by `$request->user()->id`, preventing cross-user data leakage.

## Known Issues / Blockers
- None.

## Current Working-Tree State
- All Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, and Phase 6 changes are present in the working tree and uncommitted.

## Next Task / Phase
- **Phase 7: Frontend Learner Hub & UI Hardening (T030–T044)**
  - Apply `/muaz-skill` for responsive, bilingual RTL/LTR, accessible UX.
  - Implement data hooks: `useLearnerDashboard`, `useLearnerTickets`, `useLessonPlayback`.
  - Implement and harden UI components: `TicketLedgerDrawer`, `LearnerHubView`, `LessonPlayerView`, `WatermarkOverlay`, `ProtectedResourceList`.
  - Clean client mocks (`DEF-05B`, `DEF-05C`, `DEF-05D`).
