# Muaz-v3 — MCP Integration & Design Intelligence Upgrade

> **STATUS: COMPLETED** (all 10 steps executed). Archived for reference.

> Goal: Make the AI agent SEARCH real shipped screens before designing, cite evidence in blueprint, and use AI generation for visual assets — so every design is grounded in what works, not invented from training data.

---

## Problem

The skill generates generic designs because:
1. Agent invents layouts from training data instead of referencing real products
2. No composition patterns (only tokens — colors, fonts, spacing)
3. No enforcement to search real screens before designing
4. No MCP integration for design intelligence

## Solution

Add 3 MCPs (Mobbin, Figma, Higgsfield) + compositions data + enforcement rules so the agent MUST search real screens before designing.

---

## Gaps Found in Current State

| Gap | Impact | Fix |
|---|---|---|
| `search-guide.md` doesn't mention `--domain design` | Agent doesn't know design.csv exists | Add design domain to domain table |
| `README.md` is outdated | Doesn't mention premium-design-guide, quality-gate, anti-slop, MCP | Update features list |
| No `data/compositions.csv` | No searchable layout patterns | Create with 25-30 patterns |
| No MCP setup doc | Agent doesn't know how to configure MCPs | Create `references/mcp-setup.md` |
| `design-reference-workflow.md` only covers webfetch | No MCP-specific workflows | Add Mobbin/Figma/Higgsfield sections |
| `quality-gate.md` has 5 dimensions (0-100) | Need decision: merge or expand for Design Grounding | Expand to 6 dimensions (0-120), threshold 96 |
| No enforcement of Mobbin search | Agent can skip it | Add Hard Rule 17 + blueprint field 13 |
| `build-mode.md` blueprint has no Design Evidence field | No place to cite real examples | Add field 13 |
| `anti-slop.sh` requires bash on Windows | Not documented | Add note in mcp-setup.md |

---

## Files to Create

### 1. `references/mcp-setup.md`

MCP configuration guide for OpenCode. Covers:
- How to add MCPs to `opencode.json` (global vs project-level)
- Mobbin setup (URL, auth, what it does)
- Figma setup (URL, auth, what it does)
- Higgsfield setup (URL, auth, cost, what it does)
- How to verify MCPs are working
- Windows note: anti-slop.sh requires git bash

### 2. `data/compositions.csv`

25-30 searchable layout patterns. Columns:
- `name` — pattern name (e.g., "Split Hero Asymmetric")
- `category` — hero | features | pricing | testimonials | footer | navigation | dashboard
- `style_tags` — minimal, bold, editorial, dark, luxury, playful
- `description` — what the pattern looks like
- `use_cases` — when to use this pattern
- `anti_patterns` — what to avoid with this pattern
- `examples` — real products that use this pattern

---

## Files to Edit

### 3. `references/search-guide.md`

Add `design` and `compositions` to the domain table:

```
| `design` | Detailed design system prompts | Bauhaus, Cyberpunk, Material, Terminal, etc. |
| `compositions` | Layout patterns and strategies | hero, bento, editorial, split, masonry |
```

### 4. `references/design-reference-workflow.md`

Add MCP-specific sections:

```
## 4 — Mobbin MCP Workflow (Recommended)

When user has NO design reference:
1. Search Mobbin for "[pattern]" (e.g., "pricing page", "onboarding flow")
2. Get 3-5 real examples from shipped products
3. Analyze patterns: what's common, what's distinct
4. Cite specific examples in blueprint Design Evidence field
5. Design from those patterns, not from training data

## 5 — Figma MCP Workflow

When user HAS a Figma link:
1. Extract design DNA via Figma MCP
2. Get colors, typography, layout, components
3. Cross-reference with search engine results
4. Merge: Figma aesthetic + product-appropriate structure

## 6 — Higgsfield MCP Workflow

When project needs custom visuals:
1. Generate hero images, illustrations, product shots
2. Use consistent style across all generated assets
3. No stock photos — everything custom-generated
```

### 5. `references/quality-gate.md`

Expand to 6 dimensions:

```
Dimension 1: Visual Coherence (0-20)
Dimension 2: Layout & Structure (0-20)
Dimension 3: Typography Quality (0-20)
Dimension 4: Motion & Interaction (0-20)
Dimension 5: Content & Copy (0-20)
Dimension 6: Design Grounding (0-20) ← NEW
  - 0-5: No real references, entirely invented
  - 6-10: Some references but generic
  - 11-15: Specific references with pattern analysis
  - 16-18: Deep pattern analysis, multiple sources
  - 19-20: Every decision traced to specific evidence

Total: 0-120, threshold: 96+ (80% ratio)
```

### 6. `SKILL.md`

Add Hard Rule 17:

```
17. Design from evidence — if Mobbin MCP is available, search real shipped
    screens before Phase 3. Cite 3-5 specific examples in blueprint field 13.
    Designing without searching real screens = task FAILED.
```

Add MCP awareness to decision tree:

```
BUILD / CREATE / DESIGN / SCAFFOLD [website/page/UI]
  → Load references/build-mode.md
  → IF mobbin MCP available: search real screens first (see references/mcp-setup.md)
  → Run python scripts/search.py "<query>" --design-system first
```

Add MCP setup to reference file map:

```
| `references/mcp-setup.md` | MCP configuration — Mobbin, Figma, Higgsfield |
```

### 7. `references/build-mode.md`

Add Design Evidence field to Phase 3 blueprint:

```
13. DESIGN EVIDENCE: [list 3-5 real product screens that informed this design]
    — must come from Mobbin search, user-provided reference, or Figma MCP
    — "invented from training data" is not valid evidence
    — if Mobbin MCP unavailable, cite search.py results or user references
```

Add Mobbin search step before Phase 2:

```
### Design Reference Search (before Phase 2)
If Mobbin MCP is available:
1. Search for "[pattern type]" (e.g., "SaaS pricing page")
2. Get 3-5 real examples from shipped products
3. Analyze patterns: layout structure, component choices, whitespace strategy
4. Document findings → feed into Phase 2 design system
```

### 8. `README.md`

Update features list:

```
- **Design Intelligence**: Mobbin MCP integration for 600k+ real product screen references
- **Composition Patterns**: 49 searchable layout strategies (hero, bento, editorial, etc.)
- **Premium Design Guide**: Affirmative standard for what "good" looks like (spacing, typography, color, motion, layout)
- **Quality Gate**: 6-dimension scoring rubric (0-120) with enforcement flow
- **Anti-Slop Script**: Deterministic grep checks for 12 common AI patterns
- **Design Reference Workflow**: URL/screenshot/Figma/Mobbin extraction pipeline
```

Update reference file map:

```
| Premium Design Guide | `references/premium-design-guide.md` |
| Quality Gate | `references/quality-gate.md` |
| Design Reference Workflow | `references/design-reference-workflow.md` |
| MCP Setup | `references/mcp-setup.md` |
```

Update structure section:

```
muaz-v3/
├── SKILL.md
├── data/
│   ├── compositions.csv      ← NEW (layout patterns)
│   ├── styles.csv
│   ├── colors.csv
│   └── stacks/
├── scripts/
│   ├── anti-slop.sh
│   └── ...
├── references/
│   ├── mcp-setup.md          ← NEW (MCP configuration)
│   ├── premium-design-guide.md
│   ├── quality-gate.md
│   ├── design-reference-workflow.md
│   └── ...
└── README.md
```

---

## Enforcement Chain (How It Works End-to-End)

```
User: "build me a SaaS pricing page"
  ↓
Hard Rule 17 triggers: agent MUST search Mobbin first
  ↓
Agent: searches Mobbin → "pricing page" → gets 43 real examples
  ↓
Agent: analyzes → "3/5 use 3-tier grid, annual toggle, feature table"
  ↓
Blueprint field 13: DESIGN EVIDENCE → cites Stripe, Linear, Vercel screens
  ↓
Phase 3: blueprint cannot proceed without field 13
  ↓
Phase 5: quality gate checks field 13 + Mobbin search proof
  ↓
Final: agent pastes Mobbin results + anti-slop.sh output + self-score
```

---

## Execution Order

| Step | File | Action | Priority |
|---|---|---|---|
| 1 | `references/mcp-setup.md` | CREATE | High |
| 2 | `data/compositions.csv` | CREATE | High |
| 3 | `references/search-guide.md` | EDIT — add design + compositions domains | High |
| 4 | `references/design-reference-workflow.md` | EDIT — add MCP workflows | High |
| 5 | `references/quality-gate.md` | EDIT — add Dimension 6 | High |
| 6 | `SKILL.md` | EDIT — add Rule 17, MCP awareness, reference map | High |
| 7 | `references/build-mode.md` | EDIT — add field 13, Mobbin search step | High |
| 8 | `README.md` | EDIT — update features, structure, references | Medium |
| 9 | Sync to `~/.config/opencode/skills/muaz-v3` | SYNC | High |
| 10 | Test: `python scripts/search.py "pricing" --domain compositions` | TEST | Medium |

---

## What Stays Untouched

| File | Why |
|---|---|
| `scripts/core.py` | Already works — compositions.csv will be parsed by existing CSV loader |
| `scripts/search.py` | Already works — new domains auto-detected |
| `scripts/anti-slop.sh` | Already works — no changes needed |
| `data/styles.csv` | Untouched |
| `data/colors.csv` | Untouched |
| `data/typography.csv` | Untouched |
| `data/products.csv` | Untouched |
| `data/landing.csv` | Untouched |
| `references/design-tokens.md` | Already updated |
| `references/premium-design-guide.md` | Already created |
| `references/code-standards.md` | Untouched |
| `references/security-levels.md` | Untouched |
| All other `references/*.md` | Untouched |

---

## Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Quality gate dimensions | Expand to 6 (0-120) | More explicit, keeps existing 5 intact |
| Compositions format | Both style + component tags | Searchable by either dimension |
| MCP required? | No — optional enhancements | Skill works without MCPs, better with them |
| Higgsfield included? | Yes but optional | Agent can generate visuals, not required |
| Mobbin required? | Strongly recommended | Hard Rule 17 makes it mandatory when available |
| Figma required? | No — only when user provides link | Reactive, not proactive |

---

## Verification

After execution:
1. `python scripts/search.py "hero" --domain compositions` — returns layout patterns
2. `python scripts/search.py "Cyberpunk" --domain design` — still works
3. `bash scripts/anti-slop.sh .` — still clean
4. All file paths in SKILL.md resolve correctly
5. README.md matches actual file structure
