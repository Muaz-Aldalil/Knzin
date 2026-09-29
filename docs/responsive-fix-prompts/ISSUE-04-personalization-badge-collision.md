# FIX PROMPT: ISSUE-04

## Role
Act as a **Senior Frontend Engineer specializing in responsive component design and RTL typography**.

## Description of the Problem
[PersonalizationBadge.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/PersonalizationBadge.tsx) uses a single-row `flex items-center justify-between` layout without wrapping. On small mobile screens (320px–375px), the mandatory 44-character Arabic watermark text ("تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك") and the user's email collide, causing text truncation or visual overflow.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Component(s):** [PersonalizationBadge.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/PersonalizationBadge.tsx)
* **Affected Route(s):** Checkout Bottom Sheet, Anti-Piracy Quiz Step 3, Order Summary
* **Related Issues:** ISSUE-03

## Evidence
In [PersonalizationBadge.tsx#L18-L35](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/PersonalizationBadge.tsx#L18-L35):
```tsx
<div className={`p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium ${className}`}>
  <div className="flex items-center gap-2">
    <ShieldCheck className="w-4 h-4 text-success shrink-0" />
    <span className="font-bold text-slate-900 dark:text-white">
      {PERSONALIZATION_STAMP_TEXT}
    </span>
  </div>
  {email && (
    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
      <Lock className="w-3 h-3 text-slate-400" />
      <span className="max-w-[140px] truncate">{email}</span>
    </div>
  )}
</div>
```
Content width (~428px) exceeds available mobile modal width (~256px–288px).

## Root Cause
Lack of responsive stacking (`flex-col sm:flex-row`) or flex wrapping on the badge container.

## Objective
Allow [PersonalizationBadge.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/PersonalizationBadge.tsx) to stack smoothly on viewports < 400px while retaining a clean horizontal row on larger viewports.

## Constraints
* The verbatim canonical watermark string `"تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك"` must not be shortened, altered, or hidden.
* Preserve dark mode styling and emerald icon accent.

## Tasks
1. In [PersonalizationBadge.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/PersonalizationBadge.tsx):
   * Change outer container layout to:
     `flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`
   * Allow the text span to wrap cleanly if needed:
     `leading-relaxed break-words`
   * Align the email badge to the start on mobile:
     `self-start sm:self-auto`

## Acceptance Criteria
* On 320px and 375px mobile viewports, the legal stamp text displays in full without collision, overlapping, or clipping.
* On desktop viewports (sm+), the badge displays as a single horizontal line.

## Verification
* Test at viewports: 320px, 360px, 375px, 768px.
* Test with short email (`a@b.co`) and long email (`mohammed.al-tamimi.engineer@example.com`).

## Scope
* **Must Change:** [PersonalizationBadge.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/PersonalizationBadge.tsx)
* **Must Not Change:** Canonical text constant `PERSONALIZATION_STAMP_TEXT`.
