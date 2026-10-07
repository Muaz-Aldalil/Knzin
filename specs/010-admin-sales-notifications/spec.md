# Feature Specification: Feature 010 — Admin Course Sales Notifications & Dual-Persona Notification Center

**Feature Branch**: `010-admin-sales-notifications`  
**Created**: 2026-10-07  
**Status**: Clarified (Ready for Planning)  
**Input**: User description: "grant the admin to get notified when users buy courses, and notify him with the things he did in the admin panel by how about this we will make a new section inside the admin notifications: users noti / admin noti."

**Contract & Governance Baseline**:
* **Governing Decision [AGENTS.md Section 11 & 13](file:///d:/Work%20Projects/Knzin%20Project/AGENTS.md)**: Server-Authoritative notification state. Commercial notifications are strictly downstream observers of authoritative database transactions (`OrderService::fulfillOrder`). Notifications must never alter, recalculate, or reverse financial truth.
* **Failure Isolation Invariant (AGENTS.md Section 20)**: Notification generation, dispatch, or delivery failures must never roll back or disrupt an authoritative order or payment transaction.
* **Anti-Notification Fatigue Guard**: Routine self-actions taken by the viewing administrator rely on instant interactive UI feedback (`FeedbackDialog`) and immutable audit logs (`AdminActivityLog`). The notification inbox is strictly reserved for high-value business events and cross-admin alerts.

---

## Clarifications

### Session 2026-10-07
- **Q1 (Recipient Eligibility)**: Which administrators should receive notification alerts when a customer completes a course purchase?  
  → **A**: All active administrators holding financial or platform management capabilities (`manage_platform_settings` or `settle_affiliate_payout`). Low-privilege single-purpose roles (e.g. draw audit viewers) do not receive commercial transaction data.
- **Q2 (Anti-Fatigue Policy)**: Should routine self-actions performed by an administrator generate persistent notification records in their own admin notification inbox?  
  → **A**: No self-spam. The admin notification inbox is reserved for external business events (sales, payout requests) and alerts from *other* admins. Self-actions rely strictly on the instant `FeedbackDialog` modal and immutable `AdminActivityLog`.
- **Q3 (Delivery Channels)**: Which delivery channels should be used when dispatching course purchase notifications to eligible administrators?  
  → **A**: Dual delivery: In-App Database Notification + instant Transactional Email alert to eligible administrators.
- **Q4 (Click Navigation)**: Where should clicking a "Course Purchased" notification navigate the administrator?  
  → **A**: Direct navigation to the Order details page (`/orders/{orderId}`) providing the full financial breakdown, customer details, and ticket allocation.
- **Q5 (Dual-Persona UX & Unread Isolation)**: How should unread badges and the "Mark All as Read" action behave across the dual-persona tabs?  
  → **A**: Scoped isolation. The Header HUD bell displays the combined total unread count. Inside the drawer/page, each tab displays its own local badge, and clicking "Mark all as read" applies strictly to the currently active tab.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Admin Course Purchase Alerts (Priority: P1)

As a platform administrator with financial or platform management capabilities,  
I want to receive an immediate in-app and email notification whenever a student or guest completes a course purchase order,  
so that I can track revenue events in real time and inspect transaction details without manually refreshing the orders ledger.

**Why this priority**: Directly delivers the core business capability requested by the product owner. Bridges the visibility gap between student order fulfillment and administrative awareness.

**Independent Test**: Can be verified independently by completing a course purchase order (via test fixture or real checkout) and asserting that an `admin_sales` notification is generated in the database and dispatched via email for eligible administrators with correct order metadata, localized text, and deep-link URL.

**Acceptance Scenarios**:

1. **Given** a customer or guest completes payment for a course order #ORD-1001 totaling $150,  
   **When** `OrderService::fulfillOrder()` successfully commits the transaction,  
   **Then** an `admin_sales` database notification and transactional email are dispatched to active administrators holding `manage_platform_settings` or `settle_affiliate_payout`, containing the student name/code, course title, total amount, and action link `/orders/{orderId}`.
2. **Given** an administrator has the notification drawer open when a purchase occurs,  
   **When** background polling or notification query invalidation triggers,  
   **Then** the admin unread badge increments and the new sales alert appears at the top of the list with a distinct commercial badge and currency label.
3. **Given** an order fulfillment transaction fails or rolls back,  
   **When** the transaction terminates,  
   **Then** no admin notification is created (zero false-positive notifications).

---

### User Story 2 - Dual-Persona Notification Drawer & Page Navigation (Priority: P1)

As an administrator who is also an active learner on the platform,  
I want my notification drawer and notifications page to clearly separate my personal learner updates from platform administrative alerts,  
so that commercial sales notices and operations do not clutter my course learning progress or promotional tickets.

**Why this priority**: Essential UX architecture requested by the product owner ("make a new section inside the admin notifications: users noti / admin noti"). Solves visual noise and persona confusion for staff accounts.

**Independent Test**: Can be tested independently by logging in as an administrator who also has course enrollments, opening `NotificationDrawer`, and verifying that two distinct segmented tabs ("My Learner Activity" vs "Admin & Sales") appear with independent unread counts and isolated list items.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator (`isAdmin === true`) opens the Notification Drawer or visits `/notifications`,  
   **When** the view renders,  
   **Then** a segmented control displays two tabs: `🎓 نشاطي كمتعلم (My Activity)` and `⚡ الإدارة والمبيعات (Admin & Sales)`, each displaying its own unread count badge.
2. **Given** a standard non-admin learner (`isAdmin === false`) opens the Notification Drawer,  
   **When** the view renders,  
   **Then** only the standard learner notification interface is displayed; admin tabs and administrative notifications are completely hidden.
3. **Given** an administrator clicks "Mark all as read" while on the "Admin & Sales" tab,  
   **When** the action completes,  
   **Then** only admin-scoped unread notifications are marked as read, while unread learner notifications remain intact.

---

### User Story 3 - Anti-Fatigue Operational Boundary & Instant Feedback Separation (Priority: P2)

As a platform administrator managing courses, settings, or drafts,  
I want my routine self-initiated actions to provide immediate interactive modal feedback without flooding my notification inbox,  
so that my notification bell remains a high-signal indicator for external events and critical cross-admin actions.

**Why this priority**: Prevents inbox fatigue and duplicate feedback channels. Balances the product owner's request ("notify him with the things he did in the admin panel") with the newly deployed `FeedbackDialog` and immutable `AdminActivityLog`.

**Independent Test**: Can be verified by editing a course or saving a draft in the admin portal: assert that `FeedbackDialog` displays the confirmation dialog and `AdminActivityLog` records the audit entry, while no redundant self-directed notification record is created in the user's notification inbox.

**Acceptance Scenarios**:

1. **Given** an administrator saves changes to a course title or platform setting,  
   **When** the mutation succeeds,  
   **Then** the UI displays an instant `FeedbackDialog` modal confirming success, records an immutable entry in `AdminActivityLog`, and does NOT create a self-spam notification in the admin inbox.
2. **Given** another administrator modifies critical global platform settings or adjudicates an affiliate payout,  
   **When** the change is committed,  
   **Then** an `admin_ops` notification is dispatched to peer administrators to provide audit visibility.

---

### User Story 4 - Secure Role & Scope-Gated Access (Priority: P2)

As the platform security officer,  
I want admin notification endpoints and data streams strictly protected by authorization checks,  
so that regular students cannot enumerate or inspect commercial sales, customer identities, or administrative operations.

**Why this priority**: Enforces Section 13 of the project constitution (Security is not optional). Prevents IDOR and privilege escalation on commercial revenue data.

**Independent Test**: Can be verified by issuing a `GET /api/notifications?scope=admin` request using a regular learner bearer token and asserting an HTTP 403 Forbidden response.

**Acceptance Scenarios**:

1. **Given** an unauthenticated guest or non-admin learner requests `GET /api/notifications?scope=admin`,  
   **When** the request reaches `NotificationController`,  
   **Then** the server rejects the request with HTTP 403 Forbidden and error code `ERR_UNAUTHORIZED_SCOPE`.
2. **Given** an active administrator requests `GET /api/notifications/unread-count`,  
   **When** the response returns,  
   **Then** the payload includes `unread_count`, `learner_unread_count`, and `admin_unread_count`.

---

## Edge Cases

- **Concurrent Course Purchases**: When multiple students purchase courses simultaneously, the post-commit hook must safely dispatch alerts without deadlocks or missed notifications.
- **Administrator as Buyer**: If an administrator purchases a course with their own account, they receive both the student order receipt (`OrderConfirmationNotification` in their Learner tab) and the administrative sales notification (`admin_sales` in their Admin tab).
- **Stale Admin Session / Revoked Capability**: If an administrator has their admin capability revoked mid-session and clicks on an admin notification, the system gracefully redirects them to an unauthorized notice without leaking sensitive data.
- **Multiple Administrators**: Course sales notifications are broadcast to all eligible administrators. When Admin A marks a sales notification as read, it marks it as read only for Admin A; Admin B's notification state remains unread.
- **RTL & Bilingual Rendering**: All notification titles, bodies, and amount badges must render with correct bidirectional layout and `<bdi>` tagging for mixed Arabic and English numbers/codes.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a dedicated notification class `CoursePurchasedAdminNotification` in the backend implementing `ShouldQueue` with `database` and `mail` delivery channels.
- **FR-002**: `OrderService::fulfillOrder()` MUST dispatch `CoursePurchasedAdminNotification` strictly inside `DB::afterCommit()` when an order enters `completed` status.
- **FR-003**: System MUST identify eligible admin recipients by querying active users possessing active `manage_platform_settings` or `settle_affiliate_payout` capabilities.
- **FR-004**: Each `CoursePurchasedAdminNotification` payload MUST include `category: 'admin_sales'`, `title_ar`, `title_en`, `body_ar`, `body_en`, `action_url: "/orders/{$order->id}"`, `entity_type: 'order'`, and metadata (`order_number`, `course_slug`, `total_amount_cents`, `currency`, `buyer_display_name`).
- **FR-005**: `NotificationController::index` MUST accept an optional `scope` query parameter (`all`, `learner`, `admin`).
- **FR-006**: `NotificationController::index` MUST reject requests where `scope=admin` with HTTP 403 Forbidden if the authenticated user is not an administrator (`$user->isAdmin() === false`).
- **FR-007**: `NotificationController::unreadCount` MUST return breakdown counters: `unread_count` (total), `learner_unread_count`, and `admin_unread_count`.
- **FR-008**: `NotificationController::markAllAsRead` MUST accept an optional `scope` parameter (`learner` or `admin`) to mark all unread notifications within that scope as read.
- **FR-009**: The frontend `NotificationDrawer` and `/notifications` page MUST render a segmented tab control ("My Activity" vs "Admin & Sales") whenever `isAdmin === true`.
- **FR-010**: The frontend `NotificationBell` in `HeaderHUD` MUST display the total aggregated unread count badge, while individual tabs in the drawer display their respective scoped unread badges.
- **FR-011**: Routine self-actions performed by an administrator MUST use `FeedbackDialog` and `AdminActivityLog` without generating self-spam records in the admin notification inbox.
- **FR-012**: Delivery channels for course purchase alerts MUST support dual delivery: In-App database notification and instant transactional email dispatch via `CoursePurchasedAdminNotification`.

---

### Key Entities

- **Admin Sales Notification (`notifications` table record)**:
  - Polymorphic relation: `notifiable_type = App\Models\User`, `notifiable_id = {admin_uuid}`
  - Type: `App\Notifications\CoursePurchasedAdminNotification`
  - Category: `'admin_sales'`
  - Action URL: `/orders/{order_id}`
- **Notification Scope**:
  - `'learner'`: notifications of categories `transactional`, `course_announcements`, `prize_draw_promotions`, `admin_broadcasts`
  - `'admin'`: notifications of categories `admin_sales`, `admin_ops`
- **Scoped Unread Summary**:
  - `unread_count`: total unread for the user
  - `learner_unread_count`: unread count for learner-scoped items
  - `admin_unread_count`: unread count for admin-scoped items (0 for non-admins)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully completed course purchase orders generate an `admin_sales` notification for eligible administrators within 2 seconds of transaction commit.
- **SC-002**: 0 false-positive notifications generated for failed or rolled-back checkout attempts.
- **SC-003**: 100% of non-admin unauthorized attempts to access `scope=admin` notifications are blocked with HTTP 403.
- **SC-004**: Admin users can switch between "Learner Activity" and "Admin & Sales" tabs in under 100ms with zero full-page reloads.
- **SC-005**: 100% of notification titles, bodies, and amounts display correctly with proper bidirectional (RTL/LTR) formatting and no corrupted numbers.

---

## Assumptions

- **Target Recipients**: Administrators holding `manage_platform_settings` or `settle_affiliate_payout` are the authoritative recipients for commercial sales.
- **Notification Retention**: Admin sales notifications adhere to the same 60-day auto-prune retention policy for read items established in Feature 009.
- **Delivery Reliability**: Asynchronous delivery utilizes Laravel's default queue with database notification persistence ensuring notifications are immediately available upon database commit.
- **RTL Support**: Arabic is the default display locale (`ar`), with English (`en`) available through existing `next-intl` routing.
