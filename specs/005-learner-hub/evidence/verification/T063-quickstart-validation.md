# Verification Evidence: T063 Quickstart Scenario Validation

**Task**: T063 Run `quickstart.md` end-to-end validation scenarios (verified locally in dev environment)  
**Purpose**: Prove that fulfillment simulation, asynchronous ticket minting, queue dispatch failure recovery, gated playback authorization, dynamic watermark payload, monotonic progress updates, account merge transfer, and frontend dashboard/ticket drawer render correctly across layers.  
**Environment**: Local MariaDB (`knzin_db`), PHP 8.2 / Laravel 11 (`http://127.0.0.1:8000`), Next.js 16 (`http://localhost:3000`).  
**Result**: PASS (All 6 scenarios verified)

---

## Scenario 1: Post-Fulfillment Entitlement & Asynchronous Ticket Minting
- **Action**:
  ```bash
  php artisan knzin:simulate-fulfillment --email="tester@example.com" --course="auto-detailing" --type="bundle"
  php artisan queue:work --once
  ```
- **Observed Database State**:
  - `orders`: `status = completed`, `tickets_status = completed`, `tickets_minted_at = 2026-10-01 04:47:35`.
  - `tickets`: Count = 15, indices = 1..15, format = `KNZ-26-HQXY-DPZ8` matching `^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$`.
  - `course_entitlements`: 1 active bundle record with `course_part_id = NULL`.
- **Result**: PASS

---

## Scenario 2: Queue Dispatch Failure & Reconciliation Recovery
- **Action**:
  - Reset simulated order to `tickets_status = pending`, deleted tickets, set `created_at` to 10 minutes ago.
  - Ran `php artisan knzin:reconcile-ticket-generation`.
  - Ran `php artisan queue:work --once`.
- **Observed Database State**:
  - Console reported: `Reconciled and re-dispatched ticket generation for 1 order(s)`.
  - Order status restored to `tickets_status = completed`.
  - Exactly 15 tickets reminted with indices 1..15.
- **Result**: PASS

---

## Scenario 3: Gated Playback & Dynamic Watermark Verification
- **Action**:
  - `POST /api/v1/lessons/auto-detailing/parts/2/playback-auth` (anonymous) -> HTTP 401 (`ERR_UNAUTHORIZED`).
  - `POST /api/v1/lessons/auto-detailing/parts/1/playback-auth` (anonymous) -> HTTP 200 OK (Public preview stream, watermark null).
  - `POST /api/v1/lessons/auto-detailing/parts/2/playback-auth` with bearer token -> HTTP 200 OK:
    - `stream.validity_seconds`: 900
    - `watermark.account_email`: `tester@example.com`
    - `watermark.learner_code`: `LRN-7QVN90`
- **Result**: PASS

---

## Scenario 4: Monotonic Progress Persistence & Sticky 95% Completion
- **Action**:
  - `POST /api/v1/progress` with `watch_seconds: 3135, percent_complete: 95` -> HTTP 200: `is_completed: true, percent_complete: 95`.
  - Subsequent `POST /api/v1/progress` with lower `watch_seconds: 600, percent_complete: 18` -> HTTP 200: `is_completed: true, percent_complete: 95`. No regression occurred.
- **Result**: PASS

---

## Scenario 5: Account Merge Transfer (Guest to Verified Google)
- **Action**:
  `php artisan test tests/Feature/AccountMergeEntitlementsTest.php`
- **Observed**: 4 tests passed (20 assertions).
- **Result**: PASS

---

## Scenario 6: Frontend Dashboard & Ticket Drawer Verification
- **Action**:
  - `curl http://localhost:3000/ar/dashboard` -> HTTP 200 OK.
  - `curl http://localhost:3000/en/dashboard` -> HTTP 200 OK.
  - Unit/Component tests `TicketLedgerDrawer.test.ts` and `LessonWatermarkOverlay.test.ts` verified RTL/LTR alignment, sliding sheet interaction, Crockford serials, and canvas overlay pass-through.
- **Result**: PASS
