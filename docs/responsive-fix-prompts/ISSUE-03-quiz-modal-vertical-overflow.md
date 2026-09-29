# FIX PROMPT: ISSUE-03

## Role
Act as a **Senior Frontend Engineer specializing in accessible modals, dialogs, and viewport constraints in React/Tailwind**.

## Description of the Problem
The Anti-Piracy Quiz Modals ([AntiPiracyQuizModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx) and [AntiPiracyModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/AntiPiracyModal.tsx)) have `overflow-hidden` with no height constraints and no internal scrolling container. On mobile landscape viewports, small laptops, or any screen with vertical height < 520px, the bottom action buttons ("التالي" / "تأكيد الإجابات") are pushed outside the viewport and clipped, blocking the user from completing checkout.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Route(s):** `/`, `/courses/[slug]` (when opening checkout or taking quiz)
* **Affected Component(s):** [AntiPiracyQuizModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx), [AntiPiracyModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/AntiPiracyModal.tsx)
* **Shared Dependencies:** [CheckoutBottomSheet.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/CheckoutBottomSheet.tsx)
* **Related Issues:** ISSUE-04

## Evidence
In [AntiPiracyQuizModal.tsx#L56-L58](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx#L56-L58):
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
  <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
```
Content height is ~480px–520px. In any viewport with height < 520px, `overflow-hidden` clips the buttons at the bottom.

## Root Cause
The modal lacks a maximum height constraint (`max-h-[...]`) and does not place question content into a scrollable flex child (`overflow-y-auto`).

## Objective
Ensure the Anti-Piracy Quiz Modal adapts to any viewport height down to 320px (mobile landscape or small screen), keeping header and footer action buttons pinned while allowing the question choices to scroll if needed.

## Constraints
* Preserve quiz step progression logic (Steps 1, 2, and 3).
* Preserve answer state and completion callback `onComplete(answers)`.
* Preserve modal close handler `onClose()`.
* Keep the visual design, backdrop blur, and colors intact.

## Tasks
1. In both [AntiPiracyQuizModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx) and [AntiPiracyModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/AntiPiracyModal.tsx):
   * Change the modal dialog container classes to:
     `relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden`
   * Wrap the header in a non-shrinking container (`p-6 pb-2 shrink-0`).
   * Wrap the question steps in a scrollable container (`p-6 py-2 overflow-y-auto flex-1`).
   * Wrap the action controls footer in a non-shrinking pinned container (`p-6 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0`).

## Acceptance Criteria
* In a viewport with height = 400px (landscape mobile), the modal fits within `90vh`, and the user can scroll to see and click all option buttons and the "التالي" / "تأكيد الإجابات" action buttons.
* In normal desktop viewports (height > 600px), the modal displays naturally without premature scrollbars.

## Verification
* Test at viewports: 375x667px, 667x375px (landscape), 768x1024px, 1920x1080px.
* Verify completion of all 3 quiz steps in landscape mode.

## Scope
* **Must Change:** [AntiPiracyQuizModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx), [AntiPiracyModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/AntiPiracyModal.tsx)
* **Must Not Change:** `QuizStep.tsx` option data, backend quiz verification endpoints.
