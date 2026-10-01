# Checkpoint: Phase 05 — Progress Persistence & Account Continuity Subsystem

## Tasks Completed
- [x] **T023**: Hardened `recordProgress` in `backend/app/Http/Controllers/ProgressController.php` with strict integer validation, duration capping, `EntitlementService::hasAccess` verification, server-side monotonicity (`max()`), and sticky 95% completion.
- [x] **T024**: Updated `getActiveLearning` in `backend/app/Http/Controllers/ProgressController.php` to query authoritative server progress, returning null when no progress exists, eliminating mock/demo fallback.
- [x] **T025**: Extended `AccountMergeService` in `backend/app/Services/AccountMergeService.php` with deterministic lock ordering (`orderBy('id')->lockForUpdate()`), entitlement reconciliation (updating `user_id` and marking duplicate scopes `superseded`), ticket re-attribution (`Ticket::update(['user_id' => $googleUser->id])`), and progress max-merging.

## Files Changed
- `backend/app/Http/Controllers/ProgressController.php`
- `backend/app/Services/AccountMergeService.php`
- `specs/005-learner-hub/tasks.md`

## Verification Performed
- Ran full PHPUnit test suite:
  ```bash
  php artisan test
  ```
  Result: 27 passed (527 assertions), zero regressions.
  - Specifically verified `OneWayAccountMergeTest`: `unverified_guest_orders_merge_into_verified_google_user_on_login` passed cleanly.

## Security Verification
- **Deterministic Row Locking**: Both `User` and `Order` records are locked in ascending primary key order (`orderBy('id')->lockForUpdate()`), preventing deadlock races between concurrent `AccountMergeService` executions and background `GenerateTicketsJob` workers.
- **Entitlement Reconciliation**: Preserves strict unique scope constraint `uq_user_course_scope_status`. Identical scope collisions between guest and Google users are safely downgraded to `status = 'superseded'` with `superseded_by_entitlement_id` audit pointers.
- **Token Invalidation**: Surviving Google login revokes all guest session tokens, eliminating zombie session hijacking.

## Known Issues / Blockers
- None.

## Current Working-Tree State
- All Phase 1, Phase 2, Phase 3, Phase 4, and Phase 5 changes are present in the working tree and uncommitted.

## Next Task / Phase
- **Phase 6: API Controller Layer & Contract Conformance (T026–T029)**
  - T026: Create `DashboardController` (`GET /api/v1/user/dashboard`)
  - T027: Create `LessonPlaybackController` (`POST .../playback-auth` and `POST .../downloads/{resourceId}`)
  - T028: Create `TicketController` (`GET /api/v1/user/tickets`)
  - T029: Register API routes in `backend/routes/api.php` under `v1` prefix with Sanctum middleware
