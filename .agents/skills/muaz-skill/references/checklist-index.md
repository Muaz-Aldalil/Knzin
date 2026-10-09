# Checklist Index

Registry of verification checklists. "Done" is a checked list, not a feeling. Each CHK is either a pointer to its authoritative home (no duplication) or new content — see ownership column.

| ID | Name | Phase | Owner / Source of Truth | Type |
|---|---|---|---|---|
| `CHK-preflight` | Pre-flight design thinking | Phase 2.5 | `build-mode.md` §2.5 (6-item gate) | pointer |
| `CHK-blueprint` | Blueprint completeness | Phase 3 | `build-mode.md` Phase 3 (fields 1-14 + Decision Briefs + tokens) | pointer |
| `CHK-security` | Security level checklist | After L1/L2/L3 detection, before Phase 5 | `security-levels.md` | pointer |
| `CHK-a11y` | Component accessibility patterns | Phase 4 | `component-a11y.md` (checklist at bottom) | pointer |
| `CHK-quality` | Quality gate scoring | Phase 5 | `quality-gate.md` + `scripts/anti_slop.py` | pointer |
| `CHK-delivery` | Pre-claim delivery verification | End of Phase 5 | `CHK-delivery.md` (this folder) | new content |

## Rules

1. Run the listed checklist before declaring the phase complete; paste evidence where the checklist says so.
2. Pointers never restate the source checklist — a change belongs in the owner file, not here.
3. A failed box returns work to its phase; no skip, no partial credit.
4. New checklists get an ID (`CHK-<name>`), an owner, and a row above — never an ad-hoc list in prose.