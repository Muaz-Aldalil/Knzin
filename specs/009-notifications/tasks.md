# Tasks: Feature 009 — Notifications (الإشعارات)

**Branch**: `009-notifications` | **Date**: 2026-10-04 | **Spec**: [spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/009-notifications/spec.md) | **Plan**: [plan.md](file:///d:/Work%20Projects/Knzin%20Project/specs/009-notifications/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration, types, and base directories for the notification subsystem.

- [X] T001 [P] Create backend directory structure for notifications: `backend/app/Notifications`, `backend/app/Mail`, and `backend/app/Models`
- [X] T002 [P] Create frontend notification types matching OpenAPI schema in `frontend/src/types/notification.ts`
- [X] T003 [P] Configure mail and queue testing environment variables in `backend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema, base models, preferences, and tracking tables that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create database migration for standard Laravel notifications table with UUID support in `backend/database/migrations/2026_10_05_000001_create_notifications_table.php`
- [X] T005 [P] Create database migration for user notification preferences in `backend/database/migrations/2026_10_05_000002_create_notification_preferences_table.php`
- [X] T006 [P] Create database migration for platform-wide admin broadcasts ledger in `backend/database/migrations/2026_10_05_000003_create_admin_broadcasts_table.php`
- [X] T007 [P] Create database migration for dedicated course mission reminder tracking in `backend/database/migrations/2026_10_05_000004_create_course_mission_reminders_table.php`
- [X] T008 [P] Create database migration to add atomic `recovery_notification_sent_at` column to `orders` and monotonic `content_version` column to `courses` in `backend/database/migrations/2026_10_05_000005_add_notification_support_columns.php`
- [X] T009 [P] Create `NotificationPreference` Eloquent model with user relation and category casts in `backend/app/Models/NotificationPreference.php`
- [X] T010 [P] Create `AdminBroadcast` Eloquent model with admin user relation in `backend/app/Models/AdminBroadcast.php`
- [X] T011 [P] Create `CourseMissionReminder` Eloquent model with user and course relations in `backend/app/Models/CourseMissionReminder.php`
- [X] T012 Run migrations and verify schema topology in `backend/database/migrations`

**Checkpoint**: Foundation ready — database schema, models, and migrations verified. User story implementation can now begin.

---

## Phase 3: User Story 1 — Order Confirmation & Ticket Issuance (Priority: P1) 🎯 MVP

**Goal**: Deliver instant order confirmation receipts and asynchronous promotional ticket issuance notifications via In-App and Email.

**Independent Test**: Complete an order checkout; verify Order Confirmation email and database notification are queued; execute `GenerateTicketsJob` and verify Ticket Issuance notification is queued with minted serial numbers.

### Implementation for User Story 1

- [X] T013 [P] [US1] Create `OrderConfirmationNotification` class implementing `ShouldQueue` with localized Arabic/English templates in `backend/app/Notifications/OrderConfirmationNotification.php`
- [X] T014 [P] [US1] Create `TicketIssuanceNotification` class implementing `ShouldQueue` with ticket serial list and localized templates in `backend/app/Notifications/TicketIssuanceNotification.php`
- [X] T015 [US1] Integrate `OrderConfirmationNotification` dispatch inside `OrderService::fulfillOrder` using `DB::afterCommit(...)` in `backend/app/Services/OrderService.php`
- [X] T016 [US1] Integrate `TicketIssuanceNotification` dispatch inside `GenerateTicketsJob::handle` strictly after ticket minting commitment in `backend/app/Jobs/GenerateTicketsJob.php`
- [X] T017 [US1] Add feature tests verifying order receipt and ticket issuance notifications in `backend/tests/Feature/OrderNotificationTest.php`

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 — In-App Notification Center & Read State (Priority: P1) 🎯 MVP

**Goal**: Provide an authenticated header HUD notification bell, real-time unread badge, interactive popover/drawer, mark-as-read mutations, and paginated inbox.

**Independent Test**: Load the application as an authenticated user; observe the bell icon and unread badge count; open the drawer, view notifications, mark an item as read, and verify the badge count decrements immediately.

### Implementation for User Story 2

- [X] T018 [P] [US2] Implement `NotificationController` with `index` (paginated), `unreadCount`, `markAsRead`, and `markAllRead` endpoints in `backend/app/Http/Controllers/NotificationController.php`
- [X] T019 [US2] Register notification API routes under `auth:sanctum` in `backend/routes/api.php`
- [X] T020 [P] [US2] Create `useNotifications` React hook managing SWR fetching, unread polling, and optimistic mark-as-read mutations in `frontend/src/hooks/useNotifications.ts`
- [X] T021 [P] [US2] Create `NotificationItem` component with read/unread styling, localized timestamps, and `<bdi>` semantic isolation in `frontend/src/components/notifications/NotificationItem.tsx`
- [X] T022 [P] [US2] Create `NotificationDrawer` component with reverse chronological feed and "Mark all as read" button in `frontend/src/components/notifications/NotificationDrawer.tsx`
- [X] T023 [US2] Create `NotificationBell` trigger component with dynamic unread badge in `frontend/src/components/notifications/NotificationBell.tsx`
- [X] T024 [US2] Mount `NotificationBell` in authenticated action row of `HeaderHUD.tsx` in `frontend/src/components/layout/HeaderHUD.tsx`
- [X] T025 [P] [US2] Add backend feature tests for notification center endpoints and IDOR protection in `backend/tests/Feature/NotificationCenterTest.php`
- [X] T026 [P] [US2] Add frontend component tests for `NotificationBell` and `NotificationDrawer` in `frontend/src/tests/NotificationCenter.test.ts`

**Checkpoint**: User Stories 1 and 2 deliver the complete core in-app notification MVP.

---

## Phase 5: User Story 3 — Abandoned Pending Order Recovery (Priority: P2)

**Goal**: Recover stalled checkouts by dispatching exactly one recovery email to customers whose pending orders have remained unpaid for at least 2 hours.

**Independent Test**: Create a pending order with `created_at` 2 hours in the past; run `php artisan notifications:evaluate-abandoned-orders`; verify recovery email is sent with payment link and `recovery_notification_sent_at` is stamped; rerun command and assert 0 duplicate emails.

### Implementation for User Story 3

- [X] T027 [P] [US3] Create `AbandonedOrderRecoveryNotification` email mailable with direct payment completion link in `backend/app/Notifications/AbandonedOrderRecoveryNotification.php`
- [X] T028 [US3] Create `EvaluateAbandonedOrdersCommand` artisan command with atomic update on `orders.recovery_notification_sent_at` in `backend/app/Console/Commands/EvaluateAbandonedOrdersCommand.php`
- [X] T029 [US3] Register `notifications:evaluate-abandoned-orders` in `backend/routes/console.php` with `everyTenMinutes()->withoutOverlapping(10)`
- [X] T030 [P] [US3] Add feature test for abandoned order recovery 2h eligibility and duplicate suppression in `backend/tests/Feature/AbandonedOrderRecoveryTest.php`

**Checkpoint**: User Story 3 fully functional and testable independently.

---

## Phase 6: User Story 4 — Live Draw 15m Alerts & Winner KYC Notifications (Priority: P2)

**Goal**: Dispatch 15-minute live draw alerts to eligible participants and immediate winner notifications with informational KYC claim instructions.

**Independent Test**: Create an active published draw ending in 14 minutes; run `php artisan notifications:evaluate-draw-alerts`; verify alert sent to ticket holders. Commit a `DrawWinner` record; verify winner receives high-priority notification detailing identity verification instructions.

### Implementation for User Story 4

- [X] T031 [P] [US4] Create `LiveDrawAlertNotification` class with broadcast stream link and deterministic UUIDv5 idempotency in `backend/app/Notifications/LiveDrawAlertNotification.php`
- [X] T032 [P] [US4] Create `WinnerKycNotification` class with informational identity verification instructions in `backend/app/Notifications/WinnerKycNotification.php`
- [X] T033 [US4] Create `EvaluateDrawAlertsCommand` artisan command querying draws ending within `[now(), now() + 15m]` in `backend/app/Console/Commands/EvaluateDrawAlertsCommand.php`
- [X] T034 [US4] Register `notifications:evaluate-draw-alerts` in `backend/routes/console.php` with `everyFiveMinutes()->withoutOverlapping(5)`
- [X] T035 [US4] Hook `WinnerKycNotification` dispatch to draw winner resolution in `backend/app/Services/Admin/DrawLifecycleService.php`
- [X] T036 [P] [US4] Add feature tests for 15m draw alert evaluation and winner KYC notification dispatch in `backend/tests/Feature/DrawNotificationTest.php`

**Checkpoint**: User Story 4 fully functional and testable independently.

---

## Phase 7: User Story 5 — Course & Catalog Lifecycle Alerts & Mission Reminders (Priority: P3)

**Goal**: Notify users of new vocational courses and prizes, and re-engage inactive learners after 3 full days of inactivity with a minimum 7-day cooldown.

**Independent Test**: Transition a course to active status; verify announcement is queued for users opted in to course announcements. Simulate learner inactivity of 3 days on unfinished lesson parts; run evaluator command; verify mission reminder is sent and `course_mission_reminders.last_reminded_at` is stamped.

### Implementation for User Story 5

- [X] T037 [P] [US5] Create `NewCourseNotification` class with marketing preference check (`course_announcements`) in `backend/app/Notifications/NewCourseNotification.php`
- [X] T038 [P] [US5] Create `NewPrizeNotification` class with marketing preference check (`prize_draw_promotions`) in `backend/app/Notifications/NewPrizeNotification.php`
- [X] T039 [P] [US5] Create `MissionReminderNotification` class with resume lesson link in `backend/app/Notifications/MissionReminderNotification.php`
- [X] T040 [US5] Create `EvaluateMissionRemindersCommand` artisan command evaluating 3-day inactivity and 7-day cooldown in `backend/app/Console/Commands/EvaluateMissionRemindersCommand.php`
- [X] T041 [US5] Register `notifications:evaluate-mission-reminders` in `backend/routes/console.php` with `hourly()->withoutOverlapping(30)`
- [X] T042 [US5] Hook `NewCourseNotification` to course activation in `backend/app/Services/Admin/AdminCourseService.php`
- [X] T043 [US5] Hook `NewPrizeNotification` to parent draw publication in `backend/app/Services/Admin/DrawLifecycleService.php`
- [X] T044 [P] [US5] Add feature tests for course publication, prize announcement, and 3-day mission reminder cooldown in `backend/tests/Feature/CatalogLifecycleNotificationTest.php`

**Checkpoint**: User Story 5 fully functional and testable independently.

---

## Phase 8: User Story 6 — Administrative Broadcast & Marketing Unsubscribe (Priority: P3)

**Goal**: Enable authorized administrators (`manage_platform_settings`) to dispatch platform-wide announcements via In-App and Email, with user preference toggles and one-click signed unsubscribe.

**Independent Test**: Dispatch an admin broadcast from an authorized session; verify users with `admin_broadcasts = true` receive it. Click the signed email unsubscribe link; verify the category is disabled without requiring login.

### Implementation for User Story 6

- [X] T045 [P] [US6] Create `AdminBroadcastNotification` class implementing `ShouldQueue` with signed unsubscribe link in `backend/app/Notifications/AdminBroadcastNotification.php`
- [X] T046 [P] [US6] Create `NotificationPreferenceController` with `show`, `update`, and `unsubscribe` (signed route) endpoints in `backend/app/Http/Controllers/NotificationPreferenceController.php`
- [X] T047 [P] [US6] Create `AdminBroadcastController` with `store` endpoint protected by `admin.capability:manage_platform_settings` in `backend/app/Http/Controllers/Admin/AdminBroadcastController.php`
- [X] T048 [US6] Register preference routes and admin broadcast route in `backend/routes/api.php`
- [X] T049 [P] [US6] Create `NotificationPreferencesModal` frontend component with category toggles in `frontend/src/components/notifications/NotificationPreferencesModal.tsx`
- [X] T050 [P] [US6] Add feature tests for admin broadcast authorization, preference enforcement, and signed unsubscribe in `backend/tests/Feature/AdminBroadcastAndPreferencesTest.php`

**Checkpoint**: User Story 6 fully functional and testable independently.

---

## Phase 9: User Story 7 — Admin Course Content Update & In-App Refresh (Priority: P2)

**Goal**: When an admin dashboard audit/update produces a verified learner-facing course change, dispatch an in-app notification to actively entitled learners with an interactive "Refresh" action that updates course data without a full page reload or session disruption.

**Independent Test**: Update course syllabus/video in `AdminCourseService`; assert enrolled users receive `CourseContentUpdatedNotification` with `action_type = 'refresh_course'`; resave identical content and assert 0 duplicate notifications; click Refresh button in frontend and verify TanStack Query refetches without browser reload.

### Implementation for User Story 7

- [X] T051 [P] [US7] Create `CourseContentUpdatedNotification` class implementing `ShouldQueue` with localized titles, bodies, `action_type = 'refresh_course'`, and course metadata in `backend/app/Notifications/CourseContentUpdatedNotification.php`
- [X] T052 [US7] Implement learner-facing mutation detection using Eloquent `wasChanged()`, atomic `content_version` increment, and `notifyEntitledLearners` in `AdminCourseService` with `DB::afterCommit(...)` and monotonic `v{$version}` UUIDv5 identity in `backend/app/Services/Admin/AdminCourseService.php`
- [X] T053 [P] [US7] Add interactive "Refresh" action button with `RefreshCw` icon and TanStack Query cache invalidation (`queryClient.invalidateQueries`) to `NotificationItem.tsx` in `frontend/src/components/notifications/NotificationItem.tsx`
- [X] T054 [P] [US7] Add feature tests verifying learner-facing change detection, entitlement filtering, non-entitled user exclusion, and duplicate suppression on identical saves in `backend/tests/Feature/AdminCourseContentNotificationTest.php`
- [X] T055 [P] [US7] Add frontend component tests verifying "Refresh" action executes query invalidation and optimistic mark-as-read without full browser reload in `frontend/src/components/notifications/NotificationItemRefresh.test.tsx`

**Checkpoint**: User Story 7 fully functional and testable independently.

---

## Phase 10: Polish, Retention & Cross-Cutting Verification

**Purpose**: Automated retention cleanup, end-to-end regression testing, and localization validation.

- [X] T056 Create `PruneReadNotificationsCommand` artisan command pruning read notifications older than 60 days in `backend/app/Console/Commands/PruneReadNotificationsCommand.php`
- [X] T057 Register `notifications:prune-read` in `backend/routes/console.php` with `dailyAt('03:00')->withoutOverlapping(60)`
- [X] T058 [P] Add feature test verifying read notifications > 60 days are pruned while unread notifications are retained indefinitely in `backend/tests/Feature/NotificationRetentionTest.php`
- [X] T059 [P] Validate Arabic RTL and English LTR rendering and `<bdi>` isolation across notification components in `frontend/src/components/notifications`
- [X] T060 Run full backend test suite (`php artisan test --filter=Notification`) and frontend tests to confirm zero regressions

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**.
- **User Stories (Phases 3–9)**: Depend on Foundational (Phase 2) completion:
  - US1 (Order & Tickets) and US2 (In-App Center) constitute the **Core MVP**.
  - US3 (Abandoned Orders), US4 (Draw Alerts & Winner KYC), and US7 (Admin Course Update) follow as Priority P2.
  - US5 (Catalog & Mission) and US6 (Broadcast & Preferences) follow as Priority P3.
- **Polish (Phase 10)**: Runs after desired user stories are complete.

### Parallel Opportunities
- All migration tasks (T004–T008) and model tasks (T009–T011) marked `[P]` can run in parallel.
- Frontend components (T020–T023, T053) can be built in parallel with backend endpoints.
- Evaluator commands (T028, T033, T040) and course update notification service (T051, T052) are independent and testable in isolation.
