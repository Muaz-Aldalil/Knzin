# Memory System

Gives the skill muscle memory across sessions. No re-explaining projects.
Works natively in OpenCode via AGENTS.md auto-read at session start.

---

## File Structure

```
project-root/
├── AGENTS.md              <- AUTO-READ by OpenCode every session
│                              Generated after Phase 3. Updated after major changes.
│                              Keep under 60 lines — attention degrades past that.
│
├── design-system/
│   └── MASTER.md            <- Design tokens + component rules (existing)
│
└── .context/
    ├── DECISIONS.md         <- Architectural decisions log (WHY, not WHAT)
    └── PROGRESS.md          <- What's built, what's active, what's next
```

---

## Session Start Protocol

Run before Phase 1 in every session that involves an existing project:

```
STEP 1 — DETECT EXISTING PROJECT
  Check if AGENTS.md exists at project root:
    YES -> load it silently, confirm in one line:
          "📂 Loaded context: [Project Name] — [Active task from PROGRESS.md]"
          Skip intake fields already covered in AGENTS.md
          Only ask for what's genuinely missing or changed
    NO  -> run full Phase 1 intake, then generate AGENTS.md after Phase 3

STEP 2 — LOAD SUPPORTING CONTEXT
  IF design-system/MASTER.md exists -> load it (design system is law)
  IF .context/PROGRESS.md exists    -> read current state + next step
  IF .context/DECISIONS.md exists   -> read before any architectural decision

STEP 3 — CONFIRM STATE (one line output)
  "📂 [Project Name] | [Stack] | [Security Level] | Active: [current task]"
  Then proceed directly to the request — no re-introduction needed.
```

---

## AGENTS.md Generation

Trigger: immediately after Phase 3 Blueprint + Decision Brief output.

```
GENERATE AGENTS.md with:

# [Project Name]
> [One-line goal from GOAL field]

## Project Context
Stack           : [detected/specified stack]
Security Level  : [L1/L2/L3 — auto-detected]
Platform        : [Web / Mobile-first / Both]
Theme           : [Light / Dark / Light+Dark]
Team            : [size + level from intake]
Skill           : muaz-skill v5.4.0

## Design System (Summary)
Primary   : #[hex] — [usage]
Secondary : #[hex] — [usage]
Accent    : #[hex] — [usage]
Background: #[hex]
Text      : #[hex]
Display   : [Font name]
Body      : [Font name]
-> Full tokens: design-system/MASTER.md

## Current State
Phase  : Building
Built  : —
Active : [First section from blueprint SECTIONS list]
Next   : [Second section from blueprint]
Blocked: None

## Status
Health   : [Healthy / Blocked / Stale]
Verified : [last verification date or "n/a"]
Last commit: [short sha or "n/a"]

## Conventions
[Extract from Code Maintainability section — naming, comments, file structure]

## Key Constraints
[Extract from CONSTRAINTS field in intake]

## Read Also
- design-system/MASTER.md
- .context/DECISIONS.md
- .context/PROGRESS.md

RULE: AGENTS.md must stay under 60 lines.
      Every line must earn its place.
      If it wouldn't confuse a developer joining mid-project, don't include it.
```

---

## PROGRESS.md Update Triggers

Update `.context/PROGRESS.md` when:

```
AFTER COMPLETING a section or component:
  -> Move item from "In Progress" to "✅ Completed"
  -> Add files touched
  -> Add any notable decisions made
  -> Update "Active" and "Next" fields

AFTER EACH SESSION (before closing):
  -> Add Session Log entry:
    - What was planned vs. what got done
    - Specific first task for next session
    - Any new blockers

AFTER PHASE 5 (delivery, per CHK-delivery):
  -> Append a LESSONS block — what worked, what failed, what to correct next time
  FORMAT (keep the last 5 entries, oldest out):
    ## LESSONS
    - L-<YYYY-MM-DD>: worked=[what worked] failed=[what failed] correct=[what to do differently]

FORMAT for session closing line:
  "🔖 Session complete. Updated PROGRESS.md.
   Next session starts with: [specific first task]"
```

---

## DECISIONS.md Update Triggers

Log to `.context/DECISIONS.md` when:

```
MUST LOG (blocks are yellow flags for future devs):
  -> Choosing between two libraries (React Query vs SWR)
  -> Deviating from skill defaults (using localStorage instead of httpOnly cookie — why?)
  -> Workarounds for bugs or constraints
  -> Any decision that cost > 10 minutes to make
  -> Any assumption that will shape the design (log BEFORE it shapes the design —
     an assumption logged after the fact is a decision made silently)

DO NOT LOG:
  -> Color adjustments
  -> Copy changes
  -> Minor layout tweaks
  -> Anything self-evident from the code

FORMAT:
  ### [D-00N] [Title] — [YYYY-MM-DD]
  Context : [why the decision was needed]
  Chose   : [what was picked]
  Over    : [what was rejected]
  Because : [the actual reason — this is the valuable part]
  Revisit : [condition that would trigger reconsidering]
```

---

## AGENTS.md Update Triggers

Update `AGENTS.md` (not just PROGRESS.md) when:

```
-> Major section completed (update "Built" + "Active" + "Next")
-> Stack changes (new library added with approval)
-> Security level changes
-> New constraint discovered
-> Convention established that wasn't in original intake

RULE: Never let AGENTS.md go stale by more than one session.
      A stale AGENTS.md is worse than no AGENTS.md.
```

---

## What Never Goes in AGENTS.md

```
❌ Design token details  -> MASTER.md
❌ Decision rationale    -> DECISIONS.md
❌ Session-by-session log -> PROGRESS.md
❌ Component API details  -> code + comments
❌ Anything over 60 lines -> split or summarize
```
