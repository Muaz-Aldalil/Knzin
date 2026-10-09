# Absorption — Phase Checklists (0–5b)

> Compact phase-by-phase checklists for the 8-phase absorption pipeline.
> Full depth: `AppData/Local/hermes/skills/absorption-skill/references/absorption-workflow.md`

---

## Phase 0 — Instrument

**Goal:** Code-level understanding of the target repo. Identify what's useful vs. commodity. Verify claims.

**Input:** Repo URL. Clone it first.

**Process:**
1. [ ] Clone repo locally
2. [ ] Read README (high-level only — note claims, license, stars, ecosystem)
3. [ ] Read LICENSE (confirm permissive: MIT/Apache/BSD. Flag GPL/BSL.)
4. [ ] Read primary implementation file:
   - Skill/plugin: SKILL.md or prompt file
   - CLI/tool: main entry point
   - Agent-based: agent role definitions
   - Library: main module
5. [ ] Read infrastructure/integration files (hooks, install scripts, config)
6. [ ] Read ecosystem/docs (CLAUDE.md, CONTRIBUTING.md, related repos)
7. [ ] Read benchmark/eval harness (verify headline claims against measurement design)
8. [ ] Write absorption-brief-phase0.md answering:
   - What it does (one paragraph, own words)
   - How it works (actual mechanism, code level)
   - What's useful to absorb (specific files, concepts, insights)
   - What's commodity (don't steal what you can rebuild)
   - Dependency risk (license, maintainer, external deps, long-term)
   - Moat potential (defensible advantage?)

**Output:** `absorption-brief-phase0.md`

**Time:** 1-8 hours depending on repo complexity.

---

## Phase 1 — Tactical Adoption

**Goal:** Get immediate value. Map every dependency. Flag for removal in Phase 2.

**Input:** Phase 0 absorption brief.

**Process:**
1. [ ] Adopt what's useful temporarily:
   - Prompt-based → adopt prompt as style reference (don't install hooks/binary)
   - Workflow pattern → implement pattern from scratch (don't import codebase)
   - Binary/tool → document concept (don't install binary)
2. [ ] Map every dependency:
   - Integration point | what it does | runtime dep? | binary dep? | network dep? | flagged for Phase 2?
3. [ ] Start measuring:
   - Token reduction: output length before/after (character proxy) or API usage (exact)
   - Failure rate: issues caught / total tasks
   - Fix success rate: first-attempt fixes / total fixes
   - Latency impact: time added by adoption
4. [ ] Write absorption-phase1-report.md:
   - How adopted (what installed/integrated, what not)
   - Dependency map (full table)
   - Measurements (start tracking)
   - Flagged items for Phase 2

**Output:** `absorption-phase1-report.md`

**Key rule:** Everything adopted is temporary. Flag for extraction/removal in Phase 2.

---

## Phase 2 — Deconstruct & Extract

**Goal:** Extract useful pieces into own code. Eliminate dependencies. Repo becomes reference only.

**Input:** Phase 1 report + dependency map.

**Process:**
1. [ ] Extract prompts: rewrite rules + insights in own voice. Delete original file dependency.
2. [ ] Extract workflow patterns: build own implementation. Document the pattern.
3. [ ] Extract binary/tool concepts: document concepts. Plan own implementation (don't install).
4. [ ] Extract ecosystem concepts: note as moat direction if relevant.
5. [ ] For each extracted piece, verify:
   - [ ] In own voice, not copied
   - [ ] Insights preserved (especially non-obvious ones)
   - [ ] Dependency eliminated (no imports, no file refs, no runtime deps)
   - [ ] Documented (where it lives, how it works, what it replaced)
6. [ ] Write absorption-phase2-report.md:
   - Each piece extracted (what, where now, how rewritten)
   - Dependency elimination checklist (every dep removed/confirmed unnecessary)
   - Skipped pieces (what and why)

**Output:** `absorption-phase2-report.md`

**Key rule:** Zero runtime dependency on the repo by end of Phase 2.

---

## Phase 3a — Build Layer 1 (Moat)

**Goal:** Build proprietary capability that contributes to a defensible moat.

**Note:** Adapt to the repo's purpose. For token-efficiency repos (caveman), this is compression. For workflow repos (autoprompt), this may be the verification layer (Phase 3b). For other repos, adapt accordingly.

**Input:** Phase 2 extraction report.

**Process:**
1. [ ] Training data (if fine-tuning is the moat direction):
   - Define task distribution (what tasks, why these)
   - Define quality criteria (what makes an output "good")
   - Generate pilot corpus (start small: 50 pairs)
   - Assess quality (terse + accurate + shorter than baseline)
   - Define scaling path (how to get to 1000+ pairs)
2. [ ] Fine-tuning feasibility:
   - Select base model (if feasible) or document deferred status
   - Assess infra needs (GPU, pipeline, expertise)
   - If deferred: document what's needed, path to close, interim approach
3. [ ] Validation:
   - Baseline vs. current approach comparison
   - Token reduction (or relevant metric) — measured, not claimed
   - Quality assessment
4. [ ] Moat analysis:
   - Why defensible (proprietary data? model? integration? compounding?)
   - What competitors would need to replicate
   - What's missing to complete the moat
5. [ ] Platform integration prep:
   - How layer composes with platform
   - Changes needed (if any)

**Output:** `absorption-phase3a-report.md`

**Key rule:** If fine-tuning is deferred, document the path clearly. Don't let it block the rest of the plan.

---

## Phase 3b — Build Layer 2 (or Equivalent Capability)

**Goal:** Build second proprietary capability (or the primary capability if Phase 3a was adapted away).

**Note:** For autoprompt-style repos, this is the verification layer. For other repos, this is whatever capability the repo provides that should become yours.

**Input:** Phase 2 extraction report.

**Process:**
1. [ ] Architecture design:
   - Components (what does what)
   - Execution model (sync/async/hybrid)
   - Failure modes caught (list with detection method)
   - User visibility (what user sees, what's invisible)
2. [ ] How it's better than original:
   - Specific advantages (more failure modes, better fixes, faster, integrated, etc.)
   - Justification (why these advantages are real)
3. [ ] Instrumentation:
   - Metrics to track
   - Baseline measurements (start tracking)
   - Data storage/access
4. [ ] Integration with other layers:
   - How this capability interacts with Layer 1 (or other platform capabilities)
   - Data flow between layers
   - Synergies and conflicts
5. [ ] Iteration plan:
   - Minimal version (v1 — what's in it)
   - Future improvements (v2+)

**Output:** `absorption-phase3b-report.md`

---

## Phase 4 — Platform Integration

**Goal:** Make capabilities native platform properties. Remove all external dependency traces. Define user-facing positioning.

**Input:** Phase 3a + 3b reports.

**Process:**
1. [ ] Capability 1 as platform property:
   - Default behavior (always-on? toggle? how does user experience it?)
   - Brand position (how positioned? "X-efficient by default" or similar)
   - Composition with platform (how fits with prompts, tools, agents, other capabilities?)
   - User-facing control (toggle, always-on, presentation)
2. [ ] Capability 2 as platform property (if applicable):
   - Same as above
3. [ ] Layer synergies:
   - Combined system description
   - Reinforcement loops (how capabilities reinforce each other)
   - Conflicts and mitigations
4. [ ] Dependency cleanliness check:
   - External/user-facing docs: no reference to original repo as dependency
   - Internal docs: philosophical influence noted (if useful) — internal only
   - Code: no imports, references, comments treating repo as dependency
   - Narrative: "our capability" not "we integrated X"
5. [ ] Metrics & instrumentation:
   - List of metrics, how measured, where reported
   - Baseline vs. current numbers (start tracking)
6. [ ] User-facing positioning:
   - How capabilities presented (UI or API-only)
   - Messaging grounded in metrics, not overclaimed

**Output:** `absorption-phase4-report.md`

**Key rule:** No "we integrated X" in any user-facing or external context. Internal docs may note philosophical influence.

---

## Phase 5a — Strategic Options

**Goal:** Decide what to do about the original repo's community/mindshare/ecosystem after building your own replacement.

**Input:** Phase 4 report.

**Process:**
1. [ ] Evaluate Option A (Partnership):
   - What it means
   - What you'd offer, what you'd want
   - Pros, cons
   - Feasibility (is maintainer reachable? interested? what's their roadmap?)
2. [ ] Evaluate Option B (Acquisition):
   - What it means
   - Pros, cons
   - Feasibility (is there a company to buy? is community acquirable? is it worth it?)
3. [ ] Evaluate Option C (Ignore & Ride):
   - What it means
   - Pros, cons
   - Feasibility (can you earn your own mindshare?)
4. [ ] Make recommendation:
   - Which option, why
   - First move (specific, actionable)
   - Information needed before revisiting

**Output:** `absorption-phase5a-report.md`

**Key rule:** Default to "Ignore & Ride" unless there's a clear signal otherwise. The code is already yours. Communities aren't acquirable in the traditional sense. Mindshare is earned, not borrowed.

---

## Phase 5b — Full Verification

**Goal:** Verify entire absorption is complete and clean. For multi-repo absorptions, assess second repo strategically and verify its absorption too.

**Input:** All previous phase reports.

**Process:**
1. [ ] Verify each phase for each repo:
   - Status (done/not done)
   - Evidence (what proves it's done)
2. [ ] Verify zero runtime dependency:
   - Check: no imports from repo in platform code
   - Check: no file references outside tracking file and extraction reports
   - Check: no runtime dependency on binaries/packages/services
   - Check: no narrative dependency in platform docs
   - Status: confirmed or not + evidence
3. [ ] Verify moat contribution:
   - Does the absorbed capability contribute to a moat?
   - Yes/no/partial + description
4. [ ] (If multi-repo) Assess second repo strategically:
   - Community/mindshare value
   - Strategic action needed: NONE (with reasoning) or SPECIFIC ACTION
5. [ ] Overall status:
   - Complete or partial (if partial: what's missing)
   - Moat status: description
   - Next actions: list

**Output:** `absorption-phase5b-report.md`

**Key rule:** Be honest. If something isn't done, say what's missing and what's needed. Evidence over assertion.

---

## Quick Start (when user says "absorb this repo")

```
1. Clone repo → Phase 0 read → write absorption-brief-phase0.md
2. Adopt temporarily + map deps → write absorption-phase1-report.md
3. Extract into own code → eliminate deps → write absorption-phase2-report.md
4. Build proprietary layer(s) → write absorption-phase3a/b-report.md
5. Integrate into platform → remove traces → write absorption-phase4-report.md
6. Decide on community → write absorption-phase5a-report.md
7. Verify everything → write absorption-phase5b-report.md
8. Update tracking file after each phase
```

For tracking file format, see `references/absorption-tracking.md`.
