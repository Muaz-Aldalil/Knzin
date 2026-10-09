---
name: ui-review-loop
description: "Verify UI work with recorded evidence instead of screenshots — record browser-testing rounds (video + DOM timeline + network evidence) reviewed on a local site where the operator leaves timestamped video comments, and run coverage sweeps that exercise 100% of an inventoried UI. Use after ANY change that touches web UI, whenever an agent tests or reviews UI behavior (agent-browser, Playwright, or Chrome), for a DOM dynamics / browser testing pass, and when the operator should verify asynchronously — prefer this over calling agent-browser directly for UI verification. Recording rounds run through the agent-browser CLI by default; a browser-control backend can record the operator's real logged-in browser on explicit request (requires the browser-control CLI + extension + ffmpeg)."
---

# UI Review Loop

Set `AR_SKILL_DIR` to the directory containing this skill, e.g.:

```bash
AR_SKILL_DIR="$HOME/.agents/skills/ui-review-loop"
```

## Prerequisite: Node 22 or newer

Both `round.mjs` and `server.mjs` require Node 22 or newer and refuse to run on anything older,
naming the version they found. Nothing else is needed to review rounds.

## Prerequisite: the agent-browser CLI

Recorded rounds run through the `agent-browser` CLI by default — video (`agent-browser record`),
network capture (`agent-browser network har`), opening the page, injecting the recorder, and
every drain of the timeline. Before the first `start`, verify it exists (`which agent-browser`);
if missing, stop and tell the operator (install: `npm i -g agent-browser && agent-browser
install`). Rounds record against the 0.32.x recording and network-capture contract: `start`
refuses an older CLI by name, and warns (but proceeds) on a newer one or one whose version it
cannot read. Only the round workflow needs it — coverage audits can drive Playwright instead (see
`references/coverage-audit.md`), and the operator reviewing rounds needs nothing but a browser.
A `browser-control` backend exists for driving the operator's real logged-in browser; use it
only on explicit request (see "Recording backend" below).

All artifacts live in the CURRENT project's `.agent-review/` directory. Never record a round
outside a project the operator is working in, and never commit `.agent-review/` (the runner
gitignores it automatically).

## Which workflow

- **Review round** — default after UI changes: record what you just built or fixed; the
  operator judges it on video and comments. Sections below.
- **Coverage audit** — the project already has a `coverage.json` inventory, or the operator
  explicitly asked to set one up. Methodology: `references/coverage-audit.md`.

## Before UI work

Run `node "$AR_SKILL_DIR/scripts/round.mjs" pending --json`.
Read every submitted, unresolved comment AND its captured frame image before changing code.
Operator feedback is the specification — address it first.

## Record a round

1. Run `node "$AR_SKILL_DIR/scripts/round.mjs" start --url <url>` — add
   `--redact <comma-separated selectors>` for fields the built-in sensitive-field
   heuristics won't catch.
2. Send EVERY browser command through `node "$AR_SKILL_DIR/scripts/round.mjs" run -- <agent-browser args>`
   (e.g. `run -- snapshot`, `run -- click @e12`, `run -- fill @e15 "text"`).
3. NEVER invoke `agent-browser` directly while a round is active — the runner owns the
   recorder lifecycle (injection, drains, navigation handling) and bypassing it loses evidence.
4. Never inject, drain, stop, or edit recorder state or `.agent-review/` files manually.
5. Run `node "$AR_SKILL_DIR/scripts/round.mjs" stop --summary "<one-line summary, max 160 chars>"`
   when verification is done.
6. Run `node "$AR_SKILL_DIR/scripts/round.mjs" abort` if the round cannot finish safely —
   partial packages are kept for diagnosis but never shown in the review library.

A failed `run` (nonzero exit) keeps the round ACTIVE — retry or continue; do NOT call
`start` again. To inspect the live timeline, do NOT use `run -- eval
"window.__rec.dumpCompact()"` — the runner drains the buffer before each wrapped command,
so wrapped evals always see an empty buffer. Inspect BEFORE `start` via direct
`agent-browser eval`, or read `dom.json` in the package after `stop`.

Keep rounds short (minutes, one concern) — the operator watches the video.

## What a round captures

A round package is evidence: it exists to show the reviewer exactly what was on screen.
Know the boundary before recording anything sensitive.

Redacted in the structured evidence (timeline, network capture):

- password-type inputs, fields with credential-shaped names/ids, and fields whose
  `autocomplete` attribute carries a sensitive standardized token (credentials, payment
  cards, street addresses, telephone numbers, email, birthdays);
- every control matched by `--redact` selectors;
- credentials in recorded URLs (userinfo, sensitive query parameters, secret-bearing
  path segments, fragments) and secret-bearing network headers and cookies.

Captured verbatim, by design:

- the page's visible text, in every timeline frame;
- the values of every other form field — an email, postal address, phone number, or
  date of birth typed into an ordinarily-named field IS recorded, saved into
  `.agent-review/`, and served by the review site;
- video pixels. Video is NEVER redacted: whatever is on screen while recording —
  including the contents of any field — is in the recording, and no selector affects it.

Trusted, never scanned: text the operator writes — round summaries, `--flow` and action
labels, review comments, and the `--redact` selectors themselves — is recorded as-is.

To redact every form value in the timeline, start the round with
`--redact input,select,textarea`. This covers the timeline only; it cannot affect video.

## Recording backend: browser-control (opt-in)

Default is `agent-browser`. Use `browser-control` ONLY when the operator explicitly asks for
it — never auto-select it. It drives the operator's real, logged-in Chromium profile through
the Browser Control extension and records CDP video.

Prerequisites (the runner preflights all of them and fails closed with a named reason): the
`browser-control` CLI on PATH, the relay running with a build that matches the CLI, the browser
extension connected AND version-compatible (checked doctor-grade, not just "connected"), and
`ffmpeg` on PATH (CDP recording needs it). No network HAR is captured on this backend, so
packages contain no `network.har`.

CDP recording limitations to expect: it ACTIVATES the recorded tab (it must be frontmost), caps
output at 720p, and captures NO audio. Video is the primary evidence; the DOM rail is rendered
approximate (sync is always low-confidence on this backend).

Start one of two ways:

```bash
round.mjs start --backend browser-control --url <url>          # fresh relay page
round.mjs start --backend browser-control --adopt <substring>  # an already-open, logged-in tab
```

Because fresh relay pages share the real authenticated profile (session ownership is not
cookie isolation), EVERY browser-control round pauses on an in-page consent handoff before the
first mutation — the operator must confirm on the page. The round is not mutable until then: if
`start` is interrupted before consent, `run` refuses it and `stop` behaves as `abort` — run
`abort` to release the session. Adopted tabs also print the exact title, URL, and target id
first. Add `--flow "<one-line intent>"` to name the flow in that prompt. For a destructive step
mid-round (send / purchase / delete / publish / permission or account change), write the snippet
as two phases: inspect, then a second `handoff()` naming the exact operation and target,
re-verify page state after acknowledgment, then act.

If the relay reports a lost-and-re-established connection, or the page's identity changes without
a snippet-driven navigation, the round FAILS CLOSED into a partial package (a `runner-error`
gap) rather than continuing under a new recorder — re-run the round.

Run syntax differs from agent-browser (verbs vs. a Playwright snippet). A label is REQUIRED and
is the ONLY thing that reaches the timeline — the snippet source never does:

```bash
round.mjs run --label "open the invite dialog" -- 'await ref("e12").click(); return await snapshot({ diff: true })'
```

Label policy (also applied to `--flow`): one line, ≤120 chars, action intent only — no typed or
selected values, credentials, URLs or query strings, account identifiers, `@` handles, quotes,
or page-derived text. The runner rejects a label that breaks any of these.

Privacy note: Browser Control keeps a per-session journal (`~/.browser-control/sessions/<id>/`)
with bounded previews of executed code and results that survives session deletion. The runner
never copies it into round packages and never persists raw envelopes, but the journal itself
persists — never put a secret in a snippet, a return value, or a console log.

`AR_BC_BIN` and `AR_FFMPEG_BIN` override the `browser-control` / `ffmpeg` binary names. They
exist for the self-test's PATH-shim fake ONLY — never set them in real use.

## Return feedback

Address submitted comments in the next implementation round. After that round is recorded and
verified, run:

```bash
node "$AR_SKILL_DIR/scripts/round.mjs" resolve \
  --feedback-round <roundId> --comment <commentId> --in-round <roundId>
```

`--in-round` must name a DIFFERENT round, recorded after the feedback was submitted, whose
`video` and `dom` evidence exists — `complete` or `partial` both count (a round that could not
prove coverage through its cutoff is still evidence; one whose artifact never landed is not).
Anything else is refused with the reason. The library re-checks this on every read, so a
resolution whose round is later deleted reads as `resolution-broken` rather than `addressed`,
and `pending` puts that comment back on the queue.

Do not edit `comments.json`, `resolutions.json`, `.active.json`, or partial packages directly.

## Coverage audits (DOM dynamics monitoring)

The same recorder powers a second workflow: a maintained `coverage.json` inventory of views ×
states × interactive elements, a driver that touches 100% of the inventory and asserts each
element's declared expectations (`nav`/`fetch`/`mut`/`focus`/`disable`/`value`/`toggle`)
against the recorder timeline, plus an `auditAffordances()` sweep per screen. The audit
proves the INVENTORY was exercised — keep it at 100% inventoried coverage with zero
violations, and review the inventory like code.

Full methodology: `references/coverage-audit.md`. Templates: `templates/`. Recorder:
`assets/recorder.js` — the runner injects it as a classic script; projects import the same
file for side effects (`import "./recorder.js"`) and boot it via
`window.AgentReviewRecorder.startRecorderIfEnabled()`.

## Open the review site (for the operator)

```bash
node "$AR_SKILL_DIR/scripts/server.mjs" open --project "$PWD"
```

Print the resulting library URL for the operator. The server is per-project, loopback-only,
and survives your session; `restart` / `stop` subcommands manage it.

## Sync calibration (rarely)

Two steps: (1) `node "$AR_SKILL_DIR/scripts/round.mjs" calibrate` records ONE ~2.5s clip of
a built-in clock page and builds a contact sheet — read it per the printed instructions;
(2) persist the measurement with `node "$AR_SKILL_DIR/scripts/round.mjs" calibrate --offset <ms> --jitter <ms>`.
Re-run if agent-browser is upgraded (a version-stale calibration caps confidence at low).
Without calibration, DOM-to-video mapping is marked low-confidence, which is fine for most rounds.

Read `references/formats.md` only when diagnosing or extending the package format.
