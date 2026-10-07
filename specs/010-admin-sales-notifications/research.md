# Phase 0 Research: Feature 010 — Admin Course Sales Notifications & Dual-Persona Notification Center

**Date**: 2026-10-07  
**Feature**: `010-admin-sales-notifications`  
**Status**: Completed

---

## 1. Executive Summary

Feature 010 introduces real-time administrative commercial notifications when users purchase courses, alongside persona separation in the notification drawer/page between personal learner notifications and administrative alerts.

This research resolves all technical questions, verifies brownfield repository reality, evaluates query performance across PostgreSQL/MySQL, confirms error shielding boundaries, and locks the dual-persona frontend caching strategy.

---

## 2. Research Inquiries & Findings

### Research Item 1: Database Query Performance on Polymorphic JSON `data` Attribute

**Context**:  
The existing `notifications` table ([2026_10_05_000001_create_notifications_table.php](file:///d:/Work%20Projects/Knzin%20Project/backend/database/migrations/2026_10_05_000001_create_notifications_table.php)) stores notification metadata and categories inside a `data` JSON column:
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    notifiable_type VARCHAR(255) NOT NULL,
    notifiable_id UUID NOT NULL,
    data JSON NOT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX idx_notifications_notifiable ON notifications(notifiable_type, notifiable_id);
CREATE INDEX idx_notifications_unread ON notifications(notifiable_type, notifiable_id, read_at);
```

**Decision**:
* **Zero Migrations Required**: All queries to `$user->notifications()` or `$user->unreadNotifications()` are already filtered by `notifiable_type = 'users'` AND `notifiable_id = :userId` using the composite index `idx_notifications_notifiable`.
* Because each administrator has at most a few hundred active notifications (due to the 60-day read retention policy established in Feature 009), filtering by `data->category` in SQL (`whereJsonIn('data->category', ['admin_sales', 'admin_ops'])`) operates strictly in-memory on the indexed rows for that specific user.
* **Scope Filter Implementation**:
  - `scope === 'admin'`:
    ```php
    $query->whereIn('data->category', ['admin_sales', 'admin_ops']);
    ```
  - `scope === 'learner'`:
    ```php
    $query->whereNotIn('data->category', ['admin_sales', 'admin_ops']);
    ```
  - `scope === 'all'` (default):
    No category filter applied; returns all notifications for the user.

---

### Research Item 2: Failure Isolation & Asynchronous Transaction Boundary

**Context**:  
Project Constitution Section 12 (Financial Integrity) and Section 20 (Failure Isolation) mandate that order completion and financial fulfillment must NEVER fail or roll back due to a failure in notification dispatch, queue latency, or mail provider unavailability.

**Decision**:
* In [OrderService.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/OrderService.php#L170), the dispatch hook executes strictly inside `DB::afterCommit()`.
* The admin notification dispatch is wrapped in a dedicated `try...catch (\Throwable $e)` block:
  ```php
  DB::afterCommit(function () use ($lockedOrder) {
      // 1. Existing student notification
      try {
          if ($lockedOrder->user) {
              $notificationId = Uuid::uuid5(Uuid::NAMESPACE_OID, "order_confirmed:{$lockedOrder->id}:{$lockedOrder->user_id}")->toString();
              if (!DB::table('notifications')->where('id', $notificationId)->exists()) {
                  $lockedOrder->user->notify(new OrderConfirmationNotification($lockedOrder));
              }
          }
      } catch (\Throwable $e) {
          Log::error("Student order notification failed for order {$lockedOrder->id}: " . $e->getMessage(), ['exception' => $e]);
      }

      // 2. New Feature 010 Admin notification
      try {
          $eligibleAdmins = User::query()
              ->where('status', 'active')
              ->whereHas('adminCapabilities', function ($q) {
                  $q->whereIn('capability', [
                      AdminCapabilities::MANAGE_PLATFORM_SETTINGS,
                      AdminCapabilities::SETTLE_AFFILIATE_PAYOUT,
                  ])->where('status', 'active');
              })
              ->get();

          foreach ($eligibleAdmins as $admin) {
              $adminNotificationId = Uuid::uuid5(Uuid::NAMESPACE_OID, "course_purchased:{$lockedOrder->id}:{$admin->id}")->toString();
              if (!DB::table('notifications')->where('id', $adminNotificationId)->exists()) {
                  $admin->notify(new CoursePurchasedAdminNotification($lockedOrder, $admin));
              }
          }
      } catch (\Throwable $e) {
          Log::error("Admin course sales notification failed for order {$lockedOrder->id}: " . $e->getMessage(), ['exception' => $e]);
      }
  });
  ```
* `CoursePurchasedAdminNotification` implements `ShouldQueue` with queue connection `redis` (or `sync` in testing).

---

### Research Item 3: Dual-Persona State Isolation & TanStack Query Keys

**Context**:  
Administrators who are also learners need seamless tab switching without data cross-contamination or sluggish page reloads.

**Decision**:
* **Query Key Strategy**:
  - Global HUD Bell Unread Count: `['notifications', 'unread-count']`
  - Learner Notifications List: `['notifications', 'learner', page, perPage, filter]`
  - Admin Notifications List: `['notifications', 'admin', page, perPage, filter]`
* **Optimistic Scoped Read Updates**:
  When marking an item or all items as read in the "Admin & Sales" tab:
  - Decrement `admin_unread_count` in cache.
  - Decrement `unread_count` in cache.
  - Leave `learner_unread_count` unchanged.
  - Invalidate `['notifications']` query family.

---

### Research Item 4: Backward Compatibility & Working Tree Safety

**Context**:  
The working tree currently contains 3 modified files and 1 untracked test for the guest tickets sign-in UX fix (`TicketLedgerDrawer.tsx`, `TicketsPageView.tsx`, `useLearnerTickets.ts`). The user explicitly ordered: *"start this fix but don't commit"*.

**Decision**:
* **Preserve Working Tree**: None of the changes in Feature 010 touch `useLearnerTickets.ts` or `TicketLedgerDrawer.tsx`.
* Feature 010 exclusively modifies `useNotifications.ts`, `NotificationDrawer.tsx`, `NotificationItem.tsx`, `HeaderHUD.tsx`, and `/notifications/page.tsx`.
* Existing non-admin learner workflows remain 100% untouched; if `isAdmin === false`, the dual-tab control is not rendered, and the UI behaves exactly as in Feature 009.
