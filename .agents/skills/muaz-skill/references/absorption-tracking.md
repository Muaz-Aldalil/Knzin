# Absorption — Tracking File

> Template and status format for tracking an absorption project.
> Copy this to `absorption-plan.md` at the start of a new absorption.

---

## Template: absorption-plan.md

```markdown
# Absorption Plan — [REPO NAME(S)]

> Tracking file for the absorption of [repo URLs] into the AI agent platform.
> Created: [DATE]
> Skill: muaz-skill absorption capability (v1.0)

---

## Repos Under Absorption

| # | Repo | URL | Local Path | License | Stars | Maintainer |
|---|---|---|---|---|---|---|
| 1 | [Name] | `[URL]` | `[path]` | [license] | [stars] | [maintainer] |
| 2 | [Name] | `[URL]` | `[path]` | [license] | [stars] | [maintainer] |

---

## Phase Status

| Phase | Description | Status | Date | Deliverable | Key Findings |
|---|---|---|---|---|---|
| 0 — Instrument | Code-level analysis | ⏳/🔄/✅ | — | `absorption-brief-phase0.md` | |
| 1 — Tactical Adoption | Get value, map deps | ⏳/🔄/✅ | — | `absorption-phase1-report.md` | |
| 2 — Deconstruct & Extract | Own code, eliminate deps | ⏳/🔄/✅ | — | `absorption-phase2-report.md` | |
| 3a — [Layer 1 Name] | Build proprietary capability | ⏳/🔄/✅ | — | `absorption-phase3a-report.md` | |
| 3b — [Layer 2 Name] | Build second capability | ⏳/🔄/✅ | — | `absorption-phase3b-report.md` | |
| 4 — Platform Integration | Make native, remove traces | ⏳/🔄/✅ | — | `absorption-phase4-report.md` | |
| 5a — Strategic Options | Community/mindshare decision | ⏳/🔄/✅ | — | `absorption-phase5a-report.md` | |
| 5b — Full Verification | Verify complete + clean | ⏳/🔄/✅ | — | `absorption-phase5b-report.md` | |

**Status:** ⏳ Pending | 🔄 In Progress | ✅ Done | ❌ Skipped

---

## Dependency Elimination

### [Repo Name]

- [ ] No imports from [repo] in platform code
- [ ] No file references outside tracking file + extraction reports
- [ ] No runtime dependency on binaries/packages/services
- [ ] No narrative dependency: "our [capability]", not "integrated [repo]"
- [ ] Internal docs only: philosophical influence noted (if useful)

**Status:** ⏳ → 🔄 → ✅

---

## Moat Assessment

| Capability | Value? | Replicable by installing original? | Proprietary data? | Proprietary model? | Compounding? | Native? | Moat strength |
|---|---|---|---|---|---|---|---|
| [Name] | Y/N/Est | Y/N | Y/N/N/A | Y/N/N/A | Y/N/Not yet | Native/Bolted | None/Weak/Mod/Strong/Very Strong |

---

## Key Decisions

| Date | Phase | Decision | Reasoning |
|---|---|---|---|

---

## Notes

[Any notes, observations, context]

---

## Next Steps

[What's next — next phase, decisions pending, etc.]
```

---

## Status Format (for updates)

When updating phase status in the tracking file, use this format:

```
| Phase | Status | Date | Deliverable | Key Findings |
|---|---|---|---|---|
| 0 — Instrument | ✅ Done | 2026-09-21 | absorption-brief-phase0.md | [1-line summary of key findings] |
```

**Key findings** should be a 1-line summary capturing the most important outcome of the phase. Example:
- Phase 0: "Core = prompt-based compression (SKILL.md) + Go tool-catalog compressor (shrink/). Claims verified via benchmark design. Moat direction = fine-tuned model (cavegemma concept)."
- Phase 2: "Compression rules extracted + rewritten in own voice. Verification pattern built from scratch. Zero runtime dependency on both repos confirmed."

---

## Existing Absorption: Caveman + autoprompt-skill

**Status:** Complete (all 8 phases, 2026-09-21)

**Reports:** `Desktop/Tools/absorption-brief-phase0.md` through `absorption-phase5b-report.md`

**Final status:**
- Caveman: compression rules extracted. Fine-tuned model deferred. Prompt-based compression active.
- autoprompt-skill: verification pattern built from scratch. Verification v1 active.
- Zero dependency on both repos.
- Strategic: Caveman → Ignore & Ride. autoprompt → no action.
- Moat: Moderate (stronger when fine-tuned model + metrics dashboard built).
