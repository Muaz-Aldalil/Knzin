#!/usr/bin/env node
/* UI Review Loop — round runner. Owns the recording lifecycle so the agent never does
 * bookkeeping: start / run / stop / abort for recording, pending / resolve for feedback,
 * calibrate for video-clock offset.
 *
 * Two browser backends behind one evidence engine:
 *   - agent-browser (default): the original path, unchanged and byte-for-byte identical.
 *   - browser-control (opt-in, --backend browser-control): shells to the `browser-control`
 *     CLI, records CDP video, and is video-primary (low-confidence DOM sync). EXPERIMENTAL.
 * A backend adapter supplies the primitive operations (eval, drain, record, run); the engine
 * owns segments, drains, overflow/gap accounting, and the crash-safe cursor protocol.
 *
 * State between invocations lives in <project>/.agent-review/.active.json (control) plus
 * append-only <partial>/frames-<segmentId>.jsonl (evidence). Frames are persisted BEFORE
 * the drain cursor advances; duplicates are removed by (segmentId, frameIndex) at assembly.
 *
 * Zero dependencies. Node 22+. Never runs agent-browser through a shell. The browser-control
 * binary name is resolvable via AR_BC_BIN (test-only override); ffmpeg via AR_FFMPEG_BIN.
 */
"use strict";

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// The redaction policy lives in the recorder asset: projects copy that file, so it cannot
// import the runner — the runner imports IT. The import installs the policy on globalThis.
import "../assets/recorder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SKILL_VERSION = "1.0.0";
// The oldest Node this tool is written against. Both entry points check it before doing
// anything, so an older runtime gets a sentence naming what it needs instead of a
// ReferenceError thrown from the middle of a command. A version string that cannot be read
// is not proof of an old runtime, so it proceeds — the same call the browser-control
// preflight makes on an undeterminable extension version.
const MIN_NODE_MAJOR = 22;
function nodeVersionProblem(version = process.versions.node) {
  const m = /^v?(\d+)\./.exec(String(version || ""));
  if (!m || Number(m[1]) >= MIN_NODE_MAJOR) return null;
  return `Node ${MIN_NODE_MAJOR} or newer is required; this is Node ${version}. Run the tool with a newer Node on PATH.`;
}
const SKILL_DIR = path.resolve(__dirname, "..");
const RECORDER_JS = path.join(SKILL_DIR, "assets", "recorder.js");
const RECORDER = globalThis.AgentReviewRecorder;
const RECORDER_VERSION = RECORDER.RECORDER_VERSION;
// shared with the in-page recorder: query/path/userinfo/fragment URL redaction and the
// sensitive-parameter predicate. Network HEADER rules stay local to the HAR sanitizer below.
const REDACTION = RECORDER.REDACTION;
const redactUrl = REDACTION.redactUrl;
const SYNC_HOLD_MS = 700;
// gate on the recorder page's own clock disagreement (clock skew), never on video alignment
const CLOCK_SKEW_GATE_MS = 500;

// browser-control backend knobs. AR_BC_BIN / AR_FFMPEG_BIN / AR_BC_RECORD_STOP_WAIT_MS exist so
// the self-test can point the runner at a PATH-shim fake and shorten the artifact wait;
// production leaves them defaulted.
const BC_BIN = process.env.AR_BC_BIN || "browser-control";
const FFMPEG_BIN = process.env.AR_FFMPEG_BIN || "ffmpeg";
// Per-chunk drain sizing + loop bounds. The chunk budget stays under browser-control's 32 KiB
// value cap with headroom; the loop is bounded so a pathological page can never wedge a drain.
const DRAIN_CHUNK_BYTES = 24 * 1024;
const DRAIN_MAX_CHUNKS = 200;
const DRAIN_BUDGET_MS = 20000;
const BC_RECORD_STOP_WAIT_MS = parseInt(process.env.AR_BC_RECORD_STOP_WAIT_MS, 10) || 30000;
// Every browser-control CLI call is bounded so a hung relay fails closed; the consent handoff
// waits on a human, so it gets its own generous ceiling. A timed-out call is a rejected result.
const BC_CLI_TIMEOUT_MS = 30000;
const BC_HANDOFF_TIMEOUT_MS = 15 * 60 * 1000;
// The optional cleanup steps shell out to agent-browser; a step that hangs must be abandoned,
// not inherited by the whole command. Same bound as every other external CLI call in this
// file; AR_AB_CAPTURE_STOP_TIMEOUT_MS exists so the self-test can shorten it.
const AB_CAPTURE_STOP_TIMEOUT_MS = parseInt(process.env.AR_AB_CAPTURE_STOP_TIMEOUT_MS, 10) || 30000;
// Where a recording is made to begin. agent-browser 0.32.1: `record start <path> [url]` creates
// a fresh recording context and, given no url, "automatically navigates to your current page" —
// whatever the shared, long-lived session was already showing, another project's authenticated
// page included. So the session is parked here first and capture inherits it. The url argument
// cannot do this job: the recorder navigates through CDP, which rejects about: and data: URLs
// ("Cannot navigate to invalid URL", exit 1) — the argument only accepts a fetchable page, and
// no fetchable page is neutral. `open` reaches about:blank fine, which is why it is the parker.
const NEUTRAL_RECORDING_PAGE = "about:blank";
// Output ceiling for a wrapped operator command; AR_AB_RUN_MAX_BUFFER exists so the
// self-test can shrink it and reach the overflow path hermetically.
const AB_RUN_MAX_BUFFER = parseInt(process.env.AR_AB_RUN_MAX_BUFFER, 10) || 64 * 1024 * 1024;
// The relay reports a lost-and-re-established connection through an execute warning; any such
// warning on a browser-control round is a continuity break the runner must fail closed on.
const BC_RECONNECT_RE = /re-established|re-resolved|connection was lost|reconnect/i;

// ---------- small utils ----------

// Temporary artifacts register their own removal the moment they exist, and every exit path
// drains the registry first: process.exit() bypasses every finally in the file, so without
// this a raw network capture could outlive ANY failure between its creation and its cleanup.
const exitCleanups = [];
function registerExitCleanup(fn) { exitCleanups.push(fn); }
function exitProcess(code) {
  for (let i = exitCleanups.length - 1; i >= 0; i--) { try { exitCleanups[i](); } catch {} }
  process.exit(code);
}
function die(msg, code = 1) { process.stderr.write(`round: ${msg}\n`); exitProcess(code); }
function sleepMs(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function nowIso() { return new Date().toISOString(); }
function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

function atomicWriteJson(file, obj) {
  // random, exclusively-created temporary: a pre-placed link at a predictable name must
  // never receive the payload, and rename() only ever replaces the leaf itself
  const tmp = `${file}.tmp-${process.pid}-${crypto.randomBytes(6).toString("hex")}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), { flag: "wx" });
  fs.renameSync(tmp, file);
}

function findProjectRoot() {
  const cwd = process.cwd();
  return fs.realpathSync(cwd);
}

// The single way every command obtains the artifact directory. lstat rejects a symlinked
// .agent-review (mkdir would silently follow it) and anything that is not a real directory;
// realpath equality then proves the directory is the project's own. Read-only commands use
// the non-creating variant. Cleanup callers (abort) pass { fatal: false }: the refusals then
// become a warning plus the LEXICAL path — enough to locate the marker and release a lock
// this project provably owns. A guard that protects a write must never block the path that
// escapes a bad state.
function arDir(root, { create = true, fatal = true } = {}) {
  const dir = path.join(root, ".agent-review");
  let lst = null;
  try { lst = fs.lstatSync(dir); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  if (lst && (lst.isSymbolicLink() || !lst.isDirectory()) && !fatal) {
    process.stderr.write(`round: warning: .agent-review is ${lst.isSymbolicLink() ? "a symlink" : "not a directory"} — cleanup proceeds on the lexical path only; nothing is read or written through it\n`);
    return dir;
  }
  if (lst && lst.isSymbolicLink()) die(".agent-review is a symlink — refusing to use it; remove the link so the tool can use a real directory");
  if (lst && !lst.isDirectory()) die(".agent-review is not a directory — refusing to use it; remove the file so the tool can use a real directory");
  if (!lst) {
    if (!create) return null;
    fs.mkdirSync(dir, { mode: 0o700 });
  }
  const real = fs.realpathSync(dir);
  if (real !== path.join(fs.realpathSync(root), ".agent-review")) die(".agent-review does not resolve inside this project — refusing to use it");
  if (!create) return real;
  try { fs.chmodSync(dir, 0o700); } catch {}
  const gi = path.join(dir, ".gitignore");
  let gl = null;
  try { gl = fs.lstatSync(gi); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  if (gl && gl.isSymbolicLink()) die(".agent-review/.gitignore is a symlink — refusing to write through it; remove the link");
  if (!gl) {
    try { fs.writeFileSync(gi, "*\n", { flag: "wx" }); } catch (e) { if (!e || e.code !== "EEXIST") throw e; }
  }
  return real;
}

// A verified directory does not protect its children: a symlinked leaf redirects a write
// even when every parent is real. Call before handing a leaf path to an external writer.
function rejectSymlinkLeaf(file) {
  let lst = null;
  try { lst = fs.lstatSync(file); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  if (lst && lst.isSymbolicLink()) die(`${path.basename(file)} is a symlink — refusing to write through it; remove it and retry`);
}

// Resolve a child directory of the verified artifact directory, refusing symlinks and escapes.
function containedDir(dir, name) {
  const d = path.join(dir, name);
  try {
    if (fs.lstatSync(d).isSymbolicLink()) return null;
    const real = fs.realpathSync(d);
    return real.startsWith(dir + path.sep) ? real : null;
  } catch { return null; }
}

// Resolve a leaf of a verified directory to its real path, refusing symlinked leaves and
// anything resolving outside the directory. Returns null when the leaf is absent or untrusted.
function containedFile(dir, name) {
  const f = path.join(dir, name);
  try {
    if (fs.lstatSync(f).isSymbolicLink()) return null;
    const real = fs.realpathSync(f);
    return real.startsWith(dir + path.sep) ? real : null;
  } catch { return null; }
}

// Read a text leaf of a verified directory without ever following a symlink.
function readContainedText(dir, name) {
  const real = containedFile(dir, name);
  if (!real) return null;
  try { return fs.readFileSync(real, "utf8"); } catch { return null; }
}

// Parse a JSON leaf of a verified directory, refusing symlinked or escaping leaves.
function readContainedJson(dir, name) {
  const text = readContainedText(dir, name);
  if (text === null) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function newRoundId() {
  const t = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "T");
  return `${t}Z-${crypto.randomBytes(3).toString("hex")}`;
}

function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return !!(e && e.code === "EPERM"); }
}

// All agent-browser rounds share ONE default session (one window.__rec, one video/HAR
// recorder), so they are machine-wide exclusive, not just per-project. The lock's pid is
// only a hint — lock writers exit right after start, so the holding project's .active.json
// marker is the ground truth for "round still running". browser-control rounds do NOT take
// this lock: they rely on the project marker plus the relay's exclusive target ownership.
function machineLockPath() { return path.join(os.homedir(), ".agent-browser", "agent-review.lock"); }

function readMachineLock() {
  try { return JSON.parse(fs.readFileSync(machineLockPath(), "utf8")); } catch { return null; }
}

// The shared agent-browser capture is machine-wide; only the lock proves which project and
// round own it, so both must match before any global recorder operation.
function machineLockHeldBy(root, roundId) {
  const h = readMachineLock();
  return !!h && h.project === root && h.roundId === roundId;
}

function acquireMachineLock(roundId, root) {
  const file = machineLockPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      fs.writeFileSync(file, JSON.stringify({ pid: process.pid, project: root, roundId, startedAt: nowIso() }, null, 2), { flag: "wx" });
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      const holder = readMachineLock();
      // the probe path comes from an untrusted lock file — only an absolute project path is
      // ever joined, and only for an existence probe
      const project = holder && typeof holder.project === "string" && path.isAbsolute(holder.project) ? holder.project : null;
      const marker = project ? path.join(project, ".agent-review", ".active.json") : null;
      // link-aware probe: ANY directory entry at the marker path — file, directory, or a
      // symlink (dangling or not) — means a round marker exists. A following probe would
      // misread a dangling link as "no round" and take a live lock away from its owner.
      let held = false;
      if (marker) {
        try { fs.lstatSync(marker); held = true; }
        catch (e) {
          // ENOTDIR/ELOOP: the holder's artifact path cannot contain a live marker (its
          // project path is a regular file, or a link loop) — the lock is stale, take it
          // over. EACCES/EPERM is undecidable: refuse with a named message, never a raw
          // node:fs trace, since taking over could steal a live lock.
          if (!e || e.code === "ENOENT" || e.code === "ENOTDIR" || e.code === "ELOOP") held = false;
          else if (e.code === "EACCES" || e.code === "EPERM") {
            die(`cannot probe the round marker of the project holding the machine lock (${project}) — permission denied; remove ${file} by hand once no round is running`);
          } else {
            die(`cannot probe the round marker of the project holding the machine lock (${project}): ${e.code || e.message}; remove ${file} by hand once no round is running`);
          }
        }
      } else {
        held = !!(holder && holder.pid && pidAlive(holder.pid));
      }
      if (held) {
        die(`another round is active on this machine (project: ${holder.project || "unknown"}, round: ${holder.roundId || "unknown"}) — stop or abort it first`);
      }
      // A stale lock may still have a live capture behind it, whoever it belongs to: the
      // round that wrote it can have lost its marker without ever stopping the recorder.
      // Stop the shared capture best-effort before taking the lock over, so takeover never
      // inherits a running recording. Only a LIVE foreign lock keeps its capture strictly
      // untouched — that case was refused above and never reaches here.
      if (holder) {
        reportTerminationNotes(stopSharedCapture());
      }
      // Stale takeover must be race-safe: two starts may both judge the lock stale, and
      // remove-then-create lets the loser's remove clobber the winner's fresh lock.
      // rename() arbitrates atomically — only one racer can rename the same inode away;
      // the loser gets ENOENT and loops to re-evaluate whoever now holds the lock.
      const aside = `${file}.stale.${process.pid}`;
      try {
        fs.renameSync(file, aside);
        fs.rmSync(aside, { force: true });
      } catch { /* lost the takeover race — next iteration re-reads the new holder */ }
    }
  }
  die("could not acquire the machine-wide round lock (contention) — retry");
}

// Best-effort stop of the shared agent-browser capture: the network capture is stopped into a
// freshly created private temporary directory (never a repository-controlled path) and the
// video recorder is stopped. Each step is independently guarded and may fail without
// consequence, and each runs under a bounded wait so a hung agent-browser is abandoned as a
// failed step rather than hanging the whole command; a missing binary fails the same way.
// Returns honest notes about anything that could not be stopped.
function stopSharedCapture() {
  const notes = [];
  try {
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "ar-netstop-"));
    registerExitCleanup(() => { try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {} });
    try {
      const r = spawnSync("agent-browser", ["network", "har", "stop", path.join(scratch, "network.raw.har")], { encoding: "utf8", timeout: AB_CAPTURE_STOP_TIMEOUT_MS });
      if (r.error) notes.push("the network capture could not be stopped");
    } finally {
      try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {}
    }
  } catch { notes.push("the network capture could not be stopped"); }
  try {
    const r = spawnSync("agent-browser", ["record", "stop"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: AB_CAPTURE_STOP_TIMEOUT_MS });
    if (r.error) notes.push("the video recorder could not be stopped");
  } catch { notes.push("the video recorder could not be stopped"); }
  return notes;
}

// Best-effort release of the shared agent-browser session: the browser the round recorded in,
// and the daemon behind it, are machine-wide and outlive every command that talks to them —
// nothing else in the lifecycle ever closes them, so a round that does not release its session
// leaves it running at full CPU indefinitely. Only ever called once the machine-wide lock has
// proven this project and round own the session; `close` (never `--all`) leaves any other
// session alone. Bounded like every other external call here, and guarded so a session that
// refuses to close is a note — never a reason to keep a marker or a lock standing.
function releaseSharedSession() {
  const notes = [];
  try {
    const r = spawnSync("agent-browser", ["close"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: AB_CAPTURE_STOP_TIMEOUT_MS });
    if (r.error) notes.push("the browser session could not be closed — close it with 'agent-browser close'");
  } catch { notes.push("the browser session could not be closed — close it with 'agent-browser close'"); }
  return notes;
}

function releaseMachineLock(root, roundId) {
  const holder = readMachineLock();
  if (!holder) return;
  // release only on an exact owner match — a copied round id alone must not free another
  // project's lock. A failed removal propagates so the caller reports it instead of
  // declaring the round cleared while the machine-wide lock still stands.
  if (holder.roundId === roundId && holder.project === root) {
    fs.rmSync(machineLockPath(), { force: true });
  }
}

// ---------- agent-browser plumbing ----------

function ab(args, { allowFail = false } = {}) {
  const r = spawnSync("agent-browser", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) die(`agent-browser failed to launch: ${r.error.message}`);
  if (r.status !== 0 && !allowFail) {
    die(`agent-browser ${args[0]} failed (exit ${r.status}): ${(r.stderr || r.stdout || "").trim().slice(0, 500)}`);
  }
  return (r.stdout || "").trim();
}

function abVersion() {
  try { return ab(["--version"]).replace(/^agent-browser\s*/, "").trim(); } catch { return "unknown"; }
}

// The agent-browser recording + network-capture contract this runner reads. 0.32 is the floor:
// `record start <path> [url]` parking semantics and the `network har` output shape below it are
// not the ones the evidence engine assembles from, and a backend that has silently changed its
// contract shows up as broken evidence — the worst symptom an evidence tool has.
const AB_CONTRACT_MIN_MAJOR = 0;
const AB_CONTRACT_MIN_MINOR = 32;
const AB_CONTRACT = `${AB_CONTRACT_MIN_MAJOR}.${AB_CONTRACT_MIN_MINOR}.x`;
// Returns { fatal, message }, or null when the version is inside the verified contract.
// A version that cannot be read, and a version newer than the contract, are both unknowns —
// and an unknown warns rather than refuses, the same call the browser-control preflight makes
// when doctor cannot determine the extension version. Only a version that can be read AND is
// provably older than the contract fails the preflight.
function abVersionProblem(version) {
  const m = /^(\d+)\.(\d+)/.exec(String(version == null ? "" : version).trim());
  if (!m) {
    return { fatal: false, message: `agent-browser version could not be determined (it reported ${JSON.stringify(String(version == null ? "" : version))}); this skill records against the ${AB_CONTRACT} recording and network-capture contract — proceeding, and recording the version it reported` };
  }
  const major = Number(m[1]), minor = Number(m[2]);
  if (major < AB_CONTRACT_MIN_MAJOR || (major === AB_CONTRACT_MIN_MAJOR && minor < AB_CONTRACT_MIN_MINOR)) {
    return { fatal: true, message: `agent-browser ${version} is older than the ${AB_CONTRACT} recording and network-capture contract this skill records against — upgrade it (npm i -g agent-browser && agent-browser install) before starting a round` };
  }
  if (major > AB_CONTRACT_MIN_MAJOR || minor > AB_CONTRACT_MIN_MINOR) {
    return { fatal: false, message: `agent-browser ${version} is newer than the ${AB_CONTRACT} contract this skill was verified against — proceeding; if the evidence looks wrong, check its release notes for recording or network-capture changes` };
  }
  return null;
}

// Evaluate JS in the page. Returns the parsed JSON-ish value agent-browser prints.
// Raw eval: last non-status stdout line (agent-browser's value formatting is
// length-dependent — never parse it directly; use abEvalJson for data).
function abEval(expr) {
  const out = ab(["eval", expr]);
  const lines = out.split("\n").map((l) => l.trim())
    .filter((l) => l && !l.startsWith("✓") && !l.startsWith("✗") && !l.startsWith("⚠") && !l.startsWith("[agent-browser]"));
  return lines.length ? lines[lines.length - 1] : "";
}

// Deterministic data channel: the page base64-encodes the JSON payload, Node decodes.
// Immune to agent-browser's raw/quoted output switching and to payload size.
const B64_HELPER = `(s) => { const b = new TextEncoder().encode(s); let bin = ""; const CH = 32768; for (let i = 0; i < b.length; i += CH) bin += String.fromCharCode.apply(null, b.subarray(i, i + CH)); return btoa(bin); }`;

function abEvalJson(expr) {
  const js = `((${B64_HELPER})(JSON.stringify((() => { try { return (${expr}); } catch (e) { return { __arErr: String(e) }; } })())))`;
  const raw = abEval(js);
  const m = raw.match(/[A-Za-z0-9+/=]{8,}/g);
  if (!m) return null;
  try { return JSON.parse(Buffer.from(m[m.length - 1], "base64").toString("utf8")); }
  catch { return null; }
}

function sleepPoll(fn, timeoutMs, intervalMs = 200) {
  const t0 = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - t0 > timeoutMs) return null;
    sleepMs(intervalMs);
  }
}

// ---------- browser-control plumbing ----------

// Deterministic session id from the round id: browser-control accepts only a leading
// [a-z0-9] then [a-z0-9-] (<= 63 chars). Round ids already fit once lowercased.
function bcSessionId(roundId) { return "ar-" + String(roundId).toLowerCase(); }

function bcRun(args, { allowFail = false, timeout = BC_CLI_TIMEOUT_MS } = {}) {
  const r = spawnSync(BC_BIN, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout });
  if (r.error) {
    // ETIMEDOUT / spawn failure: a bounded call that did not return is a rejected result
    if (allowFail) return { status: 1, stdout: "", stderr: String((r.error && r.error.message) || r.error) };
    die(`browser-control failed to launch or timed out: ${(r.error && r.error.message) || r.error}`);
  }
  if (r.status !== 0 && !allowFail) {
    die(`browser-control ${args[0]} failed (exit ${r.status})`);
  }
  return { status: r.status == null ? 1 : r.status, stdout: (r.stdout || "").trim(), stderr: (r.stderr || "").trim() };
}

// Full envelope rejection taxonomy for every execute call. Returns a reason string when the
// result must be rejected, null when it is trustworthy. Fields are REQUIRED, not merely
// checked-if-present: ok must be true, isError must be false, session.id must be present and
// exactly equal to the round's session. When a value is expected, valueUnavailable must be
// false — so value:null is a real page null ONLY once this returns null.
function bcReject(env, sid, { expectValue = true } = {}) {
  if (!env || typeof env !== "object") return "missing-envelope";
  if (env.ok !== true) return "not-ok";
  if (env.isError !== false) return "script-error";
  if (expectValue && env.valueUnavailable !== false) return "value-unavailable";
  if (!env.session || typeof env.session.id !== "string") return "missing-session";
  if (env.session.id !== sid) return "session-mismatch";
  return null;
}

// A drain chunk must be structurally sound before its frames are trusted: `more` boolean,
// `frames` an array whose indices strictly increase and all exceed the current cursor, and
// `nextCursor`/`firstRetained` integers — the same integer rule the active-state validator
// applies on load, so an accepted chunk can never persist a cursor a reload would reject.
// An empty chunk must not advance and must not claim more (empty + more:true is the poison
// case). Any violation fails the drain closed.
function bcChunkValid(chunk, cursor) {
  if (!chunk || typeof chunk !== "object") return false;
  if (typeof chunk.more !== "boolean") return false;
  if (!Number.isInteger(chunk.firstRetained)) return false;
  if (!Number.isInteger(chunk.nextCursor)) return false;
  if (!Array.isArray(chunk.frames)) return false;
  if (chunk.frames.length === 0) return !chunk.more && chunk.nextCursor === cursor;
  let prev = cursor;
  for (const f of chunk.frames) {
    if (!f || !Number.isInteger(f.i) || f.i <= prev) return false;
    prev = f.i;
  }
  return chunk.nextCursor === chunk.frames[chunk.frames.length - 1].i && chunk.nextCursor > cursor;
}

function bcStatusJson() {
  // status exits nonzero on a stale build but still prints JSON — parse regardless of exit.
  const r = bcRun(["status", "--json"], { allowFail: true });
  try { return JSON.parse(r.stdout); } catch { return null; }
}

function bcDoctorJson() {
  const r = bcRun(["doctor", "--json"], { allowFail: true });
  try { return JSON.parse(r.stdout); } catch { return null; }
}

function bcCliVersion() {
  const r = bcRun(["--version"], { allowFail: true });
  const v = (r.stdout || "").trim();
  return v || null;
}

function bcRecordingStatusJson(target) {
  const args = ["recording", "status", "--json"];
  if (target && target.tabId != null) { args.push("--tab-id", String(target.tabId)); }
  else if (target && target.sessionId) { args.push("--session", target.sessionId); }
  const r = bcRun(args, { allowFail: true });
  // a nonzero/undecodable probe must fail CLOSED — never read as "not recording"
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}

function ffmpegPresent() {
  const r = spawnSync(FFMPEG_BIN, ["-version"], { encoding: "utf8", timeout: BC_CLI_TIMEOUT_MS });
  return !r.error && r.status === 0;
}

// The canonical recorder boot, shared by the init script (future documents in the session)
// and the explicit boot on the current document. Body-ready: at document-start it registers a
// listener and returns null; once the body exists it boots and returns the recorder bootId.
function bcBootstrapSource(recorderSrc, redactJson) {
  return `(() => { ${recorderSrc}
    ;window.__arRedact = ${redactJson};
    const boot = () => {
      if (!document.body) return null;
      if (window.__rec && window.__rec.started) return window.__rec.bootId;
      window.__rec = new AgentReviewRecorder.DomRecorder();
      window.__rec.start(document.body);
      return window.__rec.bootId;
    };
    if (document.body) return boot();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
    return null;
  })()`;
}

// ---------- git / provenance ----------

// Provenance capture bounds. The diff is held in memory whole, so it gets a stated ceiling
// instead of an incidental one; untracked files are hashed through a fixed window, so a large
// worktree costs one window rather than the size of its biggest file (a probe on a large tree
// reached hundreds of megabytes reading whole files).
const GIT_DIFF_MAX_BYTES = 32 * 1024 * 1024;
const UNTRACKED_FILE_LIMIT = 2000;
const FILE_HASH_WINDOW_BYTES = 1024 * 1024;

// Hash a file's whole content without ever holding more than one window of it.
function sha256File(file) {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.allocUnsafe(FILE_HASH_WINDOW_BYTES);
    for (;;) {
      const n = fs.readSync(fd, buf, 0, buf.length, null);
      if (n <= 0) break;
      h.update(buf.subarray(0, n));
    }
  } finally { fs.closeSync(fd); }
  return h.digest("hex");
}

function gitInfo(root) {
  const g = (args, maxBuffer = 64 * 1024 * 1024) => {
    const r = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer });
    return !r.error && r.status === 0 ? r.stdout : null;
  };
  if (g(["rev-parse", "--is-inside-work-tree"]) === null) return null;
  const branch = (g(["branch", "--show-current"]) || "").trim() || "HEAD";
  const head = (g(["rev-parse", "HEAD"]) || "").trim() || null;
  // Everything the hash could NOT reach. An empty list is the claim that the hash stands for
  // the whole worktree state; anything listed is a way two different trees could still hash
  // alike, written into the evidence instead of left to be inferred.
  const notes = [];
  const status = g(["status", "--porcelain"]);
  if (status === null) notes.push("git status could not be read — added and removed files are not covered");
  // --no-ext-diff: a configured diff.external can emit output that does not vary with the
  // change, which lets two different trees hash identically. --full-index: a changed binary
  // file contributes no patch text at all, only its blob id on the index line, and the
  // default abbreviation of that id is a few hex characters — the full id is what makes
  // binary content identity exact rather than a short fingerprint.
  const diff = g(["diff", "--no-ext-diff", "--full-index", "HEAD"], GIT_DIFF_MAX_BYTES);
  if (diff === null) {
    notes.push(`the tracked-file diff could not be read (git failed, or the diff exceeded the ${GIT_DIFF_MAX_BYTES / (1024 * 1024)} MiB capture limit) — tracked edits are not covered`);
  }
  // untracked files affect the reviewed UI too — hash their contents
  const listed = (g(["ls-files", "--others", "--exclude-standard"]) || "").split("\n").filter(Boolean);
  const untracked = listed.slice(0, UNTRACKED_FILE_LIMIT);
  if (listed.length > untracked.length) {
    notes.push(`${listed.length - untracked.length} untracked file(s) past the ${UNTRACKED_FILE_LIMIT}-file capture limit are not covered`);
  }
  let uh = "";
  let unreadable = 0;
  for (const f of untracked) {
    const p = path.join(root, f);
    // an unreadable file enters the hash input AS unreadable, never silently skipped: a
    // skipped entry is indistinguishable from a file that was never there
    try { uh += `${f}:${fs.statSync(p).size}:${sha256File(p)}\n`; }
    catch { unreadable++; uh += `${f}:unreadable\n`; }
  }
  if (unreadable) notes.push(`${unreadable} untracked file(s) could not be read — their content is not covered`);
  return {
    branch, head,
    dirty: status === null ? null : status.trim().length > 0,
    diffHash: "sha256:" + sha256(`${diff || ""}\n--status--\n${status || ""}\n--untracked--\n${uh}`),
    diffHashNotes: notes,
  };
}

// ---------- active-round state ----------

const ROUND_RE = /^\d{8}T\d{6}Z-[0-9a-f]{6}$/;
const COMMENT_ID_RE = /^c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SEGMENT_ID_RE = /^s-\d{4}$/;
const BC_PHASES = new Set(["setup", "consented", "teardown-failed"]);
// Fields only a browser-control round may carry. A marker whose backend field was flipped
// after the fact keeps the old backend's knobs, and every recovery path acts on the declared
// backend alone — so the other backend's fields must be absent, not merely unread.
const BC_ONLY_STATE_FIELDS = ["bcSession", "recordingMode", "phase"];

// The marker is untrusted input: every identifier that reaches a path, an evaluated page
// expression, or a browser-control session is recomputed or shape-checked here. Returns a
// reason string, or null when the state is trustworthy.
function activeStateProblem(st) {
  if (!st || typeof st !== "object") return "not an object";
  if (typeof st.roundId !== "string" || !ROUND_RE.test(st.roundId)) return "roundId missing or malformed";
  if (st.partialDir !== `.partial-${st.roundId}`) return "partialDir does not match the round id";
  if (st.backend !== "agent-browser" && st.backend !== "browser-control") return "unknown backend";
  if (st.backend === "browser-control") {
    if (typeof st.phase !== "string" || !BC_PHASES.has(st.phase)) return "invalid phase for browser-control";
    if (st.bcSession !== bcSessionId(st.roundId)) return "bcSession does not match the round id";
  } else {
    for (const f of BC_ONLY_STATE_FIELDS) {
      if (st[f] !== undefined) return `${f} is only valid on a browser-control round`;
    }
  }
  if (!Array.isArray(st.segments)) return "segments is not an array";
  const ids = new Set();
  for (const seg of st.segments) {
    if (!seg || typeof seg !== "object" || typeof seg.id !== "string" || !SEGMENT_ID_RE.test(seg.id)) return "segment id malformed";
    if (ids.has(seg.id)) return "duplicate segment id";
    ids.add(seg.id);
    if (!Number.isInteger(seg.cursor)) return `cursor of segment ${seg.id} is not a finite integer`;
  }
  if (st.currentSegmentId !== null && !ids.has(st.currentSegmentId)) return "currentSegmentId names no segment";
  return null;
}

function loadActive(dir) {
  const f = path.join(dir, ".active.json");
  // lstat, not existsSync: a dangling symlink must reach the symlink refusal below — read as
  // "no marker" it would wedge the tool (start fails on EEXIST with no recovery path)
  let lst = null;
  try { lst = fs.lstatSync(f); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  if (!lst) return null;
  if (lst.isSymbolicLink()) die(".active.json is a symlink — refusing to trust it; run 'round.mjs abort' to clear it");
  let st;
  try { st = JSON.parse(fs.readFileSync(f, "utf8")); } catch { die(`corrupt .active.json — run 'round.mjs abort' and start over`); }
  const problem = activeStateProblem(st);
  if (problem) die(`invalid .active.json (${problem}) — run 'round.mjs abort' to clear it and start over`);
  // retired fields are dropped at the trust boundary: saving writes the whole object back,
  // so an unknown field (possibly secret-bearing) would otherwise survive every round trip
  delete st.actions;
  delete st.adopt;
  return st;
}

function saveActive(dir, st) { atomicWriteJson(path.join(dir, ".active.json"), st); }

// The partial package directory, resolved against the already-verified artifact directory
// (never rebuilt lexically): symlink-rejected, required to be a real directory, and
// containment-checked before any read or write beneath it. Callers about to write keep the
// fatal checks; cleanup callers (stop/abort) pass { fatal: false } and get null instead — a
// guard that protects a write must not block the path that escapes a bad state.
function partialPath(dir, st, { fatal = true } = {}) {
  const partial = path.join(dir, st.partialDir);
  let lst = null;
  try { lst = fs.lstatSync(partial); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  if (!lst) {
    if (!fatal) return null;
    die(`partial package ${st.partialDir} is gone — run 'round.mjs abort' to clear the round`);
  }
  if (lst.isSymbolicLink()) {
    if (!fatal) return null;
    die(`${st.partialDir} is a symlink — refusing to use it; run 'round.mjs abort' and start over`);
  }
  // a directory is expected: a regular file here must fail here, not late and messily
  if (!lst.isDirectory()) {
    if (!fatal) return null;
    die(`${st.partialDir} is not a directory — run 'round.mjs abort' and start over`);
  }
  let real = null;
  try { real = fs.realpathSync(partial); } catch {
    if (!fatal) return null;
    die(`partial package ${st.partialDir} cannot be resolved — run 'round.mjs abort' to clear the round`);
  }
  if (!real.startsWith(dir + path.sep)) {
    if (!fatal) return null;
    die(`${st.partialDir} resolves outside .agent-review — refusing to use it`);
  }
  return real;
}

function appendFrames(dir, st, segmentId, frames) {
  if (!frames.length) return;
  const file = path.join(partialPath(dir, st), `frames-${segmentId}.jsonl`);
  const lines = frames.map((f) => JSON.stringify(f)).join("\n") + "\n";
  // O_NOFOLLOW: a symlinked frame log must never redirect evidence outside the package
  let fd;
  try {
    fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_NOFOLLOW, 0o600);
  } catch (e) {
    if (e && e.code === "ELOOP") die(`frames-${segmentId}.jsonl is a symlink — refusing to append through it; run 'round.mjs abort' and start over`);
    throw e;
  }
  try { fs.writeSync(fd, lines); } finally { fs.closeSync(fd); }
}

// An interrupted earlier run can leave a raw network capture inside a stale partial package.
// Scrub those leaves at start through the same verified-path helpers every other leaf goes
// through — never an unguarded directory walk. A live round never holds one (the capture
// lands in a private temporary directory), so a raw found here is stale by construction.
function scrubStaleRawCaptures(dir) {
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return; }
  for (const name of names) {
    if (!name.startsWith(".partial-")) continue;
    const rd = containedDir(dir, name);
    if (!rd) continue;
    const raw = containedFile(rd, "network.raw.har");
    if (!raw) continue;
    try { fs.unlinkSync(raw); } catch {}
  }
}

// ---------- evidence engine (backend-agnostic) ----------

// Marker + probe helpers built on the adapter's evalInPage primitive. Each runs a small page
// function with a JSON-encoded argument; no page-derived content is ever interpolated.
function probeBootId(adapter) {
  return adapter.evalInPage("()=>(window.__rec&&window.__rec.started)?window.__rec.bootId:null", null);
}
function pageUrlOf(adapter) {
  return redactUrl(adapter.evalInPage("()=>location.href", null) || "unknown");
}
function viewportOf(adapter) {
  return adapter.evalInPage("()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})", null) || null;
}
function markSyncOn(adapter, id) {
  return adapter.evalInPage("(a)=>window.__rec&&window.__rec.markSync(a.id)", { id });
}
function clearSyncOn(adapter) {
  return adapter.evalInPage("()=>window.__rec&&window.__rec.clearSync()", null);
}
function markActionOn(adapter, name, target, note) {
  return adapter.evalInPage("(a)=>window.__rec&&window.__rec.markAction(a.name,a.target,a.note)", { name: String(name), target: target || null, note: note || null });
}

// Drain new frames from the page into the current segment, chunk by chunk. Overflow is
// recomputed on EVERY chunk against the CURRENT persisted cursor: a firstRetained jump means
// frames were evicted between chunks, so a gap is emitted for the dropped range and the drain
// continues. Each chunk is persisted before the browser is told to drop it (a crash re-drains;
// assembly dedupes). A structurally invalid chunk (bad shape, non-increasing indices, or the
// empty-with-more poison) fails the drain closed with a runner-error gap. Returns null when the
// document is gone/replaced (caller handles the navigation), { gap } otherwise.
function drainSegment(root, st, adapter) {
  const dir = arDir(root);
  const seg = st.segments.find((s) => s.id === st.currentSegmentId);
  if (!seg || !seg.bootId) return null;
  let cursor = seg.cursor;
  let anyGap = null;
  const deadline = Date.now() + DRAIN_BUDGET_MS;
  for (let chunkNo = 0; ; chunkNo++) {
    if (chunkNo >= DRAIN_MAX_CHUNKS || Date.now() > deadline) {
      // fail-safe: a runaway drain never wedges the round; mark the evidence partial and stop
      st.gaps.push({ segmentId: seg.id, reason: "runner-error", droppedFrames: null });
      saveActive(dir, st);
      return { gap: anyGap, aborted: true };
    }
    const chunk = adapter.drainChunk(cursor, DRAIN_CHUNK_BYTES);
    if (!chunk || chunk.bootId !== seg.bootId) return null; // document gone or replaced
    if (!bcChunkValid(chunk, cursor)) {
      // malformed / empty-with-more poison: never trust it, fail closed
      st.gaps.push({ segmentId: seg.id, reason: "runner-error", droppedFrames: null });
      saveActive(dir, st);
      return { gap: anyGap, aborted: true };
    }
    appendFrames(dir, st, seg.id, chunk.frames);
    let gap = null;
    // per-chunk eviction check against the cursor that produced this chunk
    if (chunk.firstRetained > cursor + 1) {
      gap = { segmentId: seg.id, reason: "overflow", droppedFrames: chunk.firstRetained - cursor - 1 };
      st.gaps.push(gap);
      anyGap = anyGap || gap;
    }
    const advanced = chunk.frames.length > 0;
    if (advanced) { seg.cursor = chunk.nextCursor; cursor = chunk.nextCursor; }
    // persist the cursor BEFORE confirming: a crash then just re-drains, strictly fail-safe
    if (advanced || gap) saveActive(dir, st);
    if (advanced) {
      const confirmed = adapter.confirmDrain(chunk.nextCursor, seg.bootId);
      // boot-guarded confirm: a mismatch means the document changed between drain and confirm;
      // treat it as a doc change so the caller re-anchors (the persisted frames stay durable)
      if (confirmed === false) return null;
    }
    if (!chunk.more) break;
  }
  return { gap: anyGap };
}

function startSegment(root, st, url) {
  const n = st.segments.length + 1;
  const seg = {
    id: `s-${String(n).padStart(4, "0")}`,
    bootId: null, url, cursor: -1,
    complete: false, endReason: null, endedWallTimeMs: null,
  };
  st.segments.push(seg);
  st.currentSegmentId = seg.id;
  return seg;
}

function finalizeOldSegment(root, st, reason) {
  const seg = st.segments.find((s) => s.id === st.currentSegmentId);
  if (!seg) return;
  if (seg.endReason === "injection-failed") return; // never clobber a failed injection
  seg.complete = reason === "stop";
  seg.endReason = reason;
  seg.endedWallTimeMs = reason === "stop" ? Date.now() : null;
  if (reason !== "stop") {
    st.gaps.push({ segmentId: seg.id, reason: reason === "navigation-tail" ? "navigation-tail" : reason, droppedFrames: null });
  }
}

// Did the end-of-round sync marker land in this segment's persisted frames? The stop
// cutoff is only real once it is in the evidence — a mark the recorder never kept
// proves nothing about coverage.
function endMarkPersisted(dir, st, segmentId) {
  const text = readContainedText(partialPath(dir, st), `frames-${segmentId}.jsonl`);
  if (text === null) return false;
  for (const line of text.split("\n")) {
    if (!line.includes('"sync"')) continue;
    try {
      const f = JSON.parse(line);
      if (f && f.kind === "sync" && f.data && f.data.id === "end") return true;
    } catch {}
  }
  return false;
}

// A document change was detected (after an action, or delayed between actions). Finalize
// the outgoing segment honestly, then either resume a BFCache-restored one (its recorder
// still holds the tail frames — lift the earlier tail gap) or inject a fresh segment.
function handleDocChange(root, st, adapter, bootIdNow) {
  finalizeOldSegment(root, st, "navigation-tail");
  const restored = bootIdNow && st.segments.find((s) => s.bootId === bootIdNow);
  if (restored) {
    st.currentSegmentId = restored.id;
    st.gaps = st.gaps.filter((g) => !(g.segmentId === restored.id && g.reason === "navigation-tail"));
    restored.complete = false; restored.endReason = null; restored.endedWallTimeMs = null;
    drainSegment(root, st, adapter);
    return;
  }
  const newSeg = startSegment(root, st, pageUrlOf(adapter));
  const newBoot = bootIdNow || adapter.bootRecorder();
  if (!newBoot) {
    newSeg.endReason = "injection-failed";
    st.gaps.push({ segmentId: newSeg.id, reason: "injection-failed", droppedFrames: null });
    return;
  }
  newSeg.bootId = newBoot;
  drainSegment(root, st, adapter);
}

// ---------- backend adapters ----------

function abInjectRecorder(redact) {
  const src = fs.readFileSync(RECORDER_JS, "utf8");
  const redactJson = JSON.stringify(redact || []);
  // single expression: the abEvalJson channel wraps it in `return ( ... )`
  const boot = `(() => { ${src}
    ;window.__arRedact = ${redactJson};
    if (window.__rec && window.__rec.started) return window.__rec.bootId;
    window.__rec = new AgentReviewRecorder.DomRecorder();
    window.__rec.start(document.body);
    return window.__rec.bootId;
  })()`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const id = abEvalJson(boot);
    if (id && typeof id === "string") return id;
    sleepMs(250); // document may still be loading
  }
  return null;
}

// agent-browser adapter: thin wrappers over the existing calls. run(spec) = { argv }
// passthrough. Zero behavior change vs. the pre-backend runner.
function makeAbAdapter({ redact }) {
  return {
    name: "agent-browser",
    preflight() { /* proven when `record start` runs; keep the existing failure path */ },
    versions() { return { agentBrowser: abVersion() }; },
    setup() { /* single shared session; nothing to create */ },
    open(url) { ab(["open", url]); },
    evalInPage(fnSource, arg) {
      const argText = (arg === undefined || arg === null) ? "null" : JSON.stringify(arg);
      return abEvalJson(`(${fnSource})(${argText})`);
    },
    bootRecorder() { return abInjectRecorder(redact); },
    drainChunk(cursor) {
      // the cursor rides an evaluated expression — encode it, never interpolate it raw
      const d = abEvalJson(`window.__rec ? window.__rec.drainSince(${JSON.stringify(cursor)}) : null`);
      if (!d) return null;
      const frames = d.frames || [];
      return { bootId: d.bootId, firstRetained: d.firstRetained, frames, nextCursor: frames.length ? frames[frames.length - 1].i : cursor, more: false };
    },
    confirmDrain(cursor) { abEvalJson(`window.__rec.confirmDrain(${JSON.stringify(cursor)})`); return true; },
    // capture begins on whatever the session is showing NOW — callers park it first
    recordStart(videoPath) {
      const wallBefore = Date.now();
      ab(["record", "start", videoPath]);
      const wallAfter = Date.now();
      return { wallBefore, wallAfter };
    },
    recordStop() {
      const r = spawnSync("agent-browser", ["record", "stop"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
      return { ok: r.status === 0 };
    },
    netStart() {
      const har = spawnSync("agent-browser", ["network", "har", "start"], { encoding: "utf8" });
      if (har.status !== 0) process.stderr.write("round: warning: HAR capture unavailable\n");
    },
    netStop(harPath) {
      spawnSync("agent-browser", ["network", "har", "stop", harPath], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    },
    consentGate() { /* isolated relay page; no shared-profile consent gate */ },
    run(spec) {
      const r = spawnSync("agent-browser", spec.argv, { encoding: "utf8", maxBuffer: AB_RUN_MAX_BUFFER });
      // a command that never ran to completion — killed by a signal, unspawnable, or cut
      // off by the output ceiling — comes back with status null, and process.exit(null)
      // is exit 0. Normalize here so a dead command is never reported as a success.
      const broken = r.error != null || r.signal != null || typeof r.status !== "number";
      const why = r.error ? String(r.error.message || r.error) : (r.signal ? `killed by signal ${r.signal}` : "no exit status");
      return {
        status: broken ? 1 : r.status,
        stdout: typeof r.stdout === "string" ? r.stdout : "",
        stderr: (typeof r.stderr === "string" ? r.stderr : "") + (broken ? `agent-browser: the command did not run to completion (${why})\n` : ""),
      };
    },
    teardown() { /* recording/HAR already stopped by the command */ },
  };
}

// browser-control adapter: shells to the CLI, one session per round, CDP recording.
function makeBcAdapter({ redact, sid, recordingMode }) {
  const recorderSrc = fs.readFileSync(RECORDER_JS, "utf8");
  const bootstrapExpr = bcBootstrapSource(recorderSrc, JSON.stringify(redact || []));
  // Sticky continuity break: once any envelope reports the relay/extension re-established a lost
  // connection, the round can no longer trust its evidence identity and must fail closed.
  let continuity = null;

  function noteWarnings(env) {
    if (env && Array.isArray(env.warnings)) {
      for (const w of env.warnings) {
        if (typeof w === "string" && BC_RECONNECT_RE.test(w)) {
          continuity = continuity || "the relay connection was lost and re-established mid-round";
        }
      }
    }
    return env;
  }

  // Every eval flows through `execute --session <sid> --json 'return await page.evaluate(...)'`.
  // Callers JSON-encode arguments; snippet/page-derived text is never interpolated into code.
  function exec(code, { timeout = BC_CLI_TIMEOUT_MS } = {}) {
    const r = bcRun(["execute", "--session", sid, "--json", code], { allowFail: true, timeout });
    if (r.status !== 0) return null; // nonzero exit / timeout is a rejection
    let env = null; try { env = JSON.parse(r.stdout || "null"); } catch { return null; }
    return noteWarnings(env);
  }

  return {
    name: "browser-control",
    takeContinuity() { const c = continuity; continuity = null; return c; },
    preflight({ adopt } = {}) {
      const status = bcStatusJson();
      if (!status) die("browser-control preflight: relay/extension status unavailable — is the CLI installed and the relay reachable?");
      if (!status.relay || status.relay.running !== true) die("browser-control preflight: relay is not running");
      if (status.relay.stale === true) die("browser-control preflight: relay build does not match the CLI — reload the extension and restart the relay");
      if (!status.extension || status.extension.connected !== true) die("browser-control preflight: browser extension is not connected");
      // doctor-grade extension-version compatibility. A confirmed mismatch is fatal.
      // versionMatches can be null when the CLI cannot read its own bundled manifest
      // (browser-control 0.2.0 looks in extension/ but ships it in extension/dist/) —
      // an undeterminable check on an otherwise-healthy install must not brick the
      // backend, so fall back to the two strong signals we already verified above:
      // extension connected + relay build matches the CLI.
      const doctor = bcDoctorJson();
      if (!doctor || !doctor.extension) die("browser-control preflight: doctor report unavailable — cannot confirm extension compatibility");
      if (doctor.extension.versionMatches === false) die("browser-control preflight: extension version does not match the relay build — reload the unpacked extension");
      if (doctor.extension.versionMatches !== true) {
        process.stderr.write("round: warning — extension version undeterminable (doctor cannot read the bundled manifest); proceeding on connected extension + matching relay build\n");
      }
      if (!ffmpegPresent()) die("browser-control preflight: ffmpeg is required for CDP recording and was not found on PATH");
      if (adopt) {
        const targets = Array.isArray(status.targets) ? status.targets.filter((t) => String(t.url || "").includes(adopt)) : [];
        if (targets.length === 0) die(`browser-control preflight: no attached tab matches --adopt "${adopt}"`);
        if (targets.length > 1) die(`browser-control preflight: --adopt "${adopt}" matches ${targets.length} tabs — narrow the substring`);
        const t = targets[0];
        if (t.tabId != null) {
          const rec = bcRecordingStatusJson({ tabId: t.tabId });
          if (!rec) die("browser-control preflight: could not read the adopt target's recording status");
          if (rec.isRecording === true) die("browser-control preflight: a recording is already active on the adopt target");
        }
      }
    },
    versions() {
      const status = bcStatusJson();
      const relay = status && status.relay ? status.relay : null;
      const ext = status && status.extension ? status.extension : null;
      return {
        cli: bcCliVersion(),
        relayBuild: relay ? (relay.buildId || null) : null,
        extensionVersion: ext ? (ext.version || null) : null,
        recordingMode,
        ffmpeg: ffmpegPresent(),
      };
    },
    setup({ adopt } = {}) {
      // throw (do not die) so the caller can release the session it just created
      const sn = bcRun(["session", "new", sid], { allowFail: true });
      if (sn.status !== 0) throw new Error("could not create the browser-control session");
      if (adopt) {
        const sa = bcRun(["session", "adopt", "--session", sid, "--target-url", adopt], { allowFail: true });
        if (sa.status !== 0) throw new Error("could not adopt the target tab");
      }
      const env = exec(`await context.addInitScript(${JSON.stringify(bootstrapExpr)}); return true`);
      if (bcReject(env, sid)) throw new Error("could not install the recorder bootstrap");
    },
    open(url) {
      const env = exec(`await page.goto(${JSON.stringify(url)}, { waitUntil: "domcontentloaded" }); return { url: page.url(), title: await page.title() }`);
      if (bcReject(env, sid)) throw new Error("navigation to the round URL failed");
      return env.value;
    },
    currentPageUrl() {
      return redactUrl(this.evalInPage("()=>location.href", null) || "unknown");
    },
    currentTargetInfo() {
      const status = bcStatusJson();
      const t = status && Array.isArray(status.targets) ? status.targets.find((x) => x.browserControlSessionId === sid) : null;
      return {
        url: this.currentPageUrl(),
        title: this.evalInPage("()=>document.title", null) || null,
        targetId: t ? t.id : null,
      };
    },
    consentGate(plannedFlow) {
      const msg = `Recording a review round on this page: ${plannedFlow}. Confirm to proceed.`;
      // the handoff waits on a human, so it gets its own generous ceiling; the acknowledgment
      // must return strictly true — anything else is treated as consent not given (throw so the
      // caller releases the session)
      const env = exec(`await handoff(${JSON.stringify(msg)}); return true`, { timeout: BC_HANDOFF_TIMEOUT_MS });
      if (bcReject(env, sid) || env.value !== true) throw new Error("the review-consent handoff was not acknowledged");
      return true;
    },
    evalInPage(fnSource, arg) {
      const argText = (arg === undefined || arg === null) ? "null" : JSON.stringify(arg);
      const env = exec(`return await page.evaluate(${fnSource}, ${argText})`);
      if (bcReject(env, sid)) return null;
      return env.value;
    },
    bootRecorder() {
      // explicit, idempotent boot of the current document; the init script covers later ones
      for (let attempt = 0; attempt < 8; attempt++) {
        const env = exec(`return await page.evaluate(${JSON.stringify(bootstrapExpr)})`);
        if (!bcReject(env, sid) && typeof env.value === "string") return env.value;
        sleepMs(250);
      }
      return null;
    },
    drainChunk(cursor, budgetBytes) {
      const fn = "(a)=>(window.__rec&&window.__rec.drainChunk)?window.__rec.drainChunk(a.cursor,a.budget):null";
      const env = exec(`return await page.evaluate(${fn}, ${JSON.stringify({ cursor, budget: budgetBytes })})`);
      if (bcReject(env, sid)) return null;
      const v = env.value;
      if (!v || typeof v !== "object") return null; // page null: recorder absent → doc gone
      return { bootId: v.bootId, firstRetained: v.firstRetained, frames: Array.isArray(v.frames) ? v.frames : [], nextCursor: v.nextCursor, more: !!v.more };
    },
    confirmDrain(cursor, bootId) {
      const fn = "(a)=>{if(!window.__rec)return false;if(window.__rec.bootId!==a.bootId)return false;window.__rec.confirmDrain(a.cursor);return true;}";
      const env = exec(`return await page.evaluate(${fn}, ${JSON.stringify({ cursor, bootId })})`);
      if (bcReject(env, sid)) return false;
      return env.value === true;
    },
    recordStart(videoPath) {
      const r = bcRun(["recording", "start", videoPath, "--session", sid, "--mode", recordingMode], { allowFail: true });
      if (r.status !== 0) throw new Error("recording start failed"); // caller releases the session
      return {};
    },
    recordStop(videoPath) {
      const r = bcRun(["recording", "stop", "--session", sid], { allowFail: true });
      // the artifact must exist and be nonempty before we trust it (wait up to the ceiling)
      const present = videoPath
        ? sleepPoll(() => { try { return fs.statSync(videoPath).size > 0; } catch { return false; } }, BC_RECORD_STOP_WAIT_MS) != null
        : true;
      return { ok: r.status === 0 && present };
    },
    netStart() { /* no network capture; completeness.network stays "missing" */ },
    netStop() { /* no-op */ },
    run(spec) {
      // Labels reach the timeline; snippets never do. The result is validated by the same
      // envelope taxonomy (a snippet may legitimately return nothing, so no value is required).
      // Only the human-readable text line is surfaced — the raw envelope (with full logs) is
      // never printed or persisted.
      const r = bcRun(["execute", "--session", sid, "--json", spec.snippet], { allowFail: true });
      let env = null; try { env = JSON.parse(r.stdout || "null"); } catch {}
      noteWarnings(env);
      const ok = r.status === 0 && !bcReject(env, sid, { expectValue: false });
      const stdout = ok && env && typeof env.text === "string" && env.text ? env.text + "\n" : "";
      const stderr = ok ? "" : "browser-control: snippet run failed\n";
      return { status: ok ? 0 : 1, stdout, stderr };
    },
    teardown() {
      // recording first, then session — a lingering CDP recording must never outlive the
      // session. A relay that restarted and forgot the session makes delete a no-op success.
      bcRun(["recording", "cancel", "--session", sid], { allowFail: true });
      const del = bcRun(["session", "delete", sid], { allowFail: true });
      const notFound = /not found/i.test((del.stderr || "") + " " + (del.stdout || ""));
      return { sessionReleased: del.status === 0 || notFound };
    },
  };
}

function resolveAdapter(st) {
  if (st.backend === "browser-control") {
    return makeBcAdapter({ redact: st.redact || [], sid: st.bcSession, recordingMode: st.recordingMode || "cdp" });
  }
  return makeAbAdapter({ redact: st.redact || [] });
}

// A browser-control round that loses evidence continuity (relay reconnect, or a document
// replaced without a runner-initiated navigation) stops mutating and finalizes as a partial:
// a sanitized runner-error gap, best-effort teardown, and the partial package kept for
// diagnosis. Never boots a fresh recorder to continue under the same evidence identity.
function bcFailClosed(root, st, adapter, reason) {
  const dir = arDir(root);
  st.gaps.push({ segmentId: st.currentSegmentId, reason: "runner-error", droppedFrames: null });
  saveActive(dir, st);
  terminateRound(root, {
    markerPath: path.join(dir, ".active.json"),
    releaseSession: () => { adapter.teardown({ crashed: true }); return null; },
  });
  die(`browser-control round failed closed: ${reason} — partial package kept at .agent-review/${st.partialDir}`);
}

// Fail closed if the adapter has seen a relay/extension reconnect warning since the last check.
function bcCheckContinuity(root, st, adapter) {
  const reason = adapter.takeContinuity && adapter.takeContinuity();
  if (reason) bcFailClosed(root, st, adapter, reason);
}

// Shared policy for the human-authored intent strings (run --label and start --flow): one line,
// bounded, and free of anything that could leak page state or credentials into the timeline.
function validateBcActionText(text, { field, required }) {
  if (!text) {
    if (required) die(`browser-control runs require --${field} "<action intent>" (labels go to the timeline; snippets never do)`);
    return text;
  }
  if (/[\r\n]/.test(text)) die(`${field} must be a single line`);
  if (text.length > 120) die(`${field} must be at most 120 characters`);
  if (/https?:\/\//i.test(text)) die(`${field} must not contain a URL — describe the action, not the destination`);
  if (/[?&][^\s=]*=/.test(text)) die(`${field} must not contain a query string — describe the action, not its parameters`);
  if (/@/.test(text)) die(`${field} must not contain '@' — no emails or handles`);
  if (/["'`]/.test(text)) die(`${field} must not contain quotes or backticks — describe the action plainly`);
  return text;
}

// ---------- commands ----------

// The single best-effort termination path for every way a round can end without finalizing,
// used by abort and by the failure paths of stop. Its shape makes cleanup structurally
// incapable of being blocked by the state it cleans up after:
//   - Optional work first, each step independently guarded and allowed to fail without
//     consequence: stop the network capture (into a freshly created private temporary
//     directory, never into a repository-controlled path), stop the video recorder, and
//     release the browser-control session. A poisoned artifact is skipped, never a
//     precondition. The shared-capture stops run when this round provably owns the capture
//     (machineLockRoundId) or when stopCapture asks for them without ownership — a lock
//     naming another round of this same project, whose capture may still be live but whose
//     lock must be kept for that round.
//   - Mandatory work last, in a finally so it runs no matter what failed above: remove the
//     marker (whatever kind of directory entry it is) and release the machine-wide lock —
//     but only when the caller has proven this project owns it.
// machineLockRoundId is non-null ONLY when ownership is proven (exact project + round match,
// or — for an unreadable marker — the lock itself naming this project). Returns honest notes
// about anything that could not be cleaned up.
function terminateRound(root, { markerPath, machineLockRoundId = null, releaseSession = null, stopCapture = false }) {
  const notes = [];
  try {
    if (machineLockRoundId || stopCapture) {
      notes.push(...stopSharedCapture());
    }
    // Closing the browser destroys pages and a daemon that are shared machine-wide, so it
    // needs the stronger proof: the lock naming this project AND this round. stopCapture alone
    // names a DIFFERENT round of this project — its capture is stopped, but the session it may
    // still be driving is left running.
    if (machineLockRoundId) {
      notes.push(...releaseSharedSession());
    }
    if (releaseSession) {
      try {
        const note = releaseSession();
        if (note) notes.push(note);
      } catch { notes.push("the browser-control session could not be released — check 'browser-control status'"); }
    }
  } finally {
    if (markerPath) {
      try { fs.rmSync(markerPath, { recursive: true, force: true }); }
      catch { notes.push(`the round marker could not be removed — remove ${markerPath} by hand`); }
    }
    if (machineLockRoundId) {
      try { releaseMachineLock(root, machineLockRoundId); }
      catch { notes.push("the machine-wide round lock could not be released — remove ~/.agent-browser/agent-review.lock by hand once no round is running"); }
    }
  }
  return notes;
}

function reportTerminationNotes(notes) {
  for (const n of notes) process.stderr.write(`round: warning: ${n}\n`);
}

// Operator-supplied redaction selectors are validated IN THE PAGE, with the browser's own
// selector engine, before any capture starts. A list the engine rejects fails the round with
// the offending selector named — the recorder never silently ignores an operator's selector.
const REDACT_PROBE_FN = `function arRedactProbe(selectors) {
  for (const s of selectors) {
    try { document.querySelectorAll(s); }
    catch (e) { return { ok: false, selector: s, message: String((e && e.message) || e) }; }
  }
  return { ok: true };
}`;

// null when the list is valid; a failure message otherwise (including when the page itself
// cannot answer — validation is fail-closed because the recorder relies on it)
function redactSelectorProblem(adapter, redact) {
  if (!redact || !redact.length) return null;
  const r = adapter.evalInPage(REDACT_PROBE_FN, redact);
  if (r && r.ok === true) return null;
  if (r && typeof r.selector === "string") {
    return `invalid --redact selector list: ${JSON.stringify(r.selector)} — ${r.message || "rejected by the browser's selector engine"}`;
  }
  return "could not validate the --redact selector list in the browser";
}

function cmdStart(args) {
  const backend = (getFlag(args, "--backend") || "agent-browser").trim();
  if (backend !== "agent-browser" && backend !== "browser-control") die(`unknown --backend "${backend}" (use agent-browser or browser-control)`);
  const url = getFlag(args, "--url");
  const adopt = getFlag(args, "--adopt");
  // the flag value is ONE selector list, passed through whole: matches()/querySelectorAll()
  // accept comma-separated lists natively, and splitting on commas would break legitimate
  // CSS such as :is(.secret,.token)
  const redactFlag = getFlag(args, "--redact");
  const redact = redactFlag && redactFlag.trim() ? [redactFlag.trim()] : [];

  if (backend === "agent-browser") {
    if (!url) die("start requires --url <url>");
    if (adopt) die("--adopt requires --backend browser-control");
    return cmdStartAb({ url, redact });
  }
  if (!url && !adopt) die("start --backend browser-control requires --url <url> or --adopt <substring>");
  if (url && adopt) die("use either --url or --adopt, not both");
  const flowFlag = getFlag(args, "--flow");
  const flow = flowFlag ? validateBcActionText(flowFlag.replace(/\s*\n\s*/g, " ").trim(), { field: "flow", required: false }) : "a UI review round";
  return cmdStartBc({ url, adopt, flow, redact });
}

function cmdStartAb({ url, redact }) {
  const root = findProjectRoot();
  const dir = arDir(root);
  scrubStaleRawCaptures(dir);
  const roundId = newRoundId();

  // gate the backend contract before the lock, the partial, and any capture: nothing to
  // clean up, and an unsupported backend is named here rather than found in the evidence
  const agentBrowser = abVersion();
  const abProblem = abVersionProblem(agentBrowser);
  if (abProblem && abProblem.fatal) die(`preflight: ${abProblem.message}`);
  if (abProblem) process.stderr.write(`round: warning — ${abProblem.message}\n`);

  // validate the operator's selectors before the lock, the partial, and any capture: an
  // invalid list fails the round here with nothing to clean up
  const adapter = makeAbAdapter({ redact });
  const selectorProblem = redactSelectorProblem(adapter, redact);
  if (selectorProblem) die(selectorProblem);

  acquireMachineLock(roundId, root);

  const partialDir = `.partial-${roundId}`;
  const partial = path.join(dir, partialDir);
  // exclusive create: a pre-placed partial (or symlink) is never reused
  try { fs.mkdirSync(partial, { mode: 0o700 }); } catch (e) {
    if (e && e.code === "EEXIST") die(`${partialDir} already exists — refusing to reuse it; remove it and retry`);
    throw e;
  }

  const st = {
    roundId, backend: "agent-browser", partialDir, startUrl: redactUrl(url), startedAt: nowIso(),
    recordStartWallBefore: null, recordStartWallAfter: null,
    versions: { skill: SKILL_VERSION, recorder: RECORDER_VERSION, agentBrowser, node: process.versions.node },
    git: gitInfo(root),
    redact,
    segments: [], gaps: [],
    currentSegmentId: null,
    viewport: null,
  };
  // persist BEFORE recording starts, so abort always works — exclusive create: an existing
  // marker IS an active round (atomic check-then-act)
  try {
    fs.writeFileSync(path.join(dir, ".active.json"), JSON.stringify(st, null, 2), { flag: "wx" });
  } catch (e) {
    releaseMachineLock(root, roundId);
    // the partial created above belongs to this failed attempt — never leave it orphaned
    try { fs.rmSync(partial, { recursive: true, force: true }); } catch {}
    if (e.code === "EEXIST") die("a round is already active — stop or abort it first");
    throw e;
  }

  const videoPath = path.join(partial, "video.webm");
  rejectSymlinkLeaf(videoPath); // the recorder is an external process writing this leaf
  // park the session on a neutral page, THEN start capture, THEN open the round's own URL: the
  // video opens on this round's navigation and nothing earlier, and the HAR — started below,
  // still before that navigation — carries the initial page load as network evidence
  adapter.open(NEUTRAL_RECORDING_PAGE);
  const rec = adapter.recordStart(videoPath);
  // The round now owns a live browser session, machine-wide and shared. Every exit path out of
  // start must give it back: process.exit() bypasses every finally in this file, so without
  // this a start that fails after this line leaves a browser running until someone closes it
  // by hand. Ownership is re-proven at exit — a lock that has moved on is another round's.
  registerExitCleanup(() => {
    if (machineLockHeldBy(root, roundId)) reportTerminationNotes(releaseSharedSession());
  });
  st.recordStartWallBefore = rec.wallBefore;
  st.recordStartWallAfter = rec.wallAfter;

  adapter.netStart();

  adapter.open(url);
  const seg = startSegment(root, st, pageUrlOf(adapter));
  const bootId = adapter.bootRecorder();
  if (!bootId) {
    finalizeOldSegment(root, st, "injection-failed");
    saveActive(dir, st);
    die("recorder injection failed — round left active in degraded state; run 'round.mjs abort'");
  }
  seg.bootId = bootId;
  st.viewport = viewportOf(adapter);

  markSyncOn(adapter, "start");
  sleepMs(SYNC_HOLD_MS); // keep the flash up for several presented frames
  clearSyncOn(adapter);

  drainSegment(root, st, adapter);
  saveActive(dir, st);
  console.log(`round started: ${roundId}`);
  console.log(`next: send every browser command through: round.mjs run -- <agent-browser args>`);
}

function cmdStartBc({ url, adopt, flow, redact }) {
  const root = findProjectRoot();
  const dir = arDir(root);
  scrubStaleRawCaptures(dir);
  const roundId = newRoundId();
  const sid = bcSessionId(roundId);
  const adapter = makeBcAdapter({ redact, sid, recordingMode: "cdp" });

  // preflight BEFORE any state: a failed preflight must leave no active round behind
  adapter.preflight({ adopt });

  const partialDir = `.partial-${roundId}`;
  const partial = path.join(dir, partialDir);
  // exclusive create: a pre-placed partial (or symlink) is never reused
  try { fs.mkdirSync(partial, { mode: 0o700 }); } catch (e) {
    if (e && e.code === "EEXIST") die(`${partialDir} already exists — refusing to reuse it; remove it and retry`);
    throw e;
  }

  const st = {
    roundId, backend: "browser-control", bcSession: sid, recordingMode: "cdp",
    // consent phase gate: a round is only mutable once the operator acknowledges the handoff.
    // An interrupted start leaves phase "setup", which run refuses and stop treats as abort.
    phase: "setup",
    partialDir, startUrl: url ? redactUrl(url) : null,
    startedAt: nowIso(),
    recordStartWallBefore: null, recordStartWallAfter: null,
    versions: { skill: SKILL_VERSION, recorder: RECORDER_VERSION, node: process.versions.node },
    git: gitInfo(root),
    redact,
    segments: [], gaps: [],
    currentSegmentId: null,
    viewport: null,
  };
  // project-scoped marker: browser-control rounds do NOT take the machine lock — the marker
  // plus the relay's exclusive target ownership is the mutual exclusion
  try {
    fs.writeFileSync(path.join(dir, ".active.json"), JSON.stringify(st, null, 2), { flag: "wx" });
  } catch (e) {
    // the partial created above belongs to this failed attempt — never leave it orphaned
    try { fs.rmSync(partial, { recursive: true, force: true }); } catch {}
    if (e.code === "EEXIST") die("a round is already active — stop or abort it first");
    throw e;
  }

  // the recording leaf is checked before the session-owning block: a die here must not skip
  // session teardown, and a symlinked leaf must never reach the external recorder
  const videoPath = path.join(partial, "video.webm");
  rejectSymlinkLeaf(videoPath);

  // Any failure from here on must release the exclusive session, never leak it until a manual
  // abort. bootRecorder failure names abort because its degraded state is worth inspecting.
  try {
    adapter.setup({ url, adopt });

    // selectors validated in the page before any capture starts; throw (not die) so the
    // session-owning catch below releases everything an invalid list leaves behind
    const selectorProblem = redactSelectorProblem(adapter, redact);
    if (selectorProblem) throw new Error(selectorProblem);

    if (adopt) {
      // adopted tabs share the authenticated profile — name the exact target before consent,
      // and record the real landed URL so the package is not startUrl-less
      const info = adapter.currentTargetInfo();
      st.startUrl = info.url;
      process.stderr.write(`round: adopting tab — title: ${info.title || "(untitled)"}  url: ${info.url}  target: ${info.targetId || "unknown"}\n`);
    } else {
      adapter.open(url); // NAVIGATE FIRST so the human sees the destination
    }

    // consent before the first mutation, every browser-control round; the marker only advances
    // to "consented" once the operator acknowledges, so an interrupted start stays unmutable
    adapter.consentGate(flow);
    st.phase = "consented";
    saveActive(dir, st);

    adapter.recordStart(videoPath);
  } catch (e) {
    try { adapter.teardown({ crashed: true }); } catch {}
    fs.rmSync(path.join(dir, ".active.json"), { force: true });
    die(`browser-control round setup failed (${(e && e.message) || e}) — session released; run 'round.mjs start' again`);
  }

  const seg = startSegment(root, st, pageUrlOf(adapter));
  const bootId = adapter.bootRecorder();
  if (!bootId) {
    finalizeOldSegment(root, st, "injection-failed");
    saveActive(dir, st);
    adapter.teardown({ crashed: true });
    die("recorder boot failed — round left active in degraded state; run 'round.mjs abort'");
  }
  seg.bootId = bootId;
  st.viewport = viewportOf(adapter);

  markSyncOn(adapter, "start");
  sleepMs(SYNC_HOLD_MS);
  clearSyncOn(adapter);

  drainSegment(root, st, adapter);
  bcCheckContinuity(root, st, adapter);
  saveActive(dir, st);
  console.log(`round started: ${roundId} (browser-control, EXPERIMENTAL)`);
  console.log(`next: send every command through: round.mjs run --label "<action intent>" -- '<playwright snippet>'`);
}

const FORBIDDEN_SUBCOMMANDS = new Set(["record", "network har", "connect", "close", "install", "upgrade", "doctor", "dashboard", "stream"]);

// Timeline labels are durable evidence, served on the review site — so command arguments are
// deny-by-default. Only a generated element reference (@e12, the shape the workflow tells
// agents to target) is kept verbatim; every other argument collapses to a fixed label naming
// the KIND of action, so a script body, a file path, a URL, or a selector carrying personal
// data never reaches the timeline. Selector-taking verbs keep the fixed "(selector)" marker:
// a failed click produces no other trace, and the marker keeps it visible in the timeline.
const ELEMENT_REF_RE = /^@e\d+$/;
const SELECTOR_COMMANDS = new Set(["click", "dblclick", "fill", "type", "inserttext", "select", "check", "uncheck", "hover", "focus"]);
const SCRIPT_COMMANDS = new Set(["eval"]);
const NAVIGATION_COMMANDS = new Set(["open", "back", "forward", "reload"]);
const FILE_COMMANDS = new Set(["upload", "download"]);

function actionTarget(cmd) {
  const verb = String(cmd[0] || "").toLowerCase();
  if (verb === "keyboard") return { name: "keyboard", target: "(keyboard)" };
  const ref = cmd.slice(1).find((a) => ELEMENT_REF_RE.test(a)) || null;
  // press takes a KEY, never a selector — and the key name itself stays denied: recording
  // `press a`, `press b`, … would reconstruct typed content in the timeline
  if (verb === "press") return { name: verb, target: ref || "(key)" };
  if (SCRIPT_COMMANDS.has(verb)) return { name: verb, target: ref || "(script)" };
  if (NAVIGATION_COMMANDS.has(verb)) return { name: verb, target: ref || "(navigation)" };
  if (FILE_COMMANDS.has(verb)) return { name: verb, target: ref || "(file)" };
  if (SELECTOR_COMMANDS.has(verb)) return { name: verb, target: ref || "(selector)" };
  // an unrecognised command contributes no argument at all
  return { name: verb, target: ref };
}

function cmdRun(args) {
  const sep = args.indexOf("--");
  const before = sep === -1 ? args : args.slice(0, sep);
  const cmd = sep === -1 ? args : args.slice(sep + 1);
  // validate the command shape BEFORE touching round state, matching the original ordering
  if (!cmd.length) die("run requires -- <agent-browser args>");
  const root = findProjectRoot();
  const dir = arDir(root, { create: false });
  const st = dir ? loadActive(dir) : null;
  if (!st) die("no active round — run 'round.mjs start' first");
  const adapter = resolveAdapter(st);
  if (st.backend === "browser-control") return cmdRunBc({ root, dir, st, adapter, before, cmd });
  return cmdRunAb({ root, dir, st, adapter, cmd });
}

function cmdRunAb({ root, dir, st, adapter, cmd }) {
  // agent-browser rounds share one machine-wide recorder: only the lock holder may drive it
  if (!machineLockHeldBy(root, st.roundId)) {
    die("the machine-wide recorder lock does not name this project and round — refusing to touch the shared browser capture; run 'round.mjs abort' to clear the local marker");
  }
  const sub = cmd[0] === "network" && cmd[1] ? `network ${cmd[1]}` : cmd[0];
  if (FORBIDDEN_SUBCOMMANDS.has(cmd[0]) || FORBIDDEN_SUBCOMMANDS.has(sub)) {
    die(`'${sub}' is lifecycle-owned by the runner and forbidden inside a round`);
  }

  // delayed navigation check: the document may have changed BETWEEN commands
  const seg0 = st.segments.find((s) => s.id === st.currentSegmentId);
  const bootPre = probeBootId(adapter);
  if (seg0 && seg0.bootId && bootPre !== seg0.bootId) handleDocChange(root, st, adapter, bootPre);

  // action label: the verb plus a deny-by-default target (generated ref or fixed kind marker)
  const { name: actionName, target } = actionTarget(cmd);
  const mark = () => markActionOn(adapter, actionName, target);

  // mark, then IMMEDIATELY drain — the marker must be durable before the command can
  // destroy the page. If the drain finds the document gone, re-mark on the live one.
  mark();
  if (drainSegment(root, st, adapter) === null) {
    handleDocChange(root, st, adapter, probeBootId(adapter));
    mark();
    drainSegment(root, st, adapter);
  }

  // last bind before execution: shrink the mark→command window to spawn latency
  const segB = st.segments.find((s) => s.id === st.currentSegmentId);
  const bootPreSpawn = probeBootId(adapter);
  if (segB && segB.bootId && bootPreSpawn !== segB.bootId) {
    handleDocChange(root, st, adapter, bootPreSpawn);
    mark();
    drainSegment(root, st, adapter);
  }

  const r = adapter.run({ argv: cmd });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);

  // document identity check + post drain
  const bootNow = probeBootId(adapter);
  const seg = st.segments.find((s) => s.id === st.currentSegmentId);
  if (bootNow && seg && bootNow === seg.bootId) {
    drainSegment(root, st, adapter);
  } else {
    handleDocChange(root, st, adapter, sleepPoll(() => probeBootId(adapter), 4000));
    // always-true annotation (no causality claim — wall clocks can't prove it): this
    // command spanned a document change; the intent marker lives in the outgoing segment
    markActionOn(adapter, actionName, target, "boundary: command spanned a document change; intent marker in outgoing segment");
    drainSegment(root, st, adapter);
  }

  saveActive(dir, st);
  if (r.status !== 0) exitProcess(r.status);
}

function cmdRunBc({ root, dir, st, adapter, before, cmd }) {
  // consent gate: an unconsented round (interrupted start) is never mutable
  if (st.phase !== "consented") die("this browser-control round has not passed the consent handoff — run 'round.mjs abort' to release it");
  const label = validateBcActionText(getFlag(before, "--label"), { field: "label", required: true });
  const snippet = cmd.join(" ").trim();
  if (!snippet) die("run requires -- '<playwright snippet>'");

  // between-command document change on a browser-control round is NOT a runner-initiated
  // navigation (the previous command already segmented anything it caused) — fail closed
  const seg0 = st.segments.find((s) => s.id === st.currentSegmentId);
  const bootPre = probeBootId(adapter);
  bcCheckContinuity(root, st, adapter);
  if (seg0 && seg0.bootId && bootPre !== seg0.bootId) bcFailClosed(root, st, adapter, "the document changed between commands without a runner navigation");

  const mark = () => markActionOn(adapter, label, null);

  mark();
  if (drainSegment(root, st, adapter) === null) bcFailClosed(root, st, adapter, "the document was replaced while marking the action");
  bcCheckContinuity(root, st, adapter);

  const segB = st.segments.find((s) => s.id === st.currentSegmentId);
  const bootPreSpawn = probeBootId(adapter);
  if (segB && segB.bootId && bootPreSpawn !== segB.bootId) bcFailClosed(root, st, adapter, "the document changed before the command ran");

  const r = adapter.run({ label, snippet });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  // a reconnect during the snippet is a continuity break, even if the bootId looks unchanged
  bcCheckContinuity(root, st, adapter);

  const bootNow = probeBootId(adapter);
  const seg = st.segments.find((s) => s.id === st.currentSegmentId);
  if (bootNow && seg && bootNow === seg.bootId) {
    drainSegment(root, st, adapter);
  } else {
    // the snippet itself navigated — a legitimate new segment (a reconnect would have failed
    // closed above via the warnings check)
    handleDocChange(root, st, adapter, sleepPoll(() => probeBootId(adapter), 4000));
    markActionOn(adapter, label, null, "boundary: command spanned a document change; intent marker in outgoing segment");
    drainSegment(root, st, adapter);
  }
  bcCheckContinuity(root, st, adapter);

  saveActive(dir, st);
  if (r.status !== 0) exitProcess(r.status);
}

function cmdStop(args) {
  const summary = (getFlag(args, "--summary") || "").replace(/\s*\n\s*/g, " ").trim().slice(0, 160);
  const root = findProjectRoot();
  const dir = arDir(root, { create: false });
  const st = dir ? loadActive(dir) : null;
  if (!st) die("no active round");
  const adapter = resolveAdapter(st);
  const bc = st.backend === "browser-control";
  // agent-browser stop drives the machine-wide recorder; only the lock holder may do that
  if (!bc && !machineLockHeldBy(root, st.roundId)) {
    die("the machine-wide recorder lock does not name this project and round — refusing to stop the shared browser capture; run 'round.mjs abort' to clear the local marker");
  }
  // the partial may be gone or tampered with — there is nothing to assemble, so degrade to
  // abort: stop the capture this round owns, clear the marker, release the lock
  const partial = partialPath(dir, st, { fatal: false });
  if (!partial) {
    reportTerminationNotes(terminateRound(root, {
      markerPath: path.join(dir, ".active.json"),
      // for agent-browser the lock check above already proved this round owns the capture
      machineLockRoundId: bc ? null : st.roundId,
      releaseSession: bc ? () => { adapter.teardown({ crashed: true }); return null; } : null,
    }));
    console.log(`partial package ${st.partialDir} is gone or unusable — nothing to finalize; cleared the round (stop behaved as abort)`);
    return;
  }

  // an unconsented browser-control round (interrupted start) can only be aborted, never
  // finalized — there is no consented evidence to promote
  if (bc && st.phase !== "consented") {
    reportTerminationNotes(terminateRound(root, {
      markerPath: path.join(dir, ".active.json"),
      releaseSession: () => { adapter.teardown({ crashed: true }); return null; },
    }));
    console.log(`stop on an unconsented round behaves as abort; partial kept at .agent-review/${st.partialDir} (not shown in library)`);
    return;
  }

  // delayed navigation may have changed the document since the last command
  const segZ = st.segments.find((s) => s.id === st.currentSegmentId);
  const bootAtStop = probeBootId(adapter);
  if (bc) {
    bcCheckContinuity(root, st, adapter);
    if (segZ && segZ.bootId && bootAtStop !== segZ.bootId) bcFailClosed(root, st, adapter, "the document changed after the last command without a runner navigation");
  } else if (segZ && segZ.bootId && bootAtStop !== segZ.bootId) {
    handleDocChange(root, st, adapter, bootAtStop);
  }

  const endMark = () => {
    markSyncOn(adapter, "end");
    sleepMs(SYNC_HOLD_MS);
    clearSyncOn(adapter);
  };
  endMark();
  let dr = drainSegment(root, st, adapter);
  if (dr === null) {
    if (bc) {
      // a browser-control document replaced during stop is a continuity break, not a navigation
      bcFailClosed(root, st, adapter, "the document was replaced during stop");
    }
    // document changed mid-stop (e.g. a timed redirect fired during the sync hold):
    // handle the navigation honestly, then anchor and drain the live document
    handleDocChange(root, st, adapter, probeBootId(adapter));
    endMark();
    dr = drainSegment(root, st, adapter);
    if (dr === null) {
      st.gaps.push({ segmentId: st.currentSegmentId, reason: "runner-error", droppedFrames: null });
    }
  }
  if (bc) bcCheckContinuity(root, st, adapter);

  // The "end" sync marker is the ONE coverage cutoff for every channel: it was flashed on
  // screen while video and network were both capturing, and the drain above carried it into
  // the DOM evidence — but only trust it once the marker frame is actually persisted.
  const segCut = st.segments.find((s) => s.id === st.currentSegmentId);
  const cursorAtCutoff = segCut ? segCut.cursor : null;
  const endConfirmed = !!segCut && endMarkPersisted(dir, st, segCut.id);

  // ---- stop capture (backend-specific): both stops are aligned back to back on the
  // cutoff, network first so no network evidence outlives the video it must agree with ----
  let networkStatus = "missing";
  let videoCompleteness;
  let harScratch = null;
  if (bc) {
    const videoFile = path.join(partial, "video.webm");
    const stop = adapter.recordStop(videoFile);
    const videoSize = fs.existsSync(videoFile) ? fs.statSync(videoFile).size : 0;
    // consume the CDP sidecar for an honest completeness verdict, then drop it — only
    // video.webm belongs in the package. A missing or unparseable sidecar is NOT proof of
    // zero drops: without a trustworthy count the verdict degrades to partial.
    let dropped = null;
    const sidecarText = readContainedText(partial, "video.webm.json");
    if (sidecarText !== null) {
      try {
        const s = JSON.parse(sidecarText);
        if (Number.isFinite(Number(s.droppedFrameCount))) dropped = Number(s.droppedFrameCount);
      } catch {}
      try { fs.unlinkSync(path.join(partial, "video.webm.json")); } catch {}
    }
    videoCompleteness = (stop.ok && videoSize > 0) ? (dropped === 0 ? "complete" : "partial") : (videoSize > 0 ? "partial" : "missing");
  } else {
    // the raw capture lands in a freshly created private temporary directory, never in a
    // repository-controlled path — a pre-placed link at the package path cannot redirect it.
    // realpath: the contained-leaf read at sanitization resolves symlinks too, and the
    // system temp root is itself a link on some platforms (macOS /var -> /private/var) — an
    // unresolved scratch path would fail containment and the capture would never be
    // sanitized. The scratch is registered for removal on any exit path the moment it exists.
    harScratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-netstop-")));
    registerExitCleanup(() => { try { fs.rmSync(harScratch, { recursive: true, force: true }); } catch {} });
    adapter.netStop(path.join(harScratch, "network.raw.har"));
    const rs = adapter.recordStop();
    // final document probe AFTER recording stops — nothing the video captured from here on
    // can be finalized without matching DOM evidence
    const segF = st.segments.find((s) => s.id === st.currentSegmentId);
    const bootFinal = probeBootId(adapter);
    if (segF && segF.bootId && bootFinal !== segF.bootId) {
      handleDocChange(root, st, adapter, bootFinal);
      drainSegment(root, st, adapter);
    }
    const videoFile = path.join(partial, "video.webm");
    const videoSize = fs.existsSync(videoFile) ? fs.statSync(videoFile).size : 0;
    videoCompleteness = rs.ok && videoSize > 0 ? "complete" : (videoSize > 0 ? "partial" : "missing");
  }

  // Quiet-window confirmation: one more drain AFTER the captures stopped. Anything it picks
  // up on the cutoff segment happened inside the stop window — past the cutoff, with no
  // provable coverage on the stopped captures. The frames stay in the evidence (the DOM
  // timeline ends with everything the recorder saw), but every channel the window touches
  // degrades to partial and the window is named in a gap. A cutoff marker that never landed
  // in the evidence is the same admission: coverage through the cutoff cannot be proven.
  const tail = drainSegment(root, st, adapter);
  if (bc) bcCheckContinuity(root, st, adapter);
  const segNow = st.segments.find((s) => s.id === st.currentSegmentId);
  const tailAdvanced = tail !== null && segNow === segCut && segNow && cursorAtCutoff !== null && segNow.cursor !== cursorAtCutoff;
  const stopTail = tailAdvanced || !endConfirmed;
  if (stopTail) {
    st.gaps.push({ segmentId: st.currentSegmentId, reason: "stop-tail", droppedFrames: null });
    if (videoCompleteness === "complete") videoCompleteness = "partial";
  }
  // browser-control recording is already stopped; a DOM change from here on cannot be paired
  // with recorded video, so the DOM is finalized as-is (no post-recording segment for bc)
  finalizeOldSegment(root, st, "stop");

  // ---- assemble dom.json from JSONL segments (dedupe by (segment, frameIndex)) ----
  const domSegments = [];
  for (const seg of st.segments) {
    const byIndex = new Map();
    let bootWall = null, truncatedFrames = 0, badLines = 0;
    // no-follow read: a symlinked frame log is skipped, never read through
    const framesText = readContainedText(partial, `frames-${seg.id}.jsonl`);
    if (framesText !== null) {
      for (const line of framesText.split("\n")) {
        if (!line.trim()) continue;
        let f; try { f = JSON.parse(line); } catch { badLines++; continue; }
        if (!byIndex.has(f.i)) byIndex.set(f.i, f);
        if (f.truncated) truncatedFrames++;
        if (f.kind === "sync" && f.data && f.data.id === "boot" && f.data.wallTimeMs) bootWall = f.data.wallTimeMs;
      }
    }
    if (truncatedFrames > 0) st.gaps.push({ segmentId: seg.id, reason: "truncation", droppedFrames: truncatedFrames });
    if (badLines > 0) st.gaps.push({ segmentId: seg.id, reason: "runner-error", droppedFrames: badLines });
    domSegments.push({
      id: seg.id,
      bootId: seg.bootId,
      url: seg.url,
      bootWallTimeMs: bootWall,
      endedWallTimeMs: seg.endedWallTimeMs,
      complete: !!seg.complete,
      endReason: seg.endReason || (seg.complete ? "stop" : "navigation-tail"),
      frames: [...byIndex.values()].sort((a, b) => a.i - b.i),
    });
  }

  // ---- sync anchors + confidence ----
  let confidence, method, clockSkewMs = null, anchors = [], calibration = null;
  if (bc) {
    // browser-control rounds are video-primary: the backend's start timestamps are not
    // trustworthy DOM anchors, so the DOM rail is rendered approximate and never claims
    // frame-accurate sync. Operator comments still ride video currentTime.
    confidence = "low"; method = "unavailable";
  } else {
    const cal = readCalibration(dir);
    // publish the calibration's age, not just its offset: a stale calibration must be
    // visible in the package, never implied
    if (cal) {
      const calAt = Date.parse(typeof cal.calibratedAt === "string" ? cal.calibratedAt : "");
      calibration = {
        offsetMs: cal.offsetMs,
        jitterMs: typeof cal.jitterMs === "number" ? cal.jitterMs : null,
        calibratedAt: cal.calibratedAt || null,
        ageMs: Number.isFinite(calAt) ? Math.max(0, Date.now() - calAt) : null,
      };
    }
    // a crashed start never persisted recordStartWallAfter — without it there is no honest
    // videoTimeMs, so fabricate no anchors and mark sync unavailable below
    const recStartOk = Number.isFinite(st.recordStartWallAfter);
    if (recStartOk) {
      for (const ds of domSegments) {
        for (const f of ds.frames) {
          if (f.kind !== "sync" || !f.data || !f.data.wallTimeMs) continue;
          if (f.data.id !== "start" && f.data.id !== "end") continue;
          anchors.push({
            id: f.data.id,
            videoTimeMs: cal ? Math.max(0, f.data.wallTimeMs - st.recordStartWallAfter - cal.offsetMs) : null,
            wallTimeMs: f.data.wallTimeMs,
            segmentId: ds.id,
            frameIndex: f.i,
          });
        }
      }
    }
    const aStart = anchors.find((a) => a.id === "start");
    const aEnd = anchors.find((a) => a.id === "end");
    if (aStart && aEnd) {
      const segStart = domSegments.find((s) => s.id === aStart.segmentId);
      const segEnd = domSegments.find((s) => s.id === aEnd.segmentId);
      if (segStart && segEnd && segStart.id === segEnd.id) {
        const fStart = segStart.frames.find((f) => f.i === aStart.frameIndex);
        const fEnd = segEnd.frames.find((f) => f.i === aEnd.frameIndex);
        if (fStart && fEnd) {
          // both sides of this difference are clocks of the same recorder page — it never
          // touches the video. It is published as clock skew, not as an alignment measure.
          clockSkewMs = Math.abs((aEnd.wallTimeMs - aStart.wallTimeMs) - (fEnd.t - fStart.t));
        }
      }
    }
    const sawHidden = domSegments.some((s) => s.frames.some((f) => f.kind === "lifecycle" && f.data && f.data.event === "visibilitychange" && f.data.state === "hidden"));
    const anchorsOk = !!(aStart && aEnd && aStart.videoTimeMs != null && aEnd.videoTimeMs != null);
    // a calibration recorded under a different agent-browser version is suspect: use the
    // offset, but never let confidence exceed low
    const calSuspect = !!cal && cal.agentBrowser !== abVersion();
    if (!recStartOk) { confidence = "unavailable"; method = "unavailable"; }
    else if (!cal) { confidence = "low"; method = "unavailable"; }
    else if (!anchorsOk) { confidence = "low"; method = "calibrated-wall"; }
    else if (clockSkewMs == null || clockSkewMs > CLOCK_SKEW_GATE_MS) { confidence = "low"; method = "calibrated-wall"; }
    else if (sawHidden) { confidence = "low"; method = "calibrated-wall"; }
    // a stored wall-clock offset measured in a separate session is the only DOM-to-video
    // mapping here — nothing in this round re-anchors it to the video, so "medium" is the
    // ceiling. "high" is reserved for a round-scoped video-anchored measurement.
    else { confidence = "medium"; method = "calibrated-wall"; }
    if (confidence === "medium" && calSuspect) confidence = "low";
  }

  // ---- HAR sanitize (agent-browser only; raw capture never enters the package) ----
  if (!bc) {
    // the capture was stopped into the private scratch at capture-stop time, next to the
    // video stop; here it is only read, sanitized, and promoted
    try {
      const rawText = readContainedText(harScratch, "network.raw.har");
      if (rawText !== null) {
        try {
          const har = JSON.parse(rawText);
          sanitizeHar(har);
          atomicWriteJson(path.join(partial, "network.har"), har);
          networkStatus = "complete";
        } catch { networkStatus = "partial"; }
      }
      // a stray raw capture (or a pre-placed link at its name) never survives finalization —
      // and the deletion is verified: a raw file that cannot be removed is reported, and the
      // network evidence is no longer claimed clean
      const strayRaw = path.join(partial, "network.raw.har");
      let rawLeft = false;
      try { fs.unlinkSync(strayRaw); } catch (e) { if (e && e.code !== "ENOENT") rawLeft = true; }
      if (!rawLeft) {
        try { fs.lstatSync(strayRaw); rawLeft = true; } catch (e) { if (!e || e.code !== "ENOENT") rawLeft = true; }
      }
      if (rawLeft) {
        networkStatus = "partial";
        process.stderr.write("round: warning: a raw network capture remains in the package — remove network.raw.har by hand before sharing the round\n");
      }
    } finally {
      try { fs.rmSync(harScratch, { recursive: true, force: true }); } catch {}
    }
    // a stop window that was not quiet trailed the video tail with network activity too:
    // the HAR cannot be proven complete through the video's end
    if (stopTail && networkStatus === "complete") networkStatus = "partial";
  }

  // ---- versions + meta ----
  const versions = bc
    ? { skill: SKILL_VERSION, recorder: RECORDER_VERSION, node: process.versions.node, backend: "browser-control", ...adapter.versions() }
    : st.versions;
  const meta = {
    schemaVersion: bc ? 2 : 1,
    roundId: st.roundId,
    startedAt: st.startedAt,
    endedAt: nowIso(),
    summary: summary || "(no summary)",
    startUrl: st.startUrl,
    git: st.git || null,
    viewport: st.viewport || null,
    versions,
    sync: { confidence, method, clockSkewMs, calibration, anchors },
    completeness: {
      video: videoCompleteness,
      dom: st.gaps.length ? "partial" : "complete",
      network: networkStatus,
      gaps: st.gaps,
    },
  };
  atomicWriteJson(path.join(partial, "meta.json"), meta);
  // dom.json frames are unchanged across backends — only meta.json carries the schema bump
  atomicWriteJson(path.join(partial, "dom.json"), { schemaVersion: 1, roundId: st.roundId, segments: domSegments });
  atomicWriteJson(path.join(partial, "comments.json"), { schemaVersion: 1, roundId: st.roundId, reviewState: "open", submittedAt: null, comments: [] });
  atomicWriteJson(path.join(partial, "resolutions.json"), { schemaVersion: 1, roundId: st.roundId, items: {} });
  const commentImages = path.join(partial, "comment-images");
  rejectSymlinkLeaf(commentImages); // same leaf guard as every other package creation
  fs.mkdirSync(commentImages, { recursive: true });

  // validate everything parses, then promote atomically
  for (const f of ["meta.json", "dom.json", "comments.json", "resolutions.json"]) {
    JSON.parse(fs.readFileSync(path.join(partial, f), "utf8"));
  }
  const finalDir = path.join(dir, st.roundId);
  fs.rmSync(finalDir, { recursive: true, force: true });
  fs.renameSync(partial, finalDir);
  const dropFrameLogs = () => {
    // evidence is safely inside dom.json now — drop the raw frame logs (a crash before this
    // point leaves them behind, which is the fail-safe direction)
    for (const seg of st.segments) {
      try { fs.unlinkSync(path.join(finalDir, `frames-${seg.id}.jsonl`)); } catch {}
    }
  };
  let sessionLeaked = false;
  if (bc) {
    // release the exclusive session AFTER the package is safely promoted; if the release fails,
    // keep the marker (phase "teardown-failed") so the leaked session is recoverable via abort
    dropFrameLogs();
    const t = adapter.teardown({ crashed: false });
    if (t && t.sessionReleased === false) {
      sessionLeaked = true;
      st.phase = "teardown-failed";
      saveActive(dir, st);
      process.stderr.write("round: warning: the browser-control session could not be released — run 'round.mjs abort' to release it\n");
    } else {
      fs.rmSync(path.join(dir, ".active.json"), { force: true });
    }
  } else {
    // The round does not outlive itself: the package is promoted, so the shared session it
    // recorded in goes back. Ownership was proven by the lock check at the top of stop, and
    // the release runs BEFORE the lock is released — a lock freed first could be taken by
    // another project mid-close. Optional work first, in a try; the marker removal and the
    // lock release sit in the finally, so a session that will not close cannot strand either.
    let notes = [];
    try {
      notes = releaseSharedSession();
    } finally {
      fs.rmSync(path.join(dir, ".active.json"), { force: true });
      dropFrameLogs();
      releaseMachineLock(root, st.roundId);
    }
    reportTerminationNotes(notes);
  }

  console.log(`round recorded: ${st.roundId}${bc ? " (browser-control)" : ""}${sessionLeaked ? " — session release failed, run 'round.mjs abort'" : ""}`);
  console.log(`sync: ${confidence} (${method}, clock skew ${clockSkewMs == null ? "n/a" : clockSkewMs + "ms"})`);
  console.log(`review: node "${path.join(SKILL_DIR, "scripts", "server.mjs")}" open --project "$PWD"`);
}

function cmdAbort() {
  const root = findProjectRoot();
  // abort is the escape hatch, so it takes the artifact directory in non-fatal mode: a
  // poisoned root warns and yields the lexical path instead of blocking the one command
  // whose job is to escape a poisoned state.
  const dir = arDir(root, { create: false, fatal: false });
  let rootPoisoned = false;
  if (dir) {
    let dl = null;
    try { dl = fs.lstatSync(dir); } catch {}
    rootPoisoned = !dl || dl.isSymbolicLink() || !dl.isDirectory();
  }
  // a poisoned root is never read or written through — the marker path is only built on a
  // verified directory
  const marker = dir && !rootPoisoned ? path.join(dir, ".active.json") : null;
  // lstat, not existsSync: a dangling symlink marker must be visible here — existsSync follows
  // the link and would report "no active round" while start keeps failing on EEXIST
  let markerLst = null;
  if (marker) {
    try { markerLst = fs.lstatSync(marker); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  }
  if (!markerLst) {
    // With a poisoned artifact root, "no readable marker" proves nothing about the
    // machine-wide lock — and refusing here would strand EVERY project on the machine
    // behind a lock this project owns. Release on the lock's own proof of ownership.
    const lock = rootPoisoned ? readMachineLock() : null;
    const ownsLock = !!lock && lock.project === root && typeof lock.roundId === "string" && ROUND_RE.test(lock.roundId);
    if (ownsLock) {
      reportTerminationNotes(terminateRound(root, { markerPath: null, machineLockRoundId: lock.roundId }));
      console.log("no readable round marker; stopped the shared capture and released the machine-wide round lock this project holds");
      return;
    }
    die("no active round");
  }

  // a marker that cannot be parsed or validated must still be recoverable — otherwise the
  // "run abort" advice in loadActive would loop. Clear it locally, and stop the shared
  // capture only when the machine lock independently names this project.
  let st = null;
  let problem = null;
  try {
    if (markerLst.isSymbolicLink()) problem = "the marker is a symlink";
    else st = JSON.parse(fs.readFileSync(marker, "utf8"));
  } catch { problem = "the marker is not valid JSON"; }
  if (!problem) problem = activeStateProblem(st);
  if (problem) {
    // an unreadable marker may still name a live browser-control session: when the round id
    // has a valid shape, recompute the session id from it (never trust the stored session
    // field) and tear the session down before the marker goes away. A marker carrying any
    // browser-control-only field is treated as a browser-control round even when its declared
    // backend says otherwise — a flipped backend field must not spare the session it names.
    const recoverableBc = st && typeof st.roundId === "string" && ROUND_RE.test(st.roundId)
      && (st.backend === "browser-control" || BC_ONLY_STATE_FIELDS.some((f) => st[f] !== undefined));
    const lock = readMachineLock();
    // the marker may be a directory or a dangling link, not just a file — termination
    // removes whatever it is, and nothing it finds can block that removal
    const ownsLock = !!lock && lock.project === root && typeof lock.roundId === "string" && ROUND_RE.test(lock.roundId);
    reportTerminationNotes(terminateRound(root, {
      markerPath: marker,
      machineLockRoundId: ownsLock ? lock.roundId : null,
      releaseSession: recoverableBc
        ? () => { makeBcAdapter({ redact: [], sid: bcSessionId(st.roundId), recordingMode: "cdp" }).teardown({ crashed: true }); return null; }
        : null,
    }));
    console.log(ownsLock
      ? `cleared an unreadable .active.json (${problem}); stopped the shared capture this project holds`
      : `cleared an unreadable .active.json (${problem}); no machine lock names this project — left any shared capture untouched`);
    return;
  }

  if (st.backend === "browser-control") {
    // best-effort recovery: cancel any recording, release the session (a relay that
    // restarted and forgot the session makes delete a no-op success). The bc journal and any
    // adopted-tab attachment may persist until the relay is restarted.
    const adapter = resolveAdapter(st);
    reportTerminationNotes(terminateRound(root, {
      markerPath: marker,
      releaseSession: () => {
        const t = adapter.teardown({ crashed: true });
        return t && t.sessionReleased === false ? "the browser-control session may still exist — check 'browser-control status'" : null;
      },
    }));
    console.log(`aborted; partial package kept at .agent-review/${st.partialDir} (not shown in library)`);
    return;
  }

  // agent-browser: the shared recorder is stopped only when the lock proves this round owns
  // it. A lock naming this project but a DIFFERENT round is cleaned up explicitly, not left
  // as an ordinary stale lock: the capture that other round started may still be live, so it
  // is stopped best-effort — but the lock itself is kept, since it belongs to the round it
  // names (which may be mid-start). Termination never consults the partial package, so its
  // state (missing, a link, a regular file, poisoned contents) can make no difference to the
  // cleanup.
  const lock = readMachineLock();
  const ownsLock = !!lock && lock.project === root && lock.roundId === st.roundId;
  const otherRoundLock = !!lock && lock.project === root && !ownsLock;
  reportTerminationNotes(terminateRound(root, {
    markerPath: marker,
    machineLockRoundId: ownsLock ? st.roundId : null,
    stopCapture: otherRoundLock,
  }));
  const partialGone = !partialPath(dir, st, { fatal: false });
  if (ownsLock) {
    console.log(partialGone
      ? `aborted; the partial package was already gone or unusable — the round is cleared`
      : `aborted; partial package kept at .agent-review/${st.partialDir} (not shown in library)`);
  } else if (otherRoundLock) {
    console.log(`cleared the local round marker; the machine lock names another round of this project — stopped any shared capture it left running and kept the lock for that round; partial package kept at .agent-review/${st.partialDir}`);
  } else {
    console.log(`cleared the local round marker; the shared browser capture belongs to another project — left it running; partial package kept at .agent-review/${st.partialDir}`);
  }
}

function cmdPending(args) {
  const root = findProjectRoot();
  const dir = arDir(root, { create: false });
  const json = args.includes("--json");
  const out = [];
  if (dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.startsWith(".") ) continue;
      const rd = containedDir(dir, name);
      if (!rd) continue;
      try {
        const comments = readContainedJson(rd, "comments.json");
        if (!comments || comments.reviewState !== "submitted") continue;
        const res = readContainedJson(rd, "resolutions.json");
        const meta = readContainedJson(rd, "meta.json");
        if (!res || !meta) continue;
        for (const c of comments.comments || []) {
          // the comment id comes from file content and reaches a filesystem path — only a
          // canonical id may be joined
          if (!c || typeof c.id !== "string" || !COMMENT_ID_RE.test(c.id)) continue;
          // A resolution only takes a comment off the queue while it still holds. One whose
          // round was deleted, or which never supported the claim, comes back as work.
          const item = res.items && res.items[c.id];
          const stale = item ? resolutionProblem({
            feedbackRoundId: name, comments, comment: c, inRoundId: item.resolvedInRoundId,
            ...resolvingRound(dir, item.resolvedInRoundId),
          }) : null;
          if (item && !stale) continue;
          // no-follow: a symlinked image is reported as absent, never as a path to read
          const img = containedFile(path.join(rd, "comment-images"), `${c.id}.jpg`);
          out.push({
            roundId: name,
            summary: meta.summary || null,
            commentId: c.id,
            videoTimeMs: c.videoTimeMs,
            text: c.text,
            createdAt: c.createdAt,
            image: img,
            brokenResolution: stale,
          });
        }
      } catch { /* ignore malformed rounds */ }
    }
  }
  if (json) console.log(JSON.stringify(out, null, 2));
  else {
    if (!out.length) console.log("no pending feedback");
    for (const c of out) console.log(`[${c.roundId}] ${Math.round(c.videoTimeMs / 1000)}s — ${c.text}\n  image: ${c.image || "(none)"}  id: ${c.commentId}${c.brokenResolution ? `\n  a resolution was recorded and no longer holds: ${c.brokenResolution}` : ""}`);
  }
}

// ---------- resolution evidence ----------

// The evidence channels a resolution rests on. A resolution asserts that a round SHOWS the
// behaviour a comment asked for, so the video the operator watches and the DOM rail that
// indexes it must both exist. `network` is deliberately absent: a browser-control round
// declares it "missing" by design, and no resolution claim is made about traffic. Add a
// channel here when a resolution starts asserting something that channel is the evidence for.
const RESOLUTION_EVIDENCE_CHANNELS = ["video", "dom"];

// The artifacts a resolving round must still carry, re-checked on every read rather than only
// when the resolution is written: video.webm is the largest file in a package and the first
// thing reclaimed when someone frees disk space, so a round can lose the evidence long after
// the claim was recorded.
const RESOLUTION_ARTIFACTS = ["meta.json", "dom.json", "video.webm"];

function isoMs(v) {
  if (typeof v !== "string") return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

// The single definition of "this resolution holds", run both where a resolution is written and
// where the library derives status from it — a claim cannot be accepted on one side and read as
// authoritative on the other, and a claim that stops being true stops reading as addressed.
// `meta` is the resolving round's parsed meta.json, or null when it cannot be read (deleted
// round, unparseable file, symlinked leaf); `missingArtifacts` names the RESOLUTION_ARTIFACTS
// that are no longer readable in it. Returns the reason it does not hold, or null.
//
// A channel reading "partial" is accepted. `partial` is what a round reports whenever coverage
// through its cutoff cannot be PROVEN, which a navigation tail alone is enough to produce, so
// demanding "complete" everywhere would reject most honestly-recorded rounds and push agents
// off resolve entirely. `missing` is refused: the artifact never landed, and evidence that does
// not exist cannot show anything.
function resolutionProblem({ feedbackRoundId, comments, comment, inRoundId, meta, missingArtifacts }) {
  if (typeof inRoundId !== "string" || !ROUND_RE.test(inRoundId)) return `resolution names ${JSON.stringify(inRoundId ?? null)}, which is not a round id`;
  // A well-formed feedback round always started before the feedback on it was submitted, so the
  // ordering rule below refuses this case too — but it would report "recorded before the
  // feedback" where the real answer is that a round cannot show its own fix. Kept for the
  // diagnosis, and as the guard that still stands if a package's own timestamps are doctored.
  if (inRoundId === feedbackRoundId) return `round ${inRoundId} is the round the feedback was left on — a round cannot be its own fix`;
  if (missingArtifacts && missingArtifacts.length) return `resolving round ${inRoundId} is missing ${missingArtifacts.join(", ")} — not a complete round`;
  if (!meta || typeof meta !== "object") return `resolving round ${inRoundId} has no readable meta.json — nothing proves what it shows`;
  const startedAt = isoMs(meta.startedAt);
  const endedAt = isoMs(meta.endedAt);
  if (startedAt === null || endedAt === null) return `resolving round ${inRoundId} does not carry readable start and end times`;
  if (endedAt < startedAt) return `resolving round ${inRoundId} reports ending before it started`;
  const spokenAt = isoMs(comments && comments.submittedAt) ?? isoMs(comment && comment.createdAt);
  if (spokenAt === null) return `feedback round ${feedbackRoundId} carries no readable submission time to order the fix against`;
  if (startedAt <= spokenAt) return `resolving round ${inRoundId} was recorded before the feedback it answers`;
  const completeness = meta.completeness;
  if (!completeness || typeof completeness !== "object") return `resolving round ${inRoundId} declares no evidence completeness`;
  for (const ch of RESOLUTION_EVIDENCE_CHANNELS) {
    const declared = completeness[ch];
    if (declared !== "complete" && declared !== "partial") {
      return `resolving round ${inRoundId} has no ${ch} evidence (completeness.${ch} is ${JSON.stringify(declared ?? null)})`;
    }
  }
  return null;
}

// What a resolving round still holds, read through the same containment rules as every other
// package read. Absent, symlinked, and unparseable all surface as an absent artifact or a null
// meta, both of which resolutionProblem refuses.
function resolvingRound(dir, inRoundId) {
  const ri = typeof inRoundId === "string" && ROUND_RE.test(inRoundId) ? containedDir(dir, inRoundId) : null;
  const missingArtifacts = RESOLUTION_ARTIFACTS.filter((f) => !ri || !containedFile(ri, f));
  return { meta: ri ? readContainedJson(ri, "meta.json") : null, missingArtifacts };
}

function cmdResolve(args) {
  const feedbackRound = getFlag(args, "--feedback-round");
  const commentId = getFlag(args, "--comment");
  const inRound = getFlag(args, "--in-round");
  if (!feedbackRound || !commentId || !inRound) die("resolve requires --feedback-round, --comment, --in-round");
  if (!ROUND_RE.test(feedbackRound) || !ROUND_RE.test(inRound)) die("invalid round id shape");
  if (!COMMENT_ID_RE.test(commentId)) die("invalid comment id shape");
  const root = findProjectRoot();
  const dir = arDir(root, { create: false });
  const rd = dir ? containedDir(dir, feedbackRound) : null;
  if (!rd) die(`no such feedback round: ${feedbackRound}`);
  const comments = readContainedJson(rd, "comments.json");
  if (!comments) die(`feedback round ${feedbackRound} has no readable comments.json`);
  if (comments.reviewState !== "submitted") die(`feedback round ${feedbackRound} is not submitted yet — nothing to resolve`);
  const comment = (comments.comments || []).find((c) => c && c.id === commentId);
  if (!comment) die(`no such comment: ${commentId}`);
  const problem = resolutionProblem({
    feedbackRoundId: feedbackRound, comments, comment, inRoundId: inRound,
    ...resolvingRound(dir, inRound),
  });
  if (problem) die(problem);
  const res = readContainedJson(rd, "resolutions.json");
  if (!res) die(`feedback round ${feedbackRound} has no readable resolutions.json`);
  res.items[commentId] = { resolvedInRoundId: inRound, resolvedAt: nowIso() };
  atomicWriteJson(path.join(rd, "resolutions.json"), res);
  console.log(`resolved ${commentId} in round ${inRound}`);
}

// ---------- HAR sanitization ----------

// header-name rules are runner-local: the recorder never sees network headers. The NAME
// pattern is built from the recorder's own credential token list (same boundary rule as
// field and URL-parameter names) so header rules can never drift from the page-side policy.
const HAR_SECRET_HEADERS = new Set(["cookie", "set-cookie", "authorization", "proxy-authorization", "x-api-key"]);
const HAR_SECRET_NAME = new RegExp(`(^|[-_])(${REDACTION.nameTokens.join("|")})([-_\\d]|$)`, "i");

function sanitizeHar(har) {
  const entries = har && har.log && har.log.entries;
  // a malformed envelope is a failure, not a no-op: returning silently would let an
  // unsanitized capture be promoted under the sanitized name, raw secrets included
  if (!Array.isArray(entries)) throw new Error("malformed HAR: missing log.entries");
  for (const e of entries) {
    for (const side of ["request", "response"]) {
      const msg = e[side];
      if (!msg) continue;
      if (Array.isArray(msg.headers)) {
        for (const h of msg.headers) {
          if (!h) continue;
          const hn = String(h.name || "").toLowerCase();
          if (HAR_SECRET_HEADERS.has(hn) || HAR_SECRET_NAME.test(hn)) h.value = "[redacted]";
          else if (hn === "referer" || hn === "referrer" || hn === "location") h.value = redactUrl(h.value);
        }
      }
      if (Array.isArray(msg.cookies)) {
        for (const c of msg.cookies) c.value = "[redacted]";
      }
    }
    if (e.request) {
      if (e.request.url) e.request.url = redactUrl(e.request.url);
      if (Array.isArray(e.request.queryString)) {
        for (const q of e.request.queryString) {
          if (q && REDACTION.isSensitiveParam(q.name || "")) q.value = "[redacted]";
        }
      }
      // bodies can carry tokens/customer data — bodies are never review evidence; drop them
      delete e.request.postData;
    }
    if (e.response && e.response.content && typeof e.response.content.text === "string") {
      delete e.response.content.text;
    }
    if (e.response && typeof e.response.redirectURL === "string" && e.response.redirectURL) {
      e.response.redirectURL = redactUrl(e.response.redirectURL);
    }
  }
}

// ---------- calibration (agent-assisted) ----------

const CLOCK_PAGE = "data:text/html," + encodeURIComponent(`<!doctype html><body style="margin:0;background:#101018;display:flex;align-items:center;justify-content:center;height:100vh">
<div id="c" style="color:#fff;font:700 40vw system-ui;letter-spacing:.02em">0</div>
<script>let n=0; setInterval(()=>{ n=(n+1)%10; document.getElementById('c').textContent=n; }, 100);</script></body>`);

function cmdCalibrate(args) {
  const offset = getFlag(args, "--offset");
  if (offset != null) {
    const jitter = parseInt(getFlag(args, "--jitter") || "150", 10);
    const root = findProjectRoot();
    const dir = arDir(root);
    atomicWriteJson(path.join(dir, ".calibration.json"), {
      schemaVersion: 1, offsetMs: parseInt(offset, 10), jitterMs: jitter,
      calibratedAt: nowIso(), agentBrowser: abVersion(),
    });
    console.log(`calibration saved: offset ${offset}ms ±${jitter}ms`);
    return;
  }
  // step 1: record the built-in clock page and build a contact sheet for the agent to read
  const root = findProjectRoot();
  const dir = arDir(root);
  const clip = path.join(dir, ".calibration.webm");
  if (loadActive(dir)) die("a round is active — stop/abort it before calibrating");
  rejectSymlinkLeaf(clip); // written by the external recorder
  const wallBefore = Date.now();
  // same shape as a round: park on a neutral page, start capture, and only then open the page
  // being measured — both so the clip cannot open on unrelated content, and so the interval
  // this measures is the one a round has between its record start and its first navigation
  ab(["open", NEUTRAL_RECORDING_PAGE]);
  ab(["record", "start", clip]);
  const wallAfter = Date.now();
  ab(["open", CLOCK_PAGE]);
  sleepMs(2500);
  ab(["record", "stop"], { allowFail: true });
  const sheet = path.join(dir, ".calibration-sheet.jpg");
  rejectSymlinkLeaf(sheet); // written by ffmpeg
  const ff = spawnSync("ffmpeg", ["-y", "-ss", "0", "-i", clip, "-frames:v", "12", "-vf", "fps=4,scale=320:-1,tile=4x3", sheet], { encoding: "utf8" });
  if (ff.status !== 0) {
    console.log(`recorded clip at ${clip}, but ffmpeg is unavailable — read the video directly.`);
  }
  console.log(`record-start wall interval: ${wallBefore}..${wallAfter}`);
  console.log(`contact sheet: ${fs.existsSync(sheet) ? sheet : "(ffmpeg missing)"}`);
  console.log(`Read the sheet: find the FIRST tile (left-to-right, top-to-bottom) showing digit N>0.`);
  console.log(`Tiles are 250ms apart; tile 1 ≈ video time 0ms. digit K appears at wall-clock ≈ page boot + K*100ms.`);
  console.log(`Then save: round.mjs calibrate --offset <ms> --jitter <ms>`);
}

function readCalibration(dir) {
  // no-follow read: a symlinked calibration file is treated as absent, never read through
  const text = readContainedText(dir, ".calibration.json");
  if (text === null) return null;
  try {
    const c = JSON.parse(text);
    return typeof c.offsetMs === "number" ? c : null;
  } catch { return null; }
}

// ---------- arg plumbing ----------

function getFlag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
}

function main() {
  const runtimeProblem = nodeVersionProblem();
  if (runtimeProblem) die(runtimeProblem);
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "start": return cmdStart(rest);
    case "run": return cmdRun(rest);
    case "stop": return cmdStop(rest);
    case "abort": return cmdAbort();
    case "pending": return cmdPending(rest);
    case "resolve": return cmdResolve(rest);
    case "calibrate": return cmdCalibrate(rest);
    default:
      die(`usage: round.mjs <start|run|stop|abort|pending|resolve|calibrate>`, 2);
  }
}

export { sanitizeHar, redactUrl, drainSegment, bcReject, bcSessionId, bcChunkValid, activeStateProblem, atomicWriteJson, actionTarget, HAR_SECRET_NAME, resolutionProblem, RESOLUTION_ARTIFACTS, nodeVersionProblem, MIN_NODE_MAJOR, abVersionProblem, gitInfo };

const isDirectRun = process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
