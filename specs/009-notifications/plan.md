# Implementation Plan: Feature 009 — Notifications (الإشعارات)

**Branch**: `009-notifications` | **Date**: 2026-10-04 | **Spec**: [spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/009-notifications/spec.md)  
**Input**: Feature specification from `specs/009-notifications/spec.md` and ratified decision [DEC-007](file:///d:/Work%20Projects/Knzin%20Project/DECISIONS.md)

---

## Summary

Feature 009 establishes the full-stack communication layer for KNZiN across two approved delivery channels:
1. **In-App Notification Center**: A persistent header bell HUD, unread badge count, interactive popover/drawer, read/unread state mutation, and paginated user inbox built directly into the Next.js shell.
2. **Asynchronous Email Notification Engine**: High-reliability transactional receipts, time-sensitive draw/winner alerts, abandoned-order recovery, and administrative broadcasts with cryptographic one-click unsubscribe, powered by Laravel Mail and Queues.

Per approved product decision **[DEC-007](file:///d:/Work%20Projects/Knzin%20Project/DECISIONS.md)**, WhatsApp delivery is **deferred** and strictly out of scope. Notifications are strictly **downstream observers** of authoritative business state and must never mutate or jeopardize financial, ticket, or draw truth.

---

## Technical Context

**Language/Version**: PHP 8.3 (Laravel 11 Backend API) + TypeScript 5.x (Next.js 14+ App Router Frontend)  
**Primary Dependencies**:
* Backend: `laravel/sanctum`, `illuminate/notifications`, `illuminate/mail`, `predis/predis`
* Frontend: `next-intl` (bidirectional Arabic RTL default, English LTR), `lucide-react`, Tailwind CSS, Radix UI primitives (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`)  
**Storage**: MySQL 8+ / MariaDB (`notifications` table with UUIDs, `notification_preferences`, `admin_broadcasts`, `course_mission_reminders`), Redis (Queues & Distributed Locks)  
**Testing**: PHPUnit / Pest (Laravel backend feature & unit tests), Jest + React Testing Library (Frontend component tests)  
**Target Platform**: Linux Server (PHP-FPM, Nginx, Redis, Supervisor queue workers) + Modern Web Viewports (Desktop >= 1280px, Tablet 768px, Mobile 375px)  
**Project Type**: Brownfield full-stack Web Application (Laravel API + Next.js Frontend)  
**Performance Architecture**:
* Query efficiency supported by composite index `(notifiable_type, notifiable_id, read_at)` for unread badge count queries (`WHERE read_at IS NULL`).
* Asynchronous queue handoff for all email and notification dispatches, isolating external network I/O from HTTP checkout request cycles.
* Paginated feed index scans on `(notifiable_type, notifiable_id, created_at)`.  
**Constraints**:
* Zero transaction rollbacks: A notification failure must NEVER roll back an order, payment, ticket grant, or draw outcome.
* Unread retention: Retained **indefinitely** (no auto-expiration, no unread pruning).
* Read retention: Auto-pruned after exactly **60 days** from `read_at`.
* Idempotency: Enforced at the database level via deterministic UUIDv5 primary keys and atomic conditional timestamp updates.  
**Scale/Scope**: 10 approved notifications, 2 delivery channels (In-App + Email), 1 shared header HUD integration, 4 scheduled console evaluators.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Compliance Status | Evidence & Enforcement |
| :--- | :--- | :--- |
| **Brownfield Reality (Section 3)** | PASS | Reuses existing `App\Models\User` (`Notifiable`), existing `config/mail.php`, existing `config/queue.php`, existing `routes/console.php`, and `HeaderHUD.tsx`. No redundant frameworks introduced. |
| **Financial Authority Boundary (Section 11 & 12)** | PASS | Notifications are strictly downstream observers. No notification code creates, updates, or reverses ledger entries, orders, tickets, or wallet balances. |
| **Failure Isolation Invariant (Section 20)** | PASS | Transaction-originated notifications queue strictly after commit (`DB::afterCommit(...)`). Mail failure leaves database transaction 100% intact. |
| **Localization Invariant (Article V)** | PASS | Full Arabic (`ar`, RTL default) and English (`en`, LTR) support. Dynamic mixed numbers, serials, and currency amounts wrapped with semantic `<bdi>` tags. |
| **Scope Discipline (Section 15)** | PASS | WhatsApp is deferred per `DEC-007`. SMS, push notifications, and derived affiliate commission alerts are excluded. |
| **Security & IDOR Resistance (Section 13)** | PASS | Notification queries strictly scoped through `$request->user()->notifications()`. Admin broadcast protected under `admin.capability:manage_platform_settings`. |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-notifications/
├── spec.md              # Authoritative feature specification & clarified rules
├── plan.md              # This full-stack implementation plan
├── research.md          # Phase 0 research & architectural decision record
├── data-model.md        # Phase 1 database schema, indexes, and entity models
├── quickstart.md        # Developer setup, testing, and manual verification guide
├── contracts/           # Phase 1 OpenAPI 3.0 API contracts
│   └── notifications.openapi.yml
└── checklists/
    └── requirements.md  # Specification quality checklist (100% pass)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       ├── EvaluateAbandonedOrdersCommand.php   # 2h abandoned order evaluator
│   │       ├── EvaluateDrawAlertsCommand.php         # 15m live draw evaluator
│   │       ├── EvaluateMissionRemindersCommand.php   # 3d inactivity evaluator (7d cooldown)
│   │       └── PruneReadNotificationsCommand.php     # 60d read notification cleanup
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── NotificationController.php            # User notification center & unread count
│   │   │   ├── NotificationPreferenceController.php  # User marketing category toggles & unsubscribe
│   │   │   └── Admin/
│   │   │       └── AdminBroadcastController.php      # Admin broadcast dispatch (manage_platform_settings)
│   │   └── Requests/
│   │       ├── UpdateNotificationPreferencesRequest.php
│   │       └── StoreAdminBroadcastRequest.php
│   ├── Models/
│   │   ├── NotificationPreference.php
│   │   ├── AdminBroadcast.php
│   │   └── CourseMissionReminder.php                 # Dedicated mission reminder cooldown tracking
│   ├── Channels/
│   │   └── DatabaseChannel.php                       # Concurrency-safe database notification channel
│   └── Notifications/                                # 10 Approved Notification Classes
│       ├── OrderConfirmationNotification.php         # Transactional: Order receipt
│       ├── TicketIssuanceNotification.php            # Transactional: Minted tickets confirmation
│       ├── AbandonedOrderRecoveryNotification.php    # Transactional: 2h recovery reminder
│       ├── LiveDrawAlertNotification.php             # Transactional: 15m live draw alert
│       ├── WinnerKycNotification.php                 # Transactional: Prize winner KYC instructions
│       ├── AdminBroadcastNotification.php            # Marketing: Platform announcement
│       ├── NewCourseNotification.php                 # Marketing: New course release
│       ├── NewPrizeNotification.php                  # Marketing: New prize/draw release
│       ├── MissionReminderNotification.php           # Learning: 3d inactivity reminder
│       └── CourseContentUpdatedNotification.php      # Learning: Learner-facing update with in-app refresh action
├── database/
│   └── migrations/
│       ├── 2026_10_05_000001_create_notifications_table.php
│       ├── 2026_10_05_000002_create_notification_preferences_table.php
│       ├── 2026_10_05_000003_create_admin_broadcasts_table.php
│       ├── 2026_10_05_000004_create_course_mission_reminders_table.php
│       └── 2026_10_05_000005_add_notification_support_columns.php
└── tests/
    └── Feature/
        ├── NotificationCenterTest.php
        ├── NotificationPreferenceTest.php
        ├── NotificationSchedulerTest.php
        └── AdminBroadcastTest.php

frontend/
├── src/
│   ├── components/
│   │   └── notifications/
│   │       ├── NotificationBell.tsx                  # Bell trigger with real-time unread badge
│   │       ├── NotificationDrawer.tsx                # Interactive dropdown/drawer popover
│   │       ├── NotificationItem.tsx                  # Individual notification card with <bdi> isolation
│   │       └── NotificationPreferencesModal.tsx      # User settings category toggles
│   ├── hooks/
│   │   └── useNotifications.ts                       # SWR/fetching, mark-as-read mutations, optimistic badge
│   └── types/
│       └── notification.ts                           # TypeScript interfaces matching OpenAPI schema
```

---

## 1. Notification Recipient & Authority Semantics

Every required notification maps to a verified, evidence-backed recipient population:

| # | Notification Name | Delivery Channel(s) | Recipient Population | State Owner & Authority | Recipient Invariants |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Order Confirmation** | In-App + Email | `$order->user` (Resolved `User` instance) | `OrderService::fulfillOrder` (`Order::status = 'completed'`) | Guest orders resolve to a `User` record (`auth_provider = 'guest'`). Email is delivered immediately; in-app notification is persisted to `notifications` and becomes accessible whenever the user logs in. |
| **2** | **Ticket Issuance** | In-App + Email | `$order->user` | `TicketMintingService` (`Order::tickets_status = 'completed'`) | Dispatched strictly after all tickets are persisted to MySQL in `GenerateTicketsJob`. Serials are queried from `$order->tickets()->pluck('serial_number')`—zero cross-user exposure. |
| **3** | **Abandoned Pending Order** | Email Only | `$order->user->email` | Scheduled Evaluator (`orders.status = 'pending'`) | Dispatched only while order is genuinely eligible (`status = 'pending'`, `created_at <= now() - 2h`, not expired, `recovery_notification_sent_at IS NULL`). |
| **4** | **Live Draw 15m Alert** | In-App + Email | Participating ticket holders for the draw | Scheduled Evaluator (`Draw::is_published = true`, `status != 'completed'`, `ends_at - now() <= 15m`) | Recipients are active users holding tickets valid for that draw window (`starts_at` to `ends_at`). Dispatched once per draw per user. |
| **5** | **Winner KYC Notice** | In-App + Email | Winning ticket holder (`$ticket->user`) | `DrawWinner` committed record | Informational KYC claim instructions. Does not approve, release, or alter prize status. No invented monetary thresholds. |
| **6** | **Admin Broadcast** | In-App + Email | All active platform users | Administrator via `POST /api/v1/admin/notifications/broadcast` | Platform-wide dispatch; filtered by user preference `admin_broadcasts = true` and `unsubscribed_at IS NULL`. Zero speculative audience segmentation. |
| **7** | **New Course Publication** | In-App + Email | All active registered users | `AdminCourseService` (`Course::is_active = true` transition) | Filtered by user preference `course_announcements = true` and `unsubscribed_at IS NULL`. |
| **8** | **New Prize Announcement** | In-App + Email | All active registered users | `DrawLifecycleService` (Parent `Draw::is_published = true` transition) | Filtered by user preference `prize_draw_promotions = true` and `unsubscribed_at IS NULL`. |
| **9** | **Mission Inactivity Reminder** | In-App + Email | Enrolled learners with incomplete parts | Scheduled Evaluator (`lesson_progress.is_completed = false`) | Dispatched if inactive for 3 full days since `last_watched_at` (or enrollment date) and `last_reminded_at <= now() - 7 days` in `course_mission_reminders`. |

---

## 2. Order Fulfillment Authoritative Integration Point

* **Authoritative Integration Point**: `App\Services\OrderService::fulfillOrder(Order $order)`
* **Evidence**:
  * `PaymentWebhookController.php` (line 301) and `ReconcilePaymentsCommand.php` (line 115) both converge exclusively on `OrderService::fulfillOrder($order)`.
  * `OrderService::fulfillOrder` wraps state transitions in `DB::transaction(...)`:
    1. Sets `status = 'completed'`, `tickets_status = 'pending'`.
    2. Synchronously creates course entitlements (`EntitlementService`).
    3. Synchronously credits affiliate commission (`AffiliateCommissionService`).
    4. Dispatches asynchronous ticket minting: `GenerateTicketsJob::dispatch($lockedOrder->id)->afterCommit()`.
    5. **Feature 009 Integration**: Dispatches Order Confirmation notification strictly within `DB::afterCommit()`:
       ```php
       DB::afterCommit(function () use ($lockedOrder) {
           $lockedOrder->user->notify(new OrderConfirmationNotification($lockedOrder));
       });
       ```
  * This guarantees zero notification dispatch if payment fulfillment rolls back.

---

## 3. Asynchronous & Transaction Boundaries (`afterCommit` vs Scheduled)

The architecture distinguishes between two execution models:

### 3.1 Transaction-Originated Notifications
* **Applies to**: Order Confirmation, Ticket Issuance, Winner KYC, Admin Broadcast, New Course Publication, New Prize Announcement.
* **Mechanism**: Handed to the queue strictly after the underlying database transaction commits, using `DB::afterCommit(fn() => ...)` or queued notifications with `public bool $afterCommit = true;`.
* **Failure Guarantee**: If an order, ticket insert, or draw winner transaction rolls back, zero notifications are queued or dispatched. If the mailer fails during delivery, the queue worker retries; the database transaction remains 100% committed and uncorrupted.

### 3.2 Scheduled Evaluator Notifications
* **Applies to**: Abandoned Order Recovery, Live Draw 15m Alert, Mission Inactivity Reminder, 60-Day Read Pruning.
* **Mechanism**: Executed in scheduled Artisan console commands querying already-committed historical records.
* **Isolation**: Scheduled commands do not wrap long-running batch sweeps in giant transactions. Evaluator commands process in chunks (`chunkById(100)`) and use atomic row updates (`whereNull(...)->update(...)`) for concurrency protection.

---

## 4. Concrete Data-Level Idempotency

Duplicate notification suppression is enforced via concrete database mechanisms:

1. **Deterministic Primary Keys (UUIDv5)**:
   * Discrete domain events derive their notification `id` primary key deterministically:
     `$notificationId = Str::uuid5(Str::NAMESPACE_OID, "{$domain_prefix}:{$entity_id}:{$user_id}");`
   * Applies to: Live Draw 15m Alerts (`draw_15m:{draw_id}:{user_id}`), Winner KYC (`winner_kyc:{winner_id}`), Admin Broadcasts (`broadcast:{broadcast_id}:{user_id}`), Course Releases (`course_pub:{course_id}:{user_id}`), Prize Releases (`prize_pub:{draw_id}:{user_id}`).
   * If a queue worker crashes, retries, or receives duplicate events, the database rejects duplicate insertion with a Primary Key Unique Constraint violation.
2. **Atomic Timestamp Updates**:
   * **Abandoned Orders**:
     ```php
     $affected = Order::where('id', $order->id)
         ->where('status', 'pending')
         ->whereNull('recovery_notification_sent_at')
         ->update(['recovery_notification_sent_at' => now()]);
     if ($affected > 0) {
         Mail::to($order->user->email)->queue(new AbandonedOrderRecoveryMail($order));
     }
     ```
     Only the worker that wins the atomic update sends the email. Maximum 1 email per order.
   * **Course Mission Reminders**:
     ```php
     CourseMissionReminder::updateOrCreate(
         ['user_id' => $user->id, 'course_id' => $course->id],
         ['last_reminded_at' => now()]
     );
     ```
     Guarantees exactly 1 reminder tracking row per `(user_id, course_id)` with zero contamination of financial `course_entitlements`.

3. **Admin Dashboard Learner-Facing Update & In-App Refresh Flow**:
   * **Explicit Scope & Mutation Boundary**:
     A learner-update notification may be created only when an authorized Admin Dashboard mutation completes successfully and produces a persisted change to learner-visible state.
     The current repository has one verified learner-facing Admin Dashboard mutation surface: `AdminCourseService`. The architecture is defined by the mutation boundary, not by the Course domain, so future learner-facing Admin Dashboard mutation paths can integrate without changing the notification contract.
     - **Eligible Mutation Points**:
       - `AdminCourseService::addPart`: Persists a new curriculum part to MySQL.
       - `AdminCourseService::updatePart`: Persists changes to part title, syllabus, video/pdf resources, or active status (`$part->wasChanged()`).
       - `AdminCourseService::reorderParts`: Shifts lesson part numbering sequence in MySQL.
       - `AdminCourseService::deletePart`: Deactivates/archives an existing part for enrolled students (`$part->wasChanged('is_active')`).
       - `AdminCourseService::updateCourse`: Persists changes to learner-visible course fields (`$course->wasChanged(['title_ar', 'title_en', 'description_ar', 'description_en', 'curriculum_summary_ar', 'curriculum_summary_en', 'outcomes', 'cover_image_url'])`).
     - **Non-Trigger Operations**: Administrative observation (reading audit logs via `AdminAuditLogController`, viewing courses), form opening/cancelling, saves where `wasChanged()` is false (identical data), internal settings/capabilities, and pricing/sweepstakes adjustments (`bundle_price_cents`, `part_price_cents`, promotional ticket counts).
   * **Role of `wasChanged()`**:
     Eloquent's `wasChanged()` is scoped strictly as the persistence-time state transition check (proving whether the database record actually changed); it is NOT a substitute for the update identity.
   * **Completion Proof**:
     Established strictly by the authoritative learner-facing mutation being persisted and the enclosing `DB::transaction` successfully committing in MySQL (`DB::transactionLevel() === 0`). Neither an audit log insertion nor an HTTP 200/201 response is the database transaction's completion proof.
   * **Transaction Boundary & Failure Isolation**:
     The mutating service owns the transaction. Dispatches are queued strictly inside `DB::afterCommit(function () use (...) { ... })`. Rollback guarantees 0 notifications. Committed state guarantees notification eligibility. Notification failure never rolls back or alters the committed admin mutation.
   * **Logical Update Identity & Deduplication**:
     The logical update is identified by the course's committed monotonic version (`courses.content_version`), combined with course ID and recipient ID:
     ```php
     $idempotencyId = Str::uuid5(
         Str::NAMESPACE_OID,
         "admin_update:course:{$courseId}:v{$course->content_version}:{$userId}"
     );
     ```
     Whenever an authorized Admin Dashboard mutation completes with verified learner-facing changes (`wasChanged() === true` on course or course part learner-visible attributes), `$course->increment('content_version')` is executed inside the enclosing transaction. This identity guarantees that:
     1. Duplicate processing of the same committed update (worker crash, queue retry) carries the same version (e.g. `v2`), yielding the exact same UUIDv5 key and producing exactly ONE learner notification.
     2. A legitimate later update—even if it produces identical changed values to an earlier update (e.g. content A → B, then B → A, then A → B) or executes within the same second—increments `content_version` (e.g. `v3`), yielding a new UUIDv5 key and producing a NEW learner notification.
   * **Category Classification**:
     Classified as `transactional` (mandatory educational service notice) rather than marketing `course_announcements`. Disabling promotional marketing preferences does NOT suppress updates for courses the learner has already purchased and is actively studying.
   * **Affected Entitled Learner Resolution**:
     Query users with active course access:
     ```php
     $entitledUserIds = CourseEntitlement::where('course_id', $courseId)
         ->where('status', 'active')
         ->pluck('user_id')
         ->unique();
     ```
     Users without active entitlements receive zero notifications.
   * **Frontend Non-Reload Cache Invalidation**:
     In `NotificationItem.tsx`, when `action_type === 'refresh_course'`, clicking the "تحديث / Refresh" button (with `RefreshCw` icon):
     1. Optimistically marks the notification as read.
     2. Calls TanStack Query `queryClient.invalidateQueries({ queryKey: ['course', courseSlug] })` and `queryClient.invalidateQueries({ queryKey: ['courses'] })`.
     3. Refetches course and lesson data in-memory without a browser window reload.
     4. Retains learner authentication tokens/cookies, active route, and application state.

---

## 5. Scheduler Design (`routes/console.php`)

Registered in `backend/routes/console.php` with concurrency protection:

```php
// 1. Evaluate Abandoned Pending Orders (every 10 minutes)
Schedule::command('notifications:evaluate-abandoned-orders')
    ->everyTenMinutes()
    ->withoutOverlapping(10);

// 2. Evaluate Live Draw Stream Alerts (every 5 minutes)
Schedule::command('notifications:evaluate-draw-alerts')
    ->everyFiveMinutes()
    ->withoutOverlapping(5);

// 3. Evaluate Course Mission Inactivity Reminders (hourly sweep)
Schedule::command('notifications:evaluate-mission-reminders')
    ->hourly()
    ->withoutOverlapping(30);

// 4. Prune Read In-App Notifications (daily at 03:00 UTC)
Schedule::command('notifications:prune-read')
    ->dailyAt('03:00')
    ->withoutOverlapping(60);
```

---

## 6. Retention Invariant Enforcement

* **Read In-App Notifications**:
  ```sql
  DELETE FROM notifications 
  WHERE read_at IS NOT NULL 
    AND read_at <= NOW() - INTERVAL 60 DAY;
  ```
* **Unread In-App Notifications**:
  * Where `read_at IS NULL`, records are **never** touched by pruning. Retained indefinitely.
  * No arbitrary expiration, no unread pruning, no dismissal-based retention.

---

## 7. Preferences & Unsubscribe Scope

* **Scope**: A category toggle controls **both In-App and Email** communications for that category:
  1. `course_announcements`
  2. `prize_draw_promotions`
  3. `admin_broadcasts`
* **Transactional Guarantee**: Transactional notifications (order receipts, ticket issuance, live draw 15m alerts, winner KYC notices, and pending order recovery) are **mandatory** and non-toggleable.
* **One-Click Email Unsubscribe**:
  * Marketing emails contain a cryptographically signed HMAC URL (`URL::signedRoute('api.v1.notifications.unsubscribe', [...])`).
  * Validating the signature updates `unsubscribed_at` or disables the specific category without requiring login.

---

## 8. In-App Notification Center & Frontend Shell Integration

1. **Mounting**: Mounted in `frontend/src/components/layout/HeaderHUD.tsx` in the action row alongside the Ticket Ledger Drawer trigger and Wallet HUD.
2. **State & Fetching (`useNotifications`)**:
   * Polls unread count every 30 seconds when tab is active (or revalidates on focus).
   * Fetches paginated inbox list upon opening drawer.
   * Optimistically decrements unread count when marking single or all notifications as read.
3. **Drawer / Popover (`NotificationDrawer.tsx`)**:
   * Radix UI Popover / Sheet styled with KNZiN tokens.
   * Direct deep-link navigation on click (`/dashboard/tickets`, `/arena`, `/courses/{slug}`).
   * Localized relative timestamps (`منذ ساعتين`, `2 hours ago`) via `Intl.RelativeTimeFormat`.
4. **Bidirectional Presentation**:
   * Native RTL layout when locale is `ar`.
   * Dynamic serial numbers, ticket counts, and order numbers wrapped in `<bdi>` elements to prevent digit inversion in Arabic viewports.

---

## 9. Security & Permissions

1. **IDOR Prevention**:
   * Endpoints `/api/v1/notifications/{id}/read` find notifications exclusively via `$request->user()->notifications()->findOrFail($id)`. Cross-user access returns `404 Not Found`.
2. **Admin Capability Verification**:
   * Admin broadcast endpoint is protected by:
     ```php
     Route::middleware(['auth:sanctum', 'admin.principal', 'admin.capability:manage_platform_settings'])
         ->post('/admin/notifications/broadcast', [AdminBroadcastController::class, 'store']);
     ```
3. **HTML Sanitization**:
   * Notification titles and bodies are strictly text-escaped before frontend rendering, preventing stored XSS injection.

---

## 10. Testing Strategy & Verification Matrix

### Backend Feature Tests (`tests/Feature/`)

1. **`NotificationCenterTest`**:
   * Assert user receives database notification on order completion.
   * Assert unread count increments.
   * Assert marking as read decrements count and sets `read_at`.
   * Assert mark-all-read clears all unread items.
   * Assert IDOR: User B cannot mark User A's notification as read (returns 404).
2. **`NotificationSchedulerTest`**:
   * Abandoned order: pending at 1h 50m -> No recovery email; pending at 2h 05m -> Recovery email sent, timestamp stamped; re-run -> 0 duplicate emails.
   * Draw alert: draw at 20m before `ends_at` -> No alert; draw at 14m before `ends_at` -> Alert sent to ticket holders; re-run -> 0 duplicate alerts.
   * Mission reminder: learner inactive for 2 days -> No reminder; learner inactive for 3 days -> Reminder sent, `last_reminded_at` stamped; learner inactive for 4 days (within 7d cooldown) -> 0 duplicate reminders.
   * Retention test: Read notifications > 60 days deleted; unread notifications > 60 days strictly preserved.
3. **`NotificationPreferenceTest`**:
   * Disabling `course_announcements` suppresses both in-app and email course announcements.
   * Transactional order receipt delivered despite all marketing disabled.
   * Signed unsubscribe link disables category without login.
4. **`AdminBroadcastTest`**:
   * Admin without `manage_platform_settings` receives 403 Forbidden.
   * Authorized admin queues platform-wide broadcast; recipients with `admin_broadcasts = false` are skipped.

### Frontend Component Tests (`frontend/src/components/notifications/`)

1. **`NotificationBell.test.tsx`**: Renders bell icon and badge with unread count; suppresses badge when count is 0.
2. **`NotificationDrawer.test.tsx`**: Renders notifications list in reverse chronological order; handles optimistic mark as read; renders `<bdi>` wrapper around order and ticket serials.

---

## 11. Scope Exclusions (Strictly Guarded)

* WhatsApp delivery (officially deferred per `DEC-007`).
* SMS or push notification gateways.
* Generic user-to-user messaging or chat.
* Derived affiliate commission alerts (candidate extensions).
* Modifying predecessor feature business logic (orders, ledger, payment drivers, ticket minting).
