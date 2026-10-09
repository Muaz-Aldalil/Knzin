# Intake Template — Smart Intake System

This file defines the full question list, defaults, and confirmation format for Phase 1.

---

## Phase 1A — Auto-Detect

Run detection before asking anything. See `build-mode.md` Phase 1A for the full detection logic.

---

## Phase 1C — Core Questions

Ask in **Frontier Rounds** (see `glossary.md`). A frontier is every question whose prerequisites are already settled — askable *now* without guessing at answers not yet heard. Never ask the whole list at once; never ask a question whose deciding answer is still open.

**Round mechanics:**

1. Compute the frontier: detection results (Phase 1A) settle some questions outright — pre-fill those and ask only "confirm or override?" Skip logic below still applies (simple projects never see AUTH/API/STATE).
2. Ask the **entire frontier in one round**: questions numbered Q1..Qn, each followed by its default as the recommended answer:

   ```
   ❓ Q3 — TONE: One word (professional / playful / clinical / luxurious / brutalist / minimalist / bold)
      ➡️ Recommended: professional
   ```

3. Wait for answers. Each answer reshapes the tree: settled decisions push the frontier outward (e.g., GOAL answered "SaaS dashboard" unblocks the Group 5 technical questions). Recompute and ask the next round.
4. Facts are never asked — anything detectable belongs to Phase 1A auto-detect. Decisions are always the user's.
5. **Sharpen vague language before recording it** (source: mattpocock `domain-modeling`): if an answer uses an ambiguous term ("modern", "clean", "minimal"), propose the precise canonical choice ("minimal → which: whitespace-minimal, decoration-minimal, or component-count-minimal?") and record the resolved form.
6. The phase is done when the frontier is empty: every non-detected field answered or explicitly defaulted. Nothing silently assumed.

### Question Bank

Skip logic: If detection succeeded for a field, pre-fill and ask "confirm or override?"
If project type is simple (landing/portfolio/docs), skip AUTH/API/STATE questions.

### Group 1 — Purpose (always ask)

| # | Question | Default if skipped |
|---|---|---|
| 1 | GOAL: What does this project do? (one sentence) | "Web application" |
| 2 | PERSONAS: Who uses this? (one line) | "General web users" |

### Group 2 — Design Direction (always ask)

| # | Question | Default if skipped |
|---|---|---|
| 3 | TONE: One word (professional / playful / clinical / luxurious / brutalist / minimalist / bold) | "professional" |
| 4 | COMPETITORS: 1-3 sites to match or avoid | "No preference" |
| 5 | BANNED VISUALS: What you DON'T want (colors, styles, patterns) | "No bans" |

### Group 3 — Scope (always ask)

| # | Question | Default if skipped |
|---|---|---|
| 6 | PAGES: List every page/section needed | Pre-fill from detection if routing found, else "Single page" |
| 7 | THEME: Light / dark / both | "both" |

### Group 4 — Content (ask if not detected)

| # | Question | Default if skipped |
|---|---|---|
| 8 | CONTENT SOURCE: Real copy ready, or need placeholder? | "Need placeholder" |
| 9 | DESIGN REFERENCE: URL / screenshot / Figma to match | "none" |
| 10 | NAVIGATION: Header style (minimal / full / sidebar / none) | "minimal header" |
| 11 | FOOTER: Content (social links / legal / newsletter / none) | "minimal footer" |

### Group 5 — Technical (skip if simple project)

| # | Question | Default if skipped | Skip for |
|---|---|---|---|
| 12 | AUTH: Login, signup, roles, or public-only? | "public-only" | landing, portfolio, docs |
| 13 | API: REST, GraphQL, static, CMS, or none? | "static" | landing, portfolio |
| 14 | STATE MANAGEMENT: Redux, Zustand, Context, or none? | "none" | landing, portfolio, docs |
|| 15 | IMAGES: Where from? (Unsplash / placeholder / user-provided / SVG only) | "placeholder" | — |
|| 16 | DATABASE: What database? (PostgreSQL / MySQL / MongoDB / Supabase / Firebase / None / recommend default) | "recommend default" | landing, portfolio, docs |
|| 17 | BACKEND: What backend approach? (Next.js API routes / separate Node.js backend / Python / Laravel / serverless / Supabase BaaS / recommend default) | "recommend default" | landing, portfolio, docs |
|| 18 | PAYMENTS: Need payments? (yes / no / Stripe / PayPal / other / no) | "no" | landing, portfolio, docs |

### Group 6 — Quality (ask if not detected)

| # | Question | Default if skipped |
|---|---|---|
|| 19 | RESPONSIVE: Mobile-first or desktop-first? | "mobile-first" |
|| 20 | ACCESSIBILITY: WCAG AA minimum? Specific needs? | "WCAG AA" |
|| 21 | ANIMATIONS: None / minimal / heavy | "minimal" |

### Group 7 — Deployment (ask if not detected)

|| # | Question | Default if skipped |
||---|---|---|
|| 22 | DEPLOYMENT TARGET: Vercel, Netlify, server, static, or unknown? | Pre-fill from build config if found, else "Vercel" |
|| 23 | BROWSER SUPPORT: Modern only (Chrome/Firefox/Safari) or legacy? | "modern only" |

---

## Phase 1D — Deep Dive (complex projects only)

**Trigger:** If project type is SaaS, dashboard, e-commerce, or admin panel — this trigger is itself a frontier gate: these questions stay out of every round until project type is confirmed complex.
**Skip for:** Landing pages, portfolios, docs, blogs.

|| # | Question | Default if skipped |
||---|---|---|
|| 24 | i18n / RTL: Multi-language or Arabic/Hebrew layout? | "none" |
|| 25 | SEO: Meta tags, OG image, sitemap, structured data? | "basic meta tags" |
|| 26 | TESTING: Unit tests, integration tests, e2e? | "none for now" |
|| 27 | CI/CD: GitHub Actions, Vercel auto-deploy, manual? | "Vercel auto-deploy" |
|| 28 | MONITORING: Analytics, error tracking (Sentry), logging? | "none" |

---

## Phase 1E — Confirmation Summary

Show this after all questions are answered. User confirms or edits.

```
INTAKE SUMMARY — [Project Name]
═══════════════════════════════════

SOURCE: [Auto-detected / From scratch]

PURPOSE
  Goal: [answer]
  Personas: [answer]

DESIGN
  Tone: [answer]
  Competitors: [answer]
  Banned: [answer]
  Reference: [answer or "none"]

SCOPE
  Pages: [list]
  Theme: [answer]
  Navigation: [answer]
  Footer: [answer]

CONTENT
  Source: [answer]
  Images: [answer]

TECHNICAL
  Stack: [detected]
  Auth: [answer or "N/A"]
  API: [answer or "N/A"]
  State: [answer or "N/A"]
  Database: [answer or "N/A"]
  Backend: [answer or "N/A"]
  Payments: [answer or "N/A"]

QUALITY
  Responsive: [answer]
  Accessibility: [answer]
  Animations: [answer]

DEPLOYMENT
  Target: [answer]
  Browser: [answer]

DEEP DIVE (if complex)
  i18n: [answer or "N/A"]
  SEO: [answer or "N/A"]
  Testing: [answer or "N/A"]
  CI/CD: [answer or "N/A"]
  Monitoring: [answer or "N/A"]

═══════════════════════════════════

Proceed to Phase 2? (yes / edit [field] / restart)
```

### Re-Intake Flow

- **"edit [field]"** → Re-ask only that field, then re-show summary
- **"restart"** → Re-run Phase 1A auto-detection from scratch
- **"yes"** → Proceed to Phase 2

---

## Conflict Resolution

If user answers conflict with detection:
- User answers ALWAYS win over detection
- Detection is a suggestion, not a constraint
- Example: Detection says "React" but user says "Vue" → use Vue
