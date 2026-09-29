# FIX PROMPT: ISSUE-01

## Role
Act as a **Senior Frontend Engineer specializing in responsive web applications and Next.js layout architecture**.

## Description of the Problem
On mobile viewports (< 450px), the navigation header ([HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx)) overflows horizontally beyond the screen boundaries by 90px to 210px. Interactive elements (language toggle, tickets counter, user login/logout button) collide and are partially pushed off-screen.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Route(s):** All routes (`/`, `/courses/[slug]`, `/order-summary/[orderNumber]`)
* **Affected Component(s):** [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx), [LanguageToggle.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/LanguageToggle.tsx)
* **Shared Dependencies:** [layout.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/[locale]/layout.tsx)
* **Related Issues:** ISSUE-02, ISSUE-06

## Evidence
In [HeaderHUD.tsx#L57-L130](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx#L57-L130):
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
  {/* Logo and Brand */}
  <div className="flex items-center gap-6">...</div>

  {/* HUD Counters & User Controls */}
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1.5 px-3 py-1.5 ...">0 تذكرة</div>
    <div className="hidden sm:flex ...">0 د.ع</div>
    <LanguageToggle />
    {user ? (...) : (...)}
  </div>
</div>
```
* Left side width: ~150px.
* Right side width: ~283px (logged out) or ~403px (logged in).
* Total width: 433px–553px in a 343px available container at 375px viewport.

## Root Cause
The header container is a single un-wrapped flex row (`flex items-center justify-between`) that renders all controls at full desktop size without mobile collapsing or responsive compactness.

## Objective
Adapt [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx) and [LanguageToggle.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/LanguageToggle.tsx) so that the navigation bar fits cleanly within viewports down to 320px with zero horizontal overflow, while keeping all core controls accessible.

## Constraints
* Preserve existing desktop behavior (`sm:` and above).
* Do not remove the promotional ticket counter or the language toggle.
* Preserve authentication flow (`handleGoogleLogin` and `handleLogout`).
* Ensure touch targets remain >= 40px for mobile accessibility.

## Tasks
1. In [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx):
   * Apply semantic theme classes: header background `bg-secondary`, ticket badge `bg-accent/10 text-accent border border-accent/20`, login button `bg-primary hover:bg-primary-hover`.
   * On mobile (`< sm`), make the brand logo compact: keep the "K" logo and "كَنزين" title, but hide the secondary `"KNZiN"` badge on screens `< sm` (`hidden sm:inline`).
   * On mobile, make the ticket counter compact: show icon + count (`Ticket` icon + number) and hide the label `"تذكرة"` on screens `< sm` (`hidden sm:inline`).
   * Reduce gap in the HUD controls container on mobile: `gap-1.5 sm:gap-3`.
2. In [LanguageToggle.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/LanguageToggle.tsx):
   * On mobile (`< sm`), show a compact language badge:
     `<span className="hidden sm:inline">{locale === 'ar' ? 'English' : 'العربية'}</span><span className="sm:hidden">{locale === 'ar' ? 'EN' : 'ع'}</span>`.
   * Adjust padding on mobile: `px-2 sm:px-3 py-1.5`.
   * Use `text-primary hover:text-primary-hover`.
3. In [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx):
   * For the login button, use icon + compact label or icon only on mobile `< 380px`.
   * For the logged-in user profile badge, limit max-width on mobile: `max-w-[70px] sm:max-w-[120px] truncate`.

## Acceptance Criteria
* Zero horizontal scrollbar/overflow on viewports from 320px to 1920px.
* All elements (Logo, Tickets, Language Toggle, Auth button) remain visible and clickable on an iPhone SE (375px) and Galaxy S (360px).
* Desktop layout at 1024px+ remains identical to current design.

## Verification
* Test viewports: 320px, 360px, 375px, 390px, 768px, 1280px.
* Verify both logged-out and logged-in states in Arabic (`/ar`) and English (`/en`).

## Scope
* **Must Change:** [HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx), [LanguageToggle.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/LanguageToggle.tsx)
* **Must Not Change:** API routes, auth callbacks, checkout logic, catalog components.
