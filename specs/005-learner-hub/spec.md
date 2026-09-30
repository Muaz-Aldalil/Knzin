# Feature Specification: Feature 005 — Learner Hub, Course Library & Ticket Ledger (منظومة مركز المتعلّم ومكتبة الدورات وسجل التذاكر)

**Feature Branch**: `005-learner-hub`  
**Created**: 2026-10-01  
**Status**: Draft (Clarification Complete — Ready for Planning Review)  
**Input**: Master Roadmap Requirement: "Feature 005: Learner Hub (🟢 Full-Stack + 🟢 Database Heavy). Frontend: Dedicated /dashboard, course library, hardened lesson player with dynamic anti-piracy watermark, gated downloads, progress tracking, and global Header HUD ticket drawer. Backend: Entitlement authorization service, gated playback API, signed expiring download URLs, and promotional ticket minting engine with dynamic serials (`KNZ-{yy}-XXXX-YYYY`). DB: Migrations for `course_entitlements` and `tickets`."

---

## 1. Feature Overview & Value Proposition

In the KNZiN dual-engine ecosystem, **Feature 005 (Learner Hub)** delivers the core value proposition for which customers exchange funds:
1. **The Educational Hub (المركز التعليمي والمكتبة):** Delivers the primary commercial service—practical, vocational trade skills training (Auto Detailing, Smartphone Repair, Solar Energy, Financial Independence, etc.). It transitions the learning surface from an unauthenticated client-side demo into an authoritative, entitlement-gated experience with verified video playback, protected downloadable trade schematics, and persistent progress tracking.
2. **The Promotional Ticket Ledger (سجل التذاكر وسحوبات المشترك):** Materializes the complimentary promotional draw entries awarded with educational purchases into individual, verifiable, transparent ticket records (`KNZ-{yy}-XXXX-YYYY`). These tickets participate in multi-tier window-based draws (qualifying for active Hourly and Daily draws upon issuance, and the marquee Monthly Grand Draw throughout the calendar period), prominently surfaced in the user HUD (`تذاكري: X`) via an accessible global sliding drawer with live countdown timers.

---

## 2. Repository Reality & Baseline Findings

An empirical audit of the repository establishes the following ground truths:

### 2.1 Existing Capabilities Reused
* **Course & Catalog Data**: `courses` and `course_parts` tables are established with bilingual metadata (`title_ar`, `title_en`, `slug`, `part_number`, `duration_minutes`).
* **Order Baseline**: `orders` and `order_items` tables exist with monetary calculations in cents, exchange rates, and guest email association.
* **Account Continuity**: `AccountMergeService` is proven to transfer orders and lesson progress from guest accounts to verified Google accounts with the same email.
* **Player UI Components**: Responsive video layout, syllabus sidebar, and lesson tabs exist in `frontend/src/components/lesson/`.

### 2.2 Critical Gaps & Vulnerabilities Replaced
* **Absence of Server-Side Entitlement (`DEF-05A`)**: Currently, `ProgressController` permits progress writes if `status IN ('completed', 'pending')`, mistakenly allowing pending orders to unlock content. Feature 005 establishes explicit, immutable entitlement records where `status = 'completed'` is strictly required.
* **Client-Side Fake Purchase State (`DEF-05B`)**: `LessonPlayerClientView.tsx` currently stores purchased parts in browser `localStorage`. Feature 005 replaces this with server-authoritative entitlement verification.
* **Public Video URL Exposure (`DEF-05C`)**: Video streaming URLs are currently bundled directly in client JavaScript. Feature 005 strips paid video URLs from public bundles and gates playback behind an authorized API.
* **Missing Individual Ticket Records (`DEF-05D`)**: Promotional tickets are currently recorded only as an aggregate integer count on orders. Feature 005 introduces individual minted ticket records with standardized human-readable serials.

### 2.3 Clarifications & Approved Product Decisions

* **Decision 1 (Ticket / Draw Eligibility Model)**: Promotional tickets utilize multi-tier, draw-window-based eligibility. A ticket is not consumed or destroyed upon draw execution. Upon order fulfillment, each ticket is eligible for the active Hourly and Daily draws open at the timestamp of issuance (expiring when those specific tiers conclude), and remains continuously eligible for the designated Monthly Grand Draw throughout its active calendar window. A ticket MUST NOT be permanently locked to a single `draw_id`.
* **Decision 2 (Canonical Ticket Serial Format)**: Serials strictly conform to `^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$` utilizing the canonical uppercase Crockford Base32 alphabet (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`, excluding ambiguous characters I, L, O, and U). Serials are minted exclusively on the server upon order fulfillment, globally unique, immutable, and free of PII or course identifiers.
* **Decision 3 (Learner-Facing Watermark Identity & Privacy Policy)**: Dynamic anti-piracy Canvas watermarks visibly render three authoritative components:
  1. Full normalized account email (e.g. `muaz@example.com`) for direct, human-readable ownership attribution.
  2. Short opaque learner identifier (e.g. `LRN-7K2M`) derived from the account to support incident investigation without exposing database primary keys, internal UUIDs, or authentication tokens.
  3. Playback date and time (e.g. `01 Oct 2026 14:32`).
  *Authority Chain*: The watermark identity MUST be derived server-side from the authenticated playback authorization token (never from client-side `localStorage` or browser parameters).
  *Strict Exclusions*: Phone numbers, IP addresses, session tokens, full database UUIDs, payment info, KYC data, and course/order details MUST NOT appear in the watermark.

---

## 3. User Scenarios & Testing *(mandatory)*

### User Story 1 — Dedicated Learner Dashboard & Course Library (Priority: P1) 🎯 MVP

As an enrolled student who purchased a vocational course part or bundle,  
I want to navigate to my personal Learner Dashboard (`/dashboard`),  
So that I can see all my enrolled courses, resume my latest active lesson with one click, and track my completion percentage across all modules.

**Why this priority**: Core educational value delivery. Paying customers must have an immediate, dedicated home for accessing the trade training they purchased.

**Independent Test**: Log in or complete a guest checkout, navigate to `/[locale]/dashboard`, verify that enrolled courses render with accurate titles and progress meters, and click "Continue Learning" to jump directly into the active lesson.

**Acceptance Scenarios**:
1. **Given** a user with at least one confirmed course part or bundle purchase, **When** they navigate to `/[locale]/dashboard`, **Then** the page displays their personal library with course cards showing title, thumbnail, completed parts count, and total progress percentage.
2. **Given** a visitor with zero purchased courses visits `/dashboard`, **When** the page renders, **Then** an inviting empty state renders explaining they have no active courses yet, with a prominent call to action to browse the course catalog (`/courses`).
3. **Given** an unauthenticated visitor accesses `/dashboard`, **When** the page loads, **Then** it presents an accessible authentication prompt explaining how to access their courses via Google Login or guest email verification.
4. **Given** an enrolled learner clicks "متابعة التدريب" (Continue Learning) on a course card, **When** the action fires, **Then** they are routed directly to the exact lesson and part where they last left off.

---

### User Story 2 — Hardened Lesson Player & Dynamic Canvas Watermark (Priority: P1)

As an enrolled student watching a paid vocational lesson (Part 2 and beyond),  
I want to stream high-definition lesson videos and access lesson notes,  
While unauthorized visitors are prevented from streaming paid content, and illicit screen recording is deterred via an unobtrusive personalized watermark.

**Why this priority**: Commercial protection and platform integrity. Eliminates the severe `DEF-05A` vulnerability permanently at the server authorization layer.

**Independent Test**: Request playback for a paid part with and without an active purchase entitlement. Unentitled requests receive an access-denied response and display a paywall with purchase options, while authorized requests stream smoothly with an anti-piracy watermark displaying the learner's identity.

**Acceptance Scenarios**:
1. **Given** an unpaid visitor accesses Part 2 of any course, **When** the lesson player loads, **Then** the player displays a locked paywall overlay, and the "Resources & Downloads" tab displays a locked state with purchase triggers.
2. **Given** a paying customer who bought Part 2 accesses the lesson, **When** the player loads, **Then** the backend returns an authorized playback stream, the video plays smoothly, and a semi-transparent dynamic Canvas watermark displaying the learner's full account email, short opaque learner ID (e.g. `LRN-7K2M`), and playback timestamp (`01 Oct 2026 14:32`) drifts across the player canvas at randomized intervals.
3. **Given** Part 1 of any course is opened by any visitor (guest or registered), **When** the lesson player loads, **Then** it plays immediately as a free introductory preview without requiring purchase or login.
4. **Given** a customer bought a Single Part ($2), **When** they view the course part list, **Then** their purchased part is unlocked, while remaining parts show lock badges and offer an upgrade option.

---

### User Story 3 — Global Promotional Ticket Drawer & Live Draw Countdowns (Priority: P2)

As a customer who received complimentary promotional tickets with my vocational purchase,  
I want to click "تذاكري" (My Tickets) in the top navigation bar from any screen,  
So that I can view my exact unique ticket serial numbers, see which promotional draw tiers they are currently eligible for, and monitor live countdown timers without losing my page context.

**Why this priority**: High-engagement promotional transparency. Converts abstract purchase rewards into tangible, transparent proof of entry that builds customer trust.

**Independent Test**: Click the ticket counter badge in the navigation header, verify the sliding drawer opens instantly, displays individual tickets with formatted serials (`KNZ-{yy}-XXXX-YYYY`), displays their active eligibility across applicable draw tiers (Hourly, Daily, Monthly), and displays real-time synchronizing countdown timers for each active draw.

**Acceptance Scenarios**:
1. **Given** a customer completes a $10 course bundle purchase, **When** the order is fulfilled, **Then** exactly 15 unique ticket records are minted conforming to `^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$`.
2. **Given** a customer completes a $2 single part purchase, **When** the order is fulfilled, **Then** exactly 1 unique ticket record is minted.
3. **Given** a user clicks the ticket counter in the top navigation header, **When** the action fires, **Then** a sliding sheet opens from the layout inline-end, displaying active tickets, their current eligible draw tiers (Hourly, Daily, Monthly), and live synchronizing countdowns. When an hourly or daily draw concludes, that specific tier marks as concluded/expired, while the ticket remains visible and active for remaining tiers (such as the Monthly Grand Draw).
4. **Given** an unauthenticated visitor clicks the ticket counter, **When** the drawer opens, **Then** it shows an empty state explaining how promotional tickets are awarded with course purchases, with a link to the course catalog.

---

### User Story 4 — Gated Downloadable Trade Assets & Expiring Links (Priority: P3)

As an enrolled student viewing an unlocked vocational lesson,  
I want to download proprietary course attachments (PDF schematics, checklists, audio guides),  
While preventing public hotlinking and unauthorized asset scraping.

**Why this priority**: Protects high-value vocational IP (trade schematics, wiring diagrams, workshop checklists) from direct link sharing while providing paying students easy offline study materials.

**Independent Test**: Request a download link for an attachment as an authorized student (verify temporary link generates and begins file download); attempt to access the download link after its validity window expires (verify access is denied).

**Acceptance Scenarios**:
1. **Given** an authorized learner clicks "تحميل الملف" (Download File) on an unlocked lesson tab, **When** the download is initiated, **Then** the system provides access via a temporary signed URL valid for 15 minutes.
2. **Given** an unauthorized visitor copies a direct download URL and attempts to open it after 15 minutes, **When** the request hits the server, **Then** the server rejects the request with an expired authorization error.

---

### User Story 5 — Student Progress Persistence & Course Completion (Priority: P3)

As a learner working through a vocational course,  
I want my lesson watch time and completion status automatically saved,  
So that I can resume seamlessly across devices and see my overall progress on the dashboard.

**Why this priority**: Encourages high course completion rates and provides continuous positive feedback for self-paced trade mastery.

**Independent Test**: Watch a lesson past the 95% completion threshold, verify that the lesson is marked as completed on the syllabus, and verify that the dashboard overall progress indicator reflects the updated progress.

**Acceptance Scenarios**:
1. **Given** an authorized student watches at least 95% of a lesson video, **When** progress is reported, **Then** the part is marked as `is_completed = true` in the database.
2. **Given** all active published parts of a course are marked completed, **When** the student views their dashboard, **Then** the course card displays a 100% completion badge with a congratulatory state.

---

## 4. Edge Cases & Boundary Conditions

1. **Guest Checkout to Google Sign-In Transition**:
   * *Condition*: A guest buys a course bundle using `ahmed@gmail.com`. Later, they click "Sign in with Google" using that same email address.
   * *System Behavior*: `AccountMergeService` automatically transfers all `course_entitlements` and `tickets` from the guest identifier to the Google user identifier in a single atomic transaction. The learner loses zero progress, zero courses, and zero tickets, with zero duplicate rows created.
2. **Upgrading from Single Part ($2) to Full Bundle ($10)**:
   * *Condition*: A student already owns Part 2 and subsequently purchases the Full Bundle.
   * *System Behavior*: The bundle purchase creates a bundle entitlement (`course_part_id = null`), granting access to all course parts. The unique composite constraint on `(user_id, course_id, course_part_id)` prevents collision with the previous single-part record.
3. **Simultaneous Draw Countdown Expiry**:
   * *Condition*: A student opens the ticket drawer when the countdown is at `00:00:05`. The timer reaches `00:00:00`.
   * *System Behavior*: The ticket status transitions visually to `"قيد إجراء السحب (Draw in Progress)"` without crashing or throwing null-pointer exceptions.
4. **Intermittent Connectivity on Progress Reporting**:
   * *Condition*: A student finishes a lesson while traveling with intermittent mobile connectivity.
   * *System Behavior*: The frontend queues the progress update locally and synchronizes with the server once connectivity resumes.

---

## 5. Requirements *(mandatory)*

### 5.1 Functional Requirements

* **FR-001**: System MUST create an explicit access entitlement record whenever a course order transitions to `completed`.
* **FR-002**: System MUST permit access to Part 1 of every course to all visitors as a free introductory preview without requiring purchase or login.
* **FR-003**: System MUST reject video streaming requests for all paid course parts (Part 2 and beyond) with an authorization error if the requesting user lacks an active entitlement for that specific part or the course bundle.
* **FR-004**: System MUST serve video streaming metadata exclusively via backend API for paid parts, completely removing raw paid video URLs from public client JS bundles.
* **FR-005**: System MUST dynamically render an anti-piracy Canvas watermark over the video player displaying the authenticated learner's full normalized account email, short opaque learner identifier (e.g. `LRN-7K2M`), and playback date/time (`DD Mon YYYY HH:MM`). The watermark identity MUST be derived server-side from the playback authorization token. The watermark MUST NOT expose phone numbers, IP addresses, session tokens, full database UUIDs, or payment/KYC data.
* **FR-006**: System MUST serve downloadable files via temporary signed URLs with a maximum lifespan of 15 minutes.
* **FR-007**: System MUST mint exactly 1 ticket for a $2 part purchase and exactly 15 tickets for a $10 bundle purchase upon order fulfillment.
* **FR-008**: System MUST format all ticket serial numbers using the canonical Crockford Base32 pattern: `^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$` (utilizing the canonical alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`, excluding ambiguous characters I, L, O, and U). Serials MUST be generated exclusively on the server upon order fulfillment, globally unique, immutable, and free of PII or course identifiers.
* **FR-009**: System MUST evaluate promotional ticket eligibility dynamically across draw tiers: newly minted tickets are eligible for the active Hourly and Daily draws open at the time of issuance (expiring when those draws conclude), and remain active for the designated Monthly Grand Draw throughout its active calendar period. A ticket MUST NOT be permanently locked to a single draw identifier.
* **FR-010**: System MUST provide an accessible sliding drawer triggered from the ticket counter badge in the top navigation header on all desktop and mobile viewports.
* **FR-011**: System MUST provide a dedicated route `/[locale]/dashboard` showing enrolled courses, syllabus completion meters, and continue-learning shortcuts.
* **FR-012**: System MUST automatically transfer all guest entitlements, tickets, and lesson progress when a guest user registers or logs in with Google using the matching email address.
* **FR-013**: System MUST provide an administrative fulfillment command (`php artisan order:fulfill {orderNumber}`) and a safe local development simulator to enable full end-to-end testing in non-production environments.

---

### 5.2 Key Entities

* **Course Entitlement**: Represents a learner's verified authorization to access a specific course part or full bundle. Attributes: identifier, user reference, course reference, optional course part reference (null denotes full bundle), originating order reference, access type (part or bundle), and status (active or revoked).
* **Promotional Ticket**: Represents an individual verifiable entry in a promotional giveaway awarded with course purchases. Attributes: identifier, user reference, originating order reference, originating order item reference, unique human-readable serial number (`KNZ-YY-XXXX-YYYY`), issuance timestamp, and multi-tier draw eligibility status (active across qualifying draw windows, or concluded).
* **Lesson Progress**: Represents a learner's progression through a specific course lesson part. Attributes: identifier, user reference, course reference, course part reference, watch depth in seconds, completion percentage, completion flag, and timestamp of last activity.
* **Promotional Draw**: Represents an active or concluded promotional sweepstakes event. Attributes: identifier, draw code, tier (hourly, daily, monthly), title, prize amount, eligibility window, status, and winning ticket references.

---

## 6. Success Criteria *(measurable)*

* **SC-001**: 100% of attempts to stream paid course parts (Part 2 and beyond) without an active entitlement are rejected at the API layer with an access-denied error.
* **SC-002**: 100% of completed course orders generate the exact ratio of tickets (1 ticket for $2 part, 15 tickets for $10 bundle) with zero duplicate serials.
* **SC-003**: 100% of issued ticket serial numbers match the canonical format `KNZ-{yy}-XXXX-YYYY` and strict Crockford Base32 alphabet (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`).
* **SC-004**: Clicking the ticket counter in the navigation header opens the ticket drawer in under 150ms with zero layout shift (CLS = 0.00).
* **SC-005**: All learner dashboard and lesson player views achieve 100% bilingual parity in Arabic (`dir="rtl"`) and English (`dir="ltr"`).
* **SC-006**: An enrolled learner can resume their last watched lesson in under 2 clicks directly from the dashboard home.

---

## 7. Assumptions & Boundaries

### 7.1 Scope Inclusions
* Dedicated learner dashboard (`/[locale]/dashboard`).
* Authoritative entitlement service and database migration.
* Hardened lesson playback API and dynamic watermark.
* Gated downloadable assets with 15-minute expiring signed URLs.
* Promotional ticket minting engine and global sliding drawer (`MyTicketsSheet`).
* Guest account merge extension for entitlements and tickets.
* Development fulfillment simulator and artisan command.

### 7.2 Explicit Scope Exclusions (Deferred to Later Milestones)
* Payment gateway merchant integrations (ZainCash, AsiaHawala) &rarr; Feature 007.
* Affiliate link generation and 40% co-prize commissions &rarr; Feature 006.
* Administrative draw execution, RNG triggers, and winner KYC forms &rarr; Feature 008.
* Automated WhatsApp/Email push dispatchers &rarr; Feature 009.
