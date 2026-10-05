# Phase 0 Research & Technical Decision Record: Feature 009 — Notifications (الإشعارات)

**Feature**: [spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/009-notifications/spec.md)  
**Date**: 2026-10-04  
**Branch**: `009-notifications`  
**Status**: APPROVED

---

## 1. Executive Summary & Problem Formulation

Feature 009 establishes the full-stack notification subsystem for KNZiN across two approved delivery channels:
1. **In-App Notification Center**: A persistent header bell HUD, real-time unread badge, interactive dropdown/drawer, read/unread state mutation, and paginated user inbox in Next.js.
2. **Asynchronous Email Notification Engine**: High-reliability transactional receipts and time-sensitive alerts, plus consent-compliant marketing broadcasts with one-click unsubscribe via Laravel Mail.

Per approved product decision **[DEC-007](file:///d:/Work%20Projects/Knzin%20Project/DECISIONS.md)**, WhatsApp delivery is **deferred** and strictly out of scope. Notifications are strictly **downstream observers** of authoritative business state and must never mutate or jeopardize financial, ticket, or draw truth.

---

## 2. Brownfield Repository Reality & Precedent Analysis

| Dimension | Existing Repository Precedent | Feature 009 Architectural Consequence |
| :--- | :--- | :--- |
| **User Identity** | `App\Models\User` uses `HasUuids` and already includes `Illuminate\Notifications\Notifiable`. Primary key is `CHAR(36)` UUID. | Native Laravel `notify()` and `DatabaseNotification` can be used directly without custom notification traits. Guest orders create a `User` (`auth_provider = 'guest'`). |
| **Order Fulfillment** | `OrderService::fulfillOrder` is the single authoritative convergence point called by `PaymentWebhookController` and `ReconcilePaymentsCommand`. | Transaction-originated order confirmation dispatches strictly within `OrderService::fulfillOrder` via `DB::afterCommit(...)`. |
| **Notification Persistence** | No `notifications` table exists in `backend/database/migrations`. | Standard Laravel database notification schema must be generated with UUID support (`CHAR(36)` for `notifiable_id`), indexed on `(notifiable_type, notifiable_id, read_at)`. |
| **Mail Infrastructure** | `config/mail.php` configured with `default => env('MAIL_MAILER', 'log')`. | All emails implemented as queued `Mailable` or `Notification` classes via standard Laravel mail system. Safe for local testing (`log`) and production SMTP. |
| **Queue & Worker Architecture** | `config/queue.php` defaults to `database` with `redis` supported in production. `GenerateTicketsJob` provides precedent for retries (`tries = 3`, `backoff = [5, 15, 30]`). | All notification emails and database insertions use queued execution (`ShouldQueue`). Transaction-originated jobs queue after commit; scheduled evaluators process already-committed rows. |
| **Scheduler Pattern** | `backend/routes/console.php` registers scheduled commands with frequencies (`hourly`, `everyFiveMinutes`) and concurrency locks (`withoutOverlapping(10)`). | Evaluators for abandoned orders (every 10m), 15m draw alerts (every 5m), mission reminders (hourly), and 60-day read pruning (daily) follow this exact pattern. |
| **Admin Authorization** | Admin operations use Sanctum + `admin.principal` + `admin.capability:manage_platform_settings`. | Admin broadcast endpoint protected under existing `admin.capability:manage_platform_settings` middleware. Platform-wide broadcast with no speculative audience segmentation. |
| **Frontend Shell** | `HeaderHUD.tsx` manages HUD action buttons (Ticket Ledger Drawer, Wallet, Search) using `useAuth()`, `next-intl` (Arabic RTL default, English LTR), and Tailwind CSS. | In-App notification bell and badge mount directly in `HeaderHUD.tsx` alongside Ticket/Wallet HUD, reusing existing design tokens. |
| **API Client & Envelope** | `api-client.ts` enforces JSend format (`{ status: 'success', data: ... }`), Bearer auth token from `localStorage`, and structured error handling. | All notification endpoints adhere strictly to the established JSend schema. |

---

## 3. Concrete Architectural Choices & Decision Matrix

### Decision 1: Notification Delivery & Persistence Architecture
* **Chosen Approach**: Standard Laravel Database Notifications (`notifications` table with UUIDs) + queued `Mailable` classes.
* **Why it is sufficient**:
  * `App\Models\User` already incorporates `Notifiable`.
  * Standard `notifications` table provides UUID primary keys, polymorphic recipient linking (`notifiable_type`, `notifiable_id`), structured JSON `data` payloads, and built-in `read_at` timestamps.
  * Eliminates redundant bespoke schema while providing 100% testable Eloquent queries.

### Decision 2: Asynchronous & Transaction Boundaries
* **Core Invariant**: A notification failure must NEVER roll back an order, ticket grant, or financial transition. Conversely, an uncommitted/rolled-back transaction must NEVER generate a notification.
* **Mechanism**:
  * **Transaction-Originated**: Handed to the queue strictly after the underlying database transaction commits (`DB::afterCommit(...)` or queued notifications with `public bool $afterCommit = true;`).
  * **Scheduled Evaluators**: Query already-committed historical records; do not wrap batch processing in giant transactions.

### Decision 3: Concrete Data-Level Idempotency Strategy
* **Chosen Mechanism**:
  1. **Deterministic Primary Keys (UUIDv5)** for discrete notifications (`Str::uuid5(Str::NAMESPACE_OID, "{$prefix}:{$entity_id}:{$user_id}")`). Re-attempts trigger a Primary Key Unique Constraint violation at the database level, guaranteeing zero duplicates.
  2. **Atomic Timestamp Updates** for scheduled sweeps:
     * Abandoned orders: `orders.recovery_notification_sent_at` updated atomically via `whereNull('recovery_notification_sent_at')->update(...)`.
     * Course mission reminders: dedicated `course_mission_reminders` table (`UNIQUE(user_id, course_id)`) updated atomically via `updateOrCreate`.

### Decision 4: Marketing Preferences & Unsubscribe Model
* **Approved Categories**:
  1. `course_announcements` (Default: `true`)
  2. `prize_draw_promotions` (Default: `true`)
  3. `admin_broadcasts` (Default: `true`)
* **Scope**: Disabling a category suppresses **both In-App and Email** communications for that category.
* **Transactional Guarantee**: Transactional notifications are mandatory and non-toggleable.
* **Unsubscribe**: Cryptographically signed HMAC URL (`URL::signedRoute(...)`) allows one-click opt-out without login.

### Decision 5: Retention & Cleanup Policy
* **Approved Rule**:
  * **Read In-App Notifications**: Automatically pruned after **60 days** from `read_at`.
  * **Unread In-App Notifications**: Retained **indefinitely** (no auto-expiration, no pruning).
* **Execution**: Scheduled daily console command `notifications:prune-read` running `DELETE FROM notifications WHERE read_at IS NOT NULL AND read_at <= NOW() - INTERVAL 60 DAY`.

---

## 4. Summary of Planned Artifacts

1. `specs/009-notifications/research.md`: This document.
2. `specs/009-notifications/data-model.md`: Detailed schema definitions for `notifications`, `notification_preferences`, `admin_broadcasts`, `course_mission_reminders`, and `orders.recovery_notification_sent_at`.
3. `specs/009-notifications/contracts/notifications.openapi.yml`: Complete OpenAPI 3.0 contract.
4. `specs/009-notifications/quickstart.md`: Developer testing and verification guide.
5. `specs/009-notifications/plan.md`: Comprehensive full-stack execution plan.
