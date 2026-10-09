# ui-review-loop

[![skills.sh](https://skills.sh/b/amElnagdy/ui-review-loop)](https://skills.sh/amElnagdy/ui-review-loop)

Verify UI work with recorded evidence instead of screenshots. An agent records a browser-testing round — video, a DOM-event timeline, and a sanitized network capture — and the operator reviews the round on a local site, watching the video and leaving timestamped comments that the agent addresses in the next round. The same recorder also powers coverage audits that exercise 100% of an inventoried UI. Everything runs as a zero-dependency Node CLI; the full workflow is documented in `SKILL.md`.

## What gets recorded

Read this before recording anything. A round package exists to show the reviewer exactly what was on screen, and it is written to `.agent-review/` in the project being tested.

- **Video pixels are NEVER redacted.** Whatever is on screen while recording — including the contents of any field — is in the video. No selector or flag affects it.
- **Visible text IS recorded.** Every timeline frame carries the page's visible text.
- **Ordinary form values ARE recorded.** An email, postal address, phone number, or date of birth typed into an ordinarily-named field is captured in the timeline, saved into `.agent-review/`, and served by the review site. The built-in heuristics redact password-type inputs, fields with credential-shaped names/ids, and fields whose `autocomplete` attribute carries a sensitive standardized token — everything else is captured verbatim.
- **`--redact` affects structured evidence only.** `--redact <selectors>` removes matching controls' values from the timeline (and `--redact input,select,textarea` removes every form value from it). It never touches video pixels.
- **`.agent-review/` is private local evidence.** The runner writes a `.gitignore` inside it automatically, but add `.agent-review/` to your own project's `.gitignore` as well, and never commit it.
- **Never display or type real secrets during a recording.** If a secret reaches the screen, it is in the video.

Text the operator writes — round summaries, flow and action labels, review comments, `--redact` selectors — is recorded as-is and never scanned.

## The network capture: what is stripped and what survives

The agent-browser backend records network traffic as a HAR file, and the runner sanitizes it before it becomes evidence. The sanitized capture is **not "safe to share" by default** — it is the capture with the following removed:

- **URLs:** userinfo (username/password) is stripped; sensitive query parameters (credential-shaped names) are redacted; secret-bearing path segments and credential-carrying fragments are redacted. The same redaction is applied to `Referer`, `Location`, and redirect URLs.
- **Headers and cookies:** `Cookie`, `Set-Cookie`, `Authorization`, `Proxy-Authorization`, `X-API-Key`, and any header whose name matches the credential-name pattern are replaced with `[redacted]`; every cookie value in the HAR is redacted.
- **Bodies:** request bodies (`postData`) and response bodies (`content.text`) are dropped entirely — bodies are never review evidence.

What survives: the request method, URL shape (host, non-sensitive path and query), non-sensitive headers, status codes, and timings — enough to follow what the page did, not enough to replay it. The unsanitized raw capture is deleted; only the sanitized file ships in the round package. Treat even the sanitized capture as private to the project.

## Install

With the [Skills CLI](https://github.com/vercel-labs/skills) (any agent it supports):

```bash
npx skills add amElnagdy/ui-review-loop
```

Or manually:

```bash
git clone https://github.com/amElnagdy/ui-review-loop ~/.agents/skills/ui-review-loop
```

Either way, `SKILL.md` in the installed directory is the entry point an agent reads to use the tool.

## Prerequisites

- **Node 22 or newer.** The runner and the review server refuse to start on anything older, naming the version they found.
- **agent-browser 0.32.x** for recording rounds:

  ```bash
  npm i -g agent-browser && agent-browser install
  ```

  `start` refuses an older CLI by name and warns (but proceeds) on a newer one. Only the round workflow needs agent-browser; reviewing rounds needs nothing but a browser.

## Quickstart

From the project under test:

```bash
# 1. start a recorded round
node ~/.agents/skills/ui-review-loop/scripts/round.mjs start --url http://localhost:3000

# 2. drive the browser through the runner (never call agent-browser directly mid-round)
node ~/.agents/skills/ui-review-loop/scripts/round.mjs run -- snapshot
node ~/.agents/skills/ui-review-loop/scripts/round.mjs run -- click @e12

# 3. stop the round — this packages video + timeline + sanitized network capture
node ~/.agents/skills/ui-review-loop/scripts/round.mjs stop --summary "what this round verified"

# 4. open the review site for the operator
node ~/.agents/skills/ui-review-loop/scripts/server.mjs open --project "$PWD"
```

The review server is per-project, binds to `127.0.0.1` on a random port behind a per-project URL token, and survives the agent's session. On it, the operator watches the video with the DOM timeline alongside, leaves timestamped comments, and submits them; the agent reads them with `round.mjs pending --json` and, after recording a fix, marks each addressed with `round.mjs resolve`.

## Recording backends

- **agent-browser (default).** Records video, the DOM timeline, and the sanitized network capture against a fresh browser session. This is the backend every command above uses.
- **browser-control (experimental, opt-in).** Drives the operator's real, logged-in Chromium through the Browser Control extension and records CDP video. Requires the `browser-control` CLI and its browser extension (connected and version-compatible) plus `ffmpeg` on PATH; the runner preflights all of them and fails closed with a named reason. No network capture on this backend — packages contain no `network.har`. Because rounds run in the operator's authenticated profile, every browser-control round pauses on an in-page consent prompt before the first action. Use it only when the operator explicitly asks; details are in `SKILL.md`.

## Testing

```bash
npm test        # node test/self-test.mjs — the 416-check suite
```

The suite builds fixture projects and round packages, drives the runner CLI end to end (with a PATH-shim fake standing in for the browser CLIs), and asserts the read/write contract of the review server.

`test/mutate.mjs` is the mutation harness: for each entry it breaks one behaviour in the runner, recorder, or server, runs the suite, and requires that the named checks fail — a check that stays green while its subject is broken is a false guarantee. It is slow by design (it runs the suite once per mutation):

```bash
node test/mutate.mjs                 # every mutation
node test/mutate.mjs <label-substr>  # a matching subset
```

## License

Apache-2.0 — see `LICENSE`.
