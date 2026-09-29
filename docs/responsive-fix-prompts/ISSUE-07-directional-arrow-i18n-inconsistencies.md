# FIX PROMPT: ISSUE-07

## Role
Act as a **Senior Frontend Engineer specializing in internationalization (i18n), RTL/LTR directionality, and logical CSS properties**.

## Description of the Problem
Multiple components contain hardcoded physical directional classes (`text-right`, `left-4`), an inverted navigation arrow in [OrderSummaryCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/OrderSummaryCard.tsx), and hardcoded Arabic strings. In English mode (`/en`), legal disclaimers and quiz questions are forced right-aligned, close buttons collide with LTR text, and the "Back to Catalog" arrow points in the wrong direction in both languages.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Component(s):** [OrderSummaryCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/OrderSummaryCard.tsx), [LegalShieldCheckbox.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/LegalShieldCheckbox.tsx), [CoursePartList.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CoursePartList.tsx), [AntiPiracyQuizModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx), [AntiPiracyModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/AntiPiracyModal.tsx), [QuizStep.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/QuizStep.tsx)
* **Affected Route(s):** `/courses/[slug]`, `/order-summary/[orderNumber]`, Checkout Modal
* **Related Issues:** None

## Evidence
1. [OrderSummaryCard.tsx#L122](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/OrderSummaryCard.tsx#L122):
   `<ArrowRight className="w-4 h-4 rtl:rotate-180" />`
   Points left in RTL (forward) and right in LTR (forward) for a "Back" button!
2. [LegalShieldCheckbox.tsx#L29](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/LegalShieldCheckbox.tsx#L29):
   `<label ... className="... text-right">` forces right-alignment in English.
3. [QuizStep.tsx#L25](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/QuizStep.tsx#L25) & [L39](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/QuizStep.tsx#L39):
   `text-right` forces questions and option buttons right-aligned in English.
4. [AntiPiracyQuizModal.tsx#L60](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx#L60):
   `absolute top-4 left-4` pins close button to top-left, colliding with LTR header text.
5. [AntiPiracyQuizModal.tsx#L191](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx#L191):
   `<span>السابق</span>` hardcodes Arabic text.

## Root Cause
Physical styling classes (`text-right`, `left-4`) used instead of logical properties (`text-start`, `start-4` / `end-4`), inverted SVG rotation logic on the back arrow, and missing translation keys.

## Objective
Convert all physical directional properties to logical direction-aware properties so that Arabic (`/ar`) renders cleanly RTL and English (`/en`) renders cleanly LTR, with correct icon orientations and full translation coverage.

## Constraints
* **Strict Test Invariant:** `assert.deepEqual(Object.keys(arMessages.quiz), Object.keys(enMessages.quiz))` is enforced in [CatalogDisplay.test.ts](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/tests/CatalogDisplay.test.ts#L48). Any new translation keys added to `messages/ar.json` MUST be added identically to `messages/en.json`.
* The verbatim canonical legal shield text in [LegalShieldCheckbox.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/LegalShieldCheckbox.tsx) must remain exact (enforced by backend validation).

## Tasks
1. In [OrderSummaryCard.tsx#L122](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/OrderSummaryCard.tsx#L122):
   * Replace:
     `<ArrowRight className="w-4 h-4 rtl:rotate-180" />`
     with:
     `<ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />`
2. In [LegalShieldCheckbox.tsx#L29](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/LegalShieldCheckbox.tsx#L29):
   * Replace `text-right` with `text-start`.
3. In [QuizStep.tsx#L25](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/QuizStep.tsx#L25) and [QuizStep.tsx#L39](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/QuizStep.tsx#L39):
   * Replace `text-right` with `text-start`.
4. In [AntiPiracyQuizModal.tsx#L60](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx#L60) and [AntiPiracyModal.tsx#L76](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/AntiPiracyModal.tsx#L76):
   * Position the close button logically:
     `absolute top-4 start-auto end-4` (or `ltr:right-4 rtl:left-4`).
   * Replace `text-right mb-6` with `text-start mb-6`.
5. In [AntiPiracyQuizModal.tsx#L191](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx#L191):
   * Replace `<span>السابق</span>` with `<span>{t('prev')}</span>`.
   * Add `"prev": "السابق"` to `quiz` section in `messages/ar.json`.
   * Add `"prev": "Previous"` to `quiz` section in `messages/en.json`.
6. In [CoursePartList.tsx#L92-L93](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CoursePartList.tsx#L92-L93):
   * Replace `text-right` with `text-start md:text-end`.
   * Replace `justify-end` with `justify-start md:justify-end`.

## Acceptance Criteria
* In `/ar`: All text aligns right, close buttons sit at the top-left, and the back arrow points right (backward).
* In `/en`: All text aligns left, close buttons sit at the top-right, and the back arrow points left (backward).
* `npm test` runs with 0 failures and passes all translation key parity assertions.

## Verification
* Run `npm test` in the `frontend` directory.
* Navigate to `/en/order-summary/[orderNumber]` and verify the back arrow points left.
* Open the checkout modal in `/en` and verify the legal shield and quiz questions align to the left.

## Scope
* **Must Change:** [OrderSummaryCard.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/OrderSummaryCard.tsx), [LegalShieldCheckbox.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/LegalShieldCheckbox.tsx), [QuizStep.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/QuizStep.tsx), [AntiPiracyQuizModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/checkout/AntiPiracyQuizModal.tsx), [AntiPiracyModal.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/quiz/AntiPiracyModal.tsx), [CoursePartList.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/catalog/CoursePartList.tsx), `messages/ar.json`, `messages/en.json`.
* **Must Not Change:** Order creation API, legal shield canonical string.
