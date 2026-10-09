# Glossary

Single source of truth for terminology (`03_WRITING_STANDARDS.md` §14 pattern). One definition per term. Reference files link here on first use; they do not redefine terms.

## Pipeline Terms

| Term | Definition |
|---|---|
| **Blueprint** | Phase 3 structured output: all 14 mandatory fields + Decision Briefs + Design Tokens, every field source-cited. The contract between design intent and code. |
| **Frontier Round** | Intake round that asks only questions whose prerequisites are already settled (Phase 1C/1D). Questions numbered Q1..Qn, each carrying its default as the recommended answer; user answers reshape the next round's frontier. Source: mattpocock `grilling`. |
| **Seam** | The pre-agreed public boundary where component behavior is tested (component interface, route, service method). Agreed with the user before any test is written; no tests at unconfirmed seams. Source: mattpocock `tdd`. |
| **Decision Brief** | Per-major-design-choice tradeoff statement. Five parts: **Advantages / Disadvantages / Alternatives (incl. doing nothing) / Appropriate situations / Inappropriate situations**. Replaces the earlier 3-part "Best case / Realistic / Risks". |
| **Decision Framework** | Blueprint block for major choices: Problem → Constraints → Options → Tradeoffs → Decision → Consequences. |
| **Design Tokens** | Named design values (color, type, spacing, motion) output in 3 formats: CSS custom properties, Tailwind config, JS/TS object. |
| **Design Lock** | `.design-lock.md` written after blueprint confirmation — the frozen style/color/type/layout contract re-read at every session start. |
| **Design DNA** | Structured JSON extracted from a reference design (URL/screenshot/Figma): colors, typography, layout, effects. Becomes the source citation for blueprint fields. |
| **Evidence Class** | Label on every blueprint citation: `[STANDARD]` (WCAG/W3C/MDN/official docs — for factual, a11y, performance claims), `[PRODUCT]` (real shipped screens — for aesthetic decisions), `[HEURISTIC]` (judgment, not verifiable). |
| **Fallback/Exception** | Blueprint field 14: one line stating when this design is the wrong answer and the recommended pivot (handbook "when NOT to use"). |
| **Pre-flight** | Phase 2.5 gate: inspiration (3 real products), difference, key move, composition, style, content — all answered before blueprint. Vague in = vague out. |

## Quality Terms

| Term | Definition |
|---|---|
| **Anti-Slop** | Deterministic checks for common AI tell-patterns (purple gradients, Inter-only, default Tailwind palette, pure black bg, buzzwords, gradient text, glass blur, equal 3-col grid, em-dashes, "Welcome to"). Run via `scripts/anti_slop.py` (Windows-safe) or legacy `scripts/anti-slop.sh`. |
| **Quality Gate** | Phase 5 enforcement: self-score 8 dimensions (0-160). 128-160 ship / 96-127 revise (max 3 iterations) / <96 redesign from Phase 3. Paste score + tool output as proof. |
| **Three States** | Every data/interactive component implements loading (skeleton), error (inline + retry), empty (CTA). All 3, always. |
| **Premium Signals** | Affirmative markers of "good" design per `premium-design-guide.md`: intentional spacing rhythm, editorial type scale, restrained palette, meaningful motion — the opposite of AI-slop. |
| **Acceptance** | Blueprint field 12: testable checkbox conditions that define "done" for the delivery. |
| **Spec Axis** | Phase 5 fidelity check run before standards scoring: delivered code verified field-by-field against the blueprint, Design Lock, and ACCEPTANCE criteria — reported under `## Spec` separately from `## Standards` so neither axis masks the other. Source: mattpocock `code-review` two-axis review. |
| **Red** | A failing check that goes red on the specific bug under diagnosis and green once fixed (visual diff gate, DOM/console assertion, perf budget). Prerequisite for any fix work in tune-mode STEP 1.5 — no red-capable check, no fix. Source: mattpocock `diagnosing-bugs`. |

## Security Terms

| Term | Definition |
|---|---|
| **Security Level L1** | Public — static, portfolio, no login. |
| **Security Level L2** | Authenticated — SaaS, dashboard, e-commerce, sessions. |
| **Security Level L3** | Sensitive — fintech, healthcare, admin, PII. |
| Auto-detect during intake; override with "security level: [1/2/3]". Full checklists: `security-levels.md`. |

## Memory Terms

| Term | Definition |
|---|---|
| **AGENTS.md** | Project memory file auto-read by OpenCode each session. Max 60 lines. Never stale more than one session. |
| **DECISIONS.md** | `.context` log of architectural decisions (WHY, not WHAT) using the D-00N format: Context / Chose / Over / Because / Revisit. |
| **PROGRESS.md** | `.context` log of what's built, what's active, what's next, with a `LESSONS` block (what worked / failed / corrected, last 5 entries). |
| **PROJECT_BRIEF.md** | `.context` single source of truth for the project, written after blueprint confirmation, read first in every response. |

## Architecture Terms

| Term | Definition |
|---|---|
| **Module** | A unit of behavior with an interface and an implementation. The thing you design, deepen, test through, and reason about. Not "component," "service," or "unit." Source: mattpocock `codebase-design`. |
| **Interface** | The public surface of a module: what you can see and use from outside. The promise the module makes. Not "API" or "signature." Source: mattpocock `codebase-design`. |
| **Implementation** | The hidden interior of a module: the code that fulfills the interface. Not visible from outside, free to change without breaking callers. Source: mattpocock `codebase-design`. |
| **Depth** | How much behavior a module provides relative to the size of its interface. Deep = lots of behavior behind a small interface. Shallow = the interface is nearly as complex as the implementation. Source: mattpocock `codebase-design`. |
| **Deep module** | A module with a small interface and a lot of hidden behavior. The goal. Deep modules are testable through their interface and navigable because the surface is small. Source: mattpocock `codebase-design`. |
| **Shallow module** | A module whose interface is nearly as complex as its implementation. The problem. Shallow modules force callers to understand the interior to use them correctly. Source: mattpocock `codebase-design`. |
| **Seam** | A boundary where you can test or substitute without reaching inside. Not "boundary" or "layer." A seam is where you can insert an adapter, mock, or test double. The seam is the test surface. Source: mattpocock `codebase-design`. |
| **Adapter** | A thin module that translates between two interfaces. One adapter = a hypothetical seam (worth considering). Two adapters, one on each side = a real seam (justified). Source: mattpocock `codebase-design`. |
| **Leverage** | How much behavior a module gives you access to through its interface. High leverage = small interface, big effect. Source: mattpocock `codebase-design`. |
| **Locality** | How close related behavior lives. High locality = understanding one thing doesn't require bouncing between many small modules. Low locality = the opposite. Source: mattpocock `codebase-design`. |
| **Deletion test** | Would deleting a module concentrate complexity, or just move it? If it concentrates complexity, the module is deep and worth keeping. If it just moves complexity elsewhere, the module is shallow. Source: mattpocock `codebase-design`. |
| **Interface is the test surface** | Test at the interface, not the implementation. A module's interface is the promise it makes; testing through the interface proves the promise is kept. Source: mattpocock `codebase-design`. |
| **One adapter = hypothetical seam, two = real** | A single adapter between two modules is worth considering (hypothetical seam). Two adapters, one on each side, justify the seam (real seam). Source: mattpocock `codebase-design`. |

## Search Engine Terms
|---|---|
| **Style** | One of 84 design styles in `data/styles.csv` (e.g., Neo Brutalism, Academia, Cyberpunk). Selected via `search.py --design-system` or `--domain design`. |
| **Composition Pattern** | One of 50+ layout patterns in `data/compositions.csv` (hero, pricing, auth, onboarding, empty states...). Selected via `--domain compositions`. |
| **Palette** | One of 161 color palettes in `data/colors.csv`, mapped to Primary/Secondary/Accent/Background/Text. |
| **Typography Pairing** | One of 57 pairings in `data/google-fonts.csv` — display + body, never "Inter + Inter". |