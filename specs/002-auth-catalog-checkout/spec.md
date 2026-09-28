# Feature Specification: Auth, Catalog & Checkout (MVP Scope)

**Feature Branch**: `002-auth-catalog-checkout`  
**Created**: 2026-09-29  
**Status**: Draft  
**Input**: User description: "Auth + catalog + checkout only: guest (email) + Google login, course parts ($2/1 ticket) and bundle ($10/15 tickets), anti-piracy quiz, checkout bottom-sheet with mandatory legal checkbox, order creation in pending state. Out of scope: payments webhooks, draws, wallet ledger writes, referral payouts — stubbed. Reference PROJECT_CONTEXT.md sections 5, 6 (FR-001..FR-005), 7."

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
4. **Given** the user enters a valid email and ticks the legal checkbox, **When** they click "Confirm Order", **Then** the system registers the user (as a guest identity if not already existing), creates an Order in `pending` status with line items and promotional ticket entitlements recorded, and displays the order summary screen.

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

### User Story 3 - Social Google Authentication & Account Persistence (Priority: P2)

As a returning customer,  
I want to log in using my Google account with one click,  
So that I can access my order history, track my pending orders, and avoid re-entering my email manually.

**Why this priority**: Essential for user retention, returning customer trust, and linking previous guest purchases to an authenticated profile.

**Independent Test**: Can be tested by clicking "Continue with Google", authenticating, and verifying that the user session displays the user's name, email, avatar, and active role in the header HUD.

**Acceptance Scenarios**:
1. **Given** an unauthenticated visitor, **When** they click "Login with Google", **Then** they are redirected through the secure Google authentication flow.
2. **Given** Google returns a valid authenticated identity, **When** the user returns to the platform, **Then** an account is created or matched by email, an authenticated session is established, and the header HUD displays their user profile.
3. **Given** a user previously completed a guest checkout with `student@example.com`, **When** they later log in with a Google account matching `student@example.com`, **Then** their previous orders are associated with their authenticated profile.

---

### User Story 4 - Anti-Piracy Psychological Profiler & Personalization Stamp (Priority: P3)

As a course purchaser,  
I want to complete a brief questionnaire about my learning goals and study schedule,  
So that my course package feels personally customized and legally watermarked to deter unauthorized sharing.

**Why this priority**: Provides psychological ownership and anti-piracy deterrence without requiring invasive client-side DRM software or plugins.

**Independent Test**: Can be tested by completing the 3 questionnaire steps, submitting answers, and verifying that a personalized confirmation stamp is generated and attached to the checkout intent.

**Acceptance Scenarios**:
1. **Given** a user initiates checkout for any course or part, **When** the profiler opens, **Then** they are prompted with three interactive single-choice questions (field of interest, weekly study commitment, and primary goal).
2. **Given** the user selects an answer for all three steps, **When** they advance to completion, **Then** a personalized dynamic confirmation badge is displayed (*"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"*).

---

### Edge Cases

- **Invalid or Malformed Email**: When a guest enters an invalid email format (e.g. `user@`, `user@domain`), the system rejects order creation with an inline validation alert.
- **Duplicate Pending Orders**: If a user submits checkout multiple times rapidly, the system prevents duplicate order creation through client-side submission disabling and server-side request deduplication.
- **Unticked Legal Checkbox**: If the user unchecks the legal agreement, order submission is strictly blocked with zero exceptions.
- **Currency Conversion Fluctuations**: The system freezes the exchange rate at the exact moment the order is created, ensuring that a pending order's IQD equivalent does not fluctuate while awaiting payment.
- **Catalog Navigation on Interrupted Network**: If network connection drops while viewing the catalog, previously loaded courses remain accessible without application crash.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an unauthenticated guest checkout flow requiring only a valid email address.
- **FR-002**: The system MUST provide Google OAuth authentication allowing one-click sign-in and profile synchronization.
- **FR-003**: If a guest checks out with an email that matches an existing account, the order MUST be attributed to that user account.
- **FR-004**: The system MUST display an educational course catalog supporting:
  - Single course parts priced at **$2.00 USD** granting **1 complimentary promotional ticket**.
  - Complete course bundles priced at **$10.00 USD** granting **15 complimentary promotional tickets**.
- **FR-005**: Every course part MUST specify its syllabus summary and deliverable resource types (video embed, audio lesson, PDF document).
- **FR-006**: The system MUST require completion of a 3-step Anti-Piracy Psychological Profiler quiz prior to checkout.
- **FR-007**: The checkout interface MUST render as a responsive mobile-friendly bottom-sheet on small viewports and an accessible modal on desktop screens.
- **FR-008**: The checkout interface MUST include a mandatory, non-pre-checked legal agreement checkbox containing the exact constitutional text:
  > *"أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل"*
- **FR-009**: The system MUST reject order creation if the legal checkbox is not affirmatively accepted.
- **FR-010**: Upon valid submission, the system MUST create an Order record in `pending` state containing:
  - Unique human-readable order number (e.g., `KNZ-ORD-YYYY-XXXX`).
  - Total amount in USD minor units (cents).
  - Frozen accounting exchange rate (`exchange_rate`, e.g. 1 USD = 1,310 IQD) and accounting gateway capture amount (`paid_amount_gateway_iqd`).
  - Separately stored promotional marketing display label (`marketing_display_iqd`, e.g., "2,000 IQD").
  - Explicit record of complimentary promotional tickets granted.
  - IP address and timestamp of affirmative legal terms acceptance.
- **FR-011**: The user interface MUST support full bidirectional localization:
  - Arabic as the default primary language (`dir="rtl"`).
  - English secondary language (`dir="ltr"`).
  - Language toggle that mirrors layout, typography, and controls without page reload.
- **FR-012**: Header HUD (Head-Up Display) MUST display:
  - User identity badge (Guest indicator or Authenticated Name/Avatar).
  - Active ticket count (stubbed/zero for pending orders).
  - Wallet balance display (stubbed at $0.00 until funded).
  - Live social proof marquee ticker.

---

### Scope Boundaries (In-Scope vs. Explicitly Deferred)

| Component | In-Scope (Phase 2 MVP) | Explicitly Out-of-Scope (Deferred to Phase 3) |
| :--- | :--- | :--- |
| **Authentication** | Guest email-only registration, Google OAuth sign-in, session tokens. | Phone SMS OTP, WhatsApp verification, password reset workflows. |
| **Course Catalog** | Listing, details modal, parts pricing ($2), bundle pricing ($10), syllabus preview. | Video player streaming controls, PDF watermarking rendering engine. |
| **Checkout** | Anti-piracy quiz, bottom-sheet UI, mandatory legal shield, `pending` order creation. | Live payment gateway webhooks (Zain Cash, Qi Card, Visa), card tokenization. |
| **Tickets & Draws** | Recording promotional ticket entitlements on orders. | Minting actual ticket codes, live RNG execution, draw countdown timers. |
| **Wallet & Affiliates** | Displaying static/stubbed wallet and ticket HUD. | Dual-ledger balance mutations, Western Union payouts, commission calculations. |

---

### Key Entities *(data model)*

- **User / Identity**: Represents a customer. Attributes: Unique identifier, display name, email, auth provider (`guest`, `google`, `email`), account status (`active`, `banned`), creation timestamp.
- **Course**: Educational curriculum. Attributes: Unique identifier, URL slug, Arabic title, English title, description, cover image, bundle price ($10 USD / 1000 cents), bundle promotional ticket count (15), publication status.
- **Course Part**: Modular chapter within a course. Attributes: Unique identifier, parent course reference, part number (1 to 6), Arabic title, part price ($2 USD / 200 cents), part promotional ticket count (1), resource metadata (video URL, PDF path, audio path).
- **Anti-Piracy Quiz Response**: User profile customization. Attributes: Reference to user or checkout session, sector of interest, weekly study hours, primary goal, completion timestamp.
- **Order**: Educational purchase intent. Attributes: Unique identifier, human-readable order number, customer reference, line items, total amount in cents, currency (`USD`), frozen accounting exchange rate (`exchange_rate`), accounting gateway capture amount (`paid_amount_gateway_iqd`), promotional marketing display label (`marketing_display_iqd`), order status (`pending`, `completed`, `failed`), legal agreement accepted flag, client IP address, creation timestamp.
- **Order Item**: Specific purchased unit. Attributes: Parent order reference, course reference, optional course part reference (null if bundle), item type (`bundle`, `part`), price in cents, promotional tickets granted count.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An unauthenticated guest user can complete the journey from course selection through anti-piracy quiz to a created `pending` order in under **45 seconds** on a standard 3G/4G mobile connection.
- **SC-002**: 100% of created orders strictly record the affirmative legal checkbox acceptance flag and client IP address; zero orders can be generated with a missing or false acceptance flag.
- **SC-003**: Google OAuth login completes and establishes an authenticated session in under **3 seconds** from provider callback.
- **SC-004**: The catalog and checkout bottom-sheet achieve **100% layout responsiveness** with zero horizontal overflow across test viewports from 375px (iPhone SE) to 1920px (Desktop).
- **SC-005**: Language toggle switches document direction (`rtl` &harr; `ltr`) and updates all text content within **100 milliseconds** with zero cumulative layout shift (CLS < 0.05).
- **SC-006**: Invoices and order summaries reflect **100% educational course purchase nomenclature**, with promotional tickets exclusively labeled as complimentary promotional gifts.

---

## Assumptions

1. **Exchange Rate Baseline & Dual-Field Resolution**: The system strictly separates financial accounting from promotional marketing display across two distinct fields:
   - **Accounting Rate & Capture Amount**: The accounting exchange rate is frozen at `1 USD = 1,310 IQD` (making a $2.00 part = 2,620 IQD) stored in `exchange_rate` and `paid_amount_gateway_iqd` for billing and financial reconciliation.
   - **Marketing Display Label**: The human-facing promotional price label (e.g., `2,000 IQD`) is stored in `marketing_display_iqd` strictly as UI display metadata without mutating accounting ledger amounts.
2. **Guest Identity Lifecycle**: A guest user account created via email-only checkout will automatically merge with a Google account if the user subsequently logs in with the identical email address.
3. **No Direct Ticket Minting in this Phase**: Orders in `pending` state only calculate and record the number of promotional tickets to be awarded (`promotional_tickets_granted`); actual unique ticket codes (`KNZ-A15-...`) will only be minted once payment confirmation webhooks are implemented in Phase 3.
4. **Anti-Piracy Quiz Simplicity**: The quiz is designed as a lightweight client-side interactive step for user engagement and psychological commitment; responses are passed into the order metadata without requiring complex server-side scoring.
