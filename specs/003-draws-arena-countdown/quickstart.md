# Quickstart & Verification Guide: Arena of Draws & Promotional Countdowns

**Feature**: `003-draws-arena-countdown`  
**Date**: 2026-09-29  

---

## Prerequisites

1. Backend running: `php artisan serve --port=8000`
2. Frontend running: `npm run dev` in `/frontend` (port 3000)
3. Database migrated & seeded: `php artisan migrate --seed` (includes `PromotionalDrawSeeder`)

---

## Verification Scenarios

### Scenario 1: Active Draws Showcase & Dual-Currency Presentation
- **Steps**:
  1. Open browser to `http://localhost:3000/ar`.
  2. Navigate to the Draws Arena section (or click "ساحة السحوبات" in the Header HUD).
  3. Verify that 3 distinct cards render:
     - **Hourly Micro-Draw**: Valuation `$100 (~131,000 د.ع)`.
     - **Daily Draw**: Valuation `$5,000 (~6,550,000 د.ع)` or iPhone 16 Pro Max.
     - **Monthly Grand Draw**: Valuation `$500,000 (~655,000,000 د.ع)` or New Luxury Car.
- **Pass Criteria**:
  - All cards display high-definition prize imagery, tier badges, and active countdown clocks.
  - Zero layout shift (CLS = 0.00) on initial render.

---

### Scenario 2: Synchronized Countdown & Mobile Tab Resumption
- **Steps**:
  1. Inspect the countdown digits on the Hourly Draw card.
  2. Confirm countdown decrements smoothly by 1 second without digit vibration or jumping.
  3. Switch to another browser tab or minimize browser for 15 seconds.
  4. Return to the KNZiN tab.
- **Pass Criteria**:
  - Clock immediately updates to the accurate elapsed time without lagging behind or "fast-forwarding" ticks.
  - Timer remains within ±500ms of server UTC time.

---

### Scenario 3: Zero-Countdown Pulsating Lock State Transition
- **Steps**:
  1. In backend seeder or test environment, load a draw scheduled to expire in 5 seconds (`ends_at = now() + 5 seconds`).
  2. Watch the countdown reach `00:00:00`.
- **Pass Criteria**:
  - The card immediately transitions to a pulsating amber/gold badge: *"جاري إجراء السحب الآن عبر البث المباشر"*.
  - A prominent action button appears: *"مشاهدة البث المباشر (YouTube Live)"*.
  - Clicking opens the official YouTube Live channel in a new secure tab (`target="_blank" rel="noopener noreferrer"`).
  - Purchasing/ticket entry buttons for this specific cycle become disabled.

---

### Scenario 4: Concluded Draws Archive & Transparency
- **Steps**:
  1. Click on the "السحوبات المكتملة" (Concluded Draws) filter tab.
  2. Verify that historical draws render with:
     - Winning Ticket Serial (e.g. `#KNZ-H12-8821`).
     - Masked Winner Name (e.g. `أحمد م.`).
     - Winner Governorate (e.g. `بغداد`).
     - "مشاهدة تسجيل السحب" button linking to the recorded live stream.
- **Pass Criteria**:
  - Concluded draws are read-only and distinctly separated from active countdowns.

---

### Scenario 5: RTL & LTR Language Switching
- **Steps**:
  1. Click the Language Toggle in Header HUD to switch from Arabic (`ar`) to English (`en`).
- **Pass Criteria**:
  - The entire arena flips from `dir="rtl"` to `dir="ltr"`.
  - Timer digits remain in tabular monospace format with English unit labels (`Days : Hours : Mins : Secs`).
  - No text overlaps or clipped borders.
