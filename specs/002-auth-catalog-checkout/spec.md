# Feature Specification: Auth, Catalog & Checkout (MVP Scope)

**Feature Branch**: `002-auth-catalog-checkout`  
**Created**: 2026-09-29  
**Status**: Draft  
**Input**: User description: "Auth + catalog + checkout only: guest (email) + Google login, course parts ($2/1 ticket) and bundle ($10/15 tickets), anti-piracy quiz, checkout bottom-sheet with mandatory legal checkbox, order creation in pending state. Out of scope: payments webhooks, draws, wallet ledger writes, referral payouts — stubbed. Reference PROJECT_CONTEXT.md sections 5, 6 (FR-001..FR-005), 7."

---

## Clarifications

### Session 2026-09-29

- Q: Which exact Arabic text must be strictly validated on the backend and rendered on the mandatory checkout checkbox? (FR-008) → A: Option A canonical verbatim only: `"أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل"`. Server strictly rejects any non-matching string. Checkbox must be non-pre-checked. Store acceptance flag + client IP + timestamp. Variants B and C rejected.
- Q: How are currency amounts and the exchange rate separated to avoid ledger discrepancies? → A: Single source of truth is `total_amount_cents` (USD integer). Currency is `USD`. Accounting exchange rate is frozen at order creation (`1 USD = 1,310 IQD`) and stored in `exchange_rate`. Converted gateway amount is stored as `paid_amount_gateway` (IQD integer). Marketing display label is stored separately in `display_price_label` (e.g. `"2,000 IQD"`) strictly for UI display and never used in financial calculations.
- Q: How does account merging work when a guest user later logs in with Google? → A: One-way merge only: unverified guest identity merges into verified Google account upon exact email match. Previous pending/completed orders are re-attributed, guest record is deactivated, leaving a single surviving user. Verified accounts are never merged into unverified accounts. Google logins with new emails create new distinct users with no cross-linking.
- Q: How are rapid double-clicks prevented, and what is the lifecycle/TTL of pending orders? → A: Client generates a unique UUID idempotency key per checkout intent, stored permanently under a UNIQUE constraint in MySQL. Submitting an identical key replays the original order with HTTP 200 OK (with Redis fast-path caching during the initial 10-minute double-click window). Starting a new checkout intent requires a new client idempotency key. Multiple distinct pending orders are permitted per user. Each pending order has a 48-hour TTL before auto-expiring to `failed` (accommodating delayed Zain Cash offline payments). Expired pending orders can never mint tickets and never mutate the ledger.
- Q: What is the retake policy for the anti-piracy quiz and how are answers linked to the order? → A: Quiz is bound to checkout intent / `order_id` with `completed_at` and `answers` JSON. Unlimited retakes allowed before Confirm Order; last completed submission persists. Personalization stamp text `"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"` is generated client-side and saved as order metadata. Zero server-side scoring or grading.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frictionless Guest Checkout with Mandatory Legal Shield (Priority: P1)

As a first-time Arabic learner on a mobile phone,  
I want to select an educational course part ($2) or full bundle ($10), answer a brief 3-step customization quiz, enter my active email, and submit an order under clear legal terms,  
So that I can register my order without being forced through a complicated multi-step registration form before I even decide to pay.

**Why this priority**: Conversion is the primary business engine. Forcing account registration before checkout creates high drop-off on regional mobile networks. Guest checkout is the critical path for initial sales.

**Independent Test**: Can be fully tested end-to-end by browsing a course as an unauthenticated visitor, passing the anti-piracy quiz, opening the checkout bottom-sheet, entering an email, ticking the required legal agreement checkbox, and receiving a generated `pending` order confirmation with an order reference number.

**Acceptance Scenarios**:
1. **Given** an unauthenticated visitor on the catalog page, **When** they click "Buy Part 1 ($2)" on any course, **Then** the anti-piracy psychological questionnaire modal opens before checkout.
2. **Given** a user has answered the 3-step quiz, **When** they submit the quiz, **Then** the checkout bottom-sheet opens displaying the selected item, pricing ($2 USD / ~2,000 IQD for a part, or $10 USD for a bundle), the complimentary promotional tickets granted (1 ticket for a part, 15 tickets for a bundle), an email input field, and an unticked legal shield checkbox.
3. **Given** the checkout bottom-sheet is open, **When** the user attempts to submit without ticking the legal checkbox, **Then** the submission is blocked and an error prompts the user to accept the terms.
4. **Given** the user enters a valid email and ticks the legal checkbox, **When** they click "Confirm Order", **Then** the system registers the user (as a guest identity if not already existing), creates an Order in `pending` status with line items, frozen exchange rate, and promotional ticket entitlements recorded, and displays the order summary screen.

---

### User Story 2 - Course Catalog & Micro-Pricing Bundle Exploration (Priority: P1)

As a prospective student,  
I want to browse practical vocational and digital skill courses, inspect their individual parts ($2 each) versus the comprehensive bundle ($10), and view the curriculum details,  
So that I understand the educational value and the savings/promotional advantages of purchasing the complete bundle.

**Why this priority**: Core value proposition. Users must understand what skills they will learn and transparently see pricing and complimentary promotional perks before purchasing.

**Independent Test**: Can be independently tested by navigating the course catalog, expanding course details, verifying part breakdown (Parts 1 to 6 at $2 each) versus bundle ($10 for all 6 parts), and confirming promotional ticket grants are clearly displayed.

**Acceptance Scenarios**:
1. **Given** a visitor viewing the catalog, **When** they inspect a course card, **Then** they see the course title, cover image, brief description, bundle pricing ($10 / 15 tickets), and part pricing ($2 / 1 ticket).
2. **Given** a user viewing course details, **When** they inspect individual parts, **Then** each part displays its syllabus outline, video format indicator, and individual purchase option.
3. **Given** an unauthenticated visitor, **When** they switch the language toggle (AR &harr; EN), **Then** the entire catalog and navigation mirrors direction (`rtl` to `ltr`) and displays translated course metadata.

---

### User Story 3 - Social Google Authentication & One-Way Account Merging (Priority: P2)

As a returning customer,  
I want to log in using my Google account with one click,  
So that I can access my order history, track my pending orders, and have any previous guest purchases seamlessly merged under my verified Google account.

**Why this priority**: Essential for user retention, returning customer trust, and linking previous guest purchases to an authenticated profile.

**Independent Test**: Can be tested by clicking "Continue with Google", authenticating, and verifying that the user session displays the user's name, email, avatar, and active role in the header HUD, with previous guest orders re-attributed.

**Acceptance Scenarios**:
1. **Given** an unauthenticated visitor, **When** they click "Login with Google", **Then** they are redirected through the secure Google authentication flow.
2. **Given** Google returns a valid authenticated identity, **When** the user returns to the platform, **Then** an account is created or matched by email, an authenticated session is established, and the header HUD displays their user profile.
3. **Given** a user previously completed guest checkout(s) with `student@example.com`, **When** they later authenticate via Google with `student@example.com`, **Then** the system executes a one-way merge: all orders belonging to the guest identity are re-attributed to the verified Google account, the guest identity is deactivated, and only the single verified user survives.
4. **Given** a user signs in with a new Google email, **When** authentication completes, **Then** a brand-new user record is provisioned with zero cross-linking to unrelated accounts.

---

### User Story 4 - Anti-Piracy Psychological Profiler & Personalization Stamp (Priority: P3)

As a course purchaser,  
I want to complete a brief questionnaire about my learning goals and study schedule,  
So that my course package feels personally customized and legally watermarked to deter unauthorized sharing.

**Why this priority**: Provides psychological ownership and anti-piracy deterrence without requiring invasive client-side DRM software or plugins.

**Independent Test**: Can be tested by completing the 3 questionnaire steps, submitting answers, retaking if desired before confirmation, and verifying that the final completed answer set and personalized confirmation stamp persist with the order.

**Acceptance Scenarios**:
1. **Given** a user initiates checkout for any course or part, **When** the profiler opens, **Then** they are prompted with three interactive single-choice questions (field of interest, weekly study commitment, and primary goal).
2. **Given** the user answers questions, **When** they choose to retake the quiz prior to clicking "Confirm Order", **Then** retakes are permitted without restriction, and the last completed response set overwrites previous attempts.
3. **Given** the user completes the quiz, **When** they advance to checkout, **Then** a personalized dynamic confirmation badge is displayed (*"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"*), and the answers are bound to the pending order metadata.

---

### Edge Cases

- **Invalid or Malformed Email**: When a guest enters an invalid email format (e.g. `user@`, `user@domain`), the system rejects order creation with an inline validation alert.
- **Rapid Double-Click Submission**: Client generates a unique idempotency key per checkout intent, backed by a permanent database UNIQUE constraint and an active 10-minute Redis duplicate lock. Re-submitting the same key replays the existing order reference with HTTP 200 OK without creating a duplicate record.
- **Multiple Legitimate Orders**: A user is permitted to hold multiple distinct `pending` orders concurrently (e.g. buying different course parts or gifts for friends).
- **Pending Order Expiration (48-Hour TTL)**: A `pending` order that receives no payment confirmation within 48 hours is automatically marked `failed`. Expired pending orders can never mint tickets and can never mutate the ledger.
- **Unticked or Non-Matching Legal Checkbox**: If the user unchecks the legal agreement, or if a manipulated payload transmits any string other than the canonical verbatim text, the server strictly rejects order creation.
- **One-Way Merge Protection**: A verified Google account is never merged into an unverified guest record; merging operates strictly one-way (unverified guest &rarr; verified Google account).
- **Network Interruptions**: If connection drops while viewing the catalog, previously loaded courses remain accessible without application crash.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an unauthenticated guest checkout flow requiring only a valid email address.
- **FR-002**: The system MUST provide Google OAuth authentication allowing one-click sign-in and profile synchronization.
- **FR-003**: The system MUST execute a one-way identity merge when a user authenticates via Google with an email matching an unverified guest identity:
  - All existing pending and completed orders attributed to the guest email MUST be re-attributed to the verified Google account.
  - The guest user record MUST be deactivated, leaving a single surviving verified user record.
  - Verified user accounts MUST NEVER be merged into unverified guest accounts.
  - Google sign-in with a new email MUST create a separate user with zero cross-linking.
- **FR-004**: The system MUST display an educational course catalog supporting:
  - Single course parts priced at **$2.00 USD** granting **1 complimentary promotional ticket**.
  - Complete course bundles priced at **$10.00 USD** granting **15 complimentary promotional tickets**.
- **FR-005**: Every course part MUST specify its syllabus summary and deliverable resource types (video embed, audio lesson, PDF document).
- **FR-006**: The system MUST require completion of a 3-step Anti-Piracy Psychological Profiler quiz prior to checkout.
- **FR-007**: The checkout interface MUST render as a responsive mobile-friendly bottom-sheet on small viewports and an accessible modal on desktop screens.
- **FR-008**: The checkout interface MUST include a mandatory, non-pre-checked legal agreement checkbox containing the exact canonical constitutional verbatim text:
  > *"أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل"*
- **FR-009**: The server MUST strictly validate the legal agreement text:
  - If the checkbox is false, missing, or transmits any modified string (including shortened draft variants), the server MUST reject order creation with HTTP 422 Unprocessable Entity.
  - Upon valid acceptance, the system MUST record `legal_terms_agreed = true`, `terms_agreed_ip`, and `terms_agreed_at`.
- **FR-010**: Upon valid submission, the system MUST create an Order record in `pending` state containing:
  - Unique human-readable order number (e.g., `KNZ-ORD-YYYY-XXXX`).
  - Total amount in USD minor units (`total_amount_cents` integer, e.g. 200 for $2.00, 1000 for $10.00) as the financial source of truth.
  - Currency explicitly set to `USD`.
  - Frozen accounting exchange rate (`exchange_rate` DECIMAL, e.g., `1 USD = 1,310 IQD`).
  - Converted accounting gateway capture amount in Iraqi Dinars (`paid_amount_gateway` integer, e.g., 2,620 IQD for $2.00).
  - Separately stored promotional marketing display string (`display_price_label` VARCHAR, e.g., `"2,000 IQD"`), strictly for customer UI presentation and never used in financial calculations.
  - Explicit record of complimentary promotional tickets granted (`promotional_tickets_granted`).
  - Client-generated idempotency key (`idempotency_key`).
  - Order expiration timestamp (`expires_at`, set to `created_at + 48 hours`).
- **FR-011**: The system MUST enforce idempotency deduplication on order creation:
  - The `idempotency_key` MUST be permanently unique per order in the database; requests submitted with an identical `idempotency_key` MUST return the existing order with HTTP 200 OK without creating duplicate database rows (with Redis providing sub-second fast-path deduplication during the active 10-minute window).
  - Multiple distinct pending orders are permitted per user (each requiring a distinct client-generated idempotency key).
- **FR-012**: The system MUST enforce a 48-hour time-to-live (TTL) on pending orders:
  - Orders remaining in `pending` state after 48 hours MUST be transitioned to `failed`.
  - Expired pending orders can NEVER mint promotional tickets and can NEVER mutate wallet ledgers.
- **FR-013**: The Anti-Piracy Quiz MUST support unlimited retakes prior to order confirmation:
  - The user MAY retake the quiz at any time before clicking "Confirm Order", with the last completed submission persisting.
  - The client MUST issue the personalized stamp: *"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"*.
  - Completed answers MUST be stored as JSON metadata (`quiz_answers`) linked to the order, with zero server-side scoring or grading.
- **FR-014**: The user interface MUST support full bidirectional localization:
  - Arabic as the default primary language (`dir="rtl"`).
  - English secondary language (`dir="ltr"`).
  - Language toggle that mirrors layout, typography, and controls without page reload.
- **FR-015**: Header HUD (Head-Up Display) MUST display:
  - User identity badge (Guest indicator or Authenticated Name/Avatar).
  - Active ticket count (stubbed/zero for pending orders).
  - Wallet balance display (stubbed at $0.00 until funded).
  - Live social proof marquee ticker.

---

### Scope Boundaries (In-Scope vs. Explicitly Deferred)

| Component | In-Scope (Phase 2 MVP) | Explicitly Out-of-Scope (Deferred to Phase 3) |
| :--- | :--- | :--- |
| **Authentication** | Guest email-only registration, Google OAuth sign-in, session tokens, one-way account merge. | Phone SMS OTP, WhatsApp verification, password reset workflows. |
| **Course Catalog** | Listing, details modal, parts pricing ($2), bundle pricing ($10), syllabus preview. | Video player streaming controls, PDF watermarking rendering engine. |
| **Anti-Piracy** | 3-step questionnaire modal, retake-before-confirm, client personalization stamp, answers JSON on order. | Server-side quiz scoring or grading. |
| **Checkout** | Bottom-sheet UI, canonical legal shield validation, dedup 10-min window, 48h TTL, `pending` order creation. | Live payment gateway webhooks (Zain Cash, Qi Card, Visa), card tokenization. |
| **Tickets & Draws** | Recording promotional ticket entitlements on orders (`promotional_tickets_granted`). | Minting actual ticket codes (`KNZ-A15-...`), live RNG execution, draw countdown timers. |
| **Wallet & Affiliates** | Displaying static/stubbed wallet and ticket HUD. | Dual-ledger balance mutations, Western Union payouts, commission calculations. |

---

### Key Entities *(data model)*

- **User / Identity**: Represents a customer. Attributes: Unique identifier (`id` UUID), display name, email, auth provider (`guest`, `google`), provider ID (for Google sub), account status (`active`, `deactivated`), creation timestamp.
- **Course**: Educational curriculum. Attributes: Unique identifier (`id` UUID), URL slug, Arabic title, English title, description, cover image, bundle price in USD cents (`1000`), bundle promotional ticket count (`15`), publication status.
- **Course Part**: Modular chapter within a course. Attributes: Unique identifier (`id` UUID), parent course reference, part number (1 to 6), Arabic title, part price in USD cents (`200`), part promotional ticket count (`1`), resource metadata (video URL, PDF path, audio path).
- **Order**: Educational purchase intent. Attributes:
  - `id` (UUID, PK)
  - `order_number` (VARCHAR, Unique, e.g., `'KNZ-ORD-2026-0001'`)
  - `user_id` (UUID, FK -> `users.id`)
  - `total_amount_cents` (BIGINT, USD minor units, source of truth)
  - `currency` (CHAR(3), `'USD'`)
  - `exchange_rate` (DECIMAL(10,4), frozen at `1.3100`)
  - `paid_amount_gateway` (BIGINT, integer IQD gateway capture amount)
  - `display_price_label` (VARCHAR, e.g., `'2,000 IQD'`)
  - `promotional_tickets_granted` (INT, complimentary promotional tickets)
  - `status` (ENUM: `'pending'`, `'completed'`, `'failed'`, `'refunded'`)
  - `idempotency_key` (VARCHAR, Unique, 10-minute dedup window)
  - `legal_terms_agreed` (BOOLEAN, must be true)
  - `terms_agreed_ip` (VARCHAR(45))
  - `terms_agreed_at` (TIMESTAMP)
  - `quiz_answers` (JSON, last completed answer set)
  - `quiz_completed_at` (TIMESTAMP)
  - `expires_at` (TIMESTAMP, `created_at + 48 hours`)
  - `created_at` (TIMESTAMP)
- **Order Item**: Specific purchased unit. Attributes:
  - `id` (BIGINT AUTO_INCREMENT, PK)
  - `order_id` (UUID, FK -> `orders.id`)
  - `course_id` (UUID, FK -> `courses.id`)
  - `course_part_id` (UUID, FK -> `course_parts.id`, Nullable if bundle)
  - `item_type` (ENUM: `'bundle'`, `'part'`)
  - `price_cents` (INT)
  - `promotional_tickets_granted` (INT)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An unauthenticated guest user can complete the journey from course selection through anti-piracy quiz to a created `pending` order in under **45 seconds** on a standard 3G/4G mobile connection.
- **SC-002**: 100% of created orders strictly record the affirmative legal checkbox acceptance flag, client IP address, and exact canonical string; zero orders can be generated with a missing, false, or modified string.
- **SC-003**: Google OAuth login completes and establishes an authenticated session in under **3 seconds** from provider callback, executing one-way merge of matching guest orders in < 500ms.
- **SC-004**: Duplicate submissions with identical idempotency keys within 10 minutes return HTTP 200/409 with the original order reference and result in exactly **1 database order record**.
- **SC-005**: 100% of orders preserve the dual-currency separation: `total_amount_cents` is the unmutated financial source of truth, `exchange_rate` is frozen, and `display_price_label` is isolated from ledger math.
- **SC-006**: The catalog and checkout bottom-sheet achieve **100% layout responsiveness** with zero horizontal overflow across test viewports from 375px (iPhone SE) to 1920px (Desktop).
- **SC-007**: Language toggle switches document direction (`rtl` &harr; `ltr`) and updates all text content within **100 milliseconds** with zero cumulative layout shift (CLS < 0.05).
- **SC-008**: Invoices and order summaries reflect **100% educational course purchase nomenclature**, with promotional tickets exclusively labeled as complimentary promotional gifts.

---

## Assumptions

1. **Exchange Rate Baseline & Dual-Field Separation**: The accounting exchange rate is frozen at `1 USD = 1,310 IQD` (making a $2.00 part = 2,620 IQD) stored in `exchange_rate` and `paid_amount_gateway` for billing and financial reconciliation. The marketing display label (e.g., `"2,000 IQD"`) is stored in `display_price_label` strictly as UI display metadata without mutating accounting ledger amounts.
2. **One-Way Identity Merging**: Guest accounts (unverified email) merge into verified Google accounts strictly one-way upon exact email match. Guest records are deactivated upon merge; verified accounts are never merged into unverified accounts.
3. **Order TTL & Dedup**: Pending orders remain valid for 48 hours to accommodate offline payment confirmation (Zain Cash agents/cash-in). Rapid client resubmissions within 10 minutes are deduplicated via client idempotency keys.
4. **No Direct Ticket Minting in this Phase**: Orders in `pending` state only calculate and record the number of promotional tickets to be awarded (`promotional_tickets_granted`); actual unique ticket codes (`KNZ-A15-...`) will only be minted once payment confirmation webhooks are implemented in Phase 3.
5. **Anti-Piracy Quiz Persistence**: The quiz is designed as a client-side interactive commitment step with unlimited retakes before confirmation; the last completed answer set is stored as order JSON metadata with zero server-side scoring or grading.
