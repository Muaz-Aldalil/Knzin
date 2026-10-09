# Tune Mode — Improving Existing UI

Load this file when the request is to improve, fix, redesign, or optimize an existing UI.

---

## STEP 1 — AUDIT

```
Issues Found:
- [VISUAL]       [Description + why it's wrong]
- [UX]           [Description + user impact]
- [PERFORMANCE]  [Description + metric affected]
- [A11Y]         [Description + WCAG criterion]
- [SECURITY]     [Description + vulnerability type]
- [STATES]       [Missing loading/error/empty states]
```

## STEP 1.5 — DIAGNOSE (bug / perf reports only; skip for pure improvement work)

A reported bug gets a **Red** first (see `glossary.md`) — no fix without one. Source: mattpocock `diagnosing-bugs`, adapted to UI.

```
1. BUILD THE RED CHECK   — the tight pass/fail signal for THIS bug, in order of preference:
     visual_diff.py gate   -> pixel drift on the broken view (layout/visual bugs)
     Playwright script     -> DOM/console/network assertion on the exact symptom
     Component test        -> failing test at the component seam (interaction bugs)
     Lighthouse/curl loop  -> perf metric vs baseline (perf regressions)
   Must be: red-capable (catches this bug), deterministic, fast, agent-runnable.
   Cannot build one? Say so, list what you tried, ask for a capture (HAR,
   recording, screenshot). Do NOT hypothesise without a red check.
2. REPRODUCE + MINIMISE  — run it, watch it fail on the user's exact symptom,
   then cut inputs/steps one at a time until every remaining element is load-bearing.
3. HYPOTHESISE           — 3-5 ranked, falsifiable hypotheses BEFORE testing any
   ("If X is the cause, changing Y makes it green"). Show the ranked list to the user;
   proceed with your ranking if they're away.
4. INSTRUMENT            — one variable per probe; tag every debug log [DEBUG-x4f2]
   so cleanup is one grep. Perf branch: measure baseline first, bisect second.
5. FIX + REGRESS         — turn the minimised repro into a failing check, apply the
   fix, watch it green, re-run against the ORIGINAL un-minimised scenario.
6. CLEANUP               — grep [DEBUG-] tags removed; throwaway scripts deleted;
   winning hypothesis logged in .context/DECISIONS.md (D-00N).
```

## STEP 2 — PROPOSE

Rank changes by user impact:

```
- [HIGH]   [Change] — expected improvement
- [MEDIUM] [Change] — expected improvement
- [LOW]    [Change] — expected improvement
```

**Decision Brief:** per change (5-part: Advantages / Disadvantages / Alternatives / Appropriate when / Inappropriate when). Diminishing returns on flip-flop — if the brief says the change is inappropriate for this project's context, propose the alternative instead.

## STEP 3 — IMPLEMENT

Apply changes surgically. Don't rebuild what isn't broken.

- Edit existing components, don't rewrite
- Follow the stack rules in `references/build-mode.md` §4c
- Respect the existing design system; match what's there

## STEP 4 — DIFF SUMMARY

```
Changed: [list of what changed]
Reason:  [why each change was made]
Result:  [expected measurable outcome]
```
