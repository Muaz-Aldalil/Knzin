# Feature Specification: Front-of-House Trust, Engagement & Social Proof Suite (منظومة الثقة والتفاعل والإثبات الاجتماعي)

**Feature Branch**: `004-front-of-house-trust-engagement`  
**Created**: 2026-09-30  
**Status**: Draft  
**Input**: User description: "Front-of-House Trust, Engagement & Social Proof Suite covering: (1) The Hook / Vision Narrative section on homepage; (2) 'How It Works' 3-step interactive header modal; (3) Live Social Proof & Activity Ticker streaming recent course purchases and countdown urgency; (4) Floating WhatsApp Customer Support button across all pages; (5) Public FAQ & Objection Handling accordion; (6) Winner KYC Verification Transparency Disclaimer. Public-facing trust and onboarding only; strictly no payment gateway implementations, backend ticket serial minting, or authenticated learner library code."

---

## Clarifications & Ground Truth Alignment

### Session 2026-09-30 (Rigorous Pre-Plan Clarification Gate)

- **Q: What privacy level and data format should the Activity Ticker use when presenting recent customer course enrollments? (FR-006, FR-007)**  
  → **A:** Display first name with governorate only (e.g. *«أحمد من بغداد»*), strictly stripping email addresses, phone numbers, full surnames, and internal database order UUIDs to prevent personally identifiable information (PII) leakage.

- **Q: Can the Activity Ticker display simulated customer purchase events with generated names, or must customer notifications represent verified platform orders? (FR-010)**  
  → **A:** Customer purchase notifications MUST represent strictly verified platform orders. Fabricated or simulated customer names are prohibited; during quiet or low-volume periods, the ticker gracefully falls back to static educational bulletins and live draw countdown alarms.

- **Q: What exact behavior should occur if the WhatsApp support URL configuration is missing or invalid in the environment? (FR-013, FR-014)**  
  → **A:** Clicking the floating support button opens an accessible in-app fallback dialog providing the official platform contact email (`support@knzin.com`) and a direct link to the FAQ section (`#faq`), without fabricating phone numbers or failing silently.

- **Q: When a user navigates to a section anchor (such as "/#faq" or "/#vision") from a subpage, how should the transition and scroll position be coordinated? (FR-017)**  
  → **A:** Cross-route section navigation transitions to the homepage route, awaits component hydration/mounting, and smoothly scrolls to the target container with an explicit minimum 80px top clearance offset to clear the sticky Header HUD.

- **Q: How should the Winner KYC requirement be bounded in Feature 004 to prevent scope leakage from later features? (FR-018, FR-019)**  
  → **A:** Feature 004's KYC requirement is strictly an informational, read-only legal transparency disclaimer card on `/raffle` and within the FAQ. Zero document-upload forms, file verification APIs, or identity storage workflows are implemented in this feature (reserved for Feature 008).

- **Q: Where should the "How It Works" (كيف تعمل كَنزين؟) trigger be placed on mobile viewports (<1024px)? (FR-003)**  
  → **A:** Dual-surface mounting: a dedicated prominent button inside the mobile navigation drawer AND a compact question-mark shortcut icon in the sticky mobile header HUD, guaranteeing 1-to-2 click access from any public screen.

- **Q: How should the public FAQ accordion items be displayed when first loaded? (FR-015)**  
  → **A:** The first question in each category is expanded by default to invite reading and demonstrate interactivity, with remaining questions collapsed. Follows standard WAI-ARIA accordion keyboard accessibility (`Tab` to focus header, `Enter` or `Space` to toggle).

- **Q: Where does the "The Hook / Vision Narrative" section belong on the homepage, and what is its verbatim text? (FR-001, FR-002)**  
  → **A:** Positioned on the homepage between the Hero Grand Prize Countdown and the Course Showcase. It communicates the verbatim Arabic founder philosophy from the master brief:  
  *«نحن نؤمن بأن الشباب يحتاجون إلى المهارة ورأس المال معاً. لذلك، نحن نعلمك مهارات العمل الحر، ونمنحك فرصة لربح تمويل مشروعك في نفس الوقت.»*  
  (English: *"We believe youth need both skill and capital together. Therefore, we teach you freelance skills, while giving you the chance to win funding for your project at the same time."*).



---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Header "How It Works" 3-Step Interactive Onboarding (Priority: P1)

As a first-time visitor landing on KNZiN,  
I want to click a quick "How It Works" button in the header navigation to see an immediate 3-step explanation of the platform model,  
So that I instantly understand that I am buying educational vocational training and receiving complimentary promotional draw entries without reading lengthy legal texts.

**Why this priority**: Eliminates initial visitor confusion and addresses skepticism within the first 5 seconds of browsing. It establishes the non-gambling educational nature of the platform immediately.

**Independent Test**: Can be tested independently on any viewport by clicking the "كيف تعمل كَنزين؟" / "How It Works" button in the Header HUD, verifying the 3-step modal dialog opens with focus trapped, displays all 3 steps with clear iconography, and closes via Escape key, close button, or backdrop click.

**Acceptance Scenarios**:
1. **Given** a visitor is on any public page (desktop or mobile), **When** they click or activate the *"كيف تعمل كَنزين؟"* (or *"How It Works"*) button in the header, **Then** an accessible dialog modal opens instantly without changing routes.
2. **Given** the modal is open, **When** the visitor views the content, **Then** it clearly renders the 3 sequential steps:
   - Step 1: **اختر الكورس والمهارة** (Choose your vocational course part for $2 or bundle for $10).
   - Step 2: **استلم تذكرتك المجانية** (Instantly receive complimentary zero-cost promotional draw tickets).
   - Step 3: **تابع السحب المباشر** (Watch the transparent electronic draw broadcast on YouTube Live).
3. **Given** the modal is open, **When** the visitor presses the `Escape` key, clicks the explicit close button, or clicks outside the modal overlay, **Then** the modal closes and keyboard focus returns cleanly to the originating trigger button.
4. **Given** the user switches language between Arabic and English, **When** the modal opens, **Then** the sequence order, text alignment, and visual arrows respect directionality (`rtl` flows right-to-left; `ltr` flows left-to-right).

---

### User Story 2 - The Hook / Vision Narrative Experience (Priority: P1)

As a prospective learner exploring the homepage,  
I want to read the platform's vision narrative and founder mission,  
So that I understand the legitimate purpose of KNZiN (combining vocational empowerment with project startup capital) rather than viewing it as a generic sweepstakes or lottery.

**Why this priority**: Directly implements Requirement Section 3 of the master brief (*"The Hook"*). This section transforms KNZiN from a transactional sweepstakes into a noble vocational movement, establishing critical brand legitimacy in Arab markets.

**Independent Test**: Can be tested independently by navigating to the homepage (`/ar` and `/en`), confirming the Hook section renders between the Hero Countdown and the Course Catalog with the exact authoritative Arabic text, proper typography, and responsive styling.

**Acceptance Scenarios**:
1. **Given** a visitor scrolls down the homepage, **When** passing the Hero Grand Prize Countdown, **Then** they encounter the dedicated Hook Narrative section before the course grid.
2. **Given** the Hook section is rendered in Arabic (`/ar`), **When** viewed by the user, **Then** the primary heading and quote display the exact canonical text:  
   *«نحن نؤمن بأن الشباب يحتاجون إلى المهارة ورأس المال معاً. لذلك، نحن نعلمك مهارات العمل الحر، ونمنحك فرصة لربح تمويل مشروعك في نفس الوقت.»*
3. **Given** the Hook section is rendered in English (`/en`), **When** viewed by the user, **Then** the translated narrative preserves the exact meaning and tone without layout clipping or text overlap.
4. **Given** a visitor navigates via a deep-link hash (`/#vision` or `/#the-hook`), **When** the page loads, **Then** the browser scrolls smoothly to the narrative section with exact sticky-header clearance.

---

### User Story 3 - Real-Time Social Proof & Activity Ticker (Priority: P2)

As an undecided visitor browsing courses and draws,  
I want to see a live activity ticker showing recent platform transactions, ticket awards, and upcoming draw countdown alarms,  
So that I experience community momentum, urgency, and social proof that encourages me to enroll.

**Why this priority**: Implements Section 4 of the master brief (*"الإشعارات الحية - Live Hooks"*). Continuous activity streams create FOMO (fear of missing out) and demonstrate that real learners across Iraq and the Arab world are actively participating.

**Independent Test**: Can be tested independently by observing the Activity Ticker on the homepage and catalog views, verifying that items stream smoothly, cycle through purchase/ticket/countdown alerts, pause when hovered or focused, and gracefully fall back to verified announcements when no dynamic events are available.

**Acceptance Scenarios**:
1. **Given** a visitor views the homepage or catalog, **When** the Activity Ticker is rendered below the Header HUD, **Then** it continuously presents rotating activity items including:
   - Recent course purchases & ticket awards (e.g. *«علي من بغداد اشترى الجزء الأول من كورس غسل السيارات وحصل على تذكرة!»*).
   - Sales volume momentum (e.g. *«تم بيع 15 نسخة من البكج الكامل في آخر 10 دقائق»*).
   - Draw countdown urgency alerts (e.g. *«تبقت ساعتان على سحب تمويل المصنع ($100,000)!»*).
2. **Given** a visitor hovers their mouse pointer or focuses via keyboard on the ticker, **When** active, **Then** the scrolling animation pauses immediately to allow reading, resuming smoothly on blur/pointer leave.
3. **Given** a user has `prefers-reduced-motion: reduce` enabled in their operating system, **When** viewing the ticker, **Then** continuous scrolling is disabled; items transition discretely or display as a static paginated bulletin.
4. **Given** the user changes locale, **When** the ticker scrolls, **Then** Arabic text streams right-to-left and English text streams left-to-right with proper typography and numerical formatting.

---

### User Story 4 - Public FAQ & Objection Handling Accordion (Priority: P2)

As a skeptical user with questions about payment, ticket delivery, or draw fairness,  
I want an intuitive, searchable FAQ section on the website,  
So that I can find immediate answers to fundamental questions without needing to contact customer support.

**Why this priority**: Directly mandated by Section 1 ("الأسئلة الشائعة") of the master brief to reduce customer support load by answering core operational and legal questions upfront.

**Independent Test**: Can be tested independently by navigating to `#faq` on the homepage or dedicated route, clicking each accordion trigger to verify smooth expansion/collapse, testing keyboard tab/enter navigation, and confirming deep-link synchronization.

**Acceptance Scenarios**:
1. **Given** a visitor navigates to the FAQ section (via `#faq` in the header or scrolling), **When** the section renders, **Then** it displays an organized accordion with distinct categories:
   - *آلية المنصة والتذاكر (Platform Model & Free Promotional Tickets)*
   - *استلام المواد التعليمية (Accessing Digital Course Downloads & Video)*
   - *نزاهة السحوبات والبث المباشر (Draw Audits & YouTube Live Streaming)*
   - *الأرباح ونظام الإحالة (Referral System & The 40% Co-Prize)*
   - *شروط تسليم الجوائز والتحقق (Winner Identification & KYC Requirements)*
2. **Given** an accordion item is collapsed, **When** a user clicks the header or presses `Enter`/`Space` while focused, **Then** it expands smoothly, revealing the detailed answer and updating `aria-expanded="true"`.
3. **Given** a user accesses the page with a hash fragment (e.g. `/#faq`), **When** navigation completes, **Then** the viewport aligns with the FAQ container with explicit clearance for the sticky Header HUD.

---

### User Story 5 - Persistent Floating WhatsApp Customer Support (Priority: P3)

As a mobile or desktop visitor experiencing payment doubt or connection questions,  
I want a persistent WhatsApp floating button accessible on all public pages,  
So that I can reach human customer care with a single tap to resolve pre-sales inquiries.

**Why this priority**: Fulfills Section 5 of the operational requirements in the master brief (*"Floating WhatsApp Button"*). In the Iraqi and MENA market, WhatsApp is the dominant channel for pre-sales reassurance and real-time payment troubleshooting.

**Independent Test**: Can be tested independently by visiting any public page across mobile and desktop, verifying the floating button is positioned correctly according to RTL/LTR conventions, remains non-obstructive to footer and checkout drawers, and initiates a secure external navigation to the configured WhatsApp URL.

**Acceptance Scenarios**:
1. **Given** a visitor is on any public route (`/ar`, `/en`, `/courses/*`, `/raffle`), **When** the page renders, **Then** a fixed floating WhatsApp support icon appears anchored at the layout inline-end (`bottom-6 end-6`).
2. **Given** the page is in Arabic (`dir="rtl"`), **When** the button is positioned, **Then** it anchors cleanly at the bottom-left corner of the viewport without overlapping navigation controls.
3. **Given** the page is in English (`dir="ltr"`), **When** the button is positioned, **Then** it anchors cleanly at the bottom-right corner of the viewport.
4. **Given** a user clicks or taps the WhatsApp button, **When** the action fires, **Then** it opens the configured WhatsApp support link in a new browser tab (`target="_blank"` with `rel="noopener noreferrer"`) pre-filled with an initial greeting (e.g. *"مرحباً، لدي استفسار حول منصة كنزين"*).
5. **Given** the checkout bottom sheet drawer opens, **When** the drawer covers the viewport, **Then** the floating WhatsApp button gracefully lowers its z-index or hides to prevent obstructing payment actions.

---

### User Story 6 - Public Winner KYC Compliance & Legal Transparency (Priority: P3)

As a participant evaluating the legitimacy of KNZiN prize claims,  
I want to inspect the public Winner Verification & KYC compliance rules,  
So that I know upfront what identity documents are required to claim a prize and trust that awards are disbursed only to verified individuals.

**Why this priority**: Mandated by the legal appendix of the master brief (*"آلية التحقق من الفائزين"*). Publishing KYC requirements publicly ensures users understand that guest checkout requires real email addresses matching their official identity for major prize disbursement.

**Independent Test**: Can be tested independently by reviewing the transparency section on `/raffle` and the FAQ, confirming the mandatory National ID (بطاقة وطنية) claim clause is visibly presented with the exact legal disclaimer.

**Acceptance Scenarios**:
1. **Given** a visitor views the legal transparency area on `/raffle` or within the FAQ accordion, **When** inspecting prize claims, **Then** a prominent verified disclaimer card displays the verbatim requirement:  
   *«شرط تسليم الجوائز: يُلزم الفائز بتقديم إثبات هوية رسمي يطابق البيانات الأساسية (مثل البريد الإلكتروني) التي تم الشراء بها، وللإدارة الحق في حجب الجائزة في حال ثبوت تلاعب أو استخدام بطاقات دفع مسروقة.»*
2. **Given** an English-speaking visitor views the card on `/en/raffle`, **When** rendered, **Then** the card displays the accurate English legal disclaimer maintaining the same binding compliance terms.
3. **Given** the KYC disclaimer card renders, **When** inspected for scope, **Then** it clearly states requirements without presenting premature document-upload forms (which belong strictly to post-draw authenticated winner workflows in later features).

---

## Edge Cases

- **No Dynamic Social Proof Events**: When the platform has zero dynamic purchase events (e.g. new installation or quiet periods), the Activity Ticker MUST render verified static educational bulletins and draw countdown alerts rather than generating deceptive fake customer names or collapsing into an empty, jarring layout gap.
- **Missing WhatsApp Configuration**: If `NEXT_PUBLIC_WHATSAPP_SUPPORT_URL` is unset or empty in the deployment environment, clicking the floating support button MUST open an accessible in-app fallback dialog displaying the official platform contact email (`support@knzin.com`) and a direct link to the FAQ section (`#faq`), without dead redirects or broken links.
- **Modal Opened via Keyboard with Deep-Link Navigation**: When the "How It Works" modal is opened via keyboard `Enter` or `Space`, keyboard focus MUST remain trapped inside the modal until dismissed. Upon closing, focus MUST return precisely to the originating trigger button.
- **RTL/LTR Text Inversion in Mixed Ticker Strings**: When ticker messages contain alphanumeric codes, currency amounts, or English trade terms mixed with Arabic text (e.g. *«اشترى كورس غسل السيارات وحصل على 15 تذكرة بقيمة $10»*), all mixed strings MUST be isolated with `<bdi>` elements to prevent punctuation and numeral flipping.
- **Viewport Resize While Modal is Open**: If a mobile visitor rotates their device or resizes their viewport while the "How It Works" dialog is open, the modal MUST maintain maximum viewport constraints (`max-w-lg`, `max-h-[85vh]`) with internal vertical scroll, preventing body scroll leakage.
- **Cross-Route Section Navigation & Sticky Header Clearance**: When a user navigates to `/#faq` or `/#vision` from an external route (e.g. `/raffle` or `/courses/[slug]`) or from within the same page, the navigation MUST await component mount/hydration and smoothly scroll to the anchor element with an explicit minimum 80px top clearance offset to prevent the sticky Header HUD from obscuring headings.
- **Reduced Motion Preference**: When `prefers-reduced-motion: reduce` is detected via CSS media queries, continuous marquee animations MUST cease immediately, switching to static display or discrete manual step controls.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display The Hook Vision Narrative on the homepage positioned between the Hero Grand Prize Countdown and the Course Showcase.
- **FR-002**: The Hook Vision Narrative MUST display the canonical Arabic text: *«نحن نؤمن بأن الشباب يحتاجون إلى المهارة ورأس المال معاً. لذلك، نحن نعلمك مهارات العمل الحر، ونمنحك فرصة لربح تمويل مشروعك في نفس الوقت.»* with corresponding high-fidelity English localization on `/en`.
- **FR-003**: System MUST provide an accessible *"كيف تعمل كَنزين؟"* (How It Works) trigger button in the persistent Header HUD navigation on desktop, mirrored on mobile (<1024px) as both a dedicated button inside the mobile navigation drawer AND a compact question-mark shortcut icon in the sticky mobile header.
- **FR-004**: Clicking the "How It Works" trigger MUST open a modal dialog presenting the 3 canonical steps: `(1. اختر الكورس ➔ 2. استلم تذكرتك المجانية ➔ 3. تابع السحب المباشر)` with illustrative icons and brief explanatory copy.
- **FR-005**: The "How It Works" modal MUST implement full keyboard accessibility: trapping focus inside the dialog, closing upon `Escape` keypress, and returning focus to the trigger upon dismissal.
- **FR-006**: System MUST render an Activity Ticker streaming recent educational purchases, promotional ticket issuances, and upcoming draw countdown alarms, fetched via lightweight periodic client polling (every 30–60s) of public recent events.
- **FR-007**: Activity Ticker items presenting customer purchases MUST strictly preserve privacy by displaying customer first name and governorate only (e.g. *«أحمد من بغداد»*), strictly stripping email addresses, phone numbers, full surnames, and internal database order UUIDs.
- **FR-008**: Activity Ticker items MUST be semantically isolated using `<bdi>` tags to guarantee correct bidirectional text shaping for mixed Arabic, English, and numeric content.
- **FR-009**: Activity Ticker MUST immediately pause animation when hovered by a mouse cursor or focused via keyboard.
- **FR-010**: Activity Ticker MUST respect `prefers-reduced-motion: reduce`, replacing continuous scrolling with static or manual navigation.
- **FR-011**: Activity Ticker customer purchase notifications MUST represent strictly verified platform orders (no fabricated/simulated customer names); falling back to static educational bulletins and live countdown alarms during quiet periods.
- **FR-012**: System MUST render a persistent floating WhatsApp customer care button visible across all public routes (`/ar`, `/en`, `/courses/*`, `/raffle`).
- **FR-013**: Floating WhatsApp button MUST be positioned at the inline-end of the viewport using CSS logical properties (`bottom-6 end-6`), mirroring automatically between Arabic (bottom-left) and English (bottom-right).
- **FR-014**: Floating WhatsApp button MUST read its destination endpoint from configuration (`NEXT_PUBLIC_WHATSAPP_SUPPORT_URL`), opening directly in a new tab with `rel="noopener noreferrer"` and pre-filling the greeting: *"مرحباً، لدي استفسار حول منصة كَنزين"* (English: *"Hello, I have an inquiry about KNZiN"*).
- **FR-015**: If the WhatsApp support URL configuration is missing or invalid in the environment, clicking the button MUST open an accessible in-app fallback dialog displaying the official platform contact email (`support@knzin.com`) and a direct link to the FAQ section (`#faq`).
- **FR-016**: System MUST provide an accessible FAQ Accordion section on the homepage and/or dedicated view answering core objection-handling topics from the master brief, with the first question in each category expanded by default and remaining questions collapsed.
- **FR-017**: FAQ Accordion MUST follow standard WAI-ARIA accordion keyboard accessibility (`Tab` to focus header, `Enter` or `Space` to toggle, `ArrowUp`/`ArrowDown` for header navigation).
- **FR-018**: FAQ Accordion MUST organize questions into logical groups: Platform Model, Course Downloads, Draw Audits, Referral System, and Prize Claims.
- **FR-019**: Same-page and cross-route navigation to section anchors (`/#faq`, `/#vision`) MUST await component hydration/mounting and smoothly scroll to the target container with an explicit minimum 80px top clearance offset to clear the sticky Header HUD.
- **FR-020**: System MUST display a prominent Winner KYC Disclaimer card embedded within the Raffle Transparency section on `/raffle` AND highlighted as an official compliance callout inside the FAQ Prize Claims category.
- **FR-021**: Winner KYC Disclaimer MUST be strictly an informational, read-only legal transparency notice rendering the verbatim requirement: *«شرط تسليم الجوائز: يُلزم الفائز بتقديم إثبات هوية رسمي يطابق البيانات الأساسية (مثل البريد الإلكتروني) التي تم الشراء بها، وللإدارة الحق في حجب الجائزة في حال ثبوت تلاعب أو استخدام بطاقات دفع مسروقة.»*; with zero document upload forms, verification endpoints, or identity storage workflows in Feature 004.
- **FR-022**: All new UI components MUST be fully responsive across mobile (375px+), tablet, and desktop (up to 1920px).
- **FR-023**: All text, badges, and controls MUST support bilingual localization (Arabic `dir="rtl"` primary, English `dir="ltr"` secondary) adhering strictly to the Google Tajawal font family.
- **FR-024**: Touch targets for all interactive triggers (modal open/close, accordion headers, WhatsApp button) MUST be at least `44x44px`.
- **FR-025**: The "How It Works" 3-step explanation MUST be accessible within 1 to 2 clicks from any public page (1 click via desktop HUD or mobile header shortcut icon; 2 clicks via mobile navigation drawer).

---

### Key Entities

- **ActivityTickerItem**: Represents an event displayed in the activity ticker (id, type: `order_placed`, `ticket_granted`, `draw_countdown_alert`, `announcement`, timestamp, localized_text, highlight_label).
- **FaqItem**: Represents a structured question-and-answer entry (id, category, question_ar, question_en, answer_ar, answer_en, display_order).
- **HowItWorksStep**: Represents a step in the onboarding modal (step_number: 1..3, title_ar, title_en, description_ar, description_en, icon_name).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of first-time visitors can access and review the "How It Works" 3-step explanation within 2 clicks from any public page.
- **SC-002**: The Hook Vision Narrative is visible on the homepage within 1 scroll viewport below the hero section, rendering verbatim Arabic founder text with zero typography clipping.
- **SC-003**: Activity Ticker pauses within 50ms of mouse-hover or keyboard-focus and produces zero cumulative layout shift (CLS = 0.00) during text updates.
- **SC-004**: Floating WhatsApp button is persistently visible across all public viewports with minimum touch target dimensions of 48x48px, respecting RTL/LTR end-alignment.
- **SC-005**: FAQ Accordion expands and collapses with smooth CSS transitions (<250ms) and passes all keyboard accessibility checks (`Tab`, `Enter`, `Space`, `ArrowUp`, `ArrowDown`).
- **SC-006**: Target hash navigation (`/#faq`, `/#vision`) reliably clears the sticky Header HUD by at least 80px across both mobile and desktop viewports.
- **SC-007**: 100% of draw and raffle transparency sections explicitly render the mandatory KYC national ID disclaimer.

---

## Assumptions & Dependencies

- **Public Storefront Scope**: This feature is strictly front-of-house. Authenticated student dashboards, course video players, ticket serial database tables, and real payment processing belong to subsequent roadmap milestones.
- **WhatsApp Support Destination**: The official WhatsApp phone number / link is configured via environment variables (`NEXT_PUBLIC_WHATSAPP_SUPPORT_URL`). A fallback message is used when unconfigured.
- **Activity Ticker Source**: In Feature 004, the Activity Ticker reads from verified active draws data (countdown alarms) and authenticated recent course orders, augmented by static promotional announcements when live volume is sparse.
- **Localization Infrastructure**: Built on top of established `next-intl` routing, `messages/ar.json`, and `messages/en.json` dictionaries established in Feature 001–003.

---

## Out-of-Scope Boundaries

- Writing database migrations for individual ticket serials (`promotional_tickets` table) — belongs to Feature 005.
- Implementing the authenticated student library (`/my-courses`) and video/audio download player — belongs to Feature 005.
- Implementing the 40% affiliate co-prize engine, link generator, and influencer dashboard — belongs to Feature 006.
- Implementing live ZainCash/AsiaHawala payment gateways and server webhooks — belongs to Feature 007.
- Implementing the administrative back-office, RNG draw trigger, and payout zeroing — belongs to Feature 008.
- Building the automated KYC document upload and identity verification workflow — belongs to post-draw winner operations in Feature 008.
