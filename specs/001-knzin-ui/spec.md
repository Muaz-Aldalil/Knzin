# Feature Specification: KNZiN UI Prototype

**Feature Branch**: `001-knzin-ui`
**Created**: 2026-09-28
**Status**: Draft
**Input**: User description: "build the ui using just html and tailwind from PDF + 17 images"

## User Scenarios & Testing

### User Story 1 - Browse Home and Buy (Priority: P1)
Visitor sees header HUD, ticker, hero countdown, courses with parts + gold bundle, draws, Hall of Fame, referral. Clicks buy -> bottom-sheet checkout mock -> success toast + ticket added.

**Why this priority**: Core revenue engine.
**Independent Test**: Open index.html, scroll home, open checkout, confirm toast.
**Acceptance Scenarios**:
1. **Given** home loaded, **When** countdown visible, **Then** it ticks down each second.
2. **Given** course card, **When** click اشتري البكج, **Then** bottom-sheet opens with summary $10 + 15 tickets + legal checkbox.

---

### User Story 2 - Wallet Tickets Draws (Priority: P2)
User views tickets KNZ-A15 فعالة, top-up buttons, transactions, draw history.

**Why this priority**: Trust + retention.
**Independent Test**: Navigate to #draws #wallet, verify lists render.
**Acceptance Scenarios**:
1. **Given** #wallet, **When** click $50 top-up, **Then** balance updates demo.

---

### User Story 3 - Referral Influencer Admin Mock (Priority: P3)
User copies referral link, views influencer stats, admin views affiliates + Mark as Paid modal.

**Why this priority**: Growth + ops demo.
**Independent Test**: Click نسخ الرابط -> toast. Open admin modal -> confirm zeroes demo.
**Acceptance Scenarios**:
1. **Given** referral block, **When** copy, **Then** toast تم النسخ.

### Edge Cases
- No backend: all buttons demo toast, no navigation loss.
- RTL/EN toggle flips dir and lang labels.
- Images missing: gradient placeholders, layout intact.

## Requirements

### Functional Requirements
- **FR-001**: System MUST render single index.html RTL Arabic with EN toggle.
- **FR-002**: System MUST show header HUD wallet/tickets/courses/lang/user.
- **FR-003**: System MUST show live ticker marquee.
- **FR-004**: System MUST show hero countdown ticking.
- **FR-005**: System MUST show 2+ course cards with 3 parts + bundle offer + sales count.
- **FR-006**: System MUST show draws active/finished + Hall of Fame + referral.
- **FR-007**: System MUST provide checkout bottom-sheet with legal checkbox + payment methods UI.
- **FR-008**: System MUST provide wallet/tickets/transactions + quiz modal + PDF/audio mock.
- **FR-009**: System MUST provide influencer + admin tables + Mark as Paid modal.
- **FR-010**: System MUST use Tailwind CDN only + vanilla JS, no framework.

### Key Entities
- **Course**: title, parts[3], price, tickets, sales.
- **Draw**: prize, amount, countdown, expiry rule.
- **Ticket**: code e.g. KNZ-A15, status فعالة.
- **Affiliate**: name, unpaid, link.

## Success Criteria
- **SC-001**: Open index.html with no build step, all sections visible.
- **SC-002**: Works at 375px and 1280px without horizontal scroll.
- **SC-003**: Every button gives visible feedback.

## Assumptions
- Dummy data from PDF/images acceptable.
- $2/part, $10 bundle, 2000 IQD display variants shown.
- Local images optional, placeholders ok.
