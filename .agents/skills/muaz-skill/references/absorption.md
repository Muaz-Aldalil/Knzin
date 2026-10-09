# Absorption — Capability Reference

> **What it is:** A process for absorbing external open-source projects (GitHub repos) into the AI agent platform as native, owned capabilities — with zero runtime dependency on the original.

> **When it activates:** User says "absorb this repo", "absorb X and Y", "should I install or absorb?", "make X mine".

> **Core principle:** Extract the ideas. Build your own implementation. Eliminate the dependency. Never say "we integrated X" — say "we built our own X."

## Quick Value Check

Before absorbing, answer:

| Question | If YES → | If NO → |
|---|---|---|
| Does it solve a real problem we have? | Continue | Skip — not worth absorbing |
| Is the license permissive (MIT/Apache/BSD)? | Continue | Flag — GPL/BSL may block absorption |
| Is the core insight portable (prompt/pattern/concept vs. platform-specific code)? | Continue | Build your own — don't absorb platform-specific infrastructure |
| Does it deliver measurable value? | Continue | Skip — no moat without value |
| Can a competitor replicate by installing the original? | Flag — not a moat yet | Good sign — absorption may create moat |
| Is there a compounding loop possible? | Strong moat candidate | Static advantage — erodible |

**If you answered NO to value or YES to easy replicability → not a moat candidate.** Absorption may still be worth it for the capability, but don't overclaim defensibility.

## What to Steal vs. Build vs. Skip

### Steal (absorb the concept, rebuild in own code)

| Type | What to steal | How |
|---|---|---|
| Prompt-based tools | The prompt rules, specific insights, intensity levels, safety logic | Rewrite in own voice. Extract insights, not the file. |
| Workflow patterns | The pattern (review-fix-recheck, route analysis, etc.) | Build own implementation from the pattern. Don't import codebase. |
| Binary/tool concepts | What it does, how it works (structural preservation, recovery, fail-open) | Document concepts. Build own implementation in own stack. |
| Ecosystem concepts | Related ideas pointing toward moat direction | Note as moat direction. Plan to go further (own model, own data). |

### Build (Phase 3 moat)

| Type | What to build | Why it's a moat |
|---|---|---|
| Fine-tuned model | Own model + own data + own fine-tuning | Competitors can't copy by installing a skill |
| Native verification layer | Own AI reviewing own outputs, integrated with compression | Improves independently. Integrated. No external dependency. |
| Combined metrics | Proof of advantage | Quantitative claims backed by own data |

### Skip (not worth absorbing)

| Type | Why skip |
|---|---|
| Platform-specific infrastructure | Hooks, CLI, installer — specific to their platform. Build own. |
| Distribution logistics | npm packaging, multi-agent install matrix — not relevant |
| Separate skills/features | Sub-skills, companion tools — not core to the capability |
| BSL/commercial parts | Not usable. Focus on MIT/OSS parts. |
| Small community, commoditized capability | If community <5k stars AND capability is copyable → no strategic reason to engage further |

## The 8 Phases (summary)

```
Clone → 0:Instrument → 1:Adopt(temp) → 2:Extract → 3:Build → 4:Integrate → 5:Strategy → 5:Verify
```

| Phase | Goal | Deliverable | Key rule |
|---|---|---|---|
| 0 — Instrument | Code-level understanding | `absorption-brief-phase0.md` | Read implementation, not just README. Verify claims. |
| 1 — Tactical Adoption | Get value now, map deps | `absorption-phase1-report.md` | Adopt temporarily. Map every dependency. Flag for removal. |
| 2 — Deconstruct & Extract | Pull pieces into own code, eliminate deps | `absorption-phase2-report.md` | Rewritten code, not copied. Extract insights, not files. |
| 3a — Build Layer 1 | Proprietary capability (moat) | `absorption-phase3a-report.md` | Own data + own implementation. Deferred items documented. |
| 3b — Build Layer 2 | Second proprietary capability | `absorption-phase3b-report.md` | Integration design. Instrumentation defined. |
| 4 — Platform Integration | Make native, remove traces | `absorption-phase4-report.md` | "Our X", not "integrated X". No dependency in docs/code/narrative. |
| 5a — Strategic Options | Community/mindshare decision | `absorption-phase5a-report.md` | Partnership / Acquisition / Ignore — deliberate choice. |
| 5b — Full Verification | Verify complete + clean | `absorption-phase5b-report.md` | Every phase verified. Zero dependency confirmed. Moat assessed. |

For full phase checklists, see `references/absorption-phases.md`.
For tracking file format, see `references/absorption-tracking.md`.
For full depth (reading checklist, extraction patterns, moat framework, strategic options framework), see the standalone `absorption-skill` at `AppData/Local/hermes/skills/absorption-skill/`.

## Hard Rules (abbreviated)

1. **No importing the repo's codebase.** Build own implementation from the ideas.
2. **No "we integrated X" narrative.** Ever. Internal docs may note philosophical influence.
3. **Measure everything.** Real numbers, not README claims.
4. **Each phase complete before next.** Don't skip phases.
5. **Zero runtime dependency is the standard.** By end of Phase 2: no code dependency. By end of Phase 4: no narrative dependency.
6. **The moat is the goal.** Every absorption should produce something defensible.
7. **Report every phase.** Even minimal phases get a report.

## Existing Absorptions

### Caveman + autoprompt-skill (completed 2026-09-21)

- **Repo:** JuliusBrussee/caveman + Spielewoy/autoprompt-skill
- **Status:** All 8 phases complete
- **Deliverables:** 7 phase reports in `Desktop/Tools/absorption-*.md`
- **Key results:**
  - Caveman: compression rules extracted + rewritten. Fine-tuned model path deferred (no GPU infra). Prompt-based compression active (30-60% 추정 reduction).
  - autoprompt-skill: review-fix-recheck pattern built from scratch. Verification v1 active. Zero dependency.
  - Strategic: Caveman → Ignore & Ride the Wave. autoprompt → no action needed.
- **Moat:** Moderate (active capabilities + integration + feedback loop; fine-tuned model + metrics dashboard deferred)

**Next actions for existing absorption (not yet done):**
- Build metrics dashboard (token usage, failure rate, fix rate)
- Scale training data (50 → 500+ pairs)
- Evaluate fine-tuning options (GPU, base model, cost)
- Expand failure mode catalog + add behavior testing to verification v2
- Implement verification latency tracking

### mattpocock/skills (completed 2026-09-24)

- **Repo:** mattpocock/skills (`https://github.com/mattpocock/skills`)
- **License:** MIT
- **Stars:** 268,678 | **Forks:** 22,654 | **Commits:** 472
- **Status:** All 8 phases complete
- **Deliverables:**
  - Phase reports: `skills-absorption/absorption-*.md` (phases 0-5b)
  - 4 skills built in Hermes installed tree:
    - `skills/productivity/grilling-session/SKILL.md` — structured alignment session (design tree, frontier rounds, facts/decisions split)
    - `skills/productivity/domain-modeling/SKILL.md` + `references/CONTEXT-FORMAT.md` + `references/ADR-FORMAT.md` — active domain model discipline (challenge terms, sharpen language, update glossary inline, ADR three-condition gate)
    - `skills/software-development/improve-codebase-architecture/SKILL.md` — architecture survey + visual HTML report (Tailwind CDN + Mermaid CDN) + grilling follow-up
    - `skills/software-development/codebase-design/SKILL.md` — module design vocabulary reference (module, interface, depth, seam, adapter, leverage, locality + 3 principles)
  - 2 merged enhancements:
    - `requesting-code-review` v2.2.0 — Fowler 12-smell baseline + `smells_flagged` JSON instrumentation
    - `test-driven-development` v1.2.0 — seam-based TDD discipline + verification checklist item
- **Key results:**
  - Grilling session: design tree + frontier rounds pattern. Hermes-native (no Claude Code Skill tool). Used in muaz-skill Phase 1C intake (Frontier Rounds).
  - Fowler baseline: 12 smells from Fowler's _Refactoring_ ch.3. Embedded in reviewer prompt + Step 6 report output + `smells_flagged` JSON field for instrumentation.
  - Seam TDD: seam concept + "confirm seams before writing tests" + "interface is the test surface" merged into TDD cycle. Checklist item added.
  - Domain modeling: active glossary discipline + CONTEXT.md/ADR format refs. Repo-local persistence default (Obsidian available as alternative).
  - Architecture survey: subagent walk + deletion test + visual HTML report + grilling follow-up. Uses codebase-design vocabulary + grilling-session + domain-modeling.
  - Codebase-design vocabulary: shared module design terminology. Prerequisite for architecture survey and domain modeling. Used in muaz-skill glossary and architecture discussions.
- **Moat:** Integration depth — capabilities wired into Hermes's tool set (delegate_task, write_file, skill references), not standalone prompts. Partial; unmeasured.
- **Strategic:** Option C — Ignore & Ride the Wave. No partnership, no acquisition.
- **Next actions:**
  - Exercise grilling session in a real fuzzy-build session
  - Exercise improve-codebase-architecture on a real repo
  - Exercise domain-modeling when domain terms need sharpening
  - Collect instrumentation data (smells_flagged catch rate, seam confirmation rate) over multiple sessions
