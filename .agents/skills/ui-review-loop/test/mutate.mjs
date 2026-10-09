#!/usr/bin/env node
// Mutation harness: proves a check actually defends its subject.
//
//   node mutate.mjs                 run every mutation
//   node mutate.mjs <label-substr>  run the matching ones
//
// For each mutation: break one behaviour in the runner (or in the review server, for entries
// that name it), run the suite, and require that the named checks FAIL. A check that stays
// green while its subject is broken is a false guarantee, which is worse than no check at all —
// this harness is the only thing that can tell the difference. The tree is restored and
// verified clean after every mutation, including on crash.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Every file a mutation may target. `file` on an entry names one of these keys; entries that
// omit it target the runner, which is where most behaviour lives.
const TARGETS = {
  round: path.join(ROOT, "..", "scripts", "round.mjs"),
  server: path.join(ROOT, "..", "scripts", "server.mjs"),
  recorder: path.join(ROOT, "..", "assets", "recorder.js"),
};
const DEFAULT_TARGET = "round";
const SUITE = path.join(ROOT, "self-test.mjs");

// from → to must be a unique, literal, single-behaviour edit within the entry's target file.
// Each entry names the checks it must break; substrings, matched against the suite's own
// check names.
const MUTATIONS = [
  {
    label: "lock-never-acquired",
    from: "  acquireMachineLock(roundId, root);\n\n  const partialDir",
    to: "  const partialDir",
    breaks: ["acquires the machine-wide lock"],
  },
  {
    label: "lock-never-released",
    from: "function releaseMachineLock(root, roundId) {",
    to: "function releaseMachineLock(root, roundId) {\n  if (root || !root) return;",
    breaks: ["releases the machine-wide lock"],
  },
  {
    label: "backend-mislabelled-in-marker",
    from: 'roundId, backend: "agent-browser", partialDir',
    to: 'roundId, backend: "browser-control", partialDir',
    breaks: ["naming the round and the agent-browser backend"],
  },
  {
    label: "url-opened-before-capture-starts",
    from: '      ab(["record", "start", videoPath]);',
    to: '      /* capture start removed */',
    breaks: ["begins video capture on a neutral page, then opens the round URL"],
  },
  {
    label: "recording-starts-on-the-current-page",
    from: "  adapter.open(NEUTRAL_RECORDING_PAGE);\n  const rec = adapter.recordStart(videoPath);",
    to: "  const rec = adapter.recordStart(videoPath);",
    breaks: ["begins video capture on a neutral page, then opens the round URL"],
  },
  {
    label: "calibration-records-the-current-page",
    from: '  ab(["open", NEUTRAL_RECORDING_PAGE]);\n  ab(["record", "start", clip]);',
    to: '  ab(["record", "start", clip]);',
    breaks: ["calibrate begins video capture on a neutral page"],
  },
  {
    label: "session-kept-open-on-stop",
    from: "      notes = releaseSharedSession();",
    to: "      notes = [];",
    breaks: ["stop closes the browser session the round started"],
  },
  {
    label: "session-kept-open-on-termination",
    from: "    if (machineLockRoundId) {\n      notes.push(...releaseSharedSession());",
    to: "    if (false) {\n      notes.push(...releaseSharedSession());",
    breaks: ["abort closes the browser session the round started", "abandons a hung session release"],
  },
  {
    label: "session-closed-without-ownership",
    from: "    if (machineLockRoundId) {\n      notes.push(...releaseSharedSession());",
    to: "    if (machineLockRoundId || stopCapture) {\n      notes.push(...releaseSharedSession());",
    breaks: ["leaves the browser session open when the lock names another round"],
  },
  {
    label: "session-leaked-when-start-fails",
    from: "  registerExitCleanup(() => {\n    if (machineLockHeldBy(root, roundId)) reportTerminationNotes(releaseSharedSession());\n  });",
    to: "  /* session release on the way out removed */",
    breaks: ["releases the browser session on its way out"],
  },
  {
    label: "session-release-unbounded",
    from: 'spawnSync("agent-browser", ["close"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: AB_CAPTURE_STOP_TIMEOUT_MS })',
    to: 'spawnSync("agent-browser", ["close"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })',
    breaks: ["abandons a hung session release"],
  },
  {
    label: "operator-command-never-forwarded",
    from: "const mark = () => markActionOn(adapter, actionName, target);",
    to: "const mark = () => true;",
    breaks: ["records the action frame with the generated element ref"],
  },
  {
    label: "no-drain-before-command",
    from: "  mark();\n  if (drainSegment(root, st, adapter) === null) {",
    to: "  mark();\n  if (false) {",
    breaks: ["drains the intent marker before the command runs"],
  },
  {
    label: "overflow-gap-swallowed",
    from: "    if (chunk.firstRetained > cursor + 1) {",
    to: "    if (false) {",
    breaks: ["frames lost to buffer overflow reach the package as a gap"],
  },
  {
    label: "dead-command-reported-as-success",
    from: "      const broken = r.error != null || r.signal != null || typeof r.status !== \"number\";",
    to: "      const broken = false;",
    breaks: ["killed by a signal exits nonzero", "cut off by the output ceiling exits nonzero"],
  },
  {
    label: "stop-window-activity-ignored",
    from: "  const stopTail = tailAdvanced || !endConfirmed;",
    to: "  const stopTail = false;",
    breaks: ["mutation in the stop window", "end marker never persisted"],
  },
  {
    label: "cutoff-marker-assumed-persisted",
    from: "function endMarkPersisted(dir, st, segmentId) {",
    to: "function endMarkPersisted(dir, st, segmentId) {\n  if (dir || !dir) return true;",
    breaks: ["end marker never persisted"],
  },
  {
    label: "sync-claims-high-again",
    from: '    else { confidence = "medium"; method = "calibrated-wall"; }',
    to: '    else { confidence = "high"; method = "calibrated-wall"; }',
    breaks: ["caps sync confidence at medium"],
  },
  {
    label: "calibration-age-withheld",
    from: "        ageMs: Number.isFinite(calAt) ? Math.max(0, Date.now() - calAt) : null,",
    to: "        ageMs: null,",
    breaks: ["calibration age is published"],
  },
  {
    label: "missing-drop-data-assumed-zero",
    from: "    let dropped = null;",
    to: "    let dropped = 0;",
    breaks: ["drop sidecar finalizes partial"],
  },
  {
    label: "navigation-tail-gap-swallowed",
    from: '  finalizeOldSegment(root, st, "navigation-tail");',
    to: "  finalizeOldSegment(root, st, null);",
    breaks: ["records a navigation-tail gap"],
  },
  {
    label: "resolution-round-resolves-itself",
    from: "  if (inRoundId === feedbackRoundId) return ",
    to: "  if (false) return ",
    breaks: ["resolve refuses the round the feedback was left on"],
  },
  {
    label: "resolution-accepted-from-before-the-feedback",
    from: "  if (startedAt <= spokenAt) return ",
    to: "  if (false) return ",
    breaks: [
      "resolve refuses a round recorded before the feedback it would answer",
      "nothing was recorded while every resolution was refused",
    ],
  },
  {
    label: "resolution-absent-evidence-channel-accepted",
    from: '    if (declared !== "complete" && declared !== "partial") {',
    to: "    if (false) {",
    breaks: [
      "resolve refuses a round whose video evidence never landed",
      "nothing was recorded while every resolution was refused",
    ],
  },
  {
    label: "resolution-unprovable-coverage-rejected",
    from: '    if (declared !== "complete" && declared !== "partial") {',
    to: '    if (declared !== "complete") {',
    breaks: [
      "resolve accepts a later round whose coverage is only partial",
      "library reads feedback answered by a later round as addressed",
    ],
  },
  {
    label: "resolution-unreadable-metadata-trusted",
    from: '  if (!meta || typeof meta !== "object") return ',
    to: '  if (!meta || typeof meta !== "object") return null;\n  if (false) return ',
    breaks: ["resolve refuses a round whose metadata cannot be read"],
  },
  {
    label: "resolution-round-artifacts-unchecked",
    from: "  if (missingArtifacts && missingArtifacts.length) return ",
    to: "  if (false) return ",
    breaks: [
      "resolve refuses a round that is not in the library",
      "library flags feedback whose resolving round lost its video",
      "pending re-lists feedback whose resolution no longer holds",
    ],
  },
  {
    label: "resolution-broken-still-hides-the-comment",
    from: "          if (item && !stale) continue;",
    to: "          if (item) continue;",
    breaks: ["pending re-lists feedback whose resolution no longer holds"],
  },
  {
    label: "resolution-status-trusts-any-entry",
    file: "server",
    from: "      if (problem) broken = true;\n      else held++;",
    to: "      held++;",
    breaks: [
      "library flags feedback whose resolving round was deleted",
      "library flags feedback whose resolving round lost its video",
      "library refuses a hand-written resolution naming the reviewed round itself",
    ],
  },
  {
    label: "runtime-floor-unenforced-by-the-runner",
    from: "  const runtimeProblem = nodeVersionProblem();\n  if (runtimeProblem) die(runtimeProblem);\n  const [cmd, ...rest] = process.argv.slice(2);",
    to: "  const [cmd, ...rest] = process.argv.slice(2);",
    breaks: ["the runner refuses to run on a runtime below the floor"],
  },
  {
    label: "runtime-floor-unenforced-by-the-server",
    file: "server",
    from: "  const runtimeProblem = nodeVersionProblem();\n  if (runtimeProblem) die(runtimeProblem);\n  const [cmd, ...rest] = process.argv.slice(2);",
    to: "  const [cmd, ...rest] = process.argv.slice(2);",
    breaks: ["the review server refuses to run on a runtime below the floor"],
  },
  {
    label: "runtime-floor-accepts-every-version",
    from: "  if (!m || Number(m[1]) >= MIN_NODE_MAJOR) return null;",
    to: "  if (!m || Number(m[1]) >= 0) return null;",
    breaks: [
      "a runtime below the floor is refused by a message naming what is required and what is running",
      "the runner refuses to run on a runtime below the floor",
      "the review server refuses to run on a runtime below the floor",
    ],
  },
  {
    label: "backend-contract-never-gated",
    from: "  if (abProblem && abProblem.fatal) die(`preflight: ${abProblem.message}`);\n  if (abProblem) process.stderr.write(`round: warning — ${abProblem.message}\\n`);",
    to: "  /* backend contract gate removed */",
    breaks: [
      "a round refuses to start against a backend older than the recording contract",
      "a round proceeds against a backend newer than the contract, warning instead of refusing",
    ],
  },
  {
    label: "backend-contract-refuses-an-unreadable-version",
    from: "    return { fatal: false, message: `agent-browser version could not be determined",
    to: "    return { fatal: true, message: `agent-browser version could not be determined",
    breaks: ['agent-browser "unknown" is gated as warn'],
  },
  {
    label: "backend-contract-refuses-a-newer-version",
    from: "    return { fatal: false, message: `agent-browser ${version} is newer than the",
    to: "    return { fatal: true, message: `agent-browser ${version} is newer than the",
    breaks: [
      'agent-browser "0.33.0" is gated as warn',
      "a round proceeds against a backend newer than the contract, warning instead of refusing",
    ],
  },
  {
    label: "provenance-honours-an-external-differ",
    from: '"--no-ext-diff", ',
    to: '',
    breaks: ["an external differ configured on the operator's machine cannot make two different worktrees hash alike"],
  },
  {
    label: "provenance-hash-ignores-the-diff",
    from: '  const diff = g(["diff", "--no-ext-diff", "--full-index", "HEAD"], GIT_DIFF_MAX_BYTES);',
    to: '  const diff = "";',
    breaks: [
      "an external differ configured on the operator's machine cannot make two different worktrees hash alike",
      "a changed binary file's content reaches the provenance hash",
    ],
  },
  {
    label: "provenance-drops-an-unreadable-untracked-file",
    from: "    catch { unreadable++; uh += `${f}:unreadable\\n`; }",
    to: "    catch {}",
    breaks: ["an untracked file that could not be read is named in the evidence rather than dropped"],
  },
  {
    label: "provenance-silent-about-the-untracked-limit",
    from: "  if (listed.length > untracked.length) {",
    to: "  if (false) {",
    breaks: ["untracked files past the capture limit are named in the evidence rather than dropped"],
  },
  {
    label: "provenance-reads-whole-untracked-files",
    from: "    try { uh += `${f}:${fs.statSync(p).size}:${sha256File(p)}\\n`; }",
    to: "    try { uh += `${f}:${fs.statSync(p).size}:${sha256(fs.readFileSync(p))}\\n`; }",
    breaks: ["hashing a large untracked file costs a read window, not the size of the file"],
  },
  {
    label: "form-values-unbounded-in-count",
    file: "recorder",
    from: "      if (kept >= MAX_VALUES) { this.valuesBounded = true; return; }",
    to: "      /* value count bound removed */",
    breaks: [
      "a frame holds a bounded number of form values",
      "a frame whose form values hit the count bound is marked truncated",
    ],
  },
  {
    label: "form-value-length-unbounded",
    file: "recorder",
    from: "      if (value.length > MAX_VALUE_CHARS) this.valuesBounded = true;\n      const bounded = value.slice(0, MAX_VALUE_CHARS);",
    to: "      const bounded = value;",
    breaks: [
      "a long form value is stored bounded, not whole",
      "a frame whose form value was shortened is marked truncated",
    ],
  },
  {
    label: "bounded-values-not-marked-on-the-frame",
    file: "recorder",
    from: "    if (this.valuesBounded) frame.truncated = true;",
    to: "    /* the bound is not recorded on the frame */",
    breaks: [
      "a frame whose form values hit the count bound is marked truncated",
      "a frame whose form value was shortened is marked truncated",
    ],
  },
  {
    label: "server-failure-unrecorded",
    file: "server",
    from: "      logRequestFailure(req, e, token);",
    to: "      /* failure record removed */",
    breaks: [
      "an unhandled failure in the detached review server leaves a record an operator can read",
      "the recorded failure masks the URL token",
    ],
  },
  {
    label: "server-failure-record-goes-nowhere",
    file: "server",
    from: '    detached: true, stdio: ["ignore", "ignore", serverLogTarget(arDir(root))],',
    to: '    detached: true, stdio: "ignore",',
    breaks: [
      "an unhandled failure in the detached review server leaves a record an operator can read",
      "the recorded failure masks the URL token",
    ],
  },
  {
    label: "server-failure-record-leaks-the-token",
    file: "server",
    from: '    const where = String((req && req.url) || "?").split(token).join("<token>");',
    to: '    const where = String((req && req.url) || "?");',
    breaks: ["the recorded failure masks the URL token"],
  },
  {
    label: "browser-open-assumes-macos",
    file: "server",
    from: '  if (platform === "linux" || platform === "freebsd" || platform === "openbsd") return { cmd: "xdg-open", args: [] };\n  return null;',
    to: '  return { cmd: "open", args: [] };',
    breaks: [
      "each supported platform gets its own browser launcher",
      "a platform with no known launcher has none, rather than a macOS command that will fail",
    ],
  },
  {
    label: "browser-open-failure-unreported",
    file: "server",
    from: '  child.on("error", byHand);',
    to: "  /* launcher failure ignored */",
    breaks: ["opening the review site says plainly when it could not launch a browser, and prints the URL to open by hand"],
  },
];

const originals = new Map(Object.entries(TARGETS).map(([key, file]) => [key, fs.readFileSync(file, "utf8")]));
const restore = () => {
  for (const [key, file] of Object.entries(TARGETS)) fs.writeFileSync(file, originals.get(key));
};
const modifiedTargets = () =>
  Object.entries(TARGETS).filter(([key, file]) => fs.readFileSync(file, "utf8") !== originals.get(key)).map(([key]) => key);
process.on("exit", restore);
// SIGTERM as well as SIGINT: a plain `pkill` of this harness would otherwise skip the exit
// handler and leave a target MUTATED in the working tree, where a green-looking suite is
// really testing sabotaged code.
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => process.exit(130));

// A check line reads "  ok   <name>" or "  FAIL <name>"; we want the failures by name.
function failingChecks() {
  const r = spawnSync(process.execPath, [SUITE], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "") + (r.stderr || "");
  const failed = [...out.matchAll(/^\s*(?:FAIL|fail|✗)\s+(.*)$/gm)].map((m) => m[1].trim());
  const tail = (out.trim().split("\n").pop() || "").trim();
  // A suite that dies mid-run reports no failures at all, which reads identically to a mutation
  // nothing caught. They mean opposite things: a crash means the mutation was malformed.
  const crashed = r.status === null || !/^\d+ passed, \d+ failed$/.test(tail);
  return { failed, tail, crashed };
}

const only = process.argv[2];
const chosen = only ? MUTATIONS.filter((m) => m.label.includes(only)) : MUTATIONS;
let bad = 0;

const clean = failingChecks();
if (clean.failed.length) {
  console.error(`baseline is not green (${clean.tail}) — fix that before proving mutations`);
  process.exit(1);
}
console.log(`baseline: ${clean.tail}\n`);

for (const m of chosen) {
  const key = m.file || DEFAULT_TARGET;
  const file = TARGETS[key];
  if (!file) {
    console.log(`FAIL  ${m.label}: unknown target file ${JSON.stringify(m.file)}`);
    bad++;
    continue;
  }
  const original = originals.get(key);
  const occurrences = original.split(m.from).length - 1;
  if (occurrences !== 1) {
    console.log(`FAIL  ${m.label}: anchor matched ${occurrences} times in ${key}, must match exactly once`);
    bad++;
    continue;
  }
  fs.writeFileSync(file, original.replace(m.from, m.to));
  const { failed, tail, crashed } = failingChecks();
  const missed = m.breaks.filter((b) => !failed.some((f) => f.includes(b)));
  restore();
  if (crashed) {
    console.log(`FAIL  ${m.label}: suite crashed rather than reporting — the mutation is malformed (${tail})`);
    bad++;
    continue;
  }
  if (modifiedTargets().length) {
    console.log(`FAIL  ${m.label}: restore did not reproduce the original file`);
    process.exit(1);
  }
  if (missed.length) {
    console.log(`FAIL  ${m.label}: survived — no check caught [${missed.join(", ")}] (${tail})`);
    bad++;
  } else {
    console.log(`ok    ${m.label} — caught by ${failed.length} check(s)`);
  }
}

// Compare against the bytes we read at startup, NOT against git — the working tree may
// legitimately differ from HEAD while this harness runs, so a git check here is unsound.
const leftDirty = modifiedTargets();
if (leftDirty.length) {
  console.log(`FAIL: ${leftDirty.join(", ")} left modified — restore before trusting anything above`);
  process.exit(1);
}
console.log(`\n${chosen.length - bad}/${chosen.length} mutations caught`);
process.exit(bad ? 1 : 0);
