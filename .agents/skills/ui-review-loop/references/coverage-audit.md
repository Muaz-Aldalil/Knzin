# Coverage-driven audit (DOM dynamics monitoring)

The review-round workflow answers "did THIS change work, and does the operator agree?"
This workflow answers the other question: "does every INVENTORIED view still react the way
it should?" Same recorder, same timeline — different discipline: a maintained inventory,
touched 100% every audit run. The audit proves the inventory was exercised; it cannot prove
the inventory is complete — that is why the inventory is reviewed like code.

## Why not screenshots

Claude drives browsers through point-in-time tools: navigate, click, screenshot. Modern UI
is a state machine over time — debounced input → AJAX → render, several controllers reacting
to one field. A screenshot cannot show WHY a field flipped, only that it eventually did (or
didn't). Disabled submits, dead click handlers, self-firing state changes, spinners that
never spin — none of these are reliably visible in a screenshot, and screenshot loops
(shoot → read → guess → re-shoot) burn minutes per hypothesis.

The recorder watches EVERYTHING automatically (no per-feature instrumentation):

- every DOM change on `<body>` via MutationObserver (Stimulus, jQuery, React, raw JS — all
  caught), coalesced into readable frames;
- the **nearest user event in time** before each change (capture-phase listeners on
  input/change/click/keydown/submit/focus). This is TEMPORAL context, never proof of
  causation — but a mutation with no nearby event and no fetch is the classic
  "it changes by itself" smell: investigate it first;
- **fetch boundaries** (`fetch:start` / `fetch:end` / `fetch:error` with URL + status), so
  AJAX timelines read like a transcript;
- current form **values** and visible **text** per frame.

## The two recorder boot patterns

1. **Runner-injected** (review rounds): `round.mjs` injects `assets/recorder.js` and owns
   the lifecycle. Nothing to set up — record a round and the timeline is in the package.
2. **Project-integrated** (audits + ad-hoc debugging): copy `assets/recorder.js` into the
   project's dev-served JS and import it for side effects — there is one canonical file,
   no separate module build:
   ```js
   import "./recorder.js"; // sets window.AgentReviewRecorder
   window.AgentReviewRecorder.startRecorderIfEnabled();
   ```
   Boot is gated to development/test ONLY, behind an opt-in flag: `?record_dom=1` in the
   URL or `localStorage.dom_recorder = "on"`. `startRecorderIfEnabled()` shows the pattern:
   an env allow-list — a missing env marker means NO boot, so it can never run in
   production.
   - Rails (importmap/esbuild): import from the JS entry points; the env gate reads a
     `<meta name="rails-env">` rendered in dev/test.
   - Static/other stacks: include the script in dev builds only, or adapt the gate to your
     env signal.
   - Playwright drivers can skip project integration entirely:
     `await context.addInitScript({ path: "<path>/recorder.js" })` installs it before page
     scripts on every navigation; boot with
     `page.evaluate(() => window.AgentReviewRecorder.startRecorderIfEnabled())` after load
     (the env gate still applies — adapt it, or keep the project-integrated boot). The
     driver's origin preflight is then the ONLY safety gate — keep it mandatory.

Read the timeline in-page: `window.__rec.dumpCompact()` — a compact JSON timeline
(`t/dt`, trigger, mutation summary, values, text). One call replaces a dozen screenshots.

## What the timeline captures

The recorder redacts only credential-shaped fields (password type, credential-shaped
names/ids), fields whose `autocomplete` attribute carries a sensitive standardized
token, and controls matched by an operator-supplied selector list. Everything else is
captured verbatim, by design: the page's visible text and the values of ordinary form
fields — including personal data such as emails, postal addresses, phone numbers, and
birthdays typed into ordinarily-named fields — appear in the frames, and in any round
package saved from them are served by the review site. That fidelity is the point: the
reviewer must see what was on screen. Video, when a slice is recorded as a round, is
never redacted at all — whatever is on screen is in the recording.

Consequence for audits: only ever run the driver against seeded test data (the
preflight already requires an isolated throwaway account), never type real personal
data into an audited page, and treat any recorded round as containing whatever the
page showed. To redact every form value in a recorded round, start it with
`--redact input,select,textarea` (timeline only — video is unaffected).

## Setting up the audit in a project (once)

1. Integrate the recorder (boot pattern 2 above).
2. Create `scripts/browser-audit/coverage.json` from `templates/coverage.example.json`:
   one entry per view, one per interactive element, each with `expects` atoms from the
   vocabulary below plus human prose in `note`. This is the definition of done: **100% of
   inventoried elements touched per audit run.** Aim for full functional coverage of VIEWS
   (not controllers or models — those belong to the normal test suite).
3. Create the driver from `templates/driver.example.js`: logs in, walks every view/state,
   fires every element, checks each expectation against the recorder timeline, prints
   `COVERAGE n/n (inventoried)` + violations only.
   Audits run UNRECORDED by default — a 100% sweep makes a long, unwatchable video. When
   the operator should see evidence, record a SHORT review round of just the failing or
   representative flow instead (the normal round workflow). For agent-browser projects,
   drive the browser DIRECTLY (no round active) and read frames with
   `agent-browser eval "window.__rec.dumpCompact()"`. Never read frames through
   `round.mjs run -- eval ...` — the runner drains and persists the buffer BEFORE each
   command it wraps, so wrapped evals see an empty timeline. When a slice IS recorded as
   a round, read its timeline from the round package (`dom.json` — the raw `frames-*.jsonl`
   logs are consolidated into it and deleted), not live evals.
4. Wire the fail-closed preflight (the template enforces it — do not weaken it):
   the audit clicks EVERY inventoried control, including state-changing ones (sends,
   resolves, deletes), so before the first interaction the driver must verify
   (1) an approved origin — loopback or a dedicated seeded staging host, (2) a live,
   RECORDING recorder, (3) an isolated throwaway test account, (4) the project's
   seed/reset strategy for THIS run. The template ships (3) and (4) as functions that
   throw until you implement them — any check failing = the run refuses.

### The `expects` vocabulary

| atom | meaning | how the driver asserts |
|---|---|---|
| `nav` | URL changes | `waitForNavigation` (see gotcha #1); target goes in `note` |
| `fetch` | AJAX fires | recorder frames contain `fetch:start`/`fetch:end` |
| `mut` | DOM reacts | a `mutation` frame follows the interaction |
| `focus` | focus moves | `document.activeElement` changed as declared |
| `disable` | submit locks + feedback label | button disabled + label swapped while in flight |
| `value` | typed value registers | recorder frame `values` show it |
| `toggle` | open/closed flips | element/state present ↔ absent |

## The recurring workflow (every UI round)

After ANY round of functionality changes that involves UI (which is almost always):

1. Run the project in the dev browser with the recorder enabled.
2. Run the coverage driver — it must report **100% (n/n) of the inventory, zero violations**.
3. New UI elements added this round? Add them to `coverage.json` FIRST (the inventory is
   reviewed like code), then run.
4. Run `window.__rec.auditAffordances()` on every distinct screen — a one-shot sweep for
   interaction bugs no screenshot shows: clickable elements without a pointer cursor,
   `animate-*` elements whose animation isn't actually running (purged utility), and
   mouse-only controls not reachable by keyboard. Empty result = clean.
5. Debugging a dynamic bug: reproduce with `?record_dom=1`, then `dumpCompact()` and READ
   the timeline — event → fetch → mutation. The answer is usually one glance at which
   frame has no nearby event or a missing fetch. (Or record a review round and read the
   timeline alongside the video.)

## Gotchas that cost real time (pre-solved)

1. **Same-URL POST→redirect races**: `waitForURL` insta-matches when the redirect lands on
   the SAME URL — your shot/assert runs mid-flight. Always
   `Promise.all([page.waitForNavigation({url}), el.click({noWaitAfter: true})])`.
2. **Async renders**: after an action that triggers a long request (e.g. an LLM turn), wait
   on a concrete DOM condition (child count, button re-enabled), never a fixed sleep.
3. **JS-cloned templates**: content cloned into a container offsets child counts — wait on
   the busy-cycle of the triggering button instead.
4. **`assert`ing too early after AJAX**: server work may continue after the response
   (background jobs, shutdown handlers) — verify against a completion signal, not the
   response alone.
5. **Affordance false positives**: forms with submit actions and lone `@window`/`@document`
   listeners are not click-affordances; the shipped `auditAffordances` already filters them.
6. **Recorder buffer**: it's a ring buffer (default 1000 frames) — `clear()` before the
   interaction you care about on long pages.

## Reporting

The audit's output IS the report: `COVERAGE n/n (inventoried)` + a violations list (empty =
clean) + MISSING/UNKNOWN id reconciliation. Paste it (or its summary) into the round's dev
notes. A run below 100% means the inventory and the UI drifted — fix the inventory in the
same round. Remember what the number means: every DECLARED element was exercised. Elements
missing from the inventory are invisible to the audit.
