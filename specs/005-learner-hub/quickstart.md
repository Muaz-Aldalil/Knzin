# Quickstart & Verification Guide: Feature 005 — Learner Hub & Ticket Ledger

**Branch**: `005-learner-hub`  
**Date**: 2026-10-01  
**Status**: Complete (Audited for Durable Sequences, Idempotency Index, and Media Protection)  

---

## 1. Prerequisites & Environment Setup

Verify background daemons and run migrations/seeders before executing validation:
```bash
# 1. Verify MariaDB (port 3306), Redis (port 6379), Laravel (port 8000), and Next.js (port 3000)
# 2. Run pending migrations in backend
cd backend
php artisan migrate

# 3. Seed catalog and test promotional draws
php artisan db:seed --class=CourseCatalogSeeder
php artisan db:seed --class=PromotionalDrawSeeder
```

---

## 2. Core Validation Scenarios

### Scenario 1: Post-Fulfillment Entitlement & Asynchronous Ticket Minting
**Objective**: Prove that fulfilling a $10 complete bundle order activates full course access and asynchronously mints exactly 15 promotional tickets with canonical Crockford Base32 serials.

1. **Simulate Completed Order via Development Fulfillment Tooling**:
   ```bash
   php artisan knzin:simulate-fulfillment --email="tester@example.com" --course="auto-detailing" --type="bundle"
   ```
2. **Execute Queued Ticket Generation Job**:
   ```bash
   php artisan queue:work --once
   ```
3. **Verify Database Records**:
   - Check `course_entitlements`:
     ```sql
     SELECT id, user_id, course_id, course_part_id, status FROM course_entitlements WHERE status = 'active';
     ```
     *Expected*: Exactly 1 active row with `course_part_id IS NULL`.
   - Check `tickets`:
     ```sql
     SELECT COUNT(*), serial_number FROM tickets GROUP BY order_id;
     ```
     *Expected*: Exactly 15 rows with serials matching `^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$` and unique indices $1 \dots 15$.
   - Check `orders`:
     ```sql
     SELECT id, status, tickets_status, tickets_minted_at FROM orders;
     ```
     *Expected*: `status = 'completed'`, `tickets_status = 'completed'`, `tickets_minted_at IS NOT NULL`.

---

### Scenario 2: Queue Dispatch Failure & Reconciliation Recovery
**Objective**: Prove that if the asynchronous queue dispatch fails after transaction commit, the scheduled reconciliation command automatically detects the stale pending order and mints the exact ticket total.

1. **Simulate an Order with Stale Pending Tickets Status**:
   ```sql
   UPDATE orders SET tickets_status = 'pending', tickets_minted_at = NULL, created_at = NOW() - INTERVAL 5 MINUTE WHERE id = :orderId;
   DELETE FROM tickets WHERE order_id = :orderId;
   ```
2. **Run Scheduled Reconciliation Command**:
   ```bash
   php artisan knzin:reconcile-ticket-generation
   php artisan queue:work --once
   ```
3. **Verify Recovery**:
   ```sql
   SELECT id, status, tickets_status FROM orders WHERE id = :orderId;
   SELECT COUNT(*) FROM tickets WHERE order_id = :orderId;
   ```
   *Expected*: `tickets_status = 'completed'` and `COUNT(*) = 15`.

---

### Scenario 3: Gated Playback & Dynamic Watermark Verification
**Objective**: Prove that unentitled requests to Part 2 are rejected with HTTP 403, while entitled requests return a signed 15-minute stream URL and authoritative watermark payload.

1. **Unauthorized Request (No Entitlement)**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/lessons/auto-detailing/parts/2/playback-auth \
     -H "Accept: application/json"
   ```
   *Expected Outcome*: `HTTP 401 Unauthorized` (`ERR_UNAUTHORIZED`).
2. **Authorized Request (With Entitlement Token)**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/lessons/auto-detailing/parts/2/playback-auth \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Accept: application/json"
   ```
   *Expected Outcome*: `HTTP 200 OK` returning `stream.expires_at` within 15 minutes and `watermark.account_email`, `watermark.learner_code` (e.g. `LRN-7K2M9W`), and `watermark.rendered_at`.
3. **Free Part 1 Introductory Preview**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/lessons/auto-detailing/parts/1/playback-auth \
     -H "Accept: application/json"
   ```
   *Expected Outcome*: `HTTP 200 OK` returning public stream URL with zero login required.

---

### Scenario 4: Monotonic Progress Persistence & Sticky 95% Completion
**Objective**: Prove that lower watch depth or percentage reports cannot regress higher previously recorded metrics, and 95% completion locks `is_completed = true`.

1. **Report 95% Completion**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/progress \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"course_slug":"auto-detailing","part_number":2,"watch_seconds":3135,"percent_complete":95}'
   ```
   *Expected*: `is_completed: true`, `percent_complete: 95`.
2. **Report Lower Progress (Simulating Rewatch / Intermittent Sync)**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/progress \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"course_slug":"auto-detailing","part_number":2,"watch_seconds":600,"percent_complete":18}'
   ```
   *Expected*: `is_completed: true` (remains true!), `percent_complete: 95` (no regression!).

---

### Scenario 5: Account Merge Transfer (Guest to Verified Google)
**Objective**: Prove that logging in via Google seamlessly transfers entitlements and tickets from unverified guest email accounts.

1. **Run Automated PHPUnit Test**:
   ```bash
   cd backend
   php artisan test tests/Feature/AccountMergeEntitlementsTest.php
   ```
   *Expected*: All assertions pass asserting guest orders, progress, entitlements, and tickets are transferred to Google user ID, and guest user status is `deactivated`.

---

### Scenario 6: Frontend Dashboard & Ticket Drawer Verification
**Objective**: Verify UI behavior in both Arabic RTL and English LTR viewports.

1. **Start Dev Servers**:
   ```bash
   # Backend: php artisan serve --port=8000
   # Frontend: npm run dev
   ```
2. **Navigate to Dashboard**:
   - Open `http://localhost:3000/ar/dashboard` and `http://localhost:3000/en/dashboard`.
   - Verify enrolled courses render with accurate completion badges and zero mock fallback data.
3. **Open Ticket Drawer**:
   - Click ticket counter badge in `HeaderHUD`.
   - Verify sliding sheet opens smoothly from the layout inline-end.
   - Verify individual tickets display Crockford serials and live countdown timers for active Hourly, Daily, and Monthly Grand draws.

---

## 3. Automated Test Suite Execution

Run the complete test suite across backend and frontend:
```bash
# Backend Feature & Unit Tests
cd backend
php artisan test --filter=LearnerHub

# Frontend Verification Tests
cd ../frontend
npm test
```
