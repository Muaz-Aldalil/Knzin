# Quality Gate

Scoring rubric + enforcement flow. Agent MUST score before claiming done. No exceptions.

---

## Enforcement Flow

```
Phase 5:
  1. Run anti_slop.py (fallback: anti-slop.sh, then manual checklist) → fix violations
  2. Run quality_gate.py --tokens tokens.json --stack <stack> → deterministic checks
     (contrast math, token schema, bundle budget, anti-slop) — see "Deterministic Gate" below
  3. Run the Spec Axis (below) → verify output against blueprint + Design Lock → fix drift
  4. Self-score below → get total (0-160)
  5. If total < 128 → fix weakest dimension → re-score
  6. Max 3 iterations. If still < 96 after 3 → redesign from Phase 3.
  7. Paste final score + tool output + Spec Axis report as proof.
```

Registered as `CHK-quality` in `references/checklist-index.md`.

**Highest-leverage rule:** Do not claim "done" without tool-verified proof. Paste the proof in your response. Verbal assertions without tool evidence are defects.

---

## Deterministic Gate (scripts/quality_gate.py)

Pure-Python, no dependencies. Converts the skill's rules from prose into enforced constraints:

| Check | What it enforces |
|---|---|
| **anti-slop** | `scripts/anti_slop.py` scan over the generated source; fails on `--fail-on` severity (default MEDIUM) |
| **tokens** | `tokens.json` schema conformance + WCAG 2.2 contrast math on every fg/bg pair (>= 4.5:1 normal, >= 3:1 large) |
| **budget** | Bundle estimate per stack vs QD budget (JS<200KB, CSS<50KB, initial<500KB gzip) |

```bash
python scripts/quality_gate.py <source_dir> --tokens design-system/<proj>/tokens.json --stack react
# exit 0 = pass, 1 = fail, 2 = usage error
```

**tokens.json** is emitted automatically by `persist_design_system()` (design_system.py) alongside MASTER.md.

Two optional browser-verified tools (require `playwright`; gracefully degrade without it):

- **scripts/token_audit.py** — loads a page and asserts computed styles match `tokens.json` (closes the blueprint→shipped-CSS loop).
- **scripts/visual_diff.py** — screenshot capture + pixel diff for the "lookalike test": verify each iteration *sees* the change it made, and gate against drift.

```bash
python scripts/token_audit.py design-system/<proj>/tokens.json http://localhost:3000
python scripts/visual_diff.py gate http://localhost:3000 refs/v4.2.png --threshold 0.05
```

---

## Spec Axis (fidelity check — run before self-scoring)

Source: mattpocock `code-review` two-axis review. The self-score rubric measures **standards**; the Spec Axis measures whether the output faithfully implements what was agreed. A page can pass one axis and fail the other — report them separately, never merged or re-ranked against each other.

Verify delivered code against, in order:

1. **Design Lock** (`.design-lock.md`): style, colors, typography, layout as locked.
2. **Blueprint fields 1-14**: every field realized in code (pages present, sections in agreed structure, security level honored, banned visuals absent).
3. **ACCEPTANCE criteria** (field 12): each criterion pass/fail.
4. **Scope creep**: anything built that no blueprint field asked for — flag it, propose removing it.

Report format (paste with proof):

```
## Standards
[anti-slop result + deterministic gate result + 8-dimension score]

## Spec
- Design Lock: [match / drift: <field> — <what differs>]
- Blueprint fields: [N/14 realized — list any partial/missing]
- ACCEPTANCE: [x/y passed — fix plan attached for failures]
- Scope creep: [none / list]
```

Any Spec finding → fix before scoring. Silent drift is a defect.

---

## Self-Score Rubric (8 dimensions, 0-20 each, total 0-160)

### Dimension 1: Visual Coherence (0-20)

| Score | Criteria |
|---|---|
| 0-5 | Random styles, no consistent palette, mixed font families |
| 6-10 | Consistent palette but no hierarchy, spacing is arbitrary |
| 11-15 | Clear palette + hierarchy, some spacing consistency, minor inconsistencies |
| 16-18 | Cohesive design system, consistent tokens, intentional spacing rhythm |
| 19-20 | Every element feels intentional, consistent micro-details, premium polish |

**Check:** Do all colors come from the blueprint? Is typography consistent across all sections? Is spacing on a grid?

### Dimension 2: Layout & Structure (0-20)

| Score | Criteria |
|---|---|
| 0-5 | Centered-everything, 3-col equal grid, no visual hierarchy |
| 6-10 | Basic hierarchy but default layout patterns, minimal whitespace |
| 11-15 | Intentional layout choices, good whitespace, some editorial/creative layouts |
| 16-18 | Strong visual hierarchy, asymmetric layouts, whitespace as design element |
| 19-20 | Every section has distinct structure, flow is intentional, layout serves content |

**Check:** Does the layout avoid the AI default (centered hero → 3-col features → centered CTA)? Is whitespace >= 96px between major sections?

### Dimension 3: Typography Quality (0-20)

| Score | Criteria |
|---|---|
| 0-5 | Single font, no hierarchy, poor line-height, hard to read |
| 6-10 | Basic hierarchy but generic font choice, no tracking adjustments |
| 11-15 | Good pairing, clear hierarchy, appropriate line-height and length |
| 16-18 | Editorial quality, tracking adjustments, consistent scale |
| 19-20 | Typography IS the design, every text element intentional, premium feel |

**Check:** Is display font 3.5-4x body? Is tracking adjusted for headings? Is line length 60-75ch? Is there only 1-2 font families?

### Dimension 4: Motion & Interaction (0-20)

| Score | Criteria |
|---|---|
| 0-5 | No animations or instant transitions, feels static |
| 6-10 | Basic hover effects, inconsistent timing |
| 11-15 | Consistent easing, 150-300ms transitions, some scroll reveals |
| 16-18 | Premium easing (cubic-bezier(0.16,1,0.3,1)), staggered animations, respects prefers-reduced-motion |
| 19-20 | Motion serves UX purpose, every interaction feels responsive and polished |

**Check:** Are all transitions 150-300ms? Is the premium easing used? Are scroll reveals present? Does prefers-reduced-motion work?

### Dimension 5: Content & Copy (0-20)

| Score | Criteria |
|---|---|
| 0-5 | Lorem ipsum, placeholder text, AI buzzwords, generic copy |
| 6-10 | Real text but generic, some buzzwords, em-dashes present |
| 11-15 | Specific copy, no buzzwords, active voice, concrete claims |
| 16-18 | Brand voice consistent, compelling value props, no filler |
| 19-20 | Copy is a design element, every word earns its place, specific metrics |

**Check:** Is there any Lorem ipsum? Any em-dashes? Any banned phrases from premium-design-guide.md? Is copy specific with numbers/metrics?

### Dimension 6: Design Grounding (0-20)

| Score | Criteria |
|---|---|
| 0-5 | No real references, entirely invented from training data |
| 6-10 | Some references but generic ("I looked at Stripe") |
| 11-15 | Specific references with pattern analysis ("3/5 pricing pages use 3-tier grid") |
| 16-18 | Deep pattern analysis, multiple sources, every decision traced |
| 19-20 | Every design decision cites specific evidence from real shipped products |

**Check:** Is blueprint field 13 (DESIGN EVIDENCE) filled? Are references specific (not just "Stripe")? Did agent search Mobbin or use user-provided references? Can every color/layout/typography choice be traced to a source?

### Dimension 7: Accessibility (0-20)

| Score | Criteria |
|---|---|
| 0-5 | No alt text, no focus states, contrast failures, keyboard-unusable |
| 6-10 | Some alt text/labels, but focus rings missing, reduced-motion ignored, contrast below AA |
| 11-15 | AA contrast (4.5:1 normal / 3:1 large), visible focus, alt text, aria-labels on icon buttons |
| 16-18 | WCAG 2.2 target size (>=24px, 44px for critical controls), keyboard order matches visual, color-not-only, skip link, semantic structure |
| 19-20 | Accessibility IS the design — full keyboard nav, dynamic/fluid type scales, no motion or full reduced-motion support, tested with SR tooling |

**Check:** Do all text/background pairs pass 4.5:1? Are focus rings visible (2-4px, 2px offset)? Is every icon button aria-labeled? Does `prefers-reduced-motion` disable animations? Are touch targets >=44px? Is information conveyed beyond color alone? Does the page work at 200% zoom without horizontal scroll?

### Dimension 8: Responsive & Cross-Device (0-20)

| Score | Criteria |
|---|---|
| 0-5 | Desktop-only layout, horizontal scroll on mobile, fixed widths |
| 6-10 | Some breakpoints but elements overlap/overflow, touch targets too small |
| 11-15 | Mobile-first, systematic breakpoints (375/768/1024/1440), no horizontal overflow |
| 16-18 | Mobile layout is a redesign not a shrink — nav, tables, and grids re-flow intentionally; thumb-zone aware; fluid type |
| 19-20 | Every breakpoint feels designed, containers/type/clamp fluid, touch targets >=48px with 8px gaps, safe areas respected, tested on real devices |

**Check:** Is the design mobile-first (not desktop-shrunk)? Are 375/768/1024/1440 verified with no horizontal scroll? Do nav, tables, and multi-column grids reflow? Is body text >=16px on mobile? Are touch targets >=44-48px with spacing? Is type fluid (`clamp()`), not fixed rem at every breakpoint?

---

## Score Thresholds

Total is now 0-160 (8 dimensions × 0-20).

| Total | Action |
|---|---|
| 128-160 | **Ship.** Paste score + proof. |
| 96-127 | **Revise.** Fix weakest dimension(s), re-score. Max 3 iterations. |
| < 96 | **Redesign.** Return to Phase 3. Blueprint needs rethinking. |

---

## AI-Slop Detection Checklist

Deterministic checks (`python scripts/anti_slop.py <dir> --fail-on MEDIUM`; fallback `anti-slop.sh`; 29 checks, severity-tagged):
- [ ] No purple/violet gradient as primary (CRITICAL)
- [ ] No AI brand gradient (indigo/violet→purple/pink) (HIGH)
- [ ] No Inter as sole font family (HIGH)
- [ ] No default Tailwind blue-500/purple-500 as primary (HIGH)
- [ ] No pure #000 background (HIGH)
- [ ] No gradient text (background-clip: text) (HIGH)
- [ ] No scroll listeners / transition-all / layout-property animation (HIGH)
- [ ] No placeholder copy (Lorem, Acme, John Doe, example.com) (MEDIUM)
- [ ] No hover-only reveal of critical content (MEDIUM)
- [ ] No "01 · Title" numbered section eyebrows (MEDIUM)
- [ ] No italic headings (MEDIUM)
- [ ] No centered hero as sole layout pattern (HERO_CENTERED, MEDIUM)
- [ ] No backdrop-blur as decorative element (MEDIUM)
- [ ] No em-dashes in copy (MEDIUM)
- [ ] No "Welcome to" in hero (MEDIUM)
- [ ] No AI buzzwords in copy (MEDIUM)
- [ ] No 3 equal-width columns as sole grid (MEDIUM)
- [ ] No border-only selected state — unmodified shadcn `data-[state=active]:border-` (MEDIUM)
- [ ] No cramped caps eyebrow — uppercase + wide tracking at tiny size (MEDIUM)
- [ ] No decorative status pill — rounded-full Live/Beta dot (MEDIUM)
- [ ] No glow lights — blur-2xl/3xl, purple radial, glow drop-shadow (MEDIUM)
- [ ] No emoji as UI icons (MEDIUM)
- [ ] No "Most Popular"-badged middle pricing tier (MEDIUM)

Manual checks (agent must verify):
- [ ] No symmetric feature grid without visual hierarchy
- [ ] No stock photo + gradient overlay
- [ ] No glassmorphism by reflex
- [ ] No rounded-full pill buttons as only button style
- [ ] No generic SaaS page structure (hero→features→pricing→testimonials→footer)
- [ ] No filler buzzword copy

---

## Verifiable Proof Requirements

Before claiming "done", the agent MUST paste:

1. **anti-slop output** — full tool output (python or shell) showing CLEAN or violations fixed
2. **Spec Axis report** — `## Standards` / `## Spec` headings with Design Lock match, blueprint fields realized, ACCEPTANCE results, scope-creep check
3. **Self-score** — scores for all 8 dimensions (0-20 each = 0-160) with rationale
4. **Total score** — sum with ship/revise/redesign decision
5. **If revised** — what changed between iterations

Verbal claims without tool evidence are defects.

---

## Iteration Protocol

```
Iteration 1: Score → identify weakest dimension → fix → re-score
Iteration 2: Score → fix next weakest → re-score
Iteration 3: Score → if still < 96, redesign from Phase 3

If iteration 3 fails:
  "Quality gate failed after 3 iterations. Returning to Phase 3
   to redesign the blueprint. The current approach isn't reaching
   premium quality. Need different layout/typography/color strategy."
```
