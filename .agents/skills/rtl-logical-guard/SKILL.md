---
name: rtl-logical-guard
description: >-
  Quality guard enforcing CSS Logical Properties and bidirectional (LTR/RTL) layout integrity
  for bilingual Arabic/English web applications. Activates whenever reviewing, editing, or creating
  React/Next.js components, Tailwind CSS classes, or HTML templates to eliminate broken layouts.
compatibility: Technology-neutral. Optimized for Tailwind CSS v3/v4, CSS Modules, and standard HTML/CSS.
---

# RTL Logical Properties & Bilingual UI Quality Guard (SKILL.md)

## Status & Purpose
This skill serves as the automated quality guard for bilingual (Arabic / English) user interfaces. It guarantees that all components render with 100% geometric and typographical symmetry across Left-to-Right (`dir="ltr"`) and Right-to-Left (`dir="rtl"`) modes.

---

# 1. THE NON-NEGOTIABLE RULE: ZERO PHYSICAL DIRECTIONAL CLASSES

In bilingual and RTL applications, **physical directional CSS classes are considered critical defects**.

Physical properties hardcode layout to a single reading direction. **Always use CSS Logical Properties.**

### The Tailwind CSS v3 / v4 Logical Mapping Table:

```
┌──────────────────────┬──────────────────────┬───────────────────────────────────┐
│ FORBIDDEN (Physical) │ MANDATORY (Logical)  │ CSS Logical Property Standard     │
├──────────────────────┼──────────────────────┼───────────────────────────────────┤
│ pl-{size}            │ ps-{size}            │ padding-inline-start              │
│ pr-{size}            │ pe-{size}            │ padding-inline-end                │
│ ml-{size}            │ ms-{size}            │ margin-inline-start               │
│ mr-{size}            │ me-{size}            │ margin-inline-end                 │
│ left-{size}          │ start-{size}         │ inset-inline-start                │
│ right-{size}         │ end-{size}           │ inset-inline-end                  │
│ text-left            │ text-start           │ text-align: start                 │
│ text-right           │ text-end             │ text-align: end                   │
│ border-l-{size}      │ border-s-{size}      │ border-inline-start-width         │
│ border-r-{size}      │ border-e-{size}      │ border-inline-end-width           │
│ rounded-l-{size}     │ rounded-s-{size}     │ border-start-start & start-end    │
│ rounded-r-{size}     │ rounded-e-{size}     │ border-end-start & end-end        │
│ rounded-tl-{size}    │ rounded-ss-{size}    │ border-start-start-radius         │
│ rounded-tr-{size}    │ rounded-se-{size}    │ border-start-end-radius           │
│ rounded-bl-{size}    │ rounded-es-{size}    │ border-end-start-radius           │
│ rounded-br-{size}    │ rounded-ee-{size}    │ border-end-end-radius             │
│ float-left           │ float-start          │ float: inline-start               │
│ float-right          │ float-end            │ float: inline-end                 │
│ clear-left           │ clear-start          │ clear: inline-start               │
│ clear-right          │ clear-end            │ clear: inline-end                 │
└──────────────────────┴──────────────────────┴───────────────────────────────────┘
```

---

# 2. TYPOGRAPHY & FONT STACK INVARIANTS

Arabic typography has distinct x-heights, baseline descenders, and line-height requirements compared to Latin scripts.

### 2.1 Bilingual Font Stacks
Always configure and declare Arabic-native font fallbacks alongside Latin typefaces:
```css
/* Tailwind / CSS font-family standard */
font-sans: var(--font-inter), 'Cairo', 'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif;
font-heading: var(--font-outfit), 'Tajawal', 'Cairo', sans-serif;
```

### 2.2 Line Height & Vertical Rhythm
Arabic script requires approximately **10%–15% more vertical line-height** to prevent diacritics and ascenders/descenders from clipping:
- **Rule**: Avoid tight line-heights like `leading-none` or `leading-3` on mixed or Arabic text. Use `leading-relaxed` or `leading-normal`.

---

# 3. ICONOGRAPHY & DIRECTIONAL ELEMENTS

Not all icons should flip when switching between LTR and RTL. Mis-flipping icons causes severe UX disorientation.

### 3.1 Icons That MUST Flip (`rtl:rotate-180`):
- Directional navigation arrows (e.g., `ChevronRight`, `ArrowLeft`, `Forward`).
- Progress bars and stepped flow indicators.
- Sliders and volume indicators.
- Back and Forward browser navigation controls.

```tsx
// Correct implementation:
<ChevronRight className="w-5 h-5 rtl:rotate-180 transition-transform" />
```

### 3.2 Icons That MUST NOT Flip:
- Real-world physical objects with fixed directions (e.g., magnifying glass, clock, user avatar, shopping cart, heart, lock, video camera).
- Media player controls (Play, Pause, Fast Forward remain LTR worldwide).

---

# 4. FORM CONTROLS & NUMERICAL DATA

1. **Phone Numbers & Country Codes**:
   - Phone numbers must always render LTR to maintain international calling order:
     ```tsx
     <span dir="ltr" className="font-mono">+966 50 123 4567</span>
     ```
2. **Form Labels & Validation Messages**:
   - Labels and input placeholders must align to `text-start`.
   - Trailing input icons (e.g. eye icon for passwords) must use `end-3` instead of `right-3`.

---

# 5. AUDIT CHECKLIST FOR STAGE 7 CONVERGENCE

During Stage 7 of `engineering-workflow`, the agent must run this automated check against all modified frontend files:

```bash
# Search for forbidden physical classes in touched files:
grep -En '\b(pl-|pr-|ml-|mr-|left-|right-|text-left|text-right|border-l-|border-r-|rounded-l-|rounded-r-)' <touched_files>
```

- If any match is found: **Definite Defect.** Convert to logical property immediately before presenting the verification handoff.
