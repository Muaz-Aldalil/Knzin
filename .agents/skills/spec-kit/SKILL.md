---
name: spec-kit
description: >-
  Official Specification-Driven Development (SDD) workflow using GitHub Spec Kit (specify CLI).
  Activates on any request to plan, specify, break down, implement, or converge features using Spec Kit.
  Covers all SDD phases: constitution, specify, clarify, plan, checklist, tasks, implement, analyze, converge, and taskstoissues.
---

# GitHub Spec Kit — Specification-Driven Development (SDD)

Official skill for **GitHub Spec Kit** ([github.com/github/spec-kit](https://github.com/github/spec-kit)), providing a structured, repeatable, specification-driven development pipeline for Antigravity and AI coding agents.

---

## Architecture & Layout

Spec Kit enforces the **Specification-Driven Development** paradigm: specifications, architecture plans, and task breakdowns are version-controlled Markdown artifacts stored in your repository before any code is written.

### 1. Workspace Structure (`.specify/` & `.agents/`)
```
<project-root>/
├── .specify/
│   ├── memory/
│   │   └── constitution.md     # Core non-negotiable architectural & development principles
│   ├── templates/              # Standardized templates for spec, plan, tasks, checklists
│   └── scripts/powershell/     # Core automation scripts
├── .agents/
│   └── skills/                 # Native Antigravity skills
│       ├── speckit-constitution/SKILL.md
│       ├── speckit-specify/SKILL.md
│       ├── speckit-clarify/SKILL.md
│       ├── speckit-plan/SKILL.md
│       ├── speckit-checklist/SKILL.md
│       ├── speckit-tasks/SKILL.md
│       ├── speckit-analyze/SKILL.md
│       ├── speckit-implement/SKILL.md
│       ├── speckit-converge/SKILL.md
│       └── speckit-taskstoissues/SKILL.md
└── specs/
    └── <feature-id>/
        ├── spec.md             # High-level business specification (WHAT and WHY)
        ├── plan.md             # Technical architecture blueprint (HOW)
        ├── tasks.md            # Executable, dependency-ordered task checklist
        └── checklist.md        # Verifiable acceptance & quality checklist
```

---

## CLI & Tooling Reference

* **Binary:** `specify` (located at `C:\Users\HP\.local\bin\specify.exe`)
* **Version:** `specify 1.0.13.dev0` (or newer)
* **Bootstrap new project for Antigravity:**
  ```powershell
  specify init --here --force --non-interactive --integration agy --ignore-agent-tools
  ```
* **Verify CLI health:**
  ```powershell
  specify check
  specify self check
  ```

---

## End-to-End Workflow Phases

```
1. Constitution  →  2. Specify  →  3. Clarify  →  4. Plan  →  5. Checklist
        →  6. Tasks  →  7. Analyze  →  8. Implement  →  9. Converge
```

### Phase 1 — Constitution (`/speckit-constitution`)
Establishes the non-negotiable principles for the project.
* **File:** `.specify/memory/constitution.md`
* **Requirements:**
  * Defines MUST and SHOULD principles across Architecture, Data Integrity, Security, Testing, and UX.
  * Referenced by every downstream phase to prevent architectural drift.

### Phase 2 — Specify (`/speckit-specify <feature-description>`)
Produces the business-level feature specification.
* **File:** `specs/<feature-id>/spec.md`
* **Rules:**
  * Strictly describes **WHAT** and **WHY**, never **HOW** (no framework specifics, internal schema details, or libraries).
  * Mandatory sections: Summary, User Stories (with Given/When/Then acceptance criteria), Functional Requirements (`FR-###`), Success Criteria (`SC-###`).
  * Flags ambiguous points with max 3 `[NEEDS CLARIFICATION]` tags.

### Phase 3 — Clarify (`/speckit-clarify`)
De-risks ambiguity before technical planning begins.
* **Action:** Parses `[NEEDS CLARIFICATION]` tags, presents structured options with implications, waits for user selection, and updates `spec.md` with concrete answers.

### Phase 4 — Plan (`/speckit-plan`)
Translates the specification into a concrete technical architecture.
* **File:** `specs/<feature-id>/plan.md`
* **Requirements:**
  * Maps every `FR-###` to concrete technical decisions.
  * Defines technology stack, database schema/migrations, API contracts, security gates, and exact file paths to create/edit.

### Phase 5 — Checklist (`/speckit-checklist`)
Generates an independent quality assurance checklist.
* **File:** `specs/<feature-id>/checklist.md`
* **Requirements:** Contains verifiable checklist items covering all acceptance scenarios, edge cases, and compliance criteria.

### Phase 6 — Tasks (`/speckit-tasks`)
Decomposes the plan into atomic, dependency-ordered coding tasks.
* **File:** `specs/<feature-id>/tasks.md`
* **Task Syntax Rule:**
  ```markdown
  - [ ] T001 [P] [US1] <Imperative verb> <exact file path>
  ```
  * `- [ ]`: Required markdown checkbox.
  * `T###`: 3-digit zero-padded sequential ID.
  * `[P]`: Flag only if task is safely parallelizable.
  * `[US#]`: Tag indicating the parent User Story (omitted in Setup/Foundational phases).
  * Description: Must cite the exact file path being created or modified.

### Phase 7 — Analyze (`/speckit-analyze`)
Cross-artifact consistency inspection (run before implementation).
* Checks `spec.md` vs `plan.md` vs `tasks.md` vs `constitution.md`.
* Identifies coverage gaps, orphaned requirements, or missing dependencies.

### Phase 8 — Implement (`/speckit-implement`)
Executes the tasks sequentially from `tasks.md`.
* Minimal progressive context: reads only the active task and its parent story.
* Edits/creates code at the specified file path.
* Updates the checkbox from `- [ ]` to `- [x]`.

### Phase 9 — Converge (`/speckit-converge`)
Audits the codebase against the original specification and plans remediation.
* Categorizes discrepancies: `missing`, `partial`, `contradicts`, or `unrequested`.
* Assigns severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
* If gaps exist, appends a new `## Phase N+1: Convergence` task block with `T{M+1}` IDs to `tasks.md`.
* When all criteria are met, certifies the implementation as **Converged** (`✅ Converged`).

### Phase 10 — Tasks to Issues (`/speckit-taskstoissues`)
Converts remaining `tasks.md` items into tracked GitHub Issues with labels, assignees, and parent story links.

---

## Best Practices & Guidelines
1. **Never Skip Ahead:** Do not jump to coding until `spec.md`, `plan.md`, and `tasks.md` have been reviewed and approved.
2. **Explicit File Paths:** Every task in `tasks.md` must cite the exact target path.
3. **Immutability of Finished Tasks:** Never delete or renumber completed tasks in `tasks.md`.
4. **Preserve Constitution:** Always enforce constitution MUST rules in both code generation and reviews.
