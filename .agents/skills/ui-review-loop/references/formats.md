# UI Review Loop — package formats (v1, frozen)

One round = one directory under the project's `.agent-review/`:

```
.agent-review/
├── .gitignore                     # "*" — written by the runner
├── .active.json                   # present only while recording
├── .calibration.json              # written by `round.mjs calibrate`
├── .server.json                   # pid, port, token, project realpath
├── .server.log                    # the detached review server's stderr; unhandled
│                                  #   request failures land here (truncated past 1 MiB)
├── .partial-<roundId>/            # in-progress; NEVER shown in the library
└── <roundId>/
    ├── video.webm
    ├── network.har                # sanitized
    ├── meta.json
    ├── dom.json
    ├── comments.json
    ├── resolutions.json
    └── comment-images/<commentId>.jpg
```

`<roundId>` format: `<UTC compact timestamp>-<6 hex>` (e.g. `20260717T142233Z-a1b2c3`).
All JSON files are written atomically (temp file + rename).

## meta.json

```json
{
  "schemaVersion": 1,
  "roundId": "20260717T142233Z-a1b2c3",
  "startedAt": "2026-07-17T14:22:33.120Z",
  "endedAt": "2026-07-17T14:23:37.410Z",
  "summary": "Polished checkout validation and failure states",
  "startUrl": "http://localhost:3000/checkout",
  "git": {
    "branch": "feature/checkout",
    "head": "0123456789abcdef0123456789abcdef01234567",
    "dirty": true,
    "diffHash": "sha256:7d3f5c860cf4d6bb67a88eb645e6dc63185b489d60c62094e88cb93f62e84932",
    "diffHashNotes": []
  },
  "viewport": { "width": 1440, "height": 900, "dpr": 2 },
  "versions": { "skill": "1.0.0", "recorder": "1", "agentBrowser": "0.32.1", "node": "22.0.0" },
  "sync": {
    "confidence": "medium",
    "method": "calibrated-wall",
    "clockSkewMs": 84,
    "calibration": { "offsetMs": 412, "jitterMs": 9, "calibratedAt": "2026-07-19T09:12:04.221Z", "ageMs": 172800000 },
    "anchors": [
      { "id": "start", "videoTimeMs": 312, "wallTimeMs": 1784307753500, "segmentId": "s-0001", "frameIndex": 0 },
      { "id": "end", "videoTimeMs": 64120, "wallTimeMs": 1784307817308, "segmentId": "s-0001", "frameIndex": 2 }
    ]
  },
  "completeness": {
    "video": "complete",
    "dom": "complete",
    "network": "complete",
    "gaps": []
  }
}
```

Rules:

- `git` is `null` outside a git worktree. `diffHash` covers the tracked-file diff (captured with
  `--no-ext-diff` so a configured external differ cannot flatten it, and `--full-index` so a
  changed binary file contributes its full blob id), the porcelain status, and the content of
  every untracked file (bounded at 2000 files; each hashed through a 1 MiB read window).
- `diffHashNotes` lists everything the hash could NOT reach — an unreadable status or diff, a
  diff past the 32 MiB capture limit, untracked files past the file limit, untracked files that
  could not be read. An empty list is the claim that the hash stands for the whole worktree
  state; a non-empty one names the ways two different trees could still hash alike. `dirty` is
  `null` when the status could not be read, never `false`.
- `sync.confidence`: `high | medium | low | unavailable`. `sync.method`: `calibrated-wall | flash-contact-sheet | unavailable`.
  `medium` is the ceiling a recorded round can reach: the DOM-to-video mapping comes from a stored
  calibration offset, and nothing in the round re-anchors it against the video. `high` is reserved
  for a round-scoped video-anchored measurement and is not currently produced.
- `sync.clockSkewMs` is the recorder page's own disagreement between its two clocks. It is NOT a
  measure of video alignment — nothing in it touches the video. `null` when unavailable.
- `sync.calibration` carries the stored offset that actually drives the mapping, plus its age, so a
  stale calibration is visible rather than implied. `null` when no calibration was read.
- Anchor `videoTimeMs` is a best estimate from calibration/flash detection, never treated as exact.
- `completeness` values: `complete | partial | missing`. A channel is `complete` only when coverage
  through the round's cutoff can be proven; absence of evidence never counts as evidence of absence
  (missing video drop data reads `partial`, not zero drops).
- Gap shape: `{"segmentId":"s-0002","reason":"navigation-tail","droppedFrames":null}`.
  Gap reasons: `navigation-tail | stop-tail | overflow | truncation | injection-failed | runner-error`.
  `stop-tail` means activity landed in the window between the cutoff and the captures stopping, so
  the affected channels cannot be proven complete through the video's end.
- `summary`: one line, trimmed, max 160 chars.
- Library status is DERIVED (see below), never stored here.

## dom.json

```json
{
  "schemaVersion": 1,
  "roundId": "20260717T142233Z-a1b2c3",
  "segments": [
    {
      "id": "s-0001",
      "bootId": "7a2d6352-1044-493c-945f-208c81f3b420",
      "url": "http://localhost:3000/checkout",
      "bootWallTimeMs": 1784307753500,
      "endedWallTimeMs": 1784307817308,
      "complete": true,
      "endReason": "stop",
      "frames": [
        { "i": 0, "t": 0, "dt": 0, "kind": "sync", "data": { "id": "start" }, "nearbyEvent": null, "mutations": [], "values": {}, "text": "" },
        {
          "i": 1, "t": 1500, "dt": 1500, "kind": "action",
          "data": { "name": "click", "target": "button#place-order" },
          "nearbyEvent": { "type": "click", "selector": "button#place-order", "text": "Place order" },
          "mutations": [ { "type": "attributes", "target": "button#place-order", "name": "disabled" } ],
          "values": { "input#email": "dev@example.test" },
          "text": "Place order Processing"
        },
        { "i": 2, "t": 63808, "dt": 62308, "kind": "sync", "data": { "id": "end" }, "nearbyEvent": null, "mutations": [], "values": {}, "text": "Order complete" }
      ]
    }
  ]
}
```

Rules:

- `t`, `dt`: integer ms since recorder boot (`performance.now()` based, monotonic within a segment).
- Frame kinds: `action | mutation | input | fetch:start | fetch:end | fetch:error | navigation | sync | lifecycle`.
  (`input` is reserved, not emitted in v1; `lifecycle` carries `{event: "visibilitychange|pageshow|pagehide", ...}`.)
- `data` is always present; kind-specific fields inside it. `action` frames may carry a
  `note` (e.g. `boundary: …`) when the runner flags an attribution caveat.
- `nearbyEvent` is TEMPORAL context, never asserted causality.
- Mutation variants:
  - `{"type":"attributes","target":"…","name":"…"}`
  - `{"type":"childList","target":"…","added":1,"removed":0}`
  - `{"type":"characterData","target":"…"}`
- `values` keys are selectors; redacted fields serialize as `"[redacted]"`. Passwords never appear.
  At most 100 controls per frame, each value at most 200 characters — a frame that hit either
  bound carries `"truncated": true` and finalization emits a `truncation` gap for it.
- `endReason`: `stop | navigation | navigation-tail | overflow | injection-failed | runner-error`.
- Frame indices unique + increasing within a `bootId`. `endedWallTimeMs` may be `null`.
- A frame whose mutation list was capped carries `"truncated": true`; finalization also
  emits a `truncation` gap when any frame is truncated.
- Segments are appended in document order; a BFCache restore resumes its ORIGINAL segment
  (matched by `bootId`), it is never a new segment.

## comments.json

```json
{
  "schemaVersion": 1,
  "roundId": "20260717T142233Z-a1b2c3",
  "reviewState": "submitted",
  "submittedAt": "2026-07-17T15:04:11.004Z",
  "comments": [
    {
      "id": "c-4b463025-4f01-4428-a513-d903b661ff12",
      "videoTimeMs": 12840,
      "text": "The error message arrives too late.",
      "createdAt": "2026-07-17T15:02:40.211Z"
    }
  ]
}
```

Rules:

- `reviewState`: `open | submitted`. Initialized as `open` with an empty `comments` array
  (valid JSON, never zero-byte).
- Comment IDs are immutable UUIDs prefixed `c-`.
- The frame image is a convention-based sidecar: `comment-images/<commentId>.jpg`.
  The server writes the JPEG first; the comment POST only succeeds after the image is durable,
  so no image-status field exists.
- No types, threads, edits, deletes, or identities in v1.
- After `submitted`, further comment POSTs are rejected with `409`.

## resolutions.json

```json
{
  "schemaVersion": 1,
  "roundId": "20260717T142233Z-a1b2c3",
  "items": {
    "c-4b463025-4f01-4428-a513-d903b661ff12": {
      "resolvedInRoundId": "20260717T171522Z-d4e5f6",
      "resolvedAt": "2026-07-17T17:18:03.552Z"
    }
  }
}
```

Rules:

- Agent-owned file; keys are comment IDs from `comments.json`.
- A resolution HOLDS only while all of the following are true of the round it names. Both the
  write path (`round.mjs resolve`) and status derivation check them, so a resolution that stops
  holding stops reading as addressed:
  - `resolvedInRoundId` is a well-formed round id, and NOT the round the feedback was left on —
    a round can never be its own fix.
  - That round exists in the library, carries `meta.json`, `dom.json` and `video.webm`, and its
    `meta.json` parses.
  - Its `startedAt` and `endedAt` parse, `endedAt` is not before `startedAt`, and `startedAt` is
    strictly after the feedback's `comments.submittedAt` (falling back to the comment's
    `createdAt` when no submission time is readable). A round recorded before the feedback
    existed cannot answer it.
  - `completeness.video` and `completeness.dom` are each `complete` or `partial`. `partial` is
    accepted: it is what a round reports whenever coverage through its cutoff cannot be proven,
    which a navigation tail alone produces. `missing` is refused — the artifact never landed.
    `completeness.network` is never consulted: a resolution is a claim about observed behaviour,
    and a browser-control round declares that channel `missing` by design.
- `round.mjs pending` re-lists a comment whose resolution no longer holds, with the reason.

## Library status (derived, never stored)

- `awaiting-review`: review `open`, zero comments.
- `in-review`: review `open`, one or more comments.
- `submitted`: review `submitted` and (zero comments OR at least one comment with no resolution
  recorded at all).
- `addressed`: review `submitted`, at least one comment, and every comment carries a resolution
  that holds.
- `resolution-broken`: review `submitted` and at least one recorded resolution no longer holds —
  its round was deleted, its metadata became unreadable, or it never supported the claim. This
  outranks `addressed` and `submitted`: a claim that was made and broke is reported as such
  rather than reverting to a label that hides it.

## v2 — browser-control rounds only

Rounds recorded with `--backend browser-control` differ from v1 in `meta.json` ONLY. Everything
above (dom.json, comments.json, resolutions.json, the directory layout, library-status
derivation) is byte-for-byte identical, and `dom.json` stays `schemaVersion: 1` — the recorder
frames are unchanged. Agent-browser rounds remain v1. The server and review UI read neither
`schemaVersion` nor `versions.*`, so both schemas coexist in one library. The round directory
omits `network.har` entirely (this backend captures no network evidence).

`meta.json` for a browser-control round:

- `schemaVersion` is `2`.
- `versions` is `{ skill, recorder, node, backend: "browser-control", cli, relayBuild,
  extensionVersion, recordingMode, ffmpeg }`. The `agentBrowser` key is ABSENT (not `null`);
  `backend` is present only here. `cli`/`relayBuild`/`extensionVersion` are `null` when the
  relay could not report them; `ffmpeg` is a boolean; `recordingMode` is `"cdp"`.
- `sync` is always `{ "confidence": "low", "method": "unavailable", "clockSkewMs": null, "calibration": null,
  "anchors": [] }`. Browser-control rounds are video-primary: the backend's start timestamps
  are not trustworthy DOM anchors, so the DOM rail renders as approximate. Operator comments
  are unaffected — they ride video `currentTime`.
- `completeness.network` is always `"missing"` — no network capture, no synthesis.
- `completeness.video` is `"partial"` when the CDP `video.webm.json` sidecar reports
  `droppedFrameCount > 0`, else `"complete"` (or `"missing"` when no artifact landed). The
  sidecar is consumed at finalization and deleted; only `video.webm` enters the package.
- Gap reasons are the same v1 vocabulary. Oversized single frames are returned truncated
  (`"truncated": true`) rather than dropped, so the truncated-frame + `truncation` gap
  machinery applies unchanged; a drain that hits its bound emits a `runner-error` gap.

Example `versions` + `sync` block:

```json
{
  "versions": {
    "skill": "1.0.0", "recorder": "1", "node": "22.0.0",
    "backend": "browser-control", "cli": "0.4.1", "relayBuild": "b12a9f",
    "extensionVersion": "0.4.1", "recordingMode": "cdp", "ffmpeg": true
  },
  "sync": { "confidence": "low", "method": "unavailable", "clockSkewMs": null, "calibration": null, "anchors": [] }
}
```
