# CHK-delivery — Pre-Claim Delivery Verification

Run at the end of Phase 5, before claiming "done". Every box must be checked and its evidence pasted in the final response. A single unchecked box blocks the done claim.

## Deterministic Checks (tool-verified, mandatory)

- [ ] `python scripts/anti_slop.py <project-dir> --fail-on MEDIUM` run; output pasted (RESULT: CLEAN, or violations fixed and re-run clean).
- [ ] If Python unavailable: fall back to `bash scripts/anti-slop.sh <dir>` (git bash); if bash also unavailable, work the manual AI-slop checklist from `quality-gate.md` and say so explicitly.
- [ ] Self-score pasted: 8 dimensions × 0-20 = 0-160, with per-dimension rationale.
- [ ] Threshold decision stated: 128-160 ship / 96-127 revise (max 3) / <96 redesign.
- [ ] If revised: what changed between iterations recorded.

## Blueprint Fidelity

- [ ] Every blueprint field 1-14 exists; each has its citation and Evidence Class (`[STANDARD]` / `[PRODUCT]` / `[HEURISTIC]`).
- [ ] Each major design choice carries a Decision Brief with all 5 parts (Advantages / Disadvantages / Alternatives / Appropriate / Inappropriate).
- [ ] Design Tokens output in all 3 formats (CSS vars, Tailwind config, JS/TS object); generated code consumes tokens only — no hardcoded hex.
- [ ] Design Lock re-read: generated code matches style/color/type/layout in `.design-lock.md`; any drift flagged, not silent.
- [ ] ACCEPTANCE criteria (field 12) all satisfied or each failure has a fix plan attached.
- [ ] Scope creep checked: nothing built that no blueprint field asked for; extras flagged and removed or justified.
- [ ] Wrong-implementation check: requirements that look implemented but behave incorrectly are hunted explicitly, not assumed correct because present.
- [ ] Spec Axis report pasted under `## Standards` / `## Spec` headings (see `quality-gate.md`) — the two axes reported separately, never merged into one verdict.

## Code Integrity

- [ ] All Three States present on every data component (loading / error / empty).
- [ ] No placeholder content: no lorem ipsum, no TODO without a note, copy is project-specific.
- [ ] Service layer holds API calls — no fetch/axios inside components.
- [ ] Security level applied: `security-levels.md` checklist for the detected level passed.

## Memory & Follow-up

- [ ] `AGENTS.md` updated (Built / Active / Next) and still under 60 lines.
- [ ] `LESSONS` entry appended to `.context/PROGRESS.md` — L-<date>: what worked / what failed / what to correct next time (keep last 5).
- [ ] Assumptions made during the session recorded in `.context/DECISIONS.md` (D-00N format) before they shaped the design.
- [ ] Final response contains: anti-slop output, self-score, threshold decision, and the memory updates above.

**Open issues:** none. This checklist is registered as `CHK-delivery` in `checklist-index.md`.