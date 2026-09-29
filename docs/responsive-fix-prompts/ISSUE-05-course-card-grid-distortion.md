# FIX PROMPT: ISSUE-05

## Role
Act as a **Senior Frontend Engineer specializing in responsive CSS grids and card component design**.

## Description of the Problem
In [CourseCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CourseCard.tsx), the action buttons are forced into a rigid two-column grid (`grid-cols-2`). When displayed in a 3-column catalog grid on desktop viewports between 1024px and 1240px, each button receives only ~124px width, forcing the button text to wrap awkwardly across 2–3 lines.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Component(s):** [CourseCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CourseCard.tsx)
* **Affected Route(s):** `/` (Catalog Home)
* **Related Issues:** None

## Evidence
In [CourseCard.tsx#L105-L121](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CourseCard.tsx#L105-L121):
```tsx
<div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex-col xl:grid xl:grid-cols-2 gap-2 pt-1">
  <Link href={`/courses/${course.slug}`} className="w-full py-2.5 px-3 ... flex items-center justify-center gap-1.5 ...">
    <BookOpen className="w-3.5 h-3.5" />
    <span>الأجزاء (2$)</span>
  </Link>
  <button onClick={handleBundleClick} className="w-full py-2.5 px-3 ... flex items-center justify-center gap-1.5 ...">
    <Sparkles className="w-3.5 h-3.5 text-accent" />
    <span>{t('buyBundle')}</span>
  </button>
</div>
```
In a 3-column layout at 1024px (`lg`), each button gets ~124px. The label `"شراء الحقيبة كاملة"` (AR) / `"Buy Complete Bundle"` (EN) cannot fit on a single line in 80px net text width.

## Root Cause
Hardcoded `grid-cols-2` across all breakpoints regardless of the parent grid container's column constraints.

## Objective
Ensure the action buttons in [CourseCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CourseCard.tsx) fit their text cleanly without awkward 3-line word wrapping at 1024px–1240px viewports.

## Constraints
* Both buttons ("الأجزاء (2$)" and "شراء الحقيبة كاملة") must remain prominently visible.
* Preserve `onQuickCheckout` callback on the bundle button.
* Preserve link navigation to `/courses/${course.slug}`.

## Tasks
1. In [CourseCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CourseCard.tsx):
   * Adjust button grid to adapt dynamically:
     `flex flex-col sm:grid sm:grid-cols-2 lg:flex-col xl:grid xl:grid-cols-2 gap-2 pt-1`
     (Stacks cleanly when the card is narrow in a 3-column `lg` layout, and displays as dual columns on mobile/wide screens).

## Acceptance Criteria
* No broken or overlapping text inside buttons at 1024px, 1150px, and 1280px viewports.
* Buttons maintain consistent heights within the card.

## Verification
* Test viewports: 375px, 768px, 1024px, 1152px, 1440px in both Arabic and English.

## Scope
* **Must Change:** [CourseCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CourseCard.tsx)
* **Must Not Change:** Catalog data fetching, backend resources.
