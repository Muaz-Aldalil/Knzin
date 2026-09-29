# Knzin Frontend Responsiveness Audit & Fix Prompts Index

This directory contains standalone, implementation-ready fix prompts generated from a comprehensive responsiveness and directionality audit of the Knzin frontend application.

## Systemic Technical Fix Sequence

Due to layout dependencies, the fix prompts should be executed in the following order:

| Step | Prompt File | Target Component | Core Problem | Severity |
|:---:|:---|:---|:---|:---:|
| **1** | [ISSUE-08](./ISSUE-08-design-tokens-and-color-consistency.md) | `globals.css`, All Components | Color fragmentation, ad-hoc hex literals, missing `@theme` tokens | **Fundamental** |
| **2** | [ISSUE-01](./ISSUE-01-header-hud-mobile-overflow.md) | `HeaderHUD.tsx`, `LanguageToggle.tsx` | 433px–553px mobile header blowout on `< 450px` viewports | **Critical** |
| **3** | [ISSUE-02](./ISSUE-02-marquee-banner-static-clipping.md) | `HeaderHUD.tsx`, `globals.css` | 110-character announcement clipped statically on `< 750px` | **High** |
| **4** | [ISSUE-06](./ISSUE-06-globals-css-100vw-overflow-masking.md) | `globals.css` | `100vw` synthetic scrollbar overflow & blanket masking | **Medium** |
| **5** | [ISSUE-03](./ISSUE-03-quiz-modal-vertical-overflow.md) | `AntiPiracyQuizModal.tsx`, `AntiPiracyModal.tsx` | Missing height cap & internal scrolling on viewports `< 520px` | **Critical** |
| **6** | [ISSUE-04](./ISSUE-04-personalization-badge-collision.md) | `PersonalizationBadge.tsx` | Rigid single-line flex collision on viewports `< 400px` | **High** |
| **7** | [ISSUE-07](./ISSUE-07-directional-arrow-i18n-inconsistencies.md) | `OrderSummaryCard.tsx`, `LegalShieldCheckbox.tsx`, `messages/*.json` | Inverted back arrow, `text-right` in LTR, missing i18n keys | **High** |
| **8** | [ISSUE-05](./ISSUE-05-course-card-grid-distortion.md) | `CourseCard.tsx` | Action buttons grid wrapping at `1024px` 3-column layout | **Medium** |

---

## Instructions for Coding Implementers

Each prompt file in this directory is **100% self-contained**. Any prompt can be directly provided to an AI coding agent or senior engineer.

Every prompt defines:
1. **Role & Domain Context:** Specific to Knzin vocational courses and Iraqi market promotional raffles.
2. **Deterministic Evidence:** Exact file paths, line ranges, and CSS token calculations.
3. **Strict Constraints:** Preserving test invariants (e.g. `assert.deepEqual(Object.keys(arMessages.quiz), Object.keys(enMessages.quiz))` in `CatalogDisplay.test.ts`), legal shield verbatim text, and mobile touch targets.
4. **Actionable Tasks & Acceptance Criteria:** Objectively verifiable results across 320px–1920px viewports.
