# Feature Specification: Feature 009 — Notifications (الإشعارات)

**Feature Branch**: `009-notifications`

**Created**: 2026-10-04

**Status**: Draft (Specification Phase)

**Input**: Product Roadmap Feature 009: "Notifications — Full-stack communication layer communicating important authoritative platform events and user-relevant state through In-App and Email channels. Consumer of Feature 001–008 authoritative state. Preserves frozen financial boundaries and strictly isolates communication failures from domain transactions."

**Contract & Governance Baseline**:
* **Governing Decision [DEC-007](file:///d:/Work%20Projects/Knzin%20Project/DECISIONS.md)**: Feature 009 launches strictly with **In-App Notifications** (notification center, unread badge, interactive inbox, and read state) and **Transactional & Marketing Email Notifications**. WhatsApp delivery is officially **deferred** to a post-launch phase and is out of scope for Feature 009.
* **Frozen Financial Boundary (AGENTS.md Section 13)**: Notifications are strictly downstream observers of authoritative business state. Notifications must never create, alter, settle, calculate, or reverse financial, order, ticket, or draw truth.
* **Failure Isolation Invariant (AGENTS.md Section 20)**: Notification generation, queueing, or delivery failure must never roll back or disrupt an authoritative business transaction.
---

## Clarifications

### Session 2026-10-04
- Q: How many days of learner inactivity should trigger an automated course mission learning reminder email and in-app alert? → A: 3 full days of inactivity since `last_accessed_at`, triggered only when the learner has unfinished mission/course parts. A repeat/reminder cooldown (minimum 7 days) must be enforced so 3 days does not become a recurring spam cycle.
- Q: What retention and cleanup policy should govern in-app notifications in the user inbox? → A: Auto-prune read notifications after 60 days; unread notifications are retained indefinitely and are not automatically deleted by the retention process.
- Q: What level of preference toggle granularity should users have over marketing and promotional notifications? → A: Per-category toggles for marketing/promotional notifications across three categories: (1) Course announcements, (2) Prize/draw promotions, and (3) Admin/promotional broadcasts. Users can independently enable/disable each category. Transactional notifications remain strictly mandatory and non-toggleable.

---

## 1. Feature Overview & Communication Model

Feature 009 establishes the **KNZiN Notification Engine** — a unified, server-authoritative communication subsystem that alerts users and administrators to critical events, lifecycle state transitions, and engagement reminders across two approved channels:

1. **In-App Notification Center:** A persistent, interactive notification hub integrated into the authenticated application header featuring a notification bell icon, a real-time unread count badge, an interactive notification drawer/popover, an unread-to-read state machine, and a full notifications inbox with direct action links.
2. **Transactional & Marketing Email Engine:** An asynchronous email notification dispatcher delivering vital transaction receipts, promotional ticket confirmations, time-sensitive draw countdown alerts, grand prize winner KYC instructions, abandoned pending-order recovery reminders, and authorized administrative broadcasts with mandatory unsubscribe capability.

### What Feature 009 Is
* A downstream communication consumer that listens to authoritative domain outcomes and presents them clearly to users.
* An interactive in-app inbox allowing authenticated learners and affiliates to view, filter, and mark notifications as read.
* An email dispatcher for time-critical transactional alerts and marketing updates.
* A recovery engine that re-engages users who initiated a checkout but did not complete payment within 2 hours.
* An administrative broadcast tool allowing authorized managers to dispatch platform announcements.

### What Feature 009 Is Not
* It is NOT an active WhatsApp or SMS integration (officially deferred per `DEC-007`).
* It is NOT a source of business truth for payments, entitlements, promotional tickets, affiliate commissions, ledger balances, draw winners, or KYC status.
* It is NOT an arbitrary promotional spam engine; transactional notifications cannot be disabled by users, while marketing broadcasts must strictly honor unsubscribe requests.
* It is NOT a generic external marketing automation platform or third-party CRM.
* It does NOT modify or redesign predecessor features (Authentication, Catalog, Checkout, Draws, Learner Hub, Affiliate Engine, Payments, or Admin Panel).

---

## 2. Target Users & Actors

| Actor | Description & Role in Feature 009 | Primary Notification Needs |
| :--- | :--- | :--- |
| **Guest Checkout Customer** | Unregistered or newly registered purchaser who checked out using email. | Instant email receipt with order details, digital course download link, promotional ticket serial numbers, and abandoned pending-order recovery emails if checkout stalled. |
| **Enrolled Learner (متعلم)** | Authenticated user accessing digital vocational courses in the Learner Hub. | In-app and email alerts for ticket minting, newly active course releases, course mission learning reminders, and live draw alerts. |
| **Affiliate / Influencer (مسوق)** | User driving referral traffic via unique slugs and tracking earnings. | In-app and email alerts regarding grand prize co-prize eligibility, administrative broadcast updates, and payout processing outcomes. |
| **Draw Participant & Winner (فائز)** | Ticket holder participating in periodic promotional sweepstakes. | Urgent 15-minute live draw alerts, winning ticket announcements, and official identity verification (KYC) claim instructions. |
| **Platform Administrator (مدير المنصة)** | Authorized operator managing draws, settings, courses, and platform communications. | Dispatching authorized system-wide broadcasts and monitoring delivery failures. |
| **Automated System Runner (المعالج الآلي)** | Background scheduler executing periodic sweeps. | Evaluating abandoned pending orders (at 2h), live draw stream windows (at 15m), and course mission inactivity triggers without human intervention. |

---

## 3. User Scenarios & Testing *(mandatory)*

### User Story 1 — Order Confirmation & Ticket Issuance (Priority: P1)

As a purchasing customer (guest or authenticated),  
I want to receive an instant order receipt and promotional ticket issuance notification via email and in-app,  
So that I have verified proof of my educational purchase, immediate access to my course content, and my official draw ticket codes.

**Why this priority**: Core revenue and legal compliance flow. Every customer must receive affirmative written confirmation that their payment unlocked educational content and granted zero-cost promotional tickets per Constitution Article VI.

**Independent Test**: Can be fully tested by simulating an order fulfillment: verify an email is generated containing the course syllabus access link and ticket serial codes, and (if authenticated) an unread notification appears in the customer's in-app inbox.

**Acceptance Scenarios**:
1. **Given** an order transitions authoritatively to completed status, **When** fulfillment completes, **Then** the customer receives an order confirmation email containing the order reference number, purchased course title, amount paid in IQD/USD, and a direct link to access the course materials.
2. **Given** promotional tickets are minted for a completed order, **When** ticket minting completes, **Then** a notification is dispatched containing the exact ticket serial numbers (`KNZ-XXX`) and the draw tiers in which they are entered.
3. **Given** the customer is an authenticated user, **When** the order and ticket notifications are generated, **Then** both items appear as unread entries in the customer's in-app notification center, incrementing the unread badge count.

---

### User Story 2 — In-App Notification Center & Read State (Priority: P1)

As an authenticated user (learner or affiliate),  
I want to see an unread badge on the header bell icon and interact with an in-app notification center,  
So that I can stay informed of platform activity, view past announcements, and manage my unread notifications.

**Why this priority**: Forms the primary interactive user-facing surface for all in-app notifications across desktop and mobile devices.

**Independent Test**: Can be fully tested by logging in as a user with 3 unread notifications: verify the badge displays "3", clicking the bell opens the popover/drawer displaying the notifications in reverse chronological order, clicking an item marks it as read and decrements the badge to "2", and clicking "Mark all as read" clears the badge completely.

**Acceptance Scenarios**:
1. **Given** an authenticated user has unread notifications, **When** viewing any page on the platform, **Then** the header bell icon displays a visible badge with the exact count of unread notifications.
2. **Given** an authenticated user clicks the header notification bell, **When** the notification panel opens, **Then** notifications are displayed in reverse chronological order with localized Arabic/English titles, concise summaries, relative timestamps, and visual indicators distinguishing read from unread items.
3. **Given** a user clicks on an unread notification containing a destination link, **When** clicked, **Then** the notification transitions to read status, the unread counter decrements by 1, and the user is navigated to the associated destination (e.g. course lesson, draw arena, or ticket ledger).
4. **Given** a user has multiple unread notifications, **When** the user clicks "Mark all as read" (تحديد الكل كمقروء), **Then** all notifications for that user transition to read status, and the header badge is dismissed.
5. **Given** a user views notifications in Arabic (`/ar`), **When** rendered, **Then** layout follows RTL alignment with logical start/end spacing, and mixed strings (e.g., ticket codes, amounts) are wrapped with semantic bidirectional isolation (`<bdi>`).

---

### User Story 3 — Abandoned Pending Order Recovery (Priority: P2)

As a customer who initiated a course checkout but did not complete payment,  
I want to receive an automated reminder email 2 hours after checkout initiation,  
So that I can easily resume and complete my purchase before my reserved order expires.

**Why this priority**: Crucial marketing and conversion recovery engine explicitly mandated by the client brief and `PROJECT_CONTEXT.md` (FR-010).

**Independent Test**: Can be fully tested by creating an order with status `pending`, simulating an elapsed time of 2 hours, running the scheduled recovery evaluator, and asserting that exactly one recovery email is dispatched with a valid payment completion link.

**Acceptance Scenarios**:
1. **Given** an order has remained in `pending` status for at least 2 hours without payment confirmation, **When** the automated recovery process evaluates pending orders, **Then** a personalized reminder email is sent to the customer's email address stating that their educational course and promotional tickets are pending payment.
2. **Given** an abandoned order reminder email is opened, **When** the customer clicks the recovery button, **Then** the customer is taken directly to the order summary payment screen for that specific order.
3. **Given** a customer completes payment or the order is cancelled/failed before the 2-hour window elapses, **When** the recovery process runs, **Then** no reminder email is dispatched.
4. **Given** an abandoned order reminder has already been sent for an order, **When** subsequent scheduled evaluation runs occur, **Then** duplicate reminders are suppressed (maximum 1 recovery reminder per pending order).

---

### User Story 4 — Live Draw Alerts & Winner KYC Notifications (Priority: P2)

As a promotional ticket holder,  
I want to receive an alert 15 minutes before a live draw stream begins and an immediate notification if I win,  
So that I can watch the live draw broadcast and promptly submit my official identity documentation to claim my prize.

**Why this priority**: High-stakes user engagement and regulatory compliance requirement. Guarantees transparency in sweepstakes and initiates mandatory KYC claim verification for prize winners.

**Independent Test**: Can be fully tested by: (1) creating an active published draw 15 minutes prior to its scheduled conclusion time and verifying an alert is dispatched to ticket holders; (2) resolving a draw with a designated winner and verifying that a high-priority winner notification with KYC submission instructions is dispatched to the winning user.

**Acceptance Scenarios**:
1. **Given** an active published draw is 15 minutes away from its scheduled live drawing time (`ends_at`), **When** the scheduled draw alert evaluator runs, **Then** ticket holders participating in that draw receive an alert via in-app and email with the broadcast stream link.
2. **Given** an electronic draw concludes and a winning ticket is selected, **When** the winner record is officially committed, **Then** the winning ticket holder receives an urgent winner notification via email and in-app congratulating them and detailing the mandatory KYC claim process.
3. **Given** a winner notification is delivered, **When** viewed, **Then** it clearly details the official identity verification (KYC) submission instructions required before prize funds or goods can be disbursed.

---

### User Story 5 — Course & Content Lifecycle Notifications (Priority: P3)

As an enrolled learner or prospective customer,  
I want to be notified when a new vocational course is published, when a major new draw prize is announced, or when I have been inactive on my course mission,  
So that I stay motivated to complete my practical vocational training and discover new learning opportunities.

**Why this priority**: Fulfills client brief requirements regarding course mission engagement and catalog discovery.

**Independent Test**: Can be fully tested by: (1) toggling a course to active status and verifying a catalog alert is queued; (2) publishing a draw with an attached marquee prize and verifying a prize alert is generated; (3) simulating learner inactivity on an active course entitlement and verifying a mission reminder is dispatched.

**Acceptance Scenarios**:
1. **Given** a new vocational course is set to active status (`is_active = true`), **When** published, **Then** subscribed learners receive an announcement notification highlighting the course outcomes and syllabus.
2. **Given** a new promotional draw is officially published with an attached marquee prize, **When** published, **Then** active users receive an announcement showcasing the prize valuation and draw timeline.
3. **Given** an enrolled learner with unfinished course or mission parts has been inactive for 3 full days since `last_accessed_at`, **When** the scheduled mission reminder evaluator runs, **Then** the learner receives an encouraging learning reminder via in-app and email with a direct link to resume their next incomplete lesson, subject to a minimum cooldown (7 days) before another reminder can be sent for the same course.

---

### User Story 6 — Administrative Broadcast & Marketing Unsubscribe (Priority: P3)

As a platform administrator,  
I want to dispatch system-wide announcements to all active users from the Admin Panel,  
And as a customer, I want to easily unsubscribe from marketing/promotional communications,  
So that administrators can communicate platform-wide updates while respecting user consent and international commercial communication standards.

**Why this priority**: Fulfills the explicit client brief requirement for admin-dispatched updates and mandatory email unsubscribe capability.

**Independent Test**: Can be fully tested by dispatching an administrative broadcast from an authorized admin account and verifying users receive it; and clicking an unsubscribe link in a marketing email and asserting that subsequent marketing broadcasts are suppressed while transactional receipts remain unaffected.

**Acceptance Scenarios**:
1. **Given** an administrator with `manage_platform_settings` authorization, **When** submitting a platform announcement, **Then** the announcement is persisted and queued for delivery to all eligible active users.
2. **Given** an administrator attempts to dispatch a broadcast without required capabilities, **When** submitted, **Then** the request is rejected with HTTP 403 and logged in the immutable audit log.
3. **Given** any marketing or promotional email (broadcast, new course, new prize), **When** delivered, **Then** it contains a functional, one-click unsubscribe link.
4. **Given** a user has unsubscribed from marketing communications, **When** a marketing broadcast or course announcement is dispatched, **Then** the user is excluded from delivery.
5. **Given** a user has unsubscribed from marketing communications, **When** that user makes a new course purchase, **Then** transactional order confirmation and promotional ticket receipt emails are **still delivered without suppression**.

---

### User Story 7 — Admin Course Content Update Notification & In-App Refresh (Priority: P2)

As an enrolled learner who currently holds valid active access to a course,  
I want to receive an in-app notification when an authorized administrator completes an Admin Dashboard mutation that produces a verified learner-facing content change, accompanied by a clear "Refresh" action,  
So that I am immediately aware of updated lessons, syllabi, or resources and can update my course view without losing my authenticated session or reloading the entire page.

**Why this priority**: Connects authoritative Admin Dashboard curriculum updates directly to enrolled students while eliminating stale data and avoiding disruptive full-page reloads.

**Boundary Statement**: A learner-update notification may be created only when an authorized Admin Dashboard mutation completes successfully and produces a persisted change to learner-visible state. The current repository has one verified learner-facing Admin Dashboard mutation surface: `AdminCourseService`. The architecture is defined by the mutation boundary, not by the Course domain, so future learner-facing Admin Dashboard mutation paths can integrate without changing the notification contract.
- **Trigger Operations**: Authorized Admin Dashboard mutations (currently in `AdminCourseService`: `updateCourse`, `addPart`, `updatePart`, `reorderParts`, `deletePart`) where an actual state transition on learner-visible attributes (title, description, curriculum, outcomes, cover, syllabus, video/pdf media, part numbers, active part status) is verified by Eloquent (`wasChanged()`) and successfully committed to MySQL.
- **Non-Trigger Operations**: Administrative observation (viewing/reading audit logs via `AdminAuditLogController`, inspecting courses), form opening/cancelling, saves with unchanged values (`wasChanged() === false`), internal audit log generation, internal settings/capability assignments, and financial/pricing updates (`bundle_price_cents`, `part_price_cents`, promotional ticket counts).
- **Completion Proof**: Established strictly by the authoritative learner-facing mutation being persisted and the enclosing `DB::transaction` successfully committing in MySQL (`DB::transactionLevel() === 0`). Neither an audit log insertion nor an HTTP 200/201 response is the database transaction's completion proof.
- **Prerequisite Boundary**: Successful admin mutation commit is the prerequisite for notification creation. Successful notification creation or queue delivery is NOT proof of the underlying business mutation. Notification failure never rolls back or invalidates the committed mutation.
- **Transaction Invariant**: Rollback → zero learner-update notifications created. Commit → notification becomes eligible and dispatches strictly post-commit (`DB::afterCommit`).
- **Logical Update Identity**: Represented by the resource's committed monotonic version (`courses.content_version`), combined with resource type, resource ID, and recipient ID: `Str::uuid5(Str::NAMESPACE_OID, "admin_update:course:{$courseId}:v{$course->content_version}:{$userId}")`. This guarantees:
  1. *Duplicate processing* of the same logical committed update (worker retry, queue redelivery) carries the identical version (e.g. `v2`), yielding the identical UUIDv5 key and producing exactly ONE learner notification.
  2. *Legitimate later updates*—even if producing identical changed values to an earlier update (e.g. content A → B, then B → A, then A → B) or occurring rapidly in the same second—carry an incremented committed `content_version` (e.g. `v3`), yielding a new UUIDv5 key and producing a NEW learner notification.
- **Role of `wasChanged()`**: Eloquent's `wasChanged()` is scoped strictly as the persistence-time state transition check (proving whether the database record actually changed); it is NOT a substitute for the update identity.

**Independent Test**: Can be fully tested by: (1) Updating a course part (e.g., syllabus, video URL, or new part) via `AdminCourseService`; verify that users with active `CourseEntitlement` receive an in-app notification with `action_type = 'refresh_course'`; (2) Resaving identical content or changing non-learner metadata (e.g., prices or internal audit notes) and verifying 0 notifications are generated; (3) Clicking the "Refresh" action button on the frontend notification item; verify that TanStack Query refetches the course data without triggering a browser window reload and without affecting session cookies or auth state.

**Acceptance Scenarios**:
1. **Given** an administrator completes an authorized mutation on a learner-facing Admin Dashboard surface, **When** the transaction commits with verified learner-facing modifications (e.g. added/updated lessons, modified syllabi, updated video/PDF URLs, altered lesson sequence, or newly activated content), **Then** an in-app notification is queued strictly for learners who currently hold valid active access (`CourseEntitlement`) to that course.
2. **Given** an administrator performs an administrative observation, saves identical content, updates internal administrative metadata, creates audit logs, or modifies non-learner fields (pricing, promotional ticket counts, internal notes), **When** the operation completes, **Then** no learner notification is dispatched.
3. **Given** an eligible course update occurs, **When** rendered in the learner's notification center, **Then** the notification clearly states that updated course content is available and provides a prominent "Refresh" (تحديث) action button with a refresh icon.
4. **Given** an enrolled learner clicks or taps the "Refresh" action button, **When** executed, **Then** the client invalidates and refetches the latest authoritative course content via React Query without forcing a browser window reload, without logging the learner out, and while preserving the learner's current route and navigation context.
5. **Given** an admin repeatedly submits or retries the same logical update, **When** processed, **Then** the committed update instance identity suppresses duplicate notifications, while subsequent distinct updates trigger new notifications.
6. **Given** a course content update notification delivery fails, **When** failed, **Then** the administrator's committed course changes remain 100% intact and uncorrupted.

---

### Edge Cases

* **Transaction Rollback Isolation:** What happens if an order fulfillment fails mid-transaction?  
  *The system must strictly guarantee that no notification is ever dispatched for an uncommitted or rolled-back transaction. All transactional notification dispatches must be triggered after transaction commit.*
* **Rapid Payment after Abandonment Reminder:** What happens if a customer completes payment right as the 2-hour abandoned order job is executing?  
  *The evaluator must re-verify the authoritative order status immediately prior to dispatching the message. If the order has transitioned to `completed` or `failed`, the reminder must be silently discarded.*
* **Draw Cancellation / Rescheduling:** What happens if an active draw is cancelled or postponed before its 15-minute alert fires?  
  *The evaluator must verify that `is_published = true` and the draw status is currently active. If cancelled or locked, the alert must be suppressed.*
* **Duplicate Event Retries:** How does the system prevent duplicate emails if a background worker restarts during processing?  
  *Each notification must carry a deterministic unique idempotency identity (e.g. `order_fulfilled:{order_id}` or `abandoned_order:{order_id}:reminder_1`). Duplicate dispatches matching an already-sent notification identifier must be ignored.*
* **Unauthenticated Guest Notifications:** How are in-app notifications handled for a guest purchaser who does not have an active session?  
  *Order confirmation and promotional tickets are delivered immediately via Email. When/if the guest later logs in using the same verified email, past notifications associated with their resolved user ID are immediately accessible in their in-app center.*
* **Deleted / Deactivated Account:** What happens if a user account is deactivated or merged into another account?  
  *Notifications are addressed to the surviving canonical user ID. Deactivated users are excluded from all active dispatches.*

---

## 4. Requirements *(mandatory)*

### Functional Requirements

#### Core Notification Capabilities
* **FR-001**: System MUST support two primary delivery channels: In-App Database Notifications and Email Notifications.
* **FR-002**: System MUST treat notifications strictly as downstream consumers of authoritative state; a notification generation, queueing, or delivery failure MUST NEVER roll back, alter, or interrupt an authoritative business transaction.
* **FR-003**: System MUST guarantee that no notification is ever dispatched or persisted based on uncommitted or rolled-back transaction state.

#### Notification Catalog & Triggers
* **FR-004**: System MUST dispatch an Order Confirmation & Digital Course Receipt (via Email and In-App) immediately upon authoritative order fulfillment (`Order::status = 'completed'`).
* **FR-005**: System MUST dispatch a Promotional Ticket Issuance Confirmation (via Email and In-App) upon completion of asynchronous ticket minting, listing the minted ticket serial codes.
* **FR-006**: System MUST evaluate pending orders and dispatch an Abandoned Pending Order Recovery Reminder via Email exactly once for any order that has remained in `pending` status for at least 2 hours, provided the order has not been completed, failed, or expired.
* **FR-007**: System MUST dispatch a Live Draw Stream Alert (via Email and In-App) to participating ticket holders exactly 15 minutes prior to the scheduled conclusion and live drawing time (`ends_at`) of any active published draw.
* **FR-008**: System MUST dispatch a Winner Notification & KYC Claim Alert (via Email and In-App) immediately upon official resolution of a draw winner, providing explicit instructions for submitting required government identity documentation (KYC) to claim the prize.
* **FR-009**: System MUST dispatch a New Course Publication Alert (via Email and In-App) when an educational course transitions to active status (`Course::is_active = true`), delivered only to users who have not opted out of promotional communications.
* **FR-010**: System MUST dispatch a New Prize Announcement (via Email and In-App) when an official marquee prize is published with its parent draw (`Draw::is_published = true`), delivered only to users who have not opted out of promotional communications.
* **FR-011**: System MUST evaluate enrolled learner activity and dispatch a Course Mission Inactivity Reminder (via Email and In-App) to enrolled learners who have unfinished lesson parts and have been inactive for 3 full days since `last_accessed_at`. System MUST enforce a separate repeat cooldown (minimum 7 days) to prevent recurring reminder spam.
* **FR-012**: System MUST provide an Administrative Broadcast capability allowing authorized administrators to dispatch platform-wide announcements via In-App and Email.

#### In-App Notification Center
* **FR-013**: System MUST provide a persistent notification bell icon in the authenticated header HUD displaying an unread count badge representing the authenticated user's unread notifications.
* **FR-014**: System MUST provide an interactive notification popover/drawer displaying notifications in reverse chronological order with localized titles, summaries, timestamps, and read/unread visual differentiation.
* **FR-015**: Users MUST be able to mark individual notifications as read, instantly decrementing the unread badge count.
* **FR-016**: Users MUST be able to mark all notifications as read in a single action, instantly clearing the unread badge.
* **FR-017**: Clicking a notification containing an action reference MUST navigate the user to the relevant application route (e.g. course lesson, draw arena, or order receipt).
* **FR-018**: System MUST retain in-app notification records according to an approved retention schedule: read notifications are automatically pruned after 60 days, while unread notifications are retained indefinitely and are not automatically deleted by the retention process.

#### Preferences, Unsubscribe & Filtering
* **FR-019**: System MUST classify all notifications as either **Transactional** (mandatory account, payment, ticket, and winner notices) or **Marketing/Promotional** (broadcasts, new courses, new prizes, and reminders).
* **FR-020**: System MUST include a functional, secure one-click unsubscribe mechanism in all Marketing/Promotional emails.
* **FR-021**: System MUST provide per-category preference toggles for marketing/promotional notifications across three distinct categories: (1) Course announcements, (2) Prize/draw promotions, and (3) Admin/promotional broadcasts. Users MUST be able to independently enable or disable each promotional category, while Transactional notifications (order receipts, ticket grants, live draw 15m alerts, winner KYC notices, and pending order recovery) remain strictly mandatory and non-toggleable.

#### Security & Authorization
* **FR-022**: Users MUST ONLY be permitted to view, access, or mutate (mark read) their own private notifications; cross-user notification access (IDOR) MUST be strictly prevented by backend authorization.
* **FR-023**: Notification identifiers MUST NOT be guessable or sequential in public API contracts.
* **FR-024**: Notification content MUST be sanitized against HTML injection and cross-site scripting (XSS) before rendering in the browser.
* **FR-025**: Administrative broadcast endpoints MUST require affirmative authorization under the existing admin capability architecture (`manage_platform_settings`).

#### Localization & Bidirectional Presentation
* **FR-026**: System MUST support localized notification content in both Arabic (`ar`, RTL default) and English (`en`, LTR).
* **FR-027**: All mixed-direction content within notification messages (such as order numbers, ticket serials, and currency amounts) MUST be wrapped in semantic bidirectional isolation (`<bdi>`) to prevent punctuation and digit inversion in RTL viewports.

#### Admin Course Content Audit & Update Notification
* **FR-028**: A learner-update notification may be created only when an authorized Admin Dashboard mutation on a learner-facing surface (verified currently in `AdminCourseService`, with architecture defined by the mutation boundary) completes successfully and produces a persisted change to learner-visible state (`wasChanged()` on course/part content, media, or structure). Completion is strictly established by the authoritative learner-facing mutation being persisted and the enclosing database transaction successfully committing in MySQL (`DB::transactionLevel() === 0`). Notification creation MUST be suppressed for administrative observation (viewing/reading logs or screens), uncommitted/rolled-back operations, saves of identical values (`wasChanged() === false`), non-learner metadata, pricing/promotional ticket alterations, and users without active access (`CourseEntitlement`). Each notification MUST use the committed monotonic version (`courses.content_version`) combined with resource identity as its logical update identity (`Str::uuid5(Str::NAMESPACE_OID, "admin_update:course:{$courseId}:v{$course->content_version}:{$userId}")`) to guarantee that duplicate processing of the same update yields zero duplicate notifications while legitimate later updates (even with identical content or rapid execution) trigger new notifications.
* **FR-029**: The In-App Notification Center MUST render an interactive "Refresh" (تحديث) action button with a refresh icon for course content update notifications. When clicked, the client MUST invalidate and refetch the latest course state via React Query without forcing a full browser window reload, without clearing authentication tokens/cookies, without resetting unrelated UI state, and while preserving the learner's active route and session context.

---

### Key Entities

* **Notification Item (`Notification`)**: Represents an individual message targeted to a specific user. Contains reference to the recipient, notification category/type, localized title, localized body text, optional action deep-link URL, optional authoritative entity reference (e.g. order ID, draw ID), read timestamp (`read_at`), and creation timestamp.
* **Notification Preference (`NotificationPreference`)**: Stores user-configured channel and category delivery preferences, including marketing email unsubscribe status and timestamp.
* **Broadcast Announcement (`BroadcastAnnouncement`)**: Represents an administrative broadcast dispatched to multiple recipients. Contains admin author ID, title, body, delivery channels, and dispatch timestamp.

---

## 5. Success Criteria *(mandatory)*

### Measurable Outcomes

* **SC-001**: **Instant Receipt Delivery**: 99% of order confirmation and ticket issuance emails are queued within 3 seconds of authoritative transaction commit.
* **SC-002**: **Zero Transaction Interference**: 100% of simulated notification delivery failures produce zero rollbacks or corruptions of underlying order, ticket, or ledger transactions.
* **SC-003**: **Zero Duplicate Delivery**: Replaying domain events or retrying background jobs produces 0 duplicate notifications visible to users for the same business event.
* **SC-004**: **Interactive Unread Accuracy**: The in-app unread badge count matches the true database count of unread items across 100% of user sessions without requiring full page reloads.
* **SC-005**: **Strict Consent Enforcement**: 100% of users who unsubscribe from promotional emails are excluded from subsequent marketing broadcasts, while 100% of subsequent transactional receipts continue to deliver successfully.
* **SC-006**: **Responsive & RTL Fidelity**: The in-app notification center renders with 0 horizontal overflow and proper RTL alignment across mobile (375px), tablet (768px), and desktop (&ge;1280px) viewports.
* **SC-007**: **Seamless Course Update Refresh**: 100% of verified admin learner-facing changes notify entitled learners within 3 seconds of transaction commit; 0% of unchanged saves or non-entitled users receive notifications; and 100% of Refresh actions retrieve fresh course data without triggering full browser reloads or session disconnects.

---

## 6. Assumptions

* **Email Delivery Infrastructure**: In local and automated testing environments, email notifications write cleanly to logs or test inboxes (`MAIL_MAILER=log`); in production, standard SMTP or transactional API credentials will be supplied via environment variables.
* **Single Tier Notifications**: Notifications represent direct system-to-user alerts; user-to-user messaging or chat is outside the scope of KNZiN.
* **WhatsApp Deferral Contract**: Per approved decision `DEC-007`, WhatsApp delivery is out of scope for Feature 009 and will be integrated in a post-launch phase; no partial WhatsApp code or phone-number checkout walls are introduced.
* **Downstream Integration Seams**: Existing services (`OrderService`, `TicketMintingService`, `DrawLifecycleService`, `AdminCourseService`) will be augmented with minimal downstream hooks or domain event dispatches to trigger notifications after transaction commitment.
* **Derived Candidate Notifications**: Notifications for intermediate affiliate commission credits, maturation, payout settlement, and lesson completions are recognized as candidate extensions but are deferred from initial mandatory launch requirements.

---

## 7. Open Clarification Items

No open clarification items remain. All specification ambiguities have been resolved in Session 2026-10-04.

---
