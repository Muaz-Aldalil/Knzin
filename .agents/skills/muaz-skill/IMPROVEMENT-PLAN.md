# Muaz-v3 — Improvement Plan v4.2.0 (Handbook-Driven)

> **Status:** Completed 2026-08 as v4.2.0. Execution record: this file (§6 Execution Order documents what was done; §5 Verification Plan documents what should pass). Plan content retained for reference.
> **Baseline:** v4.1.0 (released 2026-07-21).
> **Target:** v4.2.0 — additive, no breaking changes, no data/schema changes.
> **Source of improvements:** the *AI Software Engineering Knowledge System* handbook
> (`C:\Users\muaza\Desktop\Software Eng Hand Book`) — its constitution, writing standards
> (03), metadata spec (03a), knowledge architecture (02), checklists (09), and operating
> rules (01), plus a senior re-review of this plan against the actual repository.
> **Canonical copy:** this repo (`C:\Users\muaza\Desktop\Tools\muaz-skill`). The installed copy
> at `AppData/Local/hermes/skills/muaz-skill/` is synced from here (see §5).

---

## 1. Findings from the Senior Re-Review (plan corrections)

The original proposal missed execution-level facts. These findings **change the plan**:

### F1 — Quality gates contradict each other (3 different thresholds)
Evidence:
- `references/quality-gate.md` enforcement flow: `If total < 96 → re-score`, `If still < 96 after 3 → redesign` (line 14) — **but** rubric table says `< 72 → Redesign` (line 106).
- `SKILL.md` §5 Phase 5: `0-100 scale, 80+ ship / 60-79 revise / <60 redesign` — a third system.
- `UPGRADE-PLAN.md` 1.1 claimed this was fixed in v4.1.0, but only line 154 (`< 80 → < 72`) was changed; the `SKILL.md` scale and the `< 96` line remain.

**Correction:** the improvement plan must fix this contradiction (a direct violation of handbook §12.4 "contradictory knowledge"). Standardize on **one** model: `0-120`, `96-120 ship / 72-95 revise (max 3) / <72 redesign`. Update `quality-gate.md` line 14 and `SKILL.md` §5.

### F2 — `anti-slop.sh` cannot run on this machine as written
Evidence: the script depends on `rg` (ripgrep) on PATH; `rg` is **not installed** here, and the user's shell is PowerShell (no guaranteed git-bash). The skill's own highest-leverage rule demands *tool-verified proof* before claiming done — currently un-runnable on the primary machine.

**Correction:** port the deterministic grep checks to `scripts/anti-slop.py` (pure Python, zero deps). The regexes already exist in Python form in `tests/test_anti_slop.py`, so the port is mechanical and testable. Phase 5 fallback order: `anti-slop.py` → `anti-slop.sh` (git bash) → inline checklist. Quality-gate enforcement flow updated accordingly, cross-platform.

### F3 — Version strings are scattered across 5+ files
Evidence: `v4.1.0` appears in `SKILL.md` frontmatter, `references/memory-system.md` (AGENTS.md template block), `templates/AGENTS.md`, plus stale copies in `README.md` (EN/AR) and `templates/user-prompt-template.md` (to verify). A bump must sweep all, or the skill ships self-contradicting context.

**Correction:** version sweep is an explicit step with a grep-based acceptance check (F3-AC: zero `v4.1.0`/`4.1.0` left outside `UPGRADE-PLAN.md`/`IMPROVEMENT-PLAN.md` history).

### F4 — README duplicates the reference-file map (handbook §12.1 anti-pattern)
Evidence: `README.md` lists 17 references (EN + AR duplicated), `SKILL.md` §8 lists 15 — but the folder has **26** files. Two divergent copies of the same inventory already exist.

**Correction:** README tables become a single pointer to `references/reference-graph.md` (the new single source). No new file list is maintained in README. EN and AR sections both updated (F4 note: README is bilingual — Arabic must be updated too).

### F5 — Tradeoff contract must be scoped, or it bloats every blueprint
Handbook `03_WRITING_STANDARDS.md` §9 defines what counts as a recommendation: "use X / prefer X". Definitions and values are *not* recommendations and need no tradeoff set.

**Correction:** the 5-part tradeoff contract applies to **named design choices only**: style selection, layout pattern, typography pairing, color palette, stack/framework (when a choice exists), auth/security-level decision. Token hex values and rule statements do not each get a full brief. Prevents the improvement from doubling blueprint length.

### F6 — Evidence hierarchy needs two classes, not "products first"
Handbook `03` §17: primary sources (standards, official docs) first; community/products only illustrate.

**Correction:** blueprint field 13 stays "DESIGN EVIDENCE" for *aesthetic* decisions (products/Mobbin are correct and primary there), but factual claims (perf budgets, WCAG AA, accessibility rules) must cite standards (W3C, WCAG, MDN, official docs). Each citation is labeled `[STANDARD]` / `[PRODUCT]` / `[HEURISTIC]`. This maps handbook §17 onto the skill's actual domain without brain-dumping standards.

### F7 — Reference graph must cover *all* 26 files, not "the map"
26 files exist in `references/`; `SKILL.md` §8 covers 15; README covers 17. A graph built from the existing map would orphan ~10 files (handbook §12.2).

**Correction:** Phase 2 of the plan includes a *completeness gate*: a script/check that every `references/*.md` appears in exactly one `reference-graph.md` node, and every node points to an existing file. No orphan files after the change.

### F8 — Frontmatter dogma: keep repo convention, don't strip
The earlier proposal suggested stripping non-standard frontmatter fields. Re-review finding: the repo convention (per `UPGRADE-PLAN.md` 1.3/1.5) deliberately keeps `version/author/integrates_with/stacks/security` in frontmatter, and the skill already loads successfully in opencode with them.

**Correction:** keep existing frontmatter; *add* `status`-style metadata and review history in the **body** (`## Status & Review` + changelog), where it cannot break the loader. Add `last_reviewed`/`review_due` lines in that section only.

### F9 — Glossary/checks must not become duplicate knowledge
Handbook `03` §14 (single source of truth) and §12.1. `quality-gate.md` already owns the rubric + enforcement flow; `build-mode.md` §2.5 owns pre-flight.

**Correction:** `checklist-index.md` is a **registry** (IDs + pointers), not a copy of the checklists. CHK-preflight points at `build-mode.md` §2.5; CHK-quality points at `quality-gate.md` + anti-slop (new py). Only CHK-delivery contains genuinely new content. Glossaries define terms once and never restate rules.

### F10 — Memory-system additions must respect its own size rules
`memory-system.md` caps `AGENTS.md` at 60 lines and keeps DECISIONS/PROGRESS separate.

**Correction:** the retrospective (lessons-learned) addition lands in `.context/PROGRESS.md` as a `LESSONS` block (bulleted, prefixed `L-<date>`), with triggers and a cap (keep last 5). `AGENTS.md` template only gets the version bump — never content growth.

### F11 — Windows is a first-class target
`UPGRADE-PLAN.md` "Key Findings" #4: *Windows compatibility is critical*. This plan's verification steps must all be PowerShell-runnable, with git-bash only as fallback for legacy `.sh`. No bash-only verification steps.

### F12 — "When not to use" (handbook Principle 1, 6th question)
Blueprint covers *what/why/how/when*, not *when-not*. Add field 14 note: `FALLBACK/EXCEPTION` — one line stating when this design is the wrong answer and the recommended pivot. Light-touch, mirrors handbook's 6-question contract.

---

## 2. Improvement Specification

Linking: | ID | Handbook source | Current state | Change | Acceptance |

| ID | Handbook source | Current | Change | Acceptance |
|---|---|---|---|---|
| **T-1** Tradeoff contract | 03 §9 (Principle 4) | Decision Brief = Best case / Realistic / Risks only | Replace Decision Brief format with the 5-part contract: **Advantages / Disadvantages / Alternatives (incl. doing nothing) / Appropriate situations / Inappropriate situations** — applied to named design choices only (F5) | T-1-AC: `build-mode.md` Decision Brief template shows all 5 parts + scope rule; `SKILL.md` §3 references it |
| **T-2** Decision framework | 03 §11 | none | Add to blueprint: `DECISION FRAMEWORK` block — Problem → Constraints → Options → Tradeoffs → Decision → Consequences (per major design choice) | T-2-AC: template block present in `build-mode.md` Phase 3 |
| **T-3** When-not-to-use | 00 Article IV P1 (Q6) | none | Blueprint field 14 `FALLBACK/EXCEPTION`: + one line when the design is wrong + the pivot | T-3-AC: field 14 in blueprint template |
| **T-4** Evidence hierarchy | 03 §17 | DESIGN EVIDENCE lists products only | Two-class citations: aesthetic → `[PRODUCT]`; factual/a11y/perf claims → `[STANDARD]` (WCAG/W3C/MDN/official docs); heuristics → `[HEURISTIC]` | T-4-AC: evidence rules text in `build-mode.md` + `design-reference-workflow.md` updated |
| **S-1** Reference graph | 02 §4, ADR-008 | Flat map; 26 files vs 15 listed | New `references/reference-graph.md`: node = file, edges = phase + prerequisites; says which references load per phase; **no orphan files** | S-1-AC: completeness gate passes (see §6 step 1) |
| **S-2** Glossary | 03 §14 | terms redefined per file | New `references/glossary.md`: ~20 core terms (Decision Brief, design tokens, design lock, anti-slop, blueprint, premium signals, security levels, 3-states, etc.), one line each; rule: first-use links, no redefinition | S-2-AC: grep check — each glossary term appears ≤1 definition in glossary; files link rather than redefine |
| **S-3** Checklist registry | 09_CHECKLISTS | quality gate + tags exist, no CHK IDs | New `references/checklist-index.md`: `CHK-preflight` (→ build-mode §2.5), `CHK-quality` (→ quality-gate.md + anti-slop), `CHK-security` (→ security-levels.md), **CHK-delivery** (new: full Phase 5 pre-claim verification list) | S-3-AC: registry resolves; CHK-delivery content is new, others are pointers only (F9) |
| **S-4** Single file map | 02 §10 / 12.1 | README duplicates map | README (EN+AR) reference-map tables → one pointer to `references/reference-graph.md` | S-4-AC: README contains no file inventory beyond the pointer (F4) |
| **A-1** Challenging flawed requests | 00 Article X §10.1, 01 §5 | implicit | New SKILL.md hard rule: if a user request conflicts with the skill's quality contract, state the conflict + evidence + alternative *before* complying | A-1-AC: rule #15 in SKILL.md hard rules |
| **A-2** Assumptions log | 01 §3.2 | assumptions implicit | SKILL.md rule: record assumptions in `.context/DECISIONS.md` (existing D-00N format) before they shape design; cite in blueprint | A-2-AC: rule #16 + memory-system.md trigger line |
| **A-3** Retrospective | CHK-topic-production-workflow Stage 15 | none | `memory-system.md`: after Phase 5 add `LESSONS` block in `.context/PROGRESS.md` — what worked / failed / corrected (keep 5) | A-3-AC: format + trigger + cap documented in memory-system.md |
|| **Q-1** Unify quality thresholds | 12.4 contradiction | 3 different scales | One model: 0-160; 128-160 ship / 96-127 revise ×3 / <96 redesign. Fix `quality-gate.md` line 14 + `SKILL.md` §5 + `build-mode.md` Phase 5. (Refined from v4.2.0 proposal in v5.0.0.) | Q-1-AC: Zero conflicting thresholds in `SKILL.md`, `quality-gate.md`, `build-mode.md` |
| **Q-2** Cross-platform anti-slop | 12.3 + F2 | bash+rg only; rg missing | New `scripts/anti-slop.py` (regexes from tests) with same exit/output contract; Phase 5 fallback chain py → sh → manual | Q-2-AC: `python scripts/anti-slop.py <dir>` runs & matches `test_anti_slop.py` expectations; enforcement flow updated |
| **M-1** Version sweep | 12.4 / F3 | v4.1.0 in 5+ files | Bump all to 4.2.0 consistently; changelog entries | M-1-AC: grep shows no stale version outside plan/upgrade history |
| **M-2** Status & Review | 03a, 03 §10 | no review trail | `SKILL.md` gains `## Status & Review` (version, last_reviewed 2026-08, review_due 2027-08, changelog table); touched reference files get a lightweight footer `> Status: v4.2.0 — last reviewed 2026-08` | M-2-AC: SKILL.md section exists; footers on touched files only (scope control) |

---

## 3. File-by-File Change List

| File | Changes (IDs) | Notes |
|---|---|---|
| `SKILL.md` | Q-1, A-1, A-2, M-1, M-2, T-1, S-* | version → 4.2.0; §3 Decision Brief pointer updated; §5 threshold line fixed; §7 rules 15-16 added; new §8a Status & Review; §8 map → reference-graph pointer |
| `references/build-mode.md` | T-1, T-2, T-3, T-4, Q-1 | Phase 3 blueprint: Decision Brief → 5-part contract (scoped), DECISION FRAMEWORK block, field 14 FALLBACK/EXCEPTION, evidence labeling; Phase 5 threshold fix |
| `references/quality-gate.md` | Q-1, Q-2 | line 14 `< 96` → `< 72`; Phase 5 step 1 fallback chain (py → sh → manual); register CHK-quality |
| `references/memory-system.md` | A-2, A-3, M-1 | DECISIONS.md trigger + assumption line; LESSONS block spec; version string |
| `references/design-reference-workflow.md` | T-4, S-1 | evidence labeling; Design DNA JSON → cite graph placement |
| `references/design-tokens.md` | T-1 | "after every Blueprint Decision Brief" → after every Decision Brief (5-part) — wording sync |
| `references/tune-mode.md` | T-1 | Decision Brief wording sync (line 29) |
| `SKILL.md` + `templates/AGENTS.md` + `templates/user-prompt-template.md` | M-1 | version strings |
| `README.md` (EN + AR) | S-4, M-1 | map tables → pointer; credits/version words updated in both languages |
| `references/reference-graph.md` | **new** | S-1: 26 nodes, phases, prerequisites, acyclic |
| `references/glossary.md` | **new** | S-2: ~20 one-line terms |
| `references/checklist-index.md` | **new** | S-3: CHK registry incl. new CHK-delivery content |
| `scripts/anti-slop.py` | **new** | Q-2: pure-Python port of `anti-slop.sh` checks (patterns from tests), same output contract |
| `tests/test_anti_slop.py` | Q-2 | extend: import & run `anti-slop.py` against fixtures; assert parity with shell regex intent |
| `IMPROVEMENT-PLAN.md` | this file | plan record; moved to `UPGRADE-PLAN.md` history at execution? — keep as execution log for v4.2.0 |

---

## 4. Versioning & Sync Protocol

- **Version:** `4.2.0` — additive only. No changes to `data/*.csv` schemas, no removed stacks, no CLI-breaking flags (matches `UPGRADE-PLAN.md` conventions).
- **Changelog:** single table in `SKILL.md` `## Status & Review`; `UPGRADE-PLAN.md` gains a v4.2.0 section after execution with the same IDs (T-1…M-2).
- **Sync to installed copy:** after the source repo changes pass verification, re-copy changed files: `SKILL.md`, `references/*` (changed + new), `scripts/anti-slop.py`, `templates/AGENTS.md`, `templates/user-prompt-template.md` to `~/.config/opencode/skills/muaz-v3/`. Exclude: `.git`, `tests/`, `__pycache__/`, `README.md` (repo doc, not runtime), plan files. Verifiy with `Get-FileHash` on the synced set.
- **Restart note:** opencode loads skills at startup — user must restart opencode after sync.

---

## 5. Verification Plan (PowerShell-runnable — F11)

```powershell
# 1. Unit tests (existing suite must stay green)
python -m unittest discover tests/ -v

# 2. Search engine smoke (data untouched, must pass)
python scripts/search.py "SaaS dashboard" --design-system -p "Verify"

# 3. New anti-slop py parity
python scripts/anti-slop.py references/
# Expected: RESULT: CLEAN (or only intended pattern hits) — same contract as .sh

# 4. YAML frontmatter parses
python -c "import yaml,sys; [yaml.safe_load(open(f,encoding='utf-8')) for f in ['SKILL.md']]"

# 5. Reference graph completeness gate (F7)
python -c @"
import pathlib
files = {p.name for p in pathlib.Path('references').glob('*.md')}
graph = set(); 
# parse reference-graph.md node names; assert files == graph
"@

# 6. Glossary single-definition check (F9)
grep-like: each glossary term appears once as a definition in glossary.md

# 7. Threshold scan (Q-1)
Select-String -Path SKILL.md,references\quality-gate.md,references\build-mode.md -Pattern '< ?9[0-6]|< ?8[0-9]|< ?6[0-9]' # expect none

# 8. Version sweep (M-1)
Select-String -Path . -Recurse -Include *.md,*.py -Pattern '4\.1\.0|v4\.1\.0' # expect: UPGRADE-PLAN.md / IMPROVEMENT-PLAN.md only
```

---

## 6. Execution Order

| Phase | Work | DoD |
|---|---|---|
| 1 | Read-only inventory: list all 26 `references/*.md` triggers + draft graph edges | inventory table approved |
| 2 | Create `reference-graph.md`, `glossary.md`, `checklist-index.md` | §5 checks 5, 6 pass |
| 3 | Edit `build-mode.md` (T-1…T-4, Q-1), `quality-gate.md` (Q-1, Q-2), `memory-system.md` (A-2, A-3) | §5 checks 7 (+1) pass |
| 4 | Edit `SKILL.md` (rules 15-16, thresholds, decision brief, Status & Review, version) | marks A-1, A-2, M-2 done |
| 5 | Version sweep: AGENTS.md template, user-prompt-template, design-reference-workflow, design-tokens, tune-mode, README EN+AR | §5 check 8 passes |
| 6 | Create `scripts/anti-slop.py`; extend `tests/test_anti_slop.py` | §5 checks 1, 3 pass |
| 7 | Sync to installed copy + hash verify + restart reminder | hashes match; user restarts |
| 8 | Record v4.2.0 section in `UPGRADE-PLAN.md` changelog | changelog complete |

---

## 7. Out of Scope (deferred, matching `UPGRADE-PLAN.md`)

- Auto quality-gate execution in CI (still manual — unchanged).
- Migrating `references/*.md` to uniform L1–L5 structure (skill convention differs from handbook content convention; not applicable).
- Changing `data/*.csv` content or adding `--standards` search flags (no current use case).
- Multi-language support beyond README EN/AR.
- Frontmatter schema reform of all 26 reference files (footers only, F8).

## 8. Open Decisions (owner confirmation before execution)

1. Keep `tests/` out of the installed skill copy (recommended: yes — runtime purity).
2. `scripts/anti-slop.py` replaces `.sh` in docs entirely, or keep both documented (recommended: `.py` first, `.sh` legacy).
3. CHK-delivery checklist: merge into `checklist-index.md` or its own `CHK-delivery.md` (recommended: own file — matches handbook naming and keeps registry thin).