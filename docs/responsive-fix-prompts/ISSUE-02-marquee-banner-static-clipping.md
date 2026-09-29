# FIX PROMPT: ISSUE-02

## Role
Act as a **Senior Frontend Engineer specializing in CSS animations, marquee tickers, and responsive header banners**.

## Description of the Problem
The social proof announcement banner at the top of [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx) contains a 110-character announcement (`liveDrawMarquee`). Because it is rendered inside an `overflow-hidden` container without the `.animate-marquee` animation class, the text is statically truncated and unreadable on viewports smaller than 750px.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Component(s):** [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx), [globals.css](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css)
* **Affected Route(s):** All routes
* **Related Issues:** ISSUE-01

## Evidence
In [HeaderHUD.tsx#L49-L54](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx#L49-L54):
```tsx
<div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-xs py-1.5 px-4 overflow-hidden border-b border-blue-600/30">
  <div className="flex items-center justify-center gap-2 text-blue-100 font-medium tracking-wide">
    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
    <span>{t('liveDrawMarquee')}</span>
  </div>
</div>
```
And in [globals.css#L46-L64](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css#L46-L64):
```css
@keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
@keyframes marquee-rtl { 0% { transform: translateX(0%); } 100% { transform: translateX(50%); } }
.animate-marquee { display: inline-flex; white-space: nowrap; animation: marquee 30s linear infinite; }
[dir="rtl"] .animate-marquee { animation: marquee-rtl 30s linear infinite; }
```

## Root Cause
The `.animate-marquee` CSS class was implemented in `globals.css` but never attached to the banner wrapper in `HeaderHUD.tsx`.

## Objective
Enable a smooth, continuous scrolling ticker marquee on mobile/tablet viewports (< 768px) while displaying a centered banner on desktop viewports where adequate width exists.

## Constraints
* Must support both RTL (`marquee-rtl`) and LTR (`marquee`).
* Banner height must remain fixed (`py-1.5`) without vertical layout shift.
* Marquee animation must pause on hover/focus (`hover:[animation-play-state:paused]`).

## Tasks
1. In [HeaderHUD.tsx#L49-L54](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx#L49-L54):
   * Update the container and text wrapper:
     ```tsx
     <div className="bg-gradient-to-r from-secondary-surface via-primary to-secondary-surface text-xs py-1.5 px-4 overflow-hidden border-b border-primary/20 whitespace-nowrap">
       <div className="flex md:justify-center items-center gap-2 text-blue-100 font-medium tracking-wide animate-marquee md:animate-none hover:[animation-play-state:paused]">
         <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse shrink-0" />
         <span>{t('liveDrawMarquee')}</span>
       </div>
     </div>
     ```

## Acceptance Criteria
* On mobile viewports (320px–767px), the banner smoothly scrolls continuously across the screen without being cut off.
* In RTL (`/ar`), the marquee scrolls right-to-left. In LTR (`/en`), it scrolls left-to-right.
* On desktop viewports (>= 768px), the banner centers cleanly if space permits.

## Verification
* Test at 375px (mobile) in `/ar` and `/en`.
* Test at 1280px (desktop).

## Scope
* **Must Change:** [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx)
* **Must Not Change:** `globals.css` keyframes.
