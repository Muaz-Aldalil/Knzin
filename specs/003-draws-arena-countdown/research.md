# Technical Research: Real-Time Promotional Countdown & Draw Architecture

**Feature**: `003-draws-arena-countdown`  
**Date**: 2026-09-29  

---

## 1. Real-Time Clock Synchronization & Drift Compensation

### The Challenge
On mobile browsers (iOS Safari, Android Chrome), several conditions break traditional `setInterval(..., 1000)` countdowns:
1. **Device Clock Manipulation**: Users can adjust local system time to alter client countdown behavior.
2. **Background Tab Throttling / Screen Lock**: Browsers deprioritize or pause JS timers when a tab is in the background or the screen locks. Upon returning, `setInterval` resumes with stale cumulative ticks.
3. **Network Latency Jitter**: Regional mobile latency can cause responses to arrive up to several seconds after dispatch.

### The Solution: Offset-Based Drift Compensation
Instead of relying on local `Date.now()`, the application computes a **Server Time Offset** upon initial API fetch:

$$\Delta_{\text{offset}} = T_{\text{server\_utc}} - \left( T_{\text{client\_receive}} - \frac{\text{RTT}}{2} \right)$$

Where:
- $T_{\text{server\_utc}}$ is the server's ISO timestamp returned in the API payload.
- $\text{RTT}$ is the measured Round-Trip Time of the HTTP request.

During every tick (using `requestAnimationFrame` throttled to 1s intervals or standard monotonic `performance.now()`):
$$\text{Current Server Virtual Time} = \text{Date.now}() + \Delta_{\text{offset}}$$
$$\text{Time Remaining} = \max\left(0, T_{\text{ends\_at}} - \text{Current Server Virtual Time}\right)$$

### Tab Visibility Recovery
A `visibilitychange` listener triggers immediate re-calculation when `document.visibilityState === 'visible'`, ensuring zero stale time display when users wake their devices.

---

## 2. Zero Cumulative Layout Shift (CLS) on Live Timers

### The Challenge
Digits `1` and `0` typically have different typographic glyph widths in proportional fonts. As the clock ticks from `10` to `09` or `01` to `00`, the container width can vibrate or cause surrounding elements to jump, inducing Cumulative Layout Shift.

### The Solution
1. **Font-Variant Numeric**: Use CSS `font-variant-numeric: tabular-nums` to enforce monospace character widths on numbers within the Tajawal font family.
2. **Fixed Digit Slot Width**: Wrap each digit pair (`DD`, `HH`, `MM`, `SS`) in a flex box with explicit minimum width (`min-w-[2.5rem]`).
3. **Directional Separation**: The numeric digits are rendered strictly in `dir="ltr"` inside a `<bdi>` tag, while unit labels ("يوم", "ساعة", "دقيقة", "ثانية") are rendered in native Arabic typography.

---

## 3. The `00:00:00` Zero-Second State Transition

### The Transition Flow
When $\text{Time Remaining} \le 0$:
1. The countdown digits freeze at `00:00:00`.
2. The component emits an `onExpire()` event.
3. The UI replaces the timer with the **`PulsatingLockBadge`**:
   - Background changes to a subtle amber/gold glowing pulse (`animate-pulse`).
   - Arabic text reads: *"جاري إجراء السحب الآن عبر البث المباشر"* (The draw is taking place right now via live broadcast).
   - Prominent action button appears: *"مشاهدة السحب المباشر (YouTube Live)"* opening the official channel in a secure tab (`target="_blank" rel="noopener noreferrer"`).
4. Ticket entry buttons (e.g. from catalog or cart) for this specific draw cycle are disabled.

---

## 4. Dynamic Status Calculation & Caching Skew Prevention

### The Problem
If the backend caches the `/api/v1/draws/active` response in Redis for 10 seconds, a draw that expired at second 0 might still be served with `status: "active"` at second 5 from cache.

### The Solution: Computed Ephemeral Status
The backend controller calculates the effective status dynamically on serialization:
```php
$status = ($draw->ends_at <= now()) ? 'locked' : $draw->status;
```
On the frontend, the client evaluates:
```ts
const isLocked = draw.status === 'locked' || remainingSeconds <= 0;
```
This guarantees that even if a network response has a cached timestamp skew of a few seconds, the frontend immediately locks the card upon countdown expiry and does not re-open it.

---

## 5. Offline Tolerance & Fallback Strategy

### Offline Resilience
1. **Query Persistence**: `@tanstack/react-query` preserves the last fetched active draws in client memory/cache.
2. **Autonomous Countdown**: The countdown hook continues to calculate `Time Remaining = ends_at - (Date.now() + offset)` even during network dropouts.
3. **Graceful Indicator**: If network requests fail during background revalidation, a subtle non-blocking connectivity badge appears (*"وضع عدم الاتصال - التوقيت متزامن"*), ensuring the countdown never goes blank or crashes.
