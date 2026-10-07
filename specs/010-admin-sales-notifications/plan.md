# Implementation Plan: Feature 010 — Admin Course Sales Notifications & Dual-Persona Notification Center

**Branch**: `010-admin-sales-notifications` | **Date**: 2026-10-07 | **Spec**: [specs/010-admin-sales-notifications/spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/010-admin-sales-notifications/spec.md)

**Input**: Feature specification from `specs/010-admin-sales-notifications/spec.md` and user directives.

---

## Summary

Feature 010 establishes an administrative commercial notification stream and dual-persona notification hub:
1. **Admin Sales Notifications**: Real-time server-dispatched alerts triggered when a customer or guest successfully completes a course purchase order, delivered via In-App Database Notifications and Transactional Email to active administrators holding `manage_platform_settings` or `settle_affiliate_payout` capabilities.
2. **Dual-Persona Notification Center**: Persona separation in `NotificationDrawer` and `/notifications` page separating personal learner notifications from administrative sales alerts for users with `isAdmin === true`.
3. **Dedicated Admin Categories & Scopes**: Introducing `admin_sales` and `admin_ops` notification categories, with isolated query filtering (`?scope=learner|admin`), scoped unread count breakdowns, and secure authorization gates (HTTP 403 for unauthorized non-admins).

---

## Technical Context

**Language/Version**:
- Backend: PHP 8.3 / Laravel 11.28+
- Frontend: TypeScript 5.6 / Next.js 16 (React 19)

**Primary Dependencies**:
- Backend: Laravel Sanctum, Laravel Notifications, Redis Queue
- Frontend: TanStack React Query v5, `next-intl`, Lucide React, TailwindCSS v4

**Storage**:
- PostgreSQL 16 (Aiven) / MySQL 8+
- Zero schema migrations needed (utilizes brownfield polymorphic `notifications` table `data` JSON column)

**Testing**:
- Backend: Pest 3 (Feature tests, Security authorization assertions)
- Frontend: Vitest + React Testing Library (Component rendering, dual-tab state isolation)

**Target Platform**:
- Backend API: Linux Server (Render)
- Frontend Web App: Edge / Netlify

**Project Type**: Full-Stack Monorepo Web Application (`backend/` + `frontend/`)

**Performance Goals**:
- Real-time notification creation <2s from transaction commit.
- Tab switching in `NotificationDrawer` and `/notifications` page <100ms with zero full-page reloads.
- Unread count polling every 60s in background with instant optimistic updates on read actions.

**Constraints**:
- **Frozen Financial Boundary**: Notification failures must never roll back order fulfillment.
- **Security Invariant**: Strictly gate `scope=admin` queries with `$user->isAdmin()`, returning 403 on violation.
- **Anti-Notification Fatigue**: Do not spam the admin inbox with routine self-actions (which rely on `FeedbackDialog` and `AdminActivityLog`).
- **Working Tree Preservation**: Preserve uncommitted guest tickets UX fixes (`useLearnerTickets.ts`, `TicketLedgerDrawer.tsx`, `TicketsPageView.tsx`).

---

## Constitution Check

*GATE: All principles verified against `.specify/memory/constitution.md` and `AGENTS.md`.*

| Principle / Rule | Evaluation | Evidence & Compliance Strategy |
| :--- | :--- | :--- |
| **I. Evidence-First & Brownfield** | **PASS** | Builds directly on existing polymorphic `notifications` table, `OrderService::fulfillOrder`, `admin_capabilities`, and `FeedbackDialog`. Zero new tables or redundant migrations. |
| **II. Full-Stack Ownership** | **PASS** | Fully designs backend notification class, order fulfillment hooks, API controller scoping, authorization gates, frontend types, API client, React Query hooks, and UI drawer/page components. |
| **III. Frozen Financial Boundary** | **PASS** | Dispatches strictly inside `DB::afterCommit()` wrapped in `try...catch (\Throwable $e)`. Notification failures cannot break financial fulfillment. |
| **IV. Security & Least Privilege** | **PASS** | Queries only admins with `manage_platform_settings` or `settle_affiliate_payout`. Rejects non-admin access to `scope=admin` with HTTP 403. |
| **V. Anti-Notification Fatigue** | **PASS** | Self-actions in admin panel use instant `FeedbackDialog` modals and `AdminActivityLog` without creating self-spam records in the inbox. |
| **VI. RTL & Bilingual Integrity** | **PASS** | All notification titles, bodies, and amounts use `<bdi>` wrappers and CSS logical properties with dual `ar`/`en` strings. |

---

## Project Structure

### Documentation (this feature)
```text
specs/010-admin-sales-notifications/
├── spec.md              # Feature specification & user stories
├── plan.md              # Implementation plan (this document)
├── research.md          # Phase 0 technical research & performance analysis
├── data-model.md        # Phase 1 data dictionary, schemas & state transitions
├── contracts/           # Phase 1 OpenAPI contracts
│   └── notifications.openapi.yml
├── quickstart.md        # Phase 1 verification steps & test fixtures
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 task breakdown (created by /speckit-tasks)
```

### Source Code Paths Affected

```text
backend/
├── app/
│   ├── Notifications/
│   │   └── CoursePurchasedAdminNotification.php      # [NEW] Queued database + mail notification
│   ├── Services/
│   │   └── OrderService.php                          # [EDIT] Post-commit hook to dispatch admin alerts
│   └── Http/
│       └── Controllers/
│           └── NotificationController.php            # [EDIT] Add scope filtering, security gate, and breakdown counts
└── tests/
    └── Feature/
        └── Notifications/
            └── AdminSalesNotificationTest.php        # [NEW] Comprehensive Pest test suite

frontend/
├── src/
│   ├── types/
│   │   └── notification.ts                           # [EDIT] Add admin_sales, admin_ops categories & scoped unread types
│   ├── lib/
│   │   └── api/
│   │       └── notifications.ts                      # [EDIT] Add scope parameter to fetch & mark-all-read
│   ├── hooks/
│   │   └── useNotifications.ts                       # [EDIT] Support scoped queries & isolated optimistic updates
│   ├── components/
│   │   ├── layout/
│   │   │   └── HeaderHUD.tsx                         # [EDIT] Ensure total count feeds NotificationBell
│   │   └── notifications/
│   │       ├── NotificationDrawer.tsx                # [EDIT] Render dual-persona segmented tabs if isAdmin
│   │       └── NotificationItem.tsx                  # [EDIT] Add admin_sales styling, badge, and order deep-link
│   └── app/
│       └── [locale]/
│           └── notifications/
│               └── page.tsx                          # [EDIT] Render dual-persona segmented tabs if isAdmin
└── src/
    └── tests/
        └── NotificationDualPersonaInvariants.test.tsx # [NEW] Vitest component verification suite
```

---

## Implementation Phases

### Phase 0: Research & Investigation (Completed)
- Documented in [`specs/010-admin-sales-notifications/research.md`](file:///d:/Work%20Projects/Knzin%20Project/specs/010-admin-sales-notifications/research.md).
- Verified JSON column query performance, post-commit failure isolation, and working tree safety.

### Phase 1: Design & Contracts (Completed)
- Data model established in [`specs/010-admin-sales-notifications/data-model.md`](file:///d:/Work%20Projects/Knzin%20Project/specs/010-admin-sales-notifications/data-model.md).
- Extended OpenAPI contract in [`specs/010-admin-sales-notifications/contracts/notifications.openapi.yml`](file:///d:/Work%20Projects/Knzin%20Project/specs/010-admin-sales-notifications/contracts/notifications.openapi.yml).
- Quickstart verification guide in [`specs/010-admin-sales-notifications/quickstart.md`](file:///d:/Work%20Projects/Knzin%20Project/specs/010-admin-sales-notifications/quickstart.md).

### Phase 2: Backend Notification & Order Fulfillment Hook
- Implement `CoursePurchasedAdminNotification.php` implementing `ShouldQueue` with `['database', 'mail']`.
- Implement mail template with localized Arabic and English greetings, course title, order number, amount, and direct link.
- In `OrderService.php::fulfillOrder`, add the post-commit admin query and dispatch wrapped in a resilient `try...catch (\Throwable $e)` block.

### Phase 3: Backend Controller Scoping & Security Gates
- Update `NotificationController::index`:
  - Read `?scope=all|learner|admin`.
  - Enforce `$request->user()->isAdmin()` when `scope=admin`; return 403 on violation.
  - Filter `whereIn('data->category', ['admin_sales', 'admin_ops'])` for admin scope.
  - Filter `whereNotIn('data->category', ['admin_sales', 'admin_ops'])` for learner scope.
- Update `NotificationController::unreadCount`:
  - Calculate `total_unread`, `learner_unread`, and `admin_unread`.
- Update `NotificationController::markAllAsRead`:
  - Support `?scope=admin|learner` to clear only unread notifications within that scope.

### Phase 4: Frontend Types, Hooks & Dual-Persona UI
- Update `frontend/src/types/notification.ts` with `'admin_sales'` and `'admin_ops'`.
- Update `frontend/src/lib/api/notifications.ts` to pass `scope`.
- Update `frontend/src/hooks/useNotifications.ts` to accept `scope: 'all' | 'learner' | 'admin'` with independent cache keys.
- Update `NotificationDrawer.tsx` and `/notifications/page.tsx`:
  - Conditionally render segmented tabs `[🎓 نشاطي كمتعلم]` and `[⚡ الإدارة والمبيعات]` when `isAdmin === true`.
  - Pass `scope` to `useNotifications` based on the active tab.
  - Display scoped unread count badges on each tab.
- Update `NotificationItem.tsx`:
  - Map `'admin_sales'` to an emerald commercial badge, `TrendingUp` icon, and navigate handler to `/orders/{id}`.

### Phase 5: Verification & Automated Test Suites
- Create and execute `backend/tests/Feature/Notifications/AdminSalesNotificationTest.php`.
- Create and execute `frontend/src/tests/NotificationDualPersonaInvariants.test.tsx`.
- Perform manual end-to-end checkout and verify admin notification arrival and drawer tab switching.
