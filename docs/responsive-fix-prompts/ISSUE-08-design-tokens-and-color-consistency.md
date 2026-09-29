# FIX PROMPT: ISSUE-08

## Role
Act as a **Senior Design Systems Engineer and Frontend Architect specializing in Tailwind CSS v4 design tokens and brand color consistency**.

## Description of the Problem
The application currently exhibits color fragmentation and inconsistency across different screens and components:
* Multiple components rely on raw, hardcoded hex values (e.g., `#1877F2` for primary brand blue, `#0B1E3A` for deep navy).
* Accent and badge colors are scattered arbitrarily across unrelated Tailwind utilities (e.g., `yellow-300`, `amber-500`, `amber-600`, `indigo-700`, `teal-700`).
* No centralized semantic color token system is configured in Tailwind CSS v4, preventing systemic theme changes, dark mode uniformity, and visual coherence.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Component(s):** All components across the application (`globals.css`, `HeaderHUD.tsx`, `CourseCard.tsx`, `CoursePartList.tsx`, `CheckoutBottomSheet.tsx`, `OrderSummaryCard.tsx`, `AntiPiracyQuizModal.tsx`, `LegalShieldCheckbox.tsx`, `layout.tsx`, `page.tsx`, `courses/[slug]/page.tsx`, `auth/callback/page.tsx`).
* **Design System Philosophy:** 4-Tier Semantic Palette:
  1. **Primary (`#1877f2`):** Primary brand blue for primary call-to-actions, active links, focused form inputs, and interactive highlights.
  2. **Secondary (`#0b1e3a`):** Deep midnight navy representing institutional trust, HUD background, footer, high-contrast typography, and premium bundle header cards.
  3. **Accent (`#f5b301`):** Gold/Amber accent representing promotional tickets, raffle entries, trophies, and celebration sparkles.
  4. **Success (`#10b981`):** Emerald green representing legal compliance verification, confirmed orders, and active feature checklists.

## Evidence
1. `frontend/src/app/globals.css`:
   Lacks `@theme` declarations for custom color utilities in Tailwind v4. Raw CSS variables in `:root` do not automatically expose Tailwind utilities (`bg-primary`, `text-secondary`, etc.).
2. Hardcoded hexes found throughout JSX:
   - `HeaderHUD.tsx`: `bg-[#0B1E3A]`, `bg-[#1877F2]`
   - `CheckoutBottomSheet.tsx`: `text-[#0B1E3A]`, `bg-[#1877F2]`
   - `CourseCard.tsx`: `text-[#0B1E3A]`
   - `CoursePartList.tsx`: `text-[#0B1E3A]`
   - `courses/[slug]/page.tsx`: `from-[#0B1E3A]`, `bg-[#1877F2]`
   - `layout.tsx`: `bg-[#0B1E3A]`
3. Inconsistent accent colors:
   - Sparkles: `text-yellow-300` in some components, `text-blue-600` in others.
   - Tickets: `bg-amber-500/10 text-amber-600` in `CheckoutBottomSheet`, `text-amber-500` in `page.tsx`.
   - Success: `text-emerald-600` in `OrderSummaryCard`, `teal-700` in gradients.

## Root Cause
Components were authored incrementally with ad-hoc utility classes and raw hex literals rather than consuming a unified `@theme` token abstraction.

## Objective
Establish a centralized, production-grade Tailwind CSS v4 `@theme` color configuration and migrate all components to semantic role tokens (`primary`, `secondary`, `accent`, `success`), eliminating all hardcoded hex literals and fragmented palette classes.

## Constraints
* Retain the authoritative Knzin brand identity: Primary Blue (`#1877f2`), Deep Navy (`#0b1e3a`), Gold/Amber Accent (`#f5b301`), Emerald Success (`#10b981`).
* Preserve WCAG AA contrast ratios for accessible typography on light and dark surfaces.
* Ensure all tests in `frontend/src/tests/` continue to pass with 0 regressions.

## Tasks
1. In `frontend/src/app/globals.css`:
   * Declare the authoritative color tokens inside `@theme`:
     ```css
     @theme {
       --color-primary: #1877f2;
       --color-primary-hover: #166fe5;
       --color-primary-light: #eff6ff;

       --color-secondary: #0b1e3a;
       --color-secondary-surface: #0f274a;

       --color-accent: #f5b301;
       --color-accent-hover: #dfa200;
       --color-accent-light: #fef9c3;

       --color-success: #10b981;
       --color-success-light: #ecfdf5;
     }
     ```
2. In `HeaderHUD.tsx`:
   * Replace `bg-[#0B1E3A]` with `bg-secondary`.
   * Replace marquee gradient `from-blue-700 via-indigo-700 to-blue-800` with `from-secondary-surface via-primary to-secondary-surface border-b border-primary/20`.
   * Replace ticket badge with `bg-accent/10 text-accent border border-accent/20`.
   * Replace login button with `bg-primary hover:bg-primary-hover`.
3. In `CourseCard.tsx` & `CoursePartList.tsx`:
   * Replace `text-[#0B1E3A]` with `text-secondary`.
   * Replace ticket badge with `text-accent bg-accent/10 border-accent/20`.
   * Replace accent bar with `bg-gradient-to-r from-primary via-secondary to-accent`.
4. In `CheckoutBottomSheet.tsx` & `AntiPiracyQuizModal.tsx`:
   * Replace `text-[#0B1E3A]` with `text-secondary`.
   * Replace `bg-[#1877F2]` with `bg-primary hover:bg-primary-hover`.
   * Replace ticket pill with `bg-accent/10 text-accent border border-accent/20`.
   * Replace input focus ring with `focus:ring-primary/40`.
5. In `OrderSummaryCard.tsx`:
   * Replace success banner gradient `from-emerald-600 to-teal-700` with `from-success to-emerald-700`.
   * Replace ticket badge with `text-accent`.
6. In `layout.tsx`:
   * Replace footer `bg-[#0B1E3A]` with `bg-secondary`.

## Acceptance Criteria
* Zero raw hex literals remain in component JSX (verified via `grep -r '#[0-9a-fA-F]\{6\}' frontend/src/components`).
* Visual palette is 100% harmonious across all pages: Primary (`#1877f2`), Secondary (`#0b1e3a`), Accent (`#f5b301`), Success (`#10b981`).
* All automated unit tests in `src/tests/*.test.ts` pass without errors.

## Verification
* Run `grep -ri "#[0-9a-fA-F]\{6\}" frontend/src/` to confirm zero non-theme hex codes.
* Run `npm test` in `frontend/`.
* Visually inspect `/ar` and `/en` routes in desktop and mobile viewports.

## Scope
* **Must Change:** `globals.css`, `HeaderHUD.tsx`, `CourseCard.tsx`, `CoursePartList.tsx`, `CheckoutBottomSheet.tsx`, `OrderSummaryCard.tsx`, `AntiPiracyQuizModal.tsx`, `LegalShieldCheckbox.tsx`, `layout.tsx`, `page.tsx`, `courses/[slug]/page.tsx`, `auth/callback/page.tsx`.
* **Must Not Change:** Backend API contracts, database schemas, test assertions.
