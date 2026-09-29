# Feature Specification: Arena of Draws & Promotional Countdowns (ساحة السحوبات والعد التنازلي)

**Feature Branch**: `003-draws-arena-countdown`  
**Created**: 2026-09-29  
**Status**: Draft  
**Input**: User description: "Arena of Draws showcasing active, upcoming, and concluded promotional sweepstakes (Hourly, Daily, Monthly Grand Draw), synchronized countdown timers, prize displays, ticket eligibility criteria, and YouTube Live draw stream integration. Strictly promotional gifts attached to educational courses. Out of scope: executing the RNG draw algorithm and payment webhooks."

---

## Clarifications

### Session 2026-09-29

- Q: How should the UI behave during the exact moment the countdown reaches 00:00:00 before the backend publishes the winner? (FR-010) → A: Transition the card immediately to a pulsating "Locked for Draw / جاري إجراء السحب" state with a prominent direct link to the YouTube Live stream, while disabling further ticket entry for that draw.
- Q: How should prize values be presented across currencies on the draw cards? (FR-011) → A: Dual-currency display: Primary USD value with secondary approximate Iraqi Dinar (IQD) conversion label (e.g. "$100 (~131,000 د.ع)"), maintaining strict consistency with the course catalog and project financial ledger rules.
- Q: Are promotional draws triggered strictly by scheduled time countdown, or can ticket volume trigger early draws? (FR-012) → A: Strictly time-scheduled draws (fixed hourly, daily, and monthly calendar countdowns), regardless of ticket volume, to preserve transparent public broadcast appointments on YouTube Live.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Active Draws & Real-Time Countdown Experience (Priority: P1)

As a prospective or enrolled learner,  
I want to browse all currently active promotional draws with live synchronizing countdown clocks and prize details,  
So that I understand what prizes are available, when the next draw occurs, and the excitement of participating through my course enrollment.

**Why this priority**: The Promotional Draw Arena is the core marketing hook and differentiator of KNZiN. Delivering a real-time, trustworthy countdown experience drives engagement and course bundle conversions.

**Independent Test**: Can be tested independently by visiting the Draws Arena on desktop and mobile, verifying that active draw cards render with accurate prize descriptions, and confirming countdown timers decrement smoothly toward their scheduled closing times.

**Acceptance Scenarios**:
1. **Given** a visitor navigates to the Draws section, **When** active draws exist, **Then** the platform displays distinct cards for Hourly ($100), Daily (e.g. iPhone 16 Pro Max / $5,000), and Monthly Grand Draw ($500,000 or Car) with high-definition prize imagery and badge status "جارية الآن" (Active Now).
2. **Given** an active draw card is visible, **When** the countdown clock is displayed, **Then** it presents remaining time formatted as `Days : Hours : Minutes : Seconds` (or `Hours : Minutes : Seconds` for sub-24h draws) decrementing continuously every second without layout jitter.
3. **Given** an active draw reaches its scheduled deadline, **When** the countdown reaches `00:00:00`, **Then** the card transitions state from "Active" to "Locked for Draw / جاري إجراء السحب" and ceases accepting new ticket entries for that draw.

---

### User Story 2 - Transparent Ticket Eligibility & Expiry Rules (Priority: P2)

As a student holding promotional tickets,  
I want to inspect the exact rules and eligibility requirements for each draw tier,  
So that I know which of my tickets qualify, how long they stay valid, and how the multi-tier retention works.

**Why this priority**: Transparency is paramount for trust and legal defensibility. Customers must clearly understand why a ticket qualified for an hourly draw vs. the monthly grand draw, eliminating allegations of unfairness.

**Independent Test**: Can be tested independently by expanding the "شروط وأهلية السحب" (Draw Terms & Eligibility) accordion on any draw card and verifying that tier-specific lifecycle rules, minimum ticket thresholds, and expiry conditions are explicitly detailed.

**Acceptance Scenarios**:
1. **Given** a user views an Hourly or Daily draw, **When** they inspect eligibility, **Then** the system clearly states that tickets entered into this specific tier expire immediately upon draw conclusion.
2. **Given** a user views the Monthly Grand Draw, **When** they inspect eligibility, **Then** the system clearly states that tickets remain active throughout the entire calendar month, maintaining eligibility across all intermediate draws until the Grand Draw.
3. **Given** a user switches language between Arabic and English, **When** viewing draw terms, **Then** the text flips layout direction (`rtl` &harr; `ltr`) with zero broken formatting or overlapping text.

---

### User Story 3 - Concluded Draws & Official Live Stream Integration (Priority: P3)

As a platform visitor or past participant,  
I want to view recently concluded draws and access the official YouTube Live broadcast link,  
So that I can verify past winners and watch the electronic draw ceremony conducted in real time.

**Why this priority**: Closes the promotional loop and reinforces social proof. Watching live transparent draws turns passive skeptics into paying students.

**Independent Test**: Can be tested independently by switching to the "السحوبات المكتملة" (Concluded Draws) tab, viewing the winner summary, and clicking the "مشاهدة البث المباشر" (Watch Live Stream) action button to confirm proper external redirection.

**Acceptance Scenarios**:
1. **Given** a draw has been completed, **When** viewing the concluded draws tab, **Then** the card displays the winning ticket serial (e.g. `#KNZ-9942`), winner's city/governorate, concluding timestamp, and a badge linking to the recorded or live stream.
2. **Given** an upcoming or live draw is scheduled for broadcast, **When** the user clicks the live broadcast button, **Then** it opens the official KNZiN YouTube Live streaming channel in a new secure browser tab.

---

## Edge Cases

- **Mobile Background Tab Suspension**: When a mobile user switches apps or locks their screen, the browser timer pauses. Upon resuming, the countdown clock MUST re-synchronize immediately against the server reference timestamp rather than showing stale or lagging time.
- **Draw Lock Interval (Zero State)**: Between countdown expiration (`00:00:00`) and the official broadcast conclusion, the draw must remain in a non-purchasable "Locked / في انتظار السحب" state, cleanly disallowing ticket attribution.
- **Empty State**: If no active draw exists for a specific tier (e.g. between hourly cycles), the arena MUST display an informative "السحب القادم يبدأ قريباً" (Next draw starting shortly) banner with scheduled launch time.
- **Dual-Currency Display**: Prize values MUST display primary USD cash equivalents alongside approximate Iraqi Dinar marketing figures without confusing the legal value.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display active promotional draws categorized by tier: Hourly Micro-Draw, Daily Major Draw, and Monthly Grand Draw.
- **FR-002**: System MUST render real-time synchronizing countdown timers on every active draw card, updating each second.
- **FR-003**: System MUST synchronize countdown timers against a standardized server reference timestamp to prevent local client clock tampering.
- **FR-004**: System MUST display clear prize attributes: prize title in Arabic and English, estimated value, high-resolution imagery, and total tickets currently eligible.
- **FR-005**: System MUST present explicit ticket lifecycle disclaimers on each card confirming that tickets are complimentary promotional gifts granted with educational course purchases.
- **FR-006**: System MUST state tier-specific ticket rules: Hourly/Daily tickets expire immediately upon draw conclusion; Monthly Grand Draw tickets persist across all active periods in that month.
- **FR-007**: System MUST provide an official YouTube Live stream integration link on active and concluded draw cards.
- **FR-008**: System MUST provide a "Concluded Draws" archive showing winning ticket numbers, winner governorates, and draw conclusion dates.
- **FR-009**: System MUST support bidirectional layout mirroring (Arabic `dir="rtl"` primary, English `dir="ltr"` secondary) across all cards, badges, and timer components.

- **FR-010**: System MUST immediately transition draw cards to a pulsating "Locked for Draw / جاري إجراء السحب" state the moment the countdown reaches `00:00:00`, presenting a direct YouTube Live broadcast button and disabling ticket attribution for that cycle.
- **FR-011**: System MUST display prize valuations in dual-currency format across all cards: primary USD value accompanied by secondary approximate IQD label (e.g. "$100 (~131,000 د.ع)"), matching the course catalog pricing convention.
- **FR-012**: System MUST govern draw execution strictly by scheduled calendar countdowns (hourly, daily, monthly), ensuring draws occur at fixed broadcast times independent of ticket sales volume.

---

### Key Entities

- **PromotionalDraw**: Represents a scheduled or completed draw event (tier, title, prize summary, scheduled start, scheduled closing, status: upcoming, active, locked, completed).
- **PrizeItem**: Represents the reward associated with a draw (title, category: cash or physical merchandise, valuation, image asset).
- **DrawWinnerRecord**: Represents the verified outcome of a completed draw (draw identifier, winning ticket serial, masked winner name, governorate, broadcast link).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Countdown timers on all client viewports remain synchronized within ±1.0 second of server authoritative time, even after browser tab reactivation.
- **SC-002**: Zero cumulative layout shift (CLS < 0.05) occurs when countdown digits transition (e.g. from 10 to 09) and when toggling between Arabic and English.
- **SC-003**: Draws arena achieves an initial visual render time of under 300ms on regional 4G mobile devices.
- **SC-004**: 100% of draw cards explicitly render the mandatory legal disclaimer confirming promotional non-gambling status.
- **SC-005**: Text shaping and typography in Arabic adhere strictly to the project Tajawal font family with zero clipped ligatures or broken numerals.

---

## Assumptions

- Draws are conducted off-platform via transparent live streaming (YouTube Live) and recorded electronically.
- The platform is not calculating or executing random number generation in this front-of-house marketing feature.
- Promotional ticket issuance rules remain bound to `specs/002-auth-catalog-checkout` ($2 part = 1 ticket, $10 bundle = 15 tickets).
- Server timestamp endpoints provide reliable UTC reference time.
