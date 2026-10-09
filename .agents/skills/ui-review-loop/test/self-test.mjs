#!/usr/bin/env node
/* UI Review Loop — self-test. Builds a fixture project, starts the server against it, and
 * asserts the read/write contract: package reads, video Range behavior, the comment
 * transaction, the submission lock, and path/token hardening — plus round.mjs unit checks
 * (HAR sanitization) and CLI checks (pending robustness, stale-pid stop). Exits non-zero
 * on any failure.
 */
"use strict";

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import crypto from "node:crypto";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sanitizeHar, redactUrl, drainSegment, bcReject, bcSessionId, bcChunkValid, activeStateProblem, atomicWriteJson, actionTarget, HAR_SECRET_NAME, nodeVersionProblem, abVersionProblem, gitInfo } from "../scripts/round.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, "..", "scripts", "server.mjs");

const ROUND_ID = "20260717T120000Z-abc123";
// real decodable 4x4 JPEG (server validates JPEG SOI/EOI magic bytes)
const JPEG_B64 = "/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYyLjI4LjEwMQD/2wBDAAgEBAQEBAUFBQUFBQYGBgYGBgYGBgYGBgYHBwcICAgHBwcGBgcHCAgICAkJCQgICAgJCQoKCgwMCwsODg4RERT/xABLAAEBAAAAAAAAAAAAAAAAAAAABwEBAAAAAAAAAAAAAAAAAAAAABABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/AABEIAAQABAMBIgACEQADEQD/2gAMAwEAAhEDEQA/AL+AD//Z";

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
}

function buildFixture(root) {
  const rd = path.join(root, ".agent-review", ROUND_ID);
  fs.mkdirSync(path.join(rd, "comment-images"), { recursive: true });
  fs.writeFileSync(path.join(root, ".agent-review", ".gitignore"), "*\n");
  fs.writeFileSync(path.join(rd, "video.webm"), Buffer.alloc(10000, 7));
  fs.writeFileSync(path.join(rd, "meta.json"), JSON.stringify({
    schemaVersion: 1, roundId: ROUND_ID, startedAt: "2026-07-17T12:00:00.000Z", endedAt: "2026-07-17T12:01:00.000Z",
    summary: "fixture", startUrl: "http://localhost/", git: null, viewport: { width: 1280, height: 720, dpr: 1 },
    versions: { skill: "1.0.0", recorder: "1", agentBrowser: "test", node: process.versions.node },
    sync: { confidence: "high", method: "calibrated-wall", residualMs: 10, anchors: [] },
    completeness: { video: "complete", dom: "complete", network: "missing", gaps: [] },
  }));
  fs.writeFileSync(path.join(rd, "dom.json"), JSON.stringify({ schemaVersion: 1, roundId: ROUND_ID, segments: [] }));
  fs.writeFileSync(path.join(rd, "comments.json"), JSON.stringify({ schemaVersion: 1, roundId: ROUND_ID, reviewState: "open", submittedAt: null, comments: [] }));
  fs.writeFileSync(path.join(rd, "resolutions.json"), JSON.stringify({ schemaVersion: 1, roundId: ROUND_ID, items: {} }));
}

// A browser-control (schemaVersion 2) round, per formats.md v2. Used to prove the server/UI
// tolerate v1 and v2 packages side by side.
function buildV2Round(root, id) {
  const rd = path.join(root, ".agent-review", id);
  fs.mkdirSync(path.join(rd, "comment-images"), { recursive: true });
  fs.writeFileSync(path.join(rd, "video.webm"), Buffer.alloc(4096, 5));
  fs.writeFileSync(path.join(rd, "meta.json"), JSON.stringify({
    schemaVersion: 2, roundId: id, startedAt: "2026-07-17T99:00:00.000Z", endedAt: "2026-07-17T99:01:00.000Z",
    summary: "browser-control fixture", startUrl: "https://app.example.test/", git: null, viewport: { width: 1280, height: 800, dpr: 2 },
    versions: { skill: "1.0.0", recorder: "1", node: process.versions.node, backend: "browser-control", cli: "0.4.1", relayBuild: "b12a9f", extensionVersion: "0.4.1", recordingMode: "cdp", ffmpeg: true },
    sync: { confidence: "low", method: "unavailable", residualMs: null, anchors: [] },
    completeness: { video: "complete", dom: "complete", network: "missing", gaps: [] },
  }));
  fs.writeFileSync(path.join(rd, "dom.json"), JSON.stringify({ schemaVersion: 1, roundId: id, segments: [] }));
  fs.writeFileSync(path.join(rd, "comments.json"), JSON.stringify({ schemaVersion: 1, roundId: id, reviewState: "open", submittedAt: null, comments: [] }));
  fs.writeFileSync(path.join(rd, "resolutions.json"), JSON.stringify({ schemaVersion: 1, roundId: id, items: {} }));
}

const ROUND = path.join(__dirname, "..", "scripts", "round.mjs");
const RECORDER_JS = path.resolve(__dirname, "..", "assets", "recorder.js");

// A hermetic PATH-shim standing in for the browser-control CLI. It never runs a browser: it
// returns envelopes carrying the real relay-schema session summary, models a small frame buffer
// (markSync/markAction push frames, drainChunk drains them, confirmDrain retires them), records a
// stub webm + sidecar on STOP, and logs a call journal so teardown ordering can be asserted.
// Behavior is keyed by AR_BC_SHIM_SCENARIO (comma-separated tags), with per-invocation state in
// AR_BC_SHIM_STATE. No backticks / ${} in this source so it can ride String.raw unescaped.
const SHIM_SRC = String.raw`#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const RECONNECT = "Relay connection was lost and re-established; the session default page was re-resolved.";
const args = process.argv.slice(2);
const scenario = process.env.AR_BC_SHIM_SCENARIO || "happy";
const stateFile = process.env.AR_BC_SHIM_STATE;
const journalFile = process.env.AR_BC_SHIM_JOURNAL;
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch (e) { return {}; } }
function saveState(x) { try { fs.writeFileSync(stateFile, JSON.stringify(x)); } catch (e) {} }
function journal(line) { if (journalFile) { try { fs.appendFileSync(journalFile, line + "\n"); } catch (e) {} } }
function flag(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; }
function has(tag) { return scenario.split(",").indexOf(tag) >= 0; }
function printEnv(obj) { process.stdout.write(JSON.stringify(obj)); }
function mkFrame(i) { return { i: i, t: i, dt: 1, kind: "mutation", data: {}, nearbyEvent: null, mutations: [], values: {}, text: "" }; }
const sub = args[0];
const s = loadState();
if (sub === "--version") { process.stdout.write("0.4.1"); process.exit(0); }
if (sub === "status") {
  const target = { type: "page", id: "t-1", tabId: 7, browserControlSessionId: s.sid || null, owner: s.sid ? "relay" : "user", crashed: false, url: "https://app.example.test/dashboard" };
  printEnv({
    endpoint: "http://127.0.0.1:19989",
    relay: { running: true, version: "0.4.1", buildId: "b12a9f", stale: has("stale") },
    extension: { connected: !has("ext-down"), version: "0.4.1", activeTargets: 1 },
    currentSession: s.sid || null, sessions: [], targets: [target],
  });
  process.exit(0);
}
if (sub === "doctor") {
  printEnv({
    status: has("ext-version-mismatch") ? "warn" : "pass",
    extension: { connected: !has("ext-down"), version: "0.4.1", expectedVersion: has("ext-version-unknown") ? null : "0.4.1", versionMatches: has("ext-version-mismatch") ? false : (has("ext-version-unknown") ? null : true), error: null },
  });
  process.exit(0);
}
if (sub === "recording") {
  const verb = args[1];
  if (verb === "status") { if (has("rec-status-error")) { process.stderr.write("relay error"); process.exit(1); } printEnv({ isRecording: false }); process.exit(0); }
  if (verb === "start") {
    journal("recording-start");
    s.videoPath = args[2]; saveState(s);
    process.stdout.write("Recording started: " + args[2] + " tab=7 mode=cdp");
    process.exit(0);
  }
  if (verb === "stop") {
    journal("recording-stop");
    // the artifact only lands on STOP, so the nonempty-file check can genuinely fail
    if (!has("no-artifact") && s.videoPath) {
      try { fs.writeFileSync(s.videoPath, Buffer.alloc(2048, 9)); } catch (e) {}
      if (has("bad-sidecar")) { try { fs.writeFileSync(s.videoPath + ".json", "{ not json"); } catch (e) {} }
      else if (!has("no-sidecar")) {
        const meta = { mode: "cdp", droppedFrameCount: has("dropped") ? 3 : 0, frameCount: 100, durationMs: 4000 };
        try { fs.writeFileSync(s.videoPath + ".json", JSON.stringify(meta, null, 2) + "\n"); } catch (e) {}
      }
    }
    // a mutation landing while the recording tears down: buffered before the runner's final drain
    if (has("stop-tail")) {
      const ti = (s.nextI || 0); s.nextI = ti + 1; s.buf = s.buf || [];
      s.buf.push({ i: ti, t: ti, dt: 1, kind: "mutation", data: {}, nearbyEvent: null, mutations: [], values: {}, text: "" });
      saveState(s);
    }
    process.stdout.write("Recording saved"); process.exit(0);
  }
  if (verb === "cancel") { journal("recording-cancel"); process.stdout.write("Recording cancelled"); process.exit(0); }
  process.exit(0);
}
if (sub === "session") {
  const verb = args[1];
  if (verb === "new") { const id = args[2]; journal("session-new"); s.sid = id; s.boot = "boot-1-" + id; s.buf = []; s.nextI = 0; saveState(s); process.stdout.write(id); process.exit(0); }
  if (verb === "adopt") { journal("session-adopt"); s.adopted = true; saveState(s); process.stdout.write("Adopted session default page: https://app.example.test/dashboard"); process.exit(0); }
  if (verb === "delete") {
    const id = args[2]; journal("session-delete");
    if (has("session-gone")) { process.stderr.write("Session not found: " + id); process.exit(1); }
    if (has("delete-fail")) { process.stderr.write("relay error: session busy"); process.exit(1); }
    process.stdout.write(id); process.exit(0);
  }
  process.exit(0);
}
if (sub === "execute") {
  const sid = flag("--session");
  const code = args[args.length - 1];
  function sess() { return { id: sid, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", connected: true, pageUrl: "https://example.test/app", stateKeys: [], created: true }; }
  function env(value, text, warnings) { return { ok: true, isError: false, text: text || "", value: value, valueUnavailable: false, logs: [], warnings: warnings || [], session: sess() }; }
  function cursorOf() { const m = /"cursor":(-?\d+)/.exec(code); return m ? parseInt(m[1], 10) : -1; }
  function pushFrame(kind, data) { const i = (s.nextI || 0); s.nextI = i + 1; s.buf = s.buf || []; s.buf.push({ i: i, t: i, dt: 1, kind: kind, data: data || {}, nearbyEvent: null, mutations: [], values: {}, text: "" }); }
  if (code.indexOf("addInitScript") >= 0) {
    if (has("setup-val-unavail")) { printEnv({ ok: true, isError: false, text: "", value: null, valueUnavailable: true, logs: [], warnings: [], session: sess() }); process.exit(0); }
    if (has("setup-no-session")) { printEnv({ ok: true, isError: false, text: "", value: true, valueUnavailable: false, logs: [], warnings: [] }); process.exit(0); }
    if (has("setup-bad-session")) { printEnv({ ok: true, isError: false, text: "", value: true, valueUnavailable: false, logs: [], warnings: [], session: { id: "wrong-session" } }); process.exit(0); }
    printEnv(env(true)); process.exit(0);
  }
  if (code.indexOf("DomRecorder") >= 0) {
    // a boot returning a new id means a fresh document: reset the frame buffer like a real recorder
    if (s.boot !== s.lastBoot) { s.buf = []; s.nextI = 0; s.lastBoot = s.boot; saveState(s); }
    printEnv(env(s.boot)); process.exit(0);
  }
  if (code.indexOf("page.goto") >= 0) { printEnv(env({ url: "https://example.test/app", title: "App" })); process.exit(0); }
  if (code.indexOf("handoff") >= 0) { if (has("consent-fail")) { printEnv(env(false)); process.exit(0); } printEnv(env(true)); process.exit(0); }
  if (code.indexOf("drainChunk") >= 0) {
    const c = cursorOf();
    if (has("poison")) { printEnv(env({ bootId: s.boot, firstRetained: c + 1, frames: [], nextCursor: c, more: true })); process.exit(0); }
    if (has("overflow")) {
      if (!s.ovDone) { s.ovDone = true; saveState(s); printEnv(env({ bootId: s.boot, firstRetained: c + 3, frames: [mkFrame(c + 3), mkFrame(c + 4)], nextCursor: c + 4, more: false })); process.exit(0); }
      printEnv(env({ bootId: s.boot, firstRetained: c + 1, frames: [], nextCursor: c, more: false })); process.exit(0);
    }
    if (has("truncate")) {
      if (!s.trDone) { s.trDone = true; saveState(s); const tf = mkFrame(c + 1); tf.truncated = true; printEnv(env({ bootId: s.boot, firstRetained: c + 1, frames: [tf], nextCursor: c + 1, more: false })); process.exit(0); }
      printEnv(env({ bootId: s.boot, firstRetained: c + 1, frames: [], nextCursor: c, more: false })); process.exit(0);
    }
    const buf = s.buf || [];
    const avail = buf.filter(function (f) { return f.i > c; });
    const firstRetained = buf.length ? buf[0].i : (s.nextI || 0);
    const nextCursor = avail.length ? avail[avail.length - 1].i : c;
    printEnv(env({ bootId: s.boot, firstRetained: firstRetained, frames: avail, nextCursor: nextCursor, more: false })); process.exit(0);
  }
  if (code.indexOf("confirmDrain") >= 0) { const cc = cursorOf(); s.buf = (s.buf || []).filter(function (f) { return f.i > cc; }); saveState(s); printEnv(env(true)); process.exit(0); }
  if (code.indexOf("markSync") >= 0) { const mid = (/"id":"([^"]*)"/.exec(code) || [])[1] || "sync"; pushFrame("sync", { id: mid, wallTimeMs: 1 }); saveState(s); printEnv(env(true)); process.exit(0); }
  if (code.indexOf("markAction") >= 0) { const mn = (/"name":"((?:\\.|[^"\\])*)"/.exec(code) || [])[1] || "action"; pushFrame("action", { name: mn, target: null }); saveState(s); printEnv(env(true)); process.exit(0); }
  if (code.indexOf("clearSync") >= 0) { printEnv(env(true)); process.exit(0); }
  if (code.indexOf("arRedactProbe") >= 0) {
    if (has("bad-redact")) { printEnv(env({ ok: false, selector: "..bad..", message: "SyntaxError: '..bad..' is not a valid selector" })); process.exit(0); }
    printEnv(env({ ok: true })); process.exit(0);
  }
  if (code.indexOf("document.title") >= 0) { printEnv(env("App Title")); process.exit(0); }
  if (code.indexOf("location.href") >= 0) { printEnv(env("https://example.test/app")); process.exit(0); }
  if (code.indexOf("innerWidth") >= 0) { printEnv(env({ width: 1280, height: 800, dpr: 2 })); process.exit(0); }
  if (code.indexOf("started") >= 0 && code.indexOf("bootId") >= 0) { printEnv(env(s.boot)); process.exit(0); }
  // operator snippet
  if (has("reconnect")) { printEnv(env(null, "snippet ran", [RECONNECT])); process.exit(0); }
  if (has("run-fail")) { printEnv({ ok: false, isError: true, text: "boom", value: null, valueUnavailable: true, logs: [], warnings: [], session: sess() }); process.exit(1); }
  if (has("bootflip")) { s.boot = "boot-2-" + (s.sid || "x"); saveState(s); }
  printEnv(env(null, "snippet ran")); process.exit(0);
}
process.exit(0);
`;

// Write the shim + an ffmpeg stub into a dir; return the env additions that point the runner at
// them. AR_BC_BIN / AR_FFMPEG_BIN / AR_BC_RECORD_STOP_WAIT_MS are the runner's documented
// test-only overrides. opts.ffmpegFail installs a failing ffmpeg stub.
function installShim(dir, scenario, opts) {
  const bcBin = path.join(dir, "browser-control");
  fs.writeFileSync(bcBin, SHIM_SRC, { mode: 0o755 });
  fs.chmodSync(bcBin, 0o755);
  const ffBin = path.join(dir, "ffmpeg-stub");
  fs.writeFileSync(ffBin, opts && opts.ffmpegFail ? "#!/bin/sh\nexit 1\n" : "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  fs.chmodSync(ffBin, 0o755);
  return {
    AR_BC_BIN: bcBin,
    AR_FFMPEG_BIN: ffBin,
    AR_BC_SHIM_STATE: path.join(dir, "shim-state.json"),
    AR_BC_SHIM_JOURNAL: path.join(dir, "shim-journal.log"),
    AR_BC_SHIM_SCENARIO: scenario,
    // the artifact lands on stop; keep the missing-artifact wait short so that test fails fast
    AR_BC_RECORD_STOP_WAIT_MS: "800",
  };
}

function newBcProject() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-bc-")));
  const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-bcshim-"));
  return { root, shimDir };
}

// A directory whose `agent-browser` refuses instantly. Cases that expect the runner to bail out
// before it ever drives a browser pass no shim, and would otherwise inherit the REAL binary from
// the ambient PATH — which on a machine with a live recorder session blocks for minutes instead
// of failing. Tests must never depend on what is installed outside this suite.
let denyDir = null;
function abDenyDir() {
  if (denyDir) return denyDir;
  denyDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-nobrowser-"));
  const bin = path.join(denyDir, "agent-browser");
  fs.writeFileSync(bin, '#!/bin/sh\necho "agent-browser: not available in tests" >&2\nexit 1\n', { mode: 0o755 });
  return denyDir;
}

function runRound(cwd, subArgs, envAdds) {
  const env = { ...process.env, ...envAdds };
  // only when the caller has not put a shim of its own in front
  if (!envAdds || !envAdds.PATH) env.PATH = `${abDenyDir()}${path.delimiter}${process.env.PATH}`;
  return spawnSync(process.execPath, [ROUND, ...subArgs], { cwd, encoding: "utf8", timeout: 60000, env });
}

function findRoundDir(root) {
  const base = path.join(root, ".agent-review");
  for (const name of fs.readdirSync(base)) {
    if (/^\d{8}T\d{6}Z-[0-9a-f]{6}$/.test(name)) return path.join(base, name);
  }
  return null;
}

function activeMarker(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, ".agent-review", ".active.json"), "utf8")); } catch (e) { return null; }
}

function readJournal(env) {
  try { return fs.readFileSync(env.AR_BC_SHIM_JOURNAL, "utf8").split("\n").filter(Boolean); } catch (e) { return []; }
}

// Load recorder.js into a Node VM with a minimal window stub, so its real drainChunk sizing can
// be tested at the byte boundary without a browser.
function loadRecorder() {
  const src = fs.readFileSync(RECORDER_JS, "utf8");
  const win = {};
  const ctx = { window: win, crypto: globalThis.crypto, TextEncoder, JSON, Math, URL, URLSearchParams, performance: { now: () => 0 }, document: undefined, setTimeout: () => {}, queueMicrotask: () => {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return win.AgentReviewRecorder;
}

function newFrame(i, text, data) {
  return { i, t: i, dt: 1, kind: "mutation", data: data || {}, nearbyEvent: null, mutations: [], values: {}, text: text || "" };
}
function encLen(obj) { return new TextEncoder().encode(JSON.stringify(obj)).length; }

// Scripted in-process adapter for engine (drainSegment) unit tests: no subprocess, fully
// deterministic. Only drainChunk + confirmDrain are used by the engine.
function scriptedAdapter(chunks, confirm) {
  let i = 0;
  return {
    drainChunk(cursor) { return i < chunks.length ? chunks[i++] : { bootId: "b", firstRetained: cursor + 1, frames: [], nextCursor: cursor, more: false }; },
    confirmDrain(cursor, bootId) { return confirm ? confirm(cursor, bootId) : true; },
  };
}

function engineFixture() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-eng-")));
  const partialDir = ".partial-eng";
  fs.mkdirSync(path.join(root, ".agent-review", partialDir), { recursive: true, mode: 0o700 });
  const st = {
    partialDir, segments: [{ id: "s-0001", bootId: "b", url: "u", cursor: -1, complete: false, endReason: null, endedWallTimeMs: null }],
    currentSegmentId: "s-0001", gaps: [],
  };
  return { root, st };
}

function engineFrames(root, st, segId) {
  const f = path.join(root, ".agent-review", st.partialDir, `frames-${segId}.jsonl`);
  try { return fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch (e) { return []; }
}

async function bcSuite() {
  console.log("\n-- browser-control backend --");

  // ---- unit: session id derivation + charset ----
  const sid = bcSessionId("20260717T142233Z-a1b2c3");
  check("bc session id derives + fits charset", sid === "ar-20260717t142233z-a1b2c3" && /^[a-z0-9][a-z0-9-]{0,62}$/.test(sid));

  // ---- unit: envelope rejection taxonomy (fields REQUIRED, not merely checked) ----
  const okEnv = { ok: true, isError: false, valueUnavailable: false, value: null, session: { id: "x" } };
  check("bcReject accepts a clean envelope (value null is a real page null)", bcReject(okEnv, "x") === null);
  check("bcReject flags missing envelope", !!bcReject(null, "x"));
  check("bcReject flags ok:false", bcReject({ ok: false, isError: false, valueUnavailable: false, session: { id: "x" } }, "x") === "not-ok");
  check("bcReject requires isError:false (missing => reject)", bcReject({ ok: true, valueUnavailable: false, session: { id: "x" } }, "x") === "script-error");
  check("bcReject flags isError:true", bcReject({ ok: true, isError: true, valueUnavailable: false, session: { id: "x" } }, "x") === "script-error");
  check("bcReject requires valueUnavailable:false when a value is expected", bcReject({ ok: true, isError: false, valueUnavailable: true, session: { id: "x" } }, "x") === "value-unavailable");
  check("bcReject flags missing session", bcReject({ ok: true, isError: false, valueUnavailable: false }, "x") === "missing-session");
  check("bcReject flags mismatched session.id", bcReject({ ...okEnv, session: { id: "y" } }, "x") === "session-mismatch");
  check("bcReject tolerates valueUnavailable when no value expected (run path)", bcReject({ ok: true, isError: false, valueUnavailable: true, session: { id: "x" } }, "x", { expectValue: false }) === null);

  // ---- unit: chunk structural validation ----
  check("bcChunkValid accepts a sound non-empty chunk", bcChunkValid({ more: false, firstRetained: 0, nextCursor: 1, frames: [{ i: 0 }, { i: 1 }] }, -1) === true);
  check("bcChunkValid accepts an empty terminal chunk", bcChunkValid({ more: false, firstRetained: 0, nextCursor: -1, frames: [] }, -1) === true);
  check("bcChunkValid rejects empty-with-more poison", bcChunkValid({ more: true, firstRetained: 0, nextCursor: -1, frames: [] }, -1) === false);
  check("bcChunkValid rejects non-increasing frame indices", bcChunkValid({ more: false, firstRetained: 0, nextCursor: 1, frames: [{ i: 1 }, { i: 0 }] }, -1) === false);
  check("bcChunkValid rejects a frame at or below the cursor", bcChunkValid({ more: false, firstRetained: 0, nextCursor: 0, frames: [{ i: 0 }] }, 0) === false);
  check("bcChunkValid rejects nextCursor that is not the last index", bcChunkValid({ more: false, firstRetained: 0, nextCursor: 9, frames: [{ i: 1 }] }, -1) === false);
  check("bcChunkValid rejects a non-boolean more", bcChunkValid({ more: "x", firstRetained: 0, nextCursor: 1, frames: [{ i: 1 }] }, -1) === false);
  // the ingest gate must match the active-state validator: a non-integer cursor accepted here
  // would be rejected on every subsequent load, killing the round
  check("bcChunkValid rejects a non-integer nextCursor and frame index", bcChunkValid({ more: false, firstRetained: 0, nextCursor: 0.5, frames: [{ i: 0.5 }] }, -1) === false);
  check("bcChunkValid rejects a non-integer firstRetained", bcChunkValid({ more: false, firstRetained: 0.5, nextCursor: 0, frames: [{ i: 0 }] }, -1) === false);

  // ---- unit: real recorder drainChunk sized on the WHOLE return value ----
  {
    const { DomRecorder } = loadRecorder();
    const rec = new DomRecorder();
    rec.bootId = "boot-1234";
    const f0 = newFrame(0, "a".repeat(300));
    const f1 = newFrame(1, "b".repeat(300));
    const W = encLen({ bootId: rec.bootId, firstRetained: 0, frames: [f0], nextCursor: 0, more: false });
    rec.frames = [f0, f1]; rec._index = 2;
    const fits = rec.drainChunk(-1, W);
    check("chunk budget: whole-return fit keeps the frame untruncated + more:true", fits.frames.length === 1 && !fits.frames[0].truncated && fits.more === true);
    rec.frames = [f0, f1]; rec._index = 2;
    const over = rec.drainChunk(-1, W - 1);
    check("chunk budget: one byte under the whole-return budget truncates the first frame", over.frames.length === 1 && over.frames[0].truncated === true && over.frames[0].text === "");

    // multi-byte: the recorder measures UTF-8 bytes, not string length
    const mb = newFrame(0, "€".repeat(200)); // 200 chars, 600 bytes
    rec.frames = [mb]; rec._index = 1;
    const charLen = JSON.stringify(mb).length, byteLen = new TextEncoder().encode(JSON.stringify(mb)).length;
    const mbChunk = rec.drainChunk(-1, charLen + 40); // above char count, below byte count
    check("chunk budget: multi-byte frame truncates by byte measure", charLen < byteLen && mbChunk.frames[0].truncated === true);

    // oversized via data.url: stage-1 strip keeps data, so the skeleton fallback must fire
    const big = newFrame(0, "", { url: "x".repeat(40000) });
    rec.frames = [big]; rec._index = 1;
    const bigChunk = rec.drainChunk(-1, 24576);
    check("chunk budget: oversized data.url skeletonized, never dropped, under budget",
      bigChunk.frames.length === 1 && bigChunk.frames[0].truncated === true && bigChunk.frames[0].data.note === "truncated" && !bigChunk.frames[0].data.url && encLen(bigChunk) <= 24576);
  }

  // ---- engine: per-chunk overflow (first chunk) ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([{ bootId: "b", firstRetained: 2, frames: [{ i: 2 }, { i: 3 }], nextCursor: 3, more: false }]));
    const g = st.gaps.find((x) => x.reason === "overflow");
    check("engine: first-chunk firstRetained jump emits an overflow gap", r && r.gap && g && g.droppedFrames === 2 && engineFrames(root, st, "s-0001").length === 2);
    fs.rmSync(root, { recursive: true, force: true });
  }
  // ---- engine: MID-LOOP eviction (per-chunk, not first-chunk-only) ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([
      { bootId: "b", firstRetained: 0, frames: [{ i: 0 }, { i: 1 }], nextCursor: 1, more: true },
      { bootId: "b", firstRetained: 5, frames: [{ i: 5 }, { i: 6 }], nextCursor: 6, more: false },
    ]));
    const g = st.gaps.find((x) => x.reason === "overflow");
    check("engine: mid-loop eviction emits an overflow gap attributed to the current cursor",
      r && g && g.droppedFrames === 3 && st.segments[0].cursor === 6 && engineFrames(root, st, "s-0001").length === 4);
    fs.rmSync(root, { recursive: true, force: true });
  }
  // ---- engine: multi-chunk with no eviction stays gap-free ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([
      { bootId: "b", firstRetained: 0, frames: [{ i: 0 }, { i: 1 }], nextCursor: 1, more: true },
      { bootId: "b", firstRetained: 2, frames: [{ i: 2 }], nextCursor: 2, more: false },
    ]));
    check("engine: multi-chunk drain with no eviction appends all, no gap", r && !r.gap && st.gaps.length === 0 && engineFrames(root, st, "s-0001").length === 3);
    fs.rmSync(root, { recursive: true, force: true });
  }
  // ---- engine: zero-frames-with-more poison records a runner-error gap (not a silent exit) ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([{ bootId: "b", firstRetained: 0, frames: [], nextCursor: -1, more: true }]));
    check("engine: poison chunk records a runner-error gap and aborts the drain",
      r && r.aborted === true && st.gaps.some((g) => g.reason === "runner-error") && engineFrames(root, st, "s-0001").length === 0);
    fs.rmSync(root, { recursive: true, force: true });
  }
  // ---- engine: malformed chunk (bad nextCursor) fails closed ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([{ bootId: "b", firstRetained: 0, frames: [{ i: 0 }], nextCursor: 9, more: false }]));
    check("engine: structurally invalid chunk fails closed with a runner-error gap", r && r.aborted === true && st.gaps.some((g) => g.reason === "runner-error"));
    fs.rmSync(root, { recursive: true, force: true });
  }
  // ---- engine: bootId mismatch on first chunk returns null ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([{ bootId: "OTHER", firstRetained: 0, frames: [{ i: 0 }], nextCursor: 0, more: false }]));
    check("engine: bootId mismatch on first chunk returns null (doc gone)", r === null);
    fs.rmSync(root, { recursive: true, force: true });
  }
  // ---- engine: bootId flip mid-loop returns null after persisting the good chunk ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([
      { bootId: "b", firstRetained: 0, frames: [{ i: 0 }], nextCursor: 0, more: true },
      { bootId: "OTHER", firstRetained: 1, frames: [{ i: 1 }], nextCursor: 1, more: false },
    ]));
    check("engine: bootId flip mid-loop returns null, keeps the good chunk", r === null && engineFrames(root, st, "s-0001").length === 1);
    fs.rmSync(root, { recursive: true, force: true });
  }
  // ---- engine: confirm boot-mismatch returns null after persisting frames ----
  {
    const { root, st } = engineFixture();
    const r = drainSegment(root, st, scriptedAdapter([{ bootId: "b", firstRetained: 0, frames: [{ i: 0 }], nextCursor: 0, more: false }], () => false));
    check("engine: confirm boot-mismatch returns null after persisting frames", r === null && engineFrames(root, st, "s-0001").length === 1);
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ---- lifecycle: fresh relay page (start -> run -> stop) produces a v2 package ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy");
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app", "--flow", "review the invite flow"], env);
    check("bc start (url) exits 0", start.status === 0);
    const active = activeMarker(root);
    check("bc .active.json carries backend + session + consented phase", !!active && active.backend === "browser-control" && active.bcSession === bcSessionId(active.roundId) && active.phase === "consented");
    const run = runRound(root, ["run", "--label", "open the invite dialog", "--", "await clickSave()"], env);
    check("bc run (label + snippet) exits 0", run.status === 0);
    const stop = runRound(root, ["stop", "--summary", "bc round"], env);
    check("bc stop exits 0", stop.status === 0);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    const dom = rd ? JSON.parse(fs.readFileSync(path.join(rd, "dom.json"), "utf8")) : null;
    check("bc meta schemaVersion 2 + backend versions, no agentBrowser key",
      !!meta && meta.schemaVersion === 2 && meta.versions.backend === "browser-control" && !("agentBrowser" in meta.versions) && meta.versions.recordingMode === "cdp" && typeof meta.versions.ffmpeg === "boolean");
    check("bc versions.cli is the CLI --version, not the relay self-report", !!meta && meta.versions.cli === "0.4.1");
    check("bc sync is video-primary low/unavailable", !!meta && meta.sync.confidence === "low" && meta.sync.method === "unavailable" && meta.sync.anchors.length === 0);
    check("bc network missing, video complete", !!meta && meta.completeness.network === "missing" && meta.completeness.video === "complete");
    check("bc round directory omits network.har", !!rd && !fs.existsSync(path.join(rd, "network.har")));
    const actionFrames = dom ? dom.segments.flatMap((sg) => sg.frames).filter((f) => f.kind === "action") : [];
    check("bc timeline records the LABEL as an action frame", actionFrames.some((f) => f.data && f.data.name === "open the invite dialog"));
    check("bc snippet source never reaches dom.json", !!dom && !JSON.stringify(dom).includes("clickSave"));
    check("bc package keeps video.webm, drops the sidecar", !!rd && fs.existsSync(path.join(rd, "video.webm")) && !fs.existsSync(path.join(rd, "video.webm.json")));
    const j = readJournal(env);
    check("bc teardown order: recording stopped before session deleted",
      j.indexOf("recording-start") >= 0 && j.indexOf("recording-start") < j.indexOf("recording-stop") && j.indexOf("recording-stop") < j.indexOf("session-delete"));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: dropped frames -> video partial via sidecar ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "dropped");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check("bc dropped frames -> completeness.video partial", !!meta && meta.completeness.video === "partial");
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: unreadable drop data is not proof of zero drops ----
  for (const [tag, label] of [["no-sidecar", "a missing"], ["bad-sidecar", "an unparseable"]]) {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, tag);
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check(`bc video with ${label} drop sidecar finalizes partial, not complete`,
      !!meta && meta.completeness.video === "partial");
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: a mutation landing in the stop window marks the channels past the cutoff partial ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "stop-tail");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    const dom = rd ? JSON.parse(fs.readFileSync(path.join(rd, "dom.json"), "utf8")) : null;
    const seg1 = dom && dom.segments.find((sg) => sg.id === "s-0001");
    const endIdx = seg1 ? seg1.frames.findIndex((f) => f.kind === "sync" && f.data && f.data.id === "end") : -1;
    check("bc a mutation in the stop window is kept in the evidence but marks video and DOM past the cutoff partial",
      stop.status === 0 && !!meta && !!seg1 && endIdx !== -1 &&
      seg1.frames[seg1.frames.length - 1].kind === "mutation" &&
      meta.completeness.gaps.some((g) => g.reason === "stop-tail" && g.segmentId === "s-0001") &&
      meta.completeness.video === "partial" && meta.completeness.dom === "partial");
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: missing artifact -> video missing, round still finalizes ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "no-artifact");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check("bc missing artifact -> completeness.video missing, round still finalizes", stop.status === 0 && !!meta && meta.completeness.video === "missing");
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: first-chunk eviction surfaces an overflow gap ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "overflow");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check("bc overflow gap reaches the package", !!meta && meta.completeness.gaps.some((g) => g.reason === "overflow" && g.droppedFrames === 2));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: oversized-frame truncation surfaces a truncation gap ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "truncate");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check("bc truncated frame -> truncation gap", !!meta && meta.completeness.gaps.some((g) => g.reason === "truncation"));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: poison chunk records a runner-error gap and still finishes ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "poison");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check("bc poison drain finishes with a runner-error gap", stop.status === 0 && !!meta && meta.completeness.gaps.some((g) => g.reason === "runner-error"));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: a snippet-driven document change splits the segment ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "bootflip");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    runRound(root, ["run", "--label", "submit the form", "--", "await go()"], env);
    runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    const dom = rd ? JSON.parse(fs.readFileSync(path.join(rd, "dom.json"), "utf8")) : null;
    check("bc snippet-driven navigation -> two segments + navigation-tail gap",
      !!dom && dom.segments.length === 2 && !!meta && meta.completeness.gaps.some((g) => g.reason === "navigation-tail"));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: reconnect warning mid-round fails closed into a partial ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "reconnect");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const run = runRound(root, ["run", "--label", "do the thing", "--", "await act()"], env);
    const partials = fs.readdirSync(path.join(root, ".agent-review")).filter((n) => n.startsWith(".partial-"));
    check("bc reconnect warning fails the round closed (marker cleared)", run.status !== 0 && /failed closed/.test(run.stderr) && !activeMarker(root));
    check("bc reconnect leaves an unassembled partial directory for diagnosis", partials.length === 1 && !findRoundDir(root));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: adopt an existing tab (adopt branch, consent naming, startUrl set) ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy");
    const start = runRound(root, ["start", "--backend", "browser-control", "--adopt", "dashboard", "--flow", "review"], env);
    check("bc start (adopt) exits 0 and names the target", start.status === 0 && /adopting tab/.test(start.stderr));
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check("bc adopt round finalizes with a real startUrl (not null)", stop.status === 0 && !!meta && typeof meta.startUrl === "string" && meta.startUrl.length > 0);
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- run failure (nonzero exit + isError envelope) keeps the round active ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "run-fail");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const run = runRound(root, ["run", "--label", "do the thing", "--", "await boom()"], env);
    check("bc snippet failure exits nonzero, round stays active", run.status !== 0 && !!activeMarker(root));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- consent gate: run before consent is refused; abort recovers ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy");
    const dir = path.join(root, ".agent-review");
    fs.mkdirSync(dir, { recursive: true });
    const roundId = "20260202T000000Z-bbbbbb";
    fs.mkdirSync(path.join(dir, `.partial-${roundId}`), { recursive: true });
    fs.writeFileSync(path.join(dir, ".active.json"), JSON.stringify({
      roundId, backend: "browser-control", bcSession: bcSessionId(roundId), recordingMode: "cdp", phase: "setup",
      partialDir: `.partial-${roundId}`, startUrl: null, startedAt: "2026-02-02T00:00:00.000Z",
      redact: [], segments: [], gaps: [], currentSegmentId: null, versions: {},
    }));
    const run = runRound(root, ["run", "--label", "do the thing", "--", "await x()"], env);
    check("bc run on an unconsented (interrupted) round is refused", run.status !== 0 && /consent/.test(run.stderr));
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    check("bc stop on an unconsented round behaves as abort", stop.status === 0 && !activeMarker(root) && !findRoundDir(root));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- start failure releases the session (M1): consent not acknowledged ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "consent-fail");
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const j = readJournal(env);
    check("bc consent failure leaves no active round and releases the session",
      start.status !== 0 && !activeMarker(root) && j.indexOf("session-delete") >= 0);
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- envelope taxonomy through the shim execute path (B4) ----
  for (const tag of ["setup-val-unavail", "setup-no-session", "setup-bad-session"]) {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, tag);
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    check(`bc rejects envelope defect via execute (${tag}) — no round left active`, start.status !== 0 && !activeMarker(root));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- label / flow policy enforcement (M4) ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const noLabel = runRound(root, ["run", "--", "await x()"], env);
    check("bc run without --label is rejected", noLabel.status !== 0 && /label/.test(noLabel.stderr));
    const urlLabel = runRound(root, ["run", "--label", "go to https://secret.example/x", "--", "await x()"], env);
    check("bc run label containing a URL is rejected", urlLabel.status !== 0 && /URL/.test(urlLabel.stderr));
    const qsLabel = runRound(root, ["run", "--label", "open ?token=abc panel", "--", "await x()"], env);
    check("bc run label with a query string is rejected", qsLabel.status !== 0 && /query string/.test(qsLabel.stderr));
    const atLabel = runRound(root, ["run", "--label", "email admin@example.test", "--", "await x()"], env);
    check("bc run label with an '@' handle is rejected", atLabel.status !== 0 && /@/.test(atLabel.stderr));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }
  {
    // the same policy applies to --flow
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy");
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app", "--flow", "notify user@example.test"], env);
    check("bc --flow with an email is rejected before any state", start.status !== 0 && !activeMarker(root));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- stop with a failed session release keeps the marker; abort recovers (M2) ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "delete-fail");
    runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const marker = activeMarker(root);
    check("bc stop promotes the package but keeps a teardown-failed marker when release fails",
      stop.status === 0 && !!findRoundDir(root) && !!marker && marker.phase === "teardown-failed");
    const abort = runRound(root, ["abort"], { ...env, AR_BC_SHIM_SCENARIO: "happy" });
    check("bc abort recovers a leaked session and clears the marker", abort.status === 0 && !activeMarker(root));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- stale .active.json recovery: abort cancels recording then releases a gone session ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "session-gone");
    const dir = path.join(root, ".agent-review");
    fs.mkdirSync(dir, { recursive: true });
    const roundId = "20260101T000000Z-aaaaaa";
    fs.writeFileSync(path.join(dir, ".active.json"), JSON.stringify({
      roundId, backend: "browser-control", bcSession: bcSessionId(roundId), recordingMode: "cdp", phase: "consented",
      partialDir: `.partial-${roundId}`, startUrl: null, startedAt: "2026-01-01T00:00:00.000Z",
      redact: [], segments: [], gaps: [], currentSegmentId: null, versions: {},
    }));
    const abort = runRound(root, ["abort"], env);
    const j = readJournal(env);
    check("bc abort on a stale session exits 0 and clears the marker", abort.status === 0 && !activeMarker(root));
    check("bc abort recovery order: recording cancelled before session delete (not-found tolerated)",
      j.indexOf("recording-cancel") >= 0 && j.indexOf("recording-cancel") < j.indexOf("session-delete"));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- abort on a marker that fails validation still releases the browser-control session ----
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy");
    const dir = path.join(root, ".agent-review");
    fs.mkdirSync(dir, { recursive: true });
    const roundId = "20260303T000000Z-ddd444";
    // the stored session id disagrees with the round id, so the marker fails validation —
    // abort must still recompute the session from the round id and tear it down
    fs.writeFileSync(path.join(dir, ".active.json"), JSON.stringify({
      roundId, backend: "browser-control", bcSession: "ar-forged-session", recordingMode: "cdp", phase: "consented",
      partialDir: `.partial-${roundId}`, startUrl: null, startedAt: "2026-03-03T00:00:00.000Z",
      redact: [], segments: [], gaps: [], currentSegmentId: null, versions: {},
    }));
    const abort = runRound(root, ["abort"], env);
    const j = readJournal(env);
    check("abort on an invalid marker releases the session recomputed from the round id",
      abort.status === 0 && !activeMarker(root) && j.indexOf("recording-cancel") >= 0 && j.indexOf("session-delete") >= 0);
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- preflight fails closed on each named reason (M3) ----
  const preflightCases = [
    ["stale", ["--url", "https://example.test/app"], /stale|build/],
    ["ext-down", ["--url", "https://example.test/app"], /extension is not connected/],
    ["ext-version-mismatch", ["--url", "https://example.test/app"], /extension version/],
    ["happy,rec-status-error", ["--adopt", "dashboard"], /recording status/],
    ["happy", ["--adopt", "zzznomatch"], /no attached tab matches/],
  ];
  for (const [scn, extra, re] of preflightCases) {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, scn);
    const start = runRound(root, ["start", "--backend", "browser-control", ...extra], env);
    check(`bc preflight fails closed (${scn} ${extra.join(" ")}), no round left active`, start.status !== 0 && re.test(start.stderr) && !activeMarker(root));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // An UNDETERMINABLE extension version (doctor versionMatches: null — real-world
  // browser-control 0.2.0 cannot read its own bundled manifest) must NOT brick the
  // backend when the extension is connected and the relay build matches: start
  // proceeds past preflight with a warning instead of dying.
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy,ext-version-unknown");
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    check("bc preflight proceeds with warning when extension version is undeterminable",
      start.status === 0 && /version undeterminable/.test(start.stderr) && activeMarker(root));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }
  {
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy", { ffmpegFail: true });
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app"], env);
    check("bc preflight fails closed when ffmpeg is unavailable", start.status !== 0 && /ffmpeg/.test(start.stderr) && !activeMarker(root));
    fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(shimDir, { recursive: true, force: true });
  }
}

// ---------- filesystem trust-boundary checks ----------

// A PATH shim standing in for the agent-browser CLI: it journals every invocation so a test
// can prove a code path did (or did not) touch the shared machine-wide recorder.
function installAbShim(dir) {
  const journal = path.join(dir, "ab-journal.log");
  const bin = path.join(dir, "agent-browser");
  fs.writeFileSync(bin, `#!/bin/sh\necho "$@" >> ${JSON.stringify(journal)}\nexit 0\n`, { mode: 0o755 });
  fs.chmodSync(bin, 0o755);
  return { journal, env: { PATH: `${dir}${path.delimiter}${process.env.PATH}` } };
}

function abJournalLines(file) {
  try { return fs.readFileSync(file, "utf8").split("\n").filter(Boolean); } catch (e) { return []; }
}

// A well-formed agent-browser marker, shaped exactly as a real start would write it.
function abMarker(roundId) {
  return {
    roundId, backend: "agent-browser", partialDir: `.partial-${roundId}`,
    startUrl: "https://example.test/", startedAt: "2026-01-01T00:00:00.000Z",
    redact: [], segments: [], gaps: [], currentSegmentId: null, versions: {},
  };
}

function writeMachineLock(home, lock) {
  fs.mkdirSync(path.join(home, ".agent-browser"), { recursive: true });
  fs.writeFileSync(path.join(home, ".agent-browser", "agent-review.lock"), JSON.stringify(lock));
}

async function securitySuite() {
  console.log("\n-- artifact directory trust boundary --");
  const fakeHome = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));

  // ---- a symlinked .agent-review is refused by every command entry point ----
  {
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-outside-")));
    const proj = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-linkproj-")));
    fs.symlinkSync(outside, path.join(proj, ".agent-review"));
    const roundCmds = [
      ["start", ["start", "--url", "https://example.test/"]],
      ["start --backend browser-control", ["start", "--backend", "browser-control", "--url", "https://example.test/"]],
      ["run", ["run", "--", "snapshot"]],
      ["stop", ["stop"]],
      ["abort", ["abort"]],
      ["pending", ["pending"]],
      ["resolve", ["resolve", "--feedback-round", ROUND_ID, "--comment", "c-00000000-0000-0000-0000-000000000000", "--in-round", ROUND_ID]],
      ["calibrate", ["calibrate", "--offset", "10"]],
    ];
    for (const [label, argv] of roundCmds) {
      const r = runRound(proj, argv, { HOME: fakeHome });
      check(`round.mjs ${label} refuses a symlinked .agent-review`, r.status !== 0 && /\.agent-review is a symlink/.test(r.stderr));
    }
    const serverCmds = [
      ["open", ["open"]],
      ["restart", ["restart"]],
      ["stop", ["stop"]],
      ["serve", ["serve", "--token", crypto.randomBytes(18).toString("base64url")]],
    ];
    for (const [label, argv] of serverCmds) {
      const r = spawnSync(process.execPath, [SERVER, ...argv, "--project", proj], { encoding: "utf8", timeout: 15000 });
      check(`server.mjs ${label} refuses a symlinked .agent-review`, r.status !== 0 && /\.agent-review is a symlink/.test(r.stderr));
    }
    check("nothing was written through the symlinked directory", fs.readdirSync(outside).length === 0);
    fs.rmSync(proj, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }

  // ---- the marker file the artifact directory creates on first use is not written through a symlink ----
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-gileaf-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const outside = path.join(root, "outside-gitignore");
    fs.symlinkSync(outside, path.join(root, ".agent-review", ".gitignore"));
    const r = runRound(root, ["calibrate", "--offset", "10"], { HOME: fakeHome });
    check("first-use marker behind a symlink is refused, never written through",
      r.status !== 0 && /\.gitignore is a symlink/.test(r.stderr) && !fs.existsSync(outside));
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ---- a symlinked frame log is not appended through ----
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-frameleaf-")));
    const partial = path.join(root, ".agent-review", ".partial-fixture");
    fs.mkdirSync(partial, { recursive: true });
    const outside = path.join(root, "outside-frames.jsonl");
    fs.symlinkSync(outside, path.join(partial, "frames-s-0001.jsonl"));
    // drainSegment dies on the poisoned leaf, so it must run in a subprocess, not in-process
    const script = `
import { drainSegment } from ${JSON.stringify(pathToFileURL(ROUND).href)};
const st = { partialDir: ".partial-fixture", segments: [{ id: "s-0001", bootId: "b", cursor: -1 }], currentSegmentId: "s-0001", gaps: [] };
drainSegment(process.argv[1], st, {
  drainChunk: () => ({ bootId: "b", firstRetained: 0, frames: [{ i: 0 }], nextCursor: 0, more: false }),
  confirmDrain: () => true,
});
`;
    const r = spawnSync(process.execPath, ["--input-type=module", "-e", script, root], { encoding: "utf8" });
    check("symlinked frame log is refused, evidence never escapes the package",
      r.status !== 0 && /symlink/.test(r.stderr) && !fs.existsSync(outside));
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ---- an atomic JSON write never follows a pre-placed symlink at its temporary path ----
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-atomic-")));
    const file = path.join(root, "state.json");
    const outside = path.join(root, "outside.json");
    fs.symlinkSync(outside, `${file}.tmp-${process.pid}`); // the once-predictable temporary name
    atomicWriteJson(file, { ok: 1 });
    check("atomic write never uses a temporary name a pre-placed symlink can wait at",
      !fs.existsSync(outside) && JSON.parse(fs.readFileSync(file, "utf8")).ok === 1);
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ---- stored marker identifiers are recomputed, never trusted (unit) ----
  {
    const rid = "20260718T000000Z-abc123";
    check("a well-formed agent-browser marker passes validation", activeStateProblem(abMarker(rid)) === null);
    check("a partialDir that disagrees with the round id is rejected",
      activeStateProblem({ ...abMarker(rid), partialDir: ".partial-20260101T000000Z-ffffff" }) === "partialDir does not match the round id");
    const forgedBc = { ...abMarker(rid), backend: "browser-control", phase: "consented", bcSession: "ar-forged" };
    check("a bcSession that disagrees with the round id is rejected",
      activeStateProblem(forgedBc) === "bcSession does not match the round id");
    const badCursor = { ...abMarker(rid), segments: [{ id: "s-0001", cursor: "7" }], currentSegmentId: "s-0001" };
    check("a non-integer segment cursor is rejected",
      activeStateProblem(badCursor) === "cursor of segment s-0001 is not a finite integer");
  }

  // ---- the same rejects hold when the marker is loaded from disk ----
  for (const [label, mutate, re] of [
    ["a partialDir that disagrees with the round id", (m) => { m.partialDir = ".partial-20260101T000000Z-ffffff"; }, /partialDir does not match the round id/],
    ["a bcSession that disagrees with the round id", (m) => { m.backend = "browser-control"; m.phase = "consented"; m.bcSession = "ar-forged"; }, /bcSession does not match the round id/],
    ["a non-integer segment cursor", (m) => { m.segments = [{ id: "s-0001", cursor: "7" }]; m.currentSegmentId = "s-0001"; }, /not a finite integer/],
  ]) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-badmark-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const m = abMarker("20260718T000000Z-abc123");
    mutate(m);
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(m));
    const r = runRound(root, ["stop"], { HOME: fakeHome });
    check(`stop refuses a marker with ${label}`, r.status !== 0 && re.test(r.stderr));
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ---- a marker that cannot be parsed is still recoverable ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);

    // no lock names this project: clear locally, touch nothing global
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-corrupt-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const marker = path.join(root, ".agent-review", ".active.json");
    fs.writeFileSync(marker, "{ not json");
    const r = runRound(root, ["abort"], { ...shim.env, HOME: home });
    check("abort clears a marker it cannot parse instead of failing in a loop",
      r.status === 0 && !fs.existsSync(marker) && /cleared/.test(r.stdout));
    check("clearing a corrupt marker leaves the shared capture alone when no lock names the project",
      abJournalLines(shim.journal).length === 0);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });

    // the lock independently names this project: clearing also stops the capture it owns
    const root2 = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-corrupt-")));
    const home2 = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root2, ".agent-review"));
    const marker2 = path.join(root2, ".agent-review", ".active.json");
    fs.writeFileSync(marker2, "{ not json");
    writeMachineLock(home2, { pid: 424242, project: root2, roundId: "20260718T000000Z-abc123", startedAt: "2026-01-01T00:00:00.000Z" });
    const r2 = runRound(root2, ["abort"], { ...shim.env, HOME: home2 });
    check("clearing a corrupt marker stops the shared capture the lock proves this project owns",
      r2.status === 0 && !fs.existsSync(marker2) && abJournalLines(shim.journal).some((l) => /record stop/.test(l)));
    check("the machine lock is released after the recovery", !fs.existsSync(path.join(home2, ".agent-browser", "agent-review.lock")));
    fs.rmSync(root2, { recursive: true, force: true });
    fs.rmSync(home2, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- abort and stop must terminate when the partial package is missing ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const mkProject = () => {
      const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-nopartial-")));
      const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
      fs.mkdirSync(path.join(root, ".agent-review"));
      const roundId = "20260718T000000Z-ccc333";
      // a well-formed marker and lock, but no .partial-<roundId> — an interrupted run or a
      // cleanup script reclaimed it
      fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker(roundId)));
      writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
      return { root, home, env: { ...shim.env, HOME: home } };
    };

    const a = mkProject();
    const abort = runRound(a.root, ["abort"], a.env);
    check("abort clears the round when the partial package is missing",
      abort.status === 0 && !fs.existsSync(path.join(a.root, ".agent-review", ".active.json")));
    check("abort with a missing partial still stops the recorder and releases the machine lock",
      abJournalLines(shim.journal).some((l) => /record stop/.test(l)) &&
      !fs.existsSync(path.join(a.home, ".agent-browser", "agent-review.lock")));
    fs.rmSync(a.root, { recursive: true, force: true });
    fs.rmSync(a.home, { recursive: true, force: true });

    const s = mkProject();
    const stop = runRound(s.root, ["stop"], s.env);
    check("stop with a missing partial clears the round and releases the lock instead of dying",
      stop.status === 0 && !fs.existsSync(path.join(s.root, ".agent-review", ".active.json")) &&
      !fs.existsSync(path.join(s.home, ".agent-browser", "agent-review.lock")));
    fs.rmSync(s.root, { recursive: true, force: true });
    fs.rmSync(s.home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- abort never writes through a symlinked partial package, and still clears the round ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-linkpartial-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const roundId = "20260718T000000Z-eee555";
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker(roundId)));
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-outside-")));
    fs.symlinkSync(outside, path.join(root, ".agent-review", `.partial-${roundId}`));
    writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
    const abort = runRound(root, ["abort"], { ...shim.env, HOME: home });
    const harStops = abJournalLines(shim.journal).filter((l) => /har stop/.test(l));
    check("abort with a symlinked partial clears the round, releases the lock, and never sends the HAR through the link",
      abort.status === 0 && !fs.existsSync(path.join(root, ".agent-review", ".active.json")) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) &&
      !fs.existsSync(path.join(outside, "network.raw.har")) &&
      harStops.length > 0 && harStops.every((l) => !l.includes(root) && !l.includes(outside)));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- abort terminates when the partial path is a regular file, not a directory ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-filepartial-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const roundId = "20260718T000000Z-fff666";
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker(roundId)));
    fs.writeFileSync(path.join(root, ".agent-review", `.partial-${roundId}`), "not a directory");
    writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
    const abort = runRound(root, ["abort"], { ...shim.env, HOME: home });
    check("abort with a partial that is a regular file still clears the round, stops the recorder, and releases the lock",
      abort.status === 0 && !fs.existsSync(path.join(root, ".agent-review", ".active.json")) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) &&
      abJournalLines(shim.journal).some((l) => /record stop/.test(l)));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a hung capture stop is abandoned under a bounded wait, and cleanup still completes ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const journal = path.join(shimDir, "ab-journal.log");
    // the shim journals, then sleeps far past the runner's bounded wait — a hung
    // agent-browser, not a failing one
    fs.writeFileSync(path.join(shimDir, "agent-browser"), `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(journal)}, process.argv.slice(2).join(" ") + "\\n");
setTimeout(() => {}, 60000);
`, { mode: 0o755 });
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-hangstop-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const roundId = "20260718T000000Z-ba0900";
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker(roundId)));
    writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
    const abort = spawnSync(process.execPath, [ROUND, "abort"], {
      cwd: root, encoding: "utf8", timeout: 20000,
      env: { ...process.env, PATH: `${shimDir}${path.delimiter}${process.env.PATH}`, HOME: home, AR_AB_CAPTURE_STOP_TIMEOUT_MS: "500" },
    });
    check("abort abandons a hung capture stop and still clears the marker and lock",
      abort.status === 0 &&
      !fs.existsSync(path.join(root, ".agent-review", ".active.json")) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) &&
      /network capture could not be stopped/.test(abort.stderr) &&
      /video recorder could not be stopped/.test(abort.stderr));
    check("abort abandons a hung session release and still clears the marker and lock",
      abort.status === 0 &&
      !fs.existsSync(path.join(root, ".agent-review", ".active.json")) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) &&
      /browser session could not be closed/.test(abort.stderr));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a failed lock release is reported, never silent ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-lockfail-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const roundId = "20260718T000000Z-10cf11";
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker(roundId)));
    writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
    const lockFile = path.join(home, ".agent-browser", "agent-review.lock");
    // a read-only lock directory makes the release fail while the lock stays readable
    fs.chmodSync(path.dirname(lockFile), 0o500);
    const abort = runRound(root, ["abort"], { ...shim.env, HOME: home });
    fs.chmodSync(path.dirname(lockFile), 0o700);
    check("a lock release that fails is reported with the lock path and the remedy",
      abort.status === 0 &&
      !fs.existsSync(path.join(root, ".agent-review", ".active.json")) &&
      fs.existsSync(lockFile) &&
      /machine-wide round lock could not be released/.test(abort.stderr) &&
      /agent-review\.lock/.test(abort.stderr));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a .agent-review that is a regular file gets a named refusal, not a stack trace ----
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-fileroot-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.writeFileSync(path.join(root, ".agent-review"), "not a directory");
    const abort = runRound(root, ["abort"], { HOME: home });
    check("abort refuses a .agent-review that is a regular file with a named reason",
      abort.status !== 0 && /\.agent-review is not a directory/.test(abort.stderr) &&
      !/^\s*(at |node:internal|node:fs|Error:|TypeError:)/m.test(abort.stderr));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }

  // ---- a symlinked raw network capture cannot block stop: the capture never lands in the package ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-harleaf-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const roundId = "20260718T000000Z-999aaa";
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker(roundId)));
    const partial = path.join(root, ".agent-review", `.partial-${roundId}`);
    fs.mkdirSync(partial);
    const outside = path.join(root, "outside.har");
    fs.symlinkSync(outside, path.join(partial, "network.raw.har"));
    writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
    const stop = runRound(root, ["stop"], { ...shim.env, HOME: home });
    check("stop finalizes past a symlinked raw capture leaf and never writes through it",
      stop.status === 0 && !!findRoundDir(root) && !activeMarker(root) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) && !fs.existsSync(outside));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a dangling symlink marker is recoverable ----
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-dangling-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const marker = path.join(root, ".agent-review", ".active.json");
    fs.symlinkSync(path.join(root, "gone-target"), marker);
    const stop = runRound(root, ["stop"], { HOME: home });
    check("stop on a dangling symlink marker names the symlink and the recovery command",
      stop.status !== 0 && /is a symlink/.test(stop.stderr) && /abort/.test(stop.stderr));
    const abort = runRound(root, ["abort"], { HOME: home });
    let markerGone = false;
    try { fs.lstatSync(marker); } catch { markerGone = true; }
    check("abort clears a dangling symlink marker", abort.status === 0 && markerGone);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }

  // ---- a marker path that is a directory is removed cleanly ----
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-dirmarker-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review", ".active.json"), { recursive: true });
    const abort = runRound(root, ["abort"], { HOME: home });
    check("abort removes a marker path that is a directory instead of crashing",
      abort.status === 0 && !fs.existsSync(path.join(root, ".agent-review", ".active.json")));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }

  // ---- round ownership: a marker in one project never commands another project's capture ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    const rootA = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-proja-")));
    const rootB = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-projb-")));
    const roundB = "20260718T000000Z-bbb222";
    fs.mkdirSync(path.join(rootA, ".agent-review"));
    fs.writeFileSync(path.join(rootA, ".agent-review", ".active.json"), JSON.stringify(abMarker("20260718T000000Z-aaa111")));
    // the shared recorder is mid-session for ANOTHER project and round
    writeMachineLock(home, { pid: 424242, project: rootB, roundId: roundB, startedAt: "2026-01-01T00:00:00.000Z" });
    const lockFile = path.join(home, ".agent-browser", "agent-review.lock");
    const env = { ...shim.env, HOME: home };

    const stop = runRound(rootA, ["stop"], env);
    check("stop refuses to drive a capture the lock assigns to another project",
      stop.status !== 0 && /does not name this project/.test(stop.stderr));
    const run = runRound(rootA, ["run", "--", "snapshot"], env);
    check("run refuses to drive a capture the lock assigns to another project",
      run.status !== 0 && /does not name this project/.test(run.stderr));
    const abort = runRound(rootA, ["abort"], env);
    check("abort clears the local marker without touching another project's capture",
      abort.status === 0 && !activeMarker(rootA));
    check("no recorder command was issued against another project's session", abJournalLines(shim.journal).length === 0);
    check("the other project's recorder lock survives", JSON.parse(fs.readFileSync(lockFile, "utf8")).roundId === roundB);
    fs.rmSync(rootA, { recursive: true, force: true });
    fs.rmSync(rootB, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a marker may not carry fields that belong to the other backend ----
  {
    const rid = "20260719T000000Z-f11add";
    const flipped = { ...abMarker(rid), bcSession: bcSessionId(rid), recordingMode: "cdp", phase: "consented" };
    check("an agent-browser marker carrying browser-control-only fields is rejected",
      activeStateProblem(flipped) === "bcSession is only valid on a browser-control round");
    const genuineBc = { ...abMarker(rid), backend: "browser-control", bcSession: bcSessionId(rid), recordingMode: "cdp", phase: "consented" };
    check("a genuine browser-control marker passes validation with its own fields present",
      activeStateProblem(genuineBc) === null);

    // on disk: every command refuses the flipped marker, and abort still tears down the
    // browser-control session the round id names — a flipped backend field must not spare it
    const { root, shimDir } = newBcProject();
    const env = installShim(shimDir, "happy");
    fs.mkdirSync(path.join(root, ".agent-review"), { recursive: true });
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(flipped));
    const stop = runRound(root, ["stop"], { ...env, HOME: fakeHome });
    check("stop refuses a marker whose declared backend does not own its fields",
      stop.status !== 0 && /only valid on a browser-control round/.test(stop.stderr));
    const abort = runRound(root, ["abort"], { ...env, HOME: fakeHome });
    const j = readJournal(env);
    check("abort clears the flipped marker and releases the session its round id names",
      abort.status === 0 && !activeMarker(root) && j.indexOf("recording-cancel") >= 0 && j.indexOf("session-delete") >= 0);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a start that dies after taking the session gives it back on the way out ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-startfail-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    const env = { ...shim.env, HOME: home };
    // the shim answers every call but can never boot a recorder, so start fails after it has
    // started capture — the point in the lifecycle where the round already owns a browser
    const start = runRound(root, ["start", "--url", "https://example.test/"], env);
    const j = abJournalLines(shim.journal);
    check("a start that fails after starting capture releases the browser session on its way out",
      start.status !== 0 && j.some((l) => /record start/.test(l)) && j.includes("close"));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- taking over a stale same-project lock stops the shared capture first ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-takeover-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    // a lock this project left behind: its round's marker is gone, but the shared capture was
    // never stopped — takeover must stop it before recording into the new round
    writeMachineLock(home, { pid: 424242, project: root, roundId: "20260718T000000Z-dead01", startedAt: "2026-01-01T00:00:00.000Z" });
    const env = { ...shim.env, HOME: home };
    runRound(root, ["start", "--url", "https://example.test/"], env);
    const journal = abJournalLines(shim.journal);
    const stopIdx = journal.findIndex((l) => /record stop/.test(l));
    const startIdx = journal.findIndex((l) => /record start/.test(l));
    check("start taking over a stale same-project lock stops the shared capture before recording",
      stopIdx !== -1 && startIdx !== -1 && stopIdx < startIdx);
    // the shim cannot boot a recorder, so start dies in its degraded state — abort cleans up
    const abort = runRound(root, ["abort"], env);
    check("the taken-over lock follows the new round and is released by abort",
      abort.status === 0 && !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a live foreign lock leaves the foreign capture strictly alone ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-takeover-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    const foreign = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-foreign-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    // the foreign project's round marker is still on disk, so its lock is live: start must
    // refuse outright and never drive the shared capture
    fs.mkdirSync(path.join(foreign, ".agent-review"));
    fs.writeFileSync(path.join(foreign, ".agent-review", ".active.json"), JSON.stringify(abMarker("20260718T000000Z-f0e119")));
    writeMachineLock(home, { pid: 424242, project: foreign, roundId: "20260718T000000Z-f0e119", startedAt: "2026-01-01T00:00:00.000Z" });
    const env = { ...shim.env, HOME: home };
    const start = runRound(root, ["start", "--url", "https://example.test/"], env);
    check("start refuses a live foreign lock and names the holding project",
      start.status !== 0 && /another round is active on this machine/.test(start.stderr));
    check("a live foreign lock never issues a capture stop",
      !abJournalLines(shim.journal).some((l) => /record stop|har stop/.test(l)));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(foreign, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- taking over a stale foreign lock stops the shared capture first ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-takeover-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    const foreign = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-foreign-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    // the foreign project's marker is gone, so its lock is stale — but the shared capture it
    // started may still be live, and the new round must not inherit it
    writeMachineLock(home, { pid: 424242, project: foreign, roundId: "20260718T000000Z-f0e119", startedAt: "2026-01-01T00:00:00.000Z" });
    const env = { ...shim.env, HOME: home };
    runRound(root, ["start", "--url", "https://example.test/"], env);
    const journal = abJournalLines(shim.journal);
    const stopIdx = journal.findIndex((l) => /record stop/.test(l));
    const startIdx = journal.findIndex((l) => /record start/.test(l));
    check("start taking over a stale foreign lock stops the shared capture before recording",
      stopIdx !== -1 && startIdx !== -1 && stopIdx < startIdx);
    const abort = runRound(root, ["abort"], env);
    check("the taken-over foreign lock follows the new round and is released by abort",
      abort.status === 0 && !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(foreign, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a lock whose holder path cannot contain a marker is stale, not a crash ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-takeover-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    // the lock's project path is a regular file: no round marker can exist beneath it
    const fileProject = path.join(home, "not-a-project");
    fs.writeFileSync(fileProject, "not a directory");
    writeMachineLock(home, { pid: 424242, project: fileProject, roundId: "20260718T000000Z-dead02", startedAt: "2026-01-01T00:00:00.000Z" });
    const env = { ...shim.env, HOME: home };
    const start = runRound(root, ["start", "--url", "https://example.test/"], env);
    const lock = JSON.parse(fs.readFileSync(path.join(home, ".agent-browser", "agent-review.lock"), "utf8"));
    check("start takes over a lock whose holder path cannot contain a marker, without a stack trace",
      lock.project === root && !/node:fs|ENOTDIR/.test(start.stderr));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a holder marker that cannot be probed gets a named refusal, not a stack trace ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-takeover-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const noAccess = path.join(home, "no-access-project");
    fs.mkdirSync(noAccess);
    fs.chmodSync(noAccess, 0o000);
    writeMachineLock(home, { pid: 424242, project: noAccess, roundId: "20260718T000000Z-dead03", startedAt: "2026-01-01T00:00:00.000Z" });
    const env = { ...shim.env, HOME: home };
    const start = runRound(root, ["start", "--url", "https://example.test/"], env);
    fs.chmodSync(noAccess, 0o700);
    check("start refuses an unprobeable holder marker with a named message and keeps the lock",
      start.status !== 0 && /cannot probe the round marker/.test(start.stderr) &&
      !/^\s*(at |node:internal|node:fs|Error:|TypeError:)/m.test(start.stderr) &&
      fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- abort treats a same-project lock naming another round as its own cleanup state ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-otherround-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const otherRound = "20260718T000000Z-d4e5f6";
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker("20260718T000000Z-a1b2c3")));
    writeMachineLock(home, { pid: 424242, project: root, roundId: otherRound, startedAt: "2026-01-01T00:00:00.000Z" });
    const abort = runRound(root, ["abort"], { ...shim.env, HOME: home });
    const journal = abJournalLines(shim.journal);
    check("abort stops the shared capture when the lock names another round of this project",
      abort.status === 0 && !activeMarker(root) && journal.some((l) => /record stop/.test(l)));
    check("abort keeps a lock that names another round of this project",
      JSON.parse(fs.readFileSync(path.join(home, ".agent-browser", "agent-review.lock"), "utf8")).roundId === otherRound);
    // the capture is stopped because it may be this project's leftover; the session is not,
    // because the round still named by the lock may be driving it right now
    check("abort leaves the browser session open when the lock names another round",
      !journal.includes("close"));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- abort never reads or writes through a symlinked raw capture leaf ----
  {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-harleaf-abort-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const roundId = "20260718T000000Z-ab7eaf";
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(abMarker(roundId)));
    const partial = path.join(root, ".agent-review", `.partial-${roundId}`);
    fs.mkdirSync(partial);
    const outside = path.join(root, "outside.har");
    fs.symlinkSync(outside, path.join(partial, "network.raw.har"));
    writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
    const abort = runRound(root, ["abort"], { ...shim.env, HOME: home });
    check("abort with a symlinked raw capture leaf clears the round and releases the lock without writing through it",
      abort.status === 0 && !fs.existsSync(path.join(root, ".agent-review", ".active.json")) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) && !fs.existsSync(outside));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a symlinked marker is removed; the file it points to is not ----
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-linkmarker-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const real = path.join(root, "real-marker.json");
    fs.writeFileSync(real, JSON.stringify(abMarker("20260718T000000Z-b771ee")));
    const marker = path.join(root, ".agent-review", ".active.json");
    fs.symlinkSync(real, marker);
    const abort = runRound(root, ["abort"], { HOME: home });
    let linkGone = false;
    try { fs.lstatSync(marker); } catch { linkGone = true; }
    check("abort removes a symlinked marker without touching the file it points to",
      abort.status === 0 && linkGone && fs.existsSync(real));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }

  // ---- a parseable marker that fails validation is cleared, and an owned lock is released ----
  for (const [label, mutate] of [
    ["a backend that is not recognized", (m) => { m.backend = "nonsense"; }],
    ["a partialDir that disagrees with the round id", (m) => { m.partialDir = ".partial-20260101T000000Z-ffffff"; }],
    ["a non-integer segment cursor", (m) => { m.segments = [{ id: "s-0001", cursor: "7" }]; m.currentSegmentId = "s-0001"; }],
  ]) {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-invalidmark-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const roundId = "20260718T000000Z-c881ff";
    const m = abMarker(roundId);
    mutate(m);
    fs.writeFileSync(path.join(root, ".agent-review", ".active.json"), JSON.stringify(m));
    writeMachineLock(home, { pid: 424242, project: root, roundId, startedAt: "2026-01-01T00:00:00.000Z" });
    const abort = runRound(root, ["abort"], { ...shim.env, HOME: home });
    check(`abort clears a marker with ${label} and releases the machine lock this project owns`,
      abort.status === 0 && !fs.existsSync(path.join(root, ".agent-review", ".active.json")) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) &&
      abJournalLines(shim.journal).some((l) => /record stop/.test(l)));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- a poisoned artifact root cannot trap the machine lock this project owns ----
  for (const [label, poison] of [
    ["a regular file", (ar) => fs.writeFileSync(ar, "not a directory")],
    ["a symlink", (ar, root) => fs.symlinkSync(path.join(root, "elsewhere"), ar)],
  ]) {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
    const shim = installAbShim(shimDir);
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-poisonroot-")));
    const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
    writeMachineLock(home, { pid: 424242, project: root, roundId: "20260718T000000Z-d991aa", startedAt: "2026-01-01T00:00:00.000Z" });
    poison(path.join(root, ".agent-review"), root);
    const abort = runRound(root, ["abort"], { ...shim.env, HOME: home });
    check(`abort with an artifact root that is ${label} still releases the machine lock this project owns`,
      abort.status === 0 &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")) &&
      abJournalLines(shim.journal).some((l) => /record stop/.test(l)) &&
      !/^\s*(at |node:internal|node:fs|Error:|TypeError:)/m.test(abort.stderr));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  fs.rmSync(fakeHome, { recursive: true, force: true });

  // ---- server state file: a poisoned port is refused before any request is made ----
  console.log("\n-- server state file --");
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-srvstate-")));
    fs.mkdirSync(path.join(root, ".agent-review"));
    const sleeper = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
    // answers health exactly like the real server would, so a made request is detectable
    let hits = 0;
    const listener = http.createServer((req, res) => {
      hits++;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, project: root, pid: sleeper.pid }));
    });
    await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
    const lport = listener.address().port;
    const stateFile = path.join(root, ".agent-review", ".server.json");
    const token = crypto.randomBytes(18).toString("base64url");
    for (const [label, port] of [
      ["a port that smuggles a host", `80@127.0.0.1:${lport}`],
      ["a non-integer port", `${lport}`],
    ]) {
      hits = 0;
      fs.writeFileSync(stateFile, JSON.stringify({ pid: sleeper.pid, port, token, project: root, startedAt: new Date().toISOString() }));
      const r = spawnSync(process.execPath, [SERVER, "stop", "--project", root], { encoding: "utf8" });
      let alive = true;
      try { process.kill(sleeper.pid, 0); } catch { alive = false; }
      check(`stop refuses a state file with ${label} before any request is made`,
        r.status === 0 && hits === 0 && alive && /no review server running/.test(r.stdout));
    }
    listener.close();
    sleeper.kill("SIGTERM");
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// ---------- durable-evidence content checks ----------

// A PATH-shim standing in for the agent-browser CLI, complete enough to drive a full
// start -> run -> stop round: it models the in-page recorder buffer (mark/drain/confirm over
// the base64 eval channel, with a boot id per document and a boot frame per fresh document),
// writes a stub video on record stop, and writes the network capture on har stop — a valid
// capture carrying cookies, bodies, and token URLs, or a malformed file under the
// malformed-har scenario. Every invocation is journaled so lifecycle order (capture start
// before navigation, drain before command, capture teardown order) can be asserted.
// Behaviour is keyed by AR_AB_SHIM_SCENARIO (comma-separated tags); state rides
// AR_AB_SHIM_STATE between invocations. No backticks / ${} so it rides String.raw.
const AB_ROUND_SHIM_SRC = String.raw`#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const args = process.argv.slice(2);
const scenario = process.env.AR_AB_SHIM_SCENARIO || "happy";
const stateFile = process.env.AR_AB_SHIM_STATE;
const journalFile = process.env.AR_AB_SHIM_JOURNAL;
function has(tag) { return scenario.split(",").indexOf(tag) >= 0; }
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch (e) { return {}; } }
function saveState(x) { try { fs.writeFileSync(stateFile, JSON.stringify(x)); } catch (e) {} }
function journal(line) { if (journalFile) { try { fs.appendFileSync(journalFile, line.slice(0, 160) + "\n"); } catch (e) {} } }
function b64(v) { process.stdout.write(Buffer.from(JSON.stringify(v), "utf8").toString("base64")); }
function mkFrame(i, kind, data) { return { i: i, t: i, dt: 1, kind: kind, data: data, nearbyEvent: null, mutations: [], values: {}, text: "" }; }
function pushFrame(s, kind, data) {
  s.buf = s.buf || []; s.nextI = s.nextI || 0;
  s.buf.push(mkFrame(s.nextI, kind, data));
  s.nextI++;
}
// A fresh document boots a new recorder id with an empty buffer and a boot frame, like the
// real recorder reinjected after a navigation. s.boot === null models a live document the
// recorder has not been injected into yet (evals find no window.__rec).
function bootDocument(s) {
  s.bootSeq = (s.bootSeq || 0) + 1;
  s.boot = "boot-" + s.bootSeq;
  s.buf = []; s.nextI = 0;
  pushFrame(s, "sync", { id: "boot", wallTimeMs: 1 });
}
function curBoot(s) { return s.boot === undefined ? "boot-1" : s.boot; }
const sub = args[0];
const s = loadState();
if (sub === "--version") { journal("--version"); process.stdout.write("agent-browser " + (process.env.AR_AB_SHIM_VERSION || "0.32.1")); process.exit(0); }
if (sub === "record") {
  journal(args.join(" "));
  if (args[1] === "start") { s.videoPath = args[2]; saveState(s); }
  // the artifact only lands on stop, so the no-artifact scenario can fail the nonempty check
  if (args[1] === "stop" && s.videoPath && !has("no-artifact")) { try { fs.writeFileSync(s.videoPath, Buffer.alloc(1024, 3)); } catch (e) {} }
  if (args[1] === "stop") { s.stopped = true; saveState(s); }
  // a mutation landing while the capture tears down: buffered before the runner's final drain
  if (args[1] === "stop" && has("stop-tail")) { pushFrame(s, "mutation", {}); saveState(s); }
  process.exit(0);
}
if (sub === "network") {
  journal(args.join(" "));
  if (args[1] === "har" && args[2] === "stop") {
    const out = args[3];
    try {
      if (has("malformed-har")) {
        fs.writeFileSync(out, "{ \"notalog\": true }");
      } else {
        fs.writeFileSync(out, JSON.stringify({ log: { entries: [ {
          request: { url: "https://app.example.test/login?token=shh", method: "POST",
            headers: [ { name: "Cookie", value: "sessionid=abc123secret" }, { name: "Accept", value: "text/html" } ],
            cookies: [ { name: "sessionid", value: "abc123secret" } ],
            postData: { mimeType: "application/x-www-form-urlencoded", text: "password=hunter2" } },
          response: { status: 200,
            headers: [ { name: "Set-Cookie", value: "sessionid=def456secret" } ],
            cookies: [], content: { mimeType: "text/html", text: "<html>secret body</html>" }, redirectURL: "" }
        } ] } }));
      }
    } catch (e) {}
  }
  process.exit(0);
}
if (sub === "open") { journal(args.join(" ")); process.exit(0); }
// closing the shared session: a lifecycle call like record/network, journaled on its own so
// the operator-command scenarios below can never stand in for it
if (sub === "close") { journal(args.join(" ")); process.exit(0); }
if (sub === "eval") {
  const code = args[args.length - 1];
  // the operator closed the browser window mid-stop: every eval fails once recording stopped
  if (has("browser-gone-after-record-stop") && s.stopped) { process.stderr.write("target closed"); process.exit(1); }
  if (code.indexOf("DomRecorder") >= 0) {
    journal("eval boot");
    if (!s.boot) { bootDocument(s); saveState(s); }
    b64(s.boot); process.exit(0);
  }
  if (code.indexOf("drainSince") >= 0) {
    const m = /drainSince\((-?\d+)\)/.exec(code);
    const c = m ? parseInt(m[1], 10) : -1;
    journal("eval drainSince " + c);
    // a buffer that evicted frames before this drain: the retained window starts late, once
    if (has("overflow") && !s.ovDone) {
      s.ovDone = true; saveState(s);
      b64({ bootId: curBoot(s), frames: [mkFrame(c + 3, "mutation", {}), mkFrame(c + 4, "mutation", {})], firstRetained: c + 3, monoNow: 0, wallNow: 1 });
      process.exit(0);
    }
    const buf = s.buf || [];
    const avail = buf.filter(function (f) { return f.i > c; });
    b64({ bootId: curBoot(s), frames: avail, firstRetained: buf.length ? buf[0].i : (s.nextI || 0), monoNow: 0, wallNow: 1 });
    process.exit(0);
  }
  if (code.indexOf("confirmDrain") >= 0) {
    const m = /confirmDrain\((-?\d+)\)/.exec(code);
    const c = m ? parseInt(m[1], 10) : -1;
    journal("eval confirmDrain " + c);
    s.buf = (s.buf || []).filter(function (f) { return f.i > c; });
    saveState(s); b64(true); process.exit(0);
  }
  if (code.indexOf("arRedactProbe") >= 0) {
    journal("eval redactProbe");
    if (has("bad-redact")) { b64({ ok: false, selector: "..bad..", message: "SyntaxError: '..bad..' is not a valid selector" }); process.exit(0); }
    b64({ ok: true }); process.exit(0);
  }
  if (code.indexOf("markAction") >= 0) {
    const mn = (/"name":"((?:\\.|[^"\\])*)"/.exec(code) || [])[1] || "action";
    const mt = (/"target":("(?:\\.|[^"\\])*"|null)/.exec(code) || [])[1] || "null";
    const mo = (/"note":("(?:\\.|[^"\\])*"|null)/.exec(code) || [])[1] || "null";
    journal("eval markAction " + mn);
    const data = { name: mn, target: mt === "null" ? null : JSON.parse(mt) };
    if (mo !== "null") data.note = JSON.parse(mo);
    pushFrame(s, "action", data);
    saveState(s); b64(true); process.exit(0);
  }
  if (code.indexOf("markSync") >= 0) {
    const mid = (/"id":"([^"]*)"/.exec(code) || [])[1] || "sync";
    journal("eval markSync " + mid);
    // the recorder accepts the mark call but never keeps the frame: the cutoff never lands
    if (has("no-end-mark") && mid === "end") { b64(null); process.exit(0); }
    pushFrame(s, "sync", { id: mid, wallTimeMs: 1 });
    saveState(s); b64(true); process.exit(0);
  }
  if (code.indexOf("clearSync") >= 0) { journal("eval clearSync"); b64(true); process.exit(0); }
  if (code.indexOf("location.href") >= 0) { journal("eval url"); b64("https://app.example.test/"); process.exit(0); }
  if (code.indexOf("innerWidth") >= 0) { journal("eval viewport"); b64({ width: 1280, height: 720, dpr: 1 }); process.exit(0); }
  if (code.indexOf("bootId") >= 0) { journal("eval bootId"); b64(curBoot(s)); process.exit(0); }
  journal("eval other");
  b64(null); process.exit(0);
}
// a forwarded operator command (round.mjs run -- ...). Scenario effects on the command are
// one entry each in this table; anything without an effect succeeds with the usual Done.
journal(args.join(" "));
const COMMAND_EFFECTS = {
  bootflip: function () { s.boot = null; s.buf = []; s.nextI = 0; saveState(s); },
};
for (const tag of Object.keys(COMMAND_EFFECTS)) { if (has(tag)) COMMAND_EFFECTS[tag](); }
if (has("run-fail")) { process.stderr.write("agent-browser: " + sub + " failed\n"); process.exit(1); }
// a command the OS kills mid-run: the child dies by signal with no exit status at all
if (has("run-signal")) { process.kill(process.pid, "SIGTERM"); }
// a command whose output blows past the runner's buffer ceiling
if (has("run-flood")) { process.stdout.write(Buffer.alloc(1024 * 1024, 120).toString()); process.exit(0); }
process.stdout.write("Done");
process.exit(0);
`;

function newAbRoundProject(scenario) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-abround-")));
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-home-")));
  const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-abshim-"));
  const bin = path.join(shimDir, "agent-browser");
  fs.writeFileSync(bin, AB_ROUND_SHIM_SRC, { mode: 0o755 });
  fs.chmodSync(bin, 0o755);
  const journal = path.join(shimDir, "ab-journal.log");
  const env = {
    PATH: `${shimDir}${path.delimiter}${process.env.PATH}`,
    HOME: home,
    AR_AB_SHIM_STATE: path.join(shimDir, "ab-state.json"),
    AR_AB_SHIM_JOURNAL: journal,
    AR_AB_SHIM_SCENARIO: scenario,
  };
  return { root, home, shimDir, env, journal };
}

// Every network.raw.har leaf under a directory (test-side walk; symlinks never followed).
function rawCapturesUnder(base) {
  const found = [];
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      let lst = null;
      try { lst = fs.lstatSync(p); } catch { continue; }
      if (lst.isSymbolicLink()) continue;
      if (lst.isDirectory()) walk(p);
      else if (name === "network.raw.har") found.push(p);
    }
  };
  walk(base);
  return found;
}

// Load recorder.js with just enough DOM to boot it and fire capture-phase events at it.
// opts can supply a fetch stub, an operator selector list, and a querySelectorAll behaviour.
function loadRecorderWithDom(opts = {}) {
  const src = fs.readFileSync(RECORDER_JS, "utf8");
  const mkEl = () => ({ setAttribute() {}, appendChild() {}, remove() {}, style: {}, textContent: "" });
  const handlers = {};
  const documentStub = {
    body: { innerText: "", querySelectorAll: opts.querySelectorAll || (() => ({ forEach: () => {} })) },
    documentElement: { appendChild() {} },
    createElement: () => mkEl(),
    addEventListener: (type, fn) => { handlers[type] = fn; },
    removeEventListener: () => {},
  };
  const win = { addEventListener: () => {}, removeEventListener: () => {} };
  if (opts.fetch) win.fetch = opts.fetch;
  if (opts.redact) win.__arRedact = opts.redact;
  const ctx = {
    window: win, crypto: globalThis.crypto, TextEncoder, JSON, Math, URL, URLSearchParams,
    performance: { now: () => 0 }, document: documentStub,
    history: { pushState: () => {}, replaceState: () => {} },
    MutationObserver: class { observe() {} disconnect() {} },
    setTimeout: () => {}, queueMicrotask: () => {},
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return { api: win.AgentReviewRecorder, handlers, win };
}

async function evidenceContentSuite() {
  console.log("\n-- durable evidence content --");

  // ---- unit: command labels are deny-by-default; only a generated element ref survives ----
  check("a generated element ref is kept as the action target",
    JSON.stringify(actionTarget(["click", "@e12"])) === JSON.stringify({ name: "click", target: "@e12" }));
  check("a selector carrying personal data collapses to a fixed marker",
    JSON.stringify(actionTarget(["click", '[data-email="someone@example.test"]'])) === JSON.stringify({ name: "click", target: "(selector)" }));
  check("a typed fill value never reaches the label",
    JSON.stringify(actionTarget(["fill", "#login-password", "hunter2"])) === JSON.stringify({ name: "fill", target: "(selector)" }));
  check("a script body collapses to a fixed script label",
    JSON.stringify(actionTarget(["eval", "document.querySelector('video').play()"])) === JSON.stringify({ name: "eval", target: "(script)" }));
  check("a navigation URL collapses to a fixed navigation label",
    JSON.stringify(actionTarget(["open", "https://user:pw@app.example.test/admin?token=x"])) === JSON.stringify({ name: "open", target: "(navigation)" }));
  check("a file path collapses to a fixed file label",
    JSON.stringify(actionTarget(["upload", "/Users/alice/secret-tax-return.pdf"])) === JSON.stringify({ name: "upload", target: "(file)" }));
  check("a keyboard command collapses to a fixed keyboard label",
    JSON.stringify(actionTarget(["keyboard", "type", "@e1", "hello"])) === JSON.stringify({ name: "keyboard", target: "(keyboard)" }));
  check("a key press is labelled as a key, never a selector, and the key name stays denied",
    JSON.stringify(actionTarget(["press", "Enter"])) === JSON.stringify({ name: "press", target: "(key)" }));
  check("an unrecognised command contributes no argument",
    JSON.stringify(actionTarget(["frobnicate", "--url", "https://x.test"])) === JSON.stringify({ name: "frobnicate", target: null }));
  check("the action name is normalized to the verb",
    JSON.stringify(actionTarget(["CLICK", "@e3"])) === JSON.stringify({ name: "click", target: "@e3" }));

  // ---- unit: the recorder boots window-first in a bare VM and exposes its API ----
  {
    const api = loadRecorder();
    check("the recorder loads window-first in a bare VM and exposes its API",
      !!api && typeof api.DomRecorder === "function" && !!api.REDACTION && typeof api.REDACTION.redactUrl === "function");
  }

  // ---- unit: a malformed capture is a sanitizer failure, never promoted as sanitized ----
  for (const bad of [null, {}, { log: {} }, { log: { entries: "nope" } }]) {
    let threw = false;
    try { sanitizeHar(bad); } catch { threw = true; }
    check(`a malformed capture is rejected by the sanitizer (${JSON.stringify(bad)})`, threw);
  }

  // ---- unit: individual keystrokes never reach the recorded timeline ----
  {
    const { api, handlers } = loadRecorderWithDom();
    const rec = new api.DomRecorder();
    rec.start();
    const inputEl = {
      nodeType: 1, type: "text", name: "q", id: "", tagName: "INPUT", className: "",
      attributes: [], getAttribute: () => null, hasAttribute: () => false,
    };
    const typed = "s3cret!";
    for (const ch of typed) handlers.keydown({ type: "keydown", key: ch, target: inputEl });
    rec._push("mutation", {});
    const timeline = JSON.stringify(rec.frames);
    const reassembled = rec.frames.map((f) => (f.nearbyEvent && f.nearbyEvent.key) || "").join("");
    check("a typed string cannot be reassembled from the recorded timeline",
      reassembled !== typed && reassembled === "" && !timeline.includes('"key"'));
  }

  // ---- unit: the recorder source carries no per-keystroke capture path at all ----
  {
    const src = fs.readFileSync(RECORDER_JS, "utf8");
    check("no per-keystroke frame assignment exists in the recorder source", !/rec\.key\s*=/.test(src));
    check("no single-character key test exists in the recorder source", !/key\.length\s*===?\s*1/.test(src));
  }

  // ---- parity: one adversarial table, asserted against BOTH redaction paths ----
  // The Node path is the runner's redactUrl (round.mjs re-exports the shared core); the
  // recorder path is the same file loaded as a classic script into a bare VM — the two ways
  // the policy is actually loaded. Equal output on every row is the no-drift guarantee.
  {
    const pageRedact = loadRecorder().REDACTION.redactUrl;
    const CASES = [
      ["OAuth code and state parameters", "https://app.example.test/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj",
        (o) => o === "https://app.example.test/callback?code=%5Bredacted%5D&state=%5Bredacted%5D"],
      ["URL userinfo", "https://alice:hunter2@example.test/app",
        (o) => o === "https://example.test/app"],
      ["a credential-bearing fragment", "https://app.example.test/cb#access_token=YA29SECRET",
        (o) => o === "https://app.example.test/cb#[redacted]"],
      ["a bare token-like fragment", "https://app.example.test/cb#ya29S3cretBearerToken9876",
        (o) => o === "https://app.example.test/cb#[redacted]"],
      ["a hash-router route fragment survives", "https://app.example.test/#/settings/users",
        (o) => o === "https://app.example.test/#/settings/users"],
      ["an anchor fragment survives", "https://app.example.test/docs#usage",
        (o) => o === "https://app.example.test/docs#usage"],
      ["ordinary parameter names sharing credential substrings survive", "https://x.test/?author=12&assignee=alice&design=dark&discard=1&wildcard=x&scorecard=9",
        (o) => o === "https://x.test/?author=12&assignee=alice&design=dark&discard=1&wildcard=x&scorecard=9"],
      ["boundary-anchored credential parameters redact", "https://x.test/?auth_token=a&card_number=4111&x-otp=123",
        (o) => !o.includes("auth_token=a") && !o.includes("4111") && !o.includes("123") && (o.match(/redacted/g) || []).length === 3],
      ["an authorization parameter redacts", "https://x.test/cb?authorization=AUTHZVALUE99",
        (o) => o === "https://x.test/cb?authorization=%5Bredacted%5D"],
      ["second-factor and key-material parameters redact", "https://x.test/?otp=483920&mfa=223311&jwt=eyJhbGciOiJIUzI1NiJ9&backup_code=a7f3",
        (o) => !o.includes("483920") && !o.includes("223311") && !o.includes("eyJhbGciOiJIUzI1NiJ9") && !o.includes("a7f3")],
      ["card, CVV, and SSN parameter names", "https://x.test/pay?card_number=4111&cvv=123&ssn=123-45-6789",
        (o) => !o.includes("4111") && !o.includes("123-45-6789") && (o.match(/redacted/g) || []).length === 3],
      ["a secret-bearing path segment", "https://x.test/reset/0123456789abcdef0123456789abcdef?next=/home",
        (o) => o === "https://x.test/reset/[redacted]?next=/home"],
      ["a relative URL keeps its relative shape", "/reset/0123456789abcdef0123456789abcdef?token=abc123",
        (o) => o === "/reset/[redacted]?token=%5Bredacted%5D"],
      ["an ordinary URL survives unchanged", "https://x.test/docs/api?status_code=200&postcode=SW1A1AA",
        (o) => o === "https://x.test/docs/api?status_code=200&postcode=SW1A1AA"],
      ["ordinary path segments survive unchanged", "https://x.test/users/12345/session/42",
        (o) => o === "https://x.test/users/12345/session/42"],
    ];
    for (const [name, input, ok] of CASES) {
      const nodeOut = redactUrl(input);
      const pageOut = pageRedact(input);
      check(`redaction parity: ${name}`, nodeOut === pageOut && ok(nodeOut));
    }

    // redirects and all three URL-valued headers inherit the same URL rules
    const har = { log: { entries: [ {
      request: { url: "https://app.example.test/cb?code=SplxlOBeZQQYbYS6WxSbIA", headers: [
        { name: "Referer", value: "https://x.test/from?state=af0ifjsldkj" },
        { name: "Referrer", value: "https://x.test/from2?code=abc" },
        { name: "Accept", value: "text/html" },
      ], cookies: [] },
      response: { status: 302, headers: [
        { name: "Location", value: "https://user:hunter2@x.test/next#ya29S3cretBearerToken9876" },
      ], cookies: [], redirectURL: "https://x.test/cb?assertion=ya29.TOKEN" },
    } ] } };
    sanitizeHar(har);
    const ent = har.log.entries[0];
    check("redaction parity: redirect and all three URL-valued headers are redacted as URLs",
      ent.request.url === "https://app.example.test/cb?code=%5Bredacted%5D" &&
      ent.request.headers[0].value === "https://x.test/from?state=%5Bredacted%5D" &&
      ent.request.headers[1].value === "https://x.test/from2?code=%5Bredacted%5D" &&
      ent.request.headers[2].value === "text/html" &&
      ent.response.headers[0].value === "https://x.test/next#[redacted]" &&
      ent.response.redirectURL === "https://x.test/cb?assertion=%5Bredacted%5D");

    // a capture's structured query entries are redacted by parameter name, independent of the URL
    const qsHar = { log: { entries: [ {
      request: { url: "https://app.example.test/cb", queryString: [
        { name: "code", value: "AUTHCODE123456" },
        { name: "q", value: "ordinary" },
      ], headers: [], cookies: [] },
      response: { headers: [], cookies: [], content: {} },
    } ] } };
    sanitizeHar(qsHar);
    const qs = qsHar.log.entries[0].request.queryString;
    check("a capture's query entries are redacted by parameter name",
      qs[0].value === "[redacted]" && qs[1].value === "ordinary");
  }

  // ---- unit: the exported policy view is inert — page code cannot mutate it ----
  {
    const R = loadRecorder().REDACTION;
    try { R.exactParams.push("status_code"); } catch {}
    try { R.autocomplete.length = 0; } catch {}
    try { R.redactUrl = () => "tampered"; } catch {}
    try { R.isSensitiveParam = () => false; } catch {}
    check("the exported redaction policy ignores mutation attempts",
      Object.isFrozen(R) && Object.isFrozen(R.exactParams) && Object.isFrozen(R.autocomplete) &&
      R.redactUrl("https://x.test/?code=abc").includes("redacted") &&
      R.isSensitiveParam("status_code") === false);
  }

  // ---- unit: a failed request records the error name, never its message ----
  {
    const { api, win } = loadRecorderWithDom({ fetch: () => Promise.reject(new Error("Bearer S3cretBearer")) });
    const rec = new api.DomRecorder();
    rec.start();
    await win.fetch("/reset/0123456789abcdef0123456789abcdef").catch(() => {});
    const fstart = rec.frames.find((f) => f.kind === "fetch:start");
    const ferr = rec.frames.find((f) => f.kind === "fetch:error");
    check("a failed request records the error name, never its message",
      !!ferr && ferr.data.error === "Error" && !JSON.stringify(ferr).includes("S3cretBearer"));
    check("a secret-bearing path segment is redacted in the recorded fetch URL",
      !!fstart && fstart.data.url === "/reset/[redacted]");
  }

  // ---- unit: sensitive controls are keyed by position; a container selector covers its fields ----
  {
    const mkControl = (over) => ({
      nodeType: 1, type: "text", name: "", id: "", tagName: "INPUT", className: "",
      attributes: [], getAttribute: () => null, hasAttribute: () => false,
      matches: () => false, closest: () => null, value: "", ...over,
    });
    const ordinary = mkControl({ id: "q", value: "hello" });
    const sensitive = mkControl({ id: "ssn-123-45-6789", value: "123-45-6789" });
    const boxed = mkControl({ value: "boxed-value", closest: (s) => (s === ".private" ? { nodeType: 1 } : null) });
    const controls = [ordinary, sensitive, boxed];
    const { api } = loadRecorderWithDom({
      redact: [".private"],
      querySelectorAll: (selStr) => ({ forEach: (fn) => { if (selStr === "input,select,textarea") controls.forEach(fn); } }),
    });
    const rec = new api.DomRecorder();
    rec.start();
    rec._push("mutation", {});
    const values = rec.frames[rec.frames.length - 1].values;
    check("a sensitive control is keyed by position, never its identifier",
      values["(field 1)"] === "[redacted]" && values["#q"] === "hello" && !JSON.stringify(values).includes("ssn-123-45-6789"));
    check("a container selector protects the controls inside it",
      values["(field 2)"] === "[redacted]" && !JSON.stringify(values).includes("boxed-value"));
  }

  // ---- unit: a sensitive control is never identified by its own id/name in events or mutations ----
  {
    const pw = {
      nodeType: 1, type: "password", name: "pw", id: "pw-ssn-123-45-6789", tagName: "INPUT", className: "",
      attributes: [], getAttribute: () => null, hasAttribute: () => false, matches: () => false, closest: () => null, value: "hunter2",
    };
    const ordinary = {
      nodeType: 1, type: "text", name: "", id: "q", tagName: "INPUT", className: "",
      attributes: [], getAttribute: () => null, hasAttribute: () => false, matches: () => false, closest: () => null, value: "hello",
    };
    const { api, handlers } = loadRecorderWithDom();
    const rec = new api.DomRecorder();
    rec.start();
    handlers.focusin({ type: "focusin", target: pw });
    rec._push("mutation", {}, [{ type: "attributes", target: pw, attributeName: "value" }]);
    const frame = rec.frames[rec.frames.length - 1];
    const json = JSON.stringify(rec.frames);
    check("a sensitive control's event carries a fixed marker, never its own id or name",
      frame.nearbyEvent && frame.nearbyEvent.selector === "(sensitive field)" && !json.includes("pw-ssn-123-45-6789"));
    check("a sensitive control's mutation target carries the same fixed marker",
      frame.mutations.length === 1 && frame.mutations[0].target === "(sensitive field)");
    handlers.focusin({ type: "focusin", target: ordinary });
    rec._push("mutation", {}, [{ type: "attributes", target: ordinary, attributeName: "class" }]);
    const frame2 = rec.frames[rec.frames.length - 1];
    check("an ordinary control keeps its selector in events and mutations",
      frame2.nearbyEvent && frame2.nearbyEvent.selector === "#q" && frame2.mutations[0].target === "#q");
  }

  // ---- unit: every sensitive standardized autocomplete token redacts; ordinary fields capture ----
  {
    const mkControl = (over) => ({
      nodeType: 1, type: "text", name: "", id: "", tagName: "INPUT", className: "",
      attributes: [], getAttribute: () => null, hasAttribute: () => false,
      matches: () => false, closest: () => null, value: "", ...over,
    });
    // The name is deliberately neutral ("f" + index, no credential-shaped substring), so
    // each check can ONLY pass through the autocomplete path — removing the token from the
    // recorder's set must fail exactly that token's check. The table is asserted against the
    // recorder's own exported set in both directions so the two cannot drift apart again.
    const TOKENS = [
      "username", "current-password", "new-password", "one-time-code",
      "cc-name", "cc-given-name", "cc-additional-name", "cc-family-name",
      "cc-number", "cc-exp", "cc-exp-month", "cc-exp-year", "cc-csc", "cc-type",
      "email", "impp",
      "street-address", "address-line1", "address-line2", "address-line3",
      "address-level1", "address-level2", "address-level3", "address-level4",
      "postal-code", "country", "country-name",
      "tel", "tel-country-code", "tel-national", "tel-area-code", "tel-local",
      "tel-local-prefix", "tel-local-suffix", "tel-extension",
      "bday", "bday-day", "bday-month", "bday-year",
    ];
    const exportedTokens = loadRecorder().REDACTION.autocomplete;
    check("the autocomplete token table matches the recorder's set exactly",
      TOKENS.length === exportedTokens.length &&
      TOKENS.every((t) => exportedTokens.includes(t)) && exportedTokens.every((t) => TOKENS.includes(t)));
    TOKENS.forEach((token, i) => {
      const field = mkControl({
        name: "f" + i, value: `value-for-${token}`,
        getAttribute: (n) => (n === "autocomplete" ? token : null),
      });
      const { api } = loadRecorderWithDom({
        querySelectorAll: (s) => ({ forEach: (fn) => { if (s === "input,select,textarea") fn(field); } }),
      });
      const rec = new api.DomRecorder();
      rec.start();
      rec._push("mutation", {});
      const values = rec.frames[rec.frames.length - 1].values;
      check(`autocomplete="${token}" is redacted`,
        values["(field 0)"] === "[redacted]" && !JSON.stringify(values).includes(`value-for-${token}`));
    });
    {
      // a modifier token before the field token still redacts ("home tel" hits "tel")
      const field = mkControl({
        name: "field-modifier", value: "555-0100",
        getAttribute: (n) => (n === "autocomplete" ? "home tel" : null),
      });
      const { api } = loadRecorderWithDom({
        querySelectorAll: (s) => ({ forEach: (fn) => { if (s === "input,select,textarea") fn(field); } }),
      });
      const rec = new api.DomRecorder();
      rec.start();
      rec._push("mutation", {});
      const values = rec.frames[rec.frames.length - 1].values;
      check(`autocomplete="home tel" is redacted via the field token`,
        values["(field 0)"] === "[redacted]" && !JSON.stringify(values).includes("555-0100"));
    }
    {
      // over-redaction guard: an ordinarily-named field with NO autocomplete attribute
      // must still be captured verbatim — redacting it would gut the evidence.
      const plain = mkControl({ name: "city", value: "Springfield" });
      const { api } = loadRecorderWithDom({
        querySelectorAll: (s) => ({ forEach: (fn) => { if (s === "input,select,textarea") fn(plain); } }),
      });
      const rec = new api.DomRecorder();
      rec.start();
      rec._push("mutation", {});
      const values = rec.frames[rec.frames.length - 1].values;
      check("an ordinary field with no autocomplete attribute is captured verbatim",
        values['input[name="city"]'] === "Springfield");
    }
  }

  // ---- unit: second-factor and key-material field names redact without any autocomplete ----
  {
    const mkControl = (over) => ({
      nodeType: 1, type: "text", name: "", id: "", tagName: "INPUT", className: "",
      attributes: [], getAttribute: () => null, hasAttribute: () => false,
      matches: () => false, closest: () => null, value: "", ...over,
    });
    for (const name of ["otp", "pin", "mfa", "2fa", "verification_code", "backup_code", "recovery_code", "seed_phrase", "private_key", "jwt", "passphrase"]) {
      const field = mkControl({ name, value: `value-for-${name}` });
      const { api } = loadRecorderWithDom({
        querySelectorAll: (s) => ({ forEach: (fn) => { if (s === "input,select,textarea") fn(field); } }),
      });
      const rec = new api.DomRecorder();
      rec.start();
      rec._push("mutation", {});
      const values = rec.frames[rec.frames.length - 1].values;
      check(`an unannotated "${name}" field is redacted by name`,
        values["(field 0)"] === "[redacted]" && !JSON.stringify(values).includes(`value-for-${name}`));
    }
    // over-redaction guard: names that merely CONTAIN a credential token as a substring
    // must still be captured verbatim — boundary matching is what keeps them ordinary
    for (const name of ["author", "assignee", "design", "discard", "scorecard", "postcode"]) {
      const field = mkControl({ name, value: `value-for-${name}` });
      const { api } = loadRecorderWithDom({
        querySelectorAll: (s) => ({ forEach: (fn) => { if (s === "input,select,textarea") fn(field); } }),
      });
      const rec = new api.DomRecorder();
      rec.start();
      rec._push("mutation", {});
      const values = rec.frames[rec.frames.length - 1].values;
      check(`an ordinary "${name}" field is captured verbatim`,
        values[`input[name="${name}"]`] === `value-for-${name}`);
    }
  }

  // ---- unit: the header-name rule derives from the recorder's own credential tokens ----
  {
    // Turn a token pattern into a concrete header name: take the first alternative of every
    // optional group and one concrete separator. Written generically so adding a token with a
    // new group shape cannot silently stop exercising the rule.
    const concrete = (tok) => "x-" + tok
      .replace(/\(\?:([^)|]+)(?:\|[^)]*)?\)\?/g, "$1")
      .replace(/\[[^\]]*\]\?/g, "-");
    const tokens = loadRecorder().REDACTION.nameTokens;
    check("every credential token reaches the network-header rule",
      tokens.length > 0 && tokens.every((tok) => HAR_SECRET_NAME.test(concrete(tok))));
    const har = { log: { entries: [{
      request: { url: "http://x.test/", headers: [
        { name: "X-Card-Number", value: "4111111111111111" },
        { name: "X-OTP", value: "483920" },
        { name: "X-Private-Key", value: "-----BEGIN RSA PRIVATE KEY-----" },
        { name: "X-Request-Id", value: "rid" },
      ], cookies: [] },
      response: { headers: [], cookies: [], content: {} },
    }] } };
    sanitizeHar(har);
    const hdrs = har.log.entries[0].request.headers;
    check("card, second-factor, and key-material headers are redacted; ordinary headers kept",
      hdrs[0].value === "[redacted]" && hdrs[1].value === "[redacted]" && hdrs[2].value === "[redacted]" && hdrs[3].value === "rid");
  }

  // ---- unit: replacing the URL global after load cannot switch redaction off ----
  {
    const win = {};
    const ctx = { window: win, crypto: globalThis.crypto, TextEncoder, JSON, Math, URL, URLSearchParams,
      performance: { now: () => 0 }, document: undefined, setTimeout: () => {}, queueMicrotask: () => {} };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(RECORDER_JS, "utf8"), ctx);
    // hostile page code swaps the URL global AFTER the recorder loaded
    ctx.URL = class { constructor() { return { username: "", password: "", searchParams: new Map(), pathname: "/", hash: "" }; } };
    const out = win.AgentReviewRecorder.REDACTION.redactUrl("https://app.test/cb?code=AUTHCODE123&token=SEEKRIT");
    check("redaction survives the URL global being replaced after load",
      !out.includes("SEEKRIT") && !out.includes("AUTHCODE123") && out.includes("redacted"));
  }

  // ---- unit: an invalid operator selector surfaces; it is never silently ignored ----
  {
    const { api } = loadRecorderWithDom({
      redact: ["??"],
      querySelectorAll: (selStr) => {
        if (selStr === "??") throw new SyntaxError("'??' is not a valid selector");
        return { forEach: () => {} };
      },
    });
    const rec = new api.DomRecorder();
    let threw = false;
    try { rec.start(); rec._push("mutation", {}); } catch { threw = true; }
    check("an invalid operator selector surfaces instead of being silently ignored", threw);
  }

  // ---- lifecycle: the --redact value is one selector list, validated before any capture ----
  {
    const { root, shimDir } = newBcProject();
    const envAdds = installShim(shimDir, "happy");
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app", "--redact", ":is(.secret,.token)"], envAdds);
    const active = activeMarker(root);
    check("a comma-bearing selector list is stored whole, not split on commas",
      start.status === 0 && !!active && Array.isArray(active.redact) && active.redact.length === 1 && active.redact[0] === ":is(.secret,.token)");
    runRound(root, ["abort"], envAdds);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }
  {
    const { root, shimDir } = newBcProject();
    const envAdds = installShim(shimDir, "bad-redact");
    const start = runRound(root, ["start", "--backend", "browser-control", "--url", "https://example.test/app", "--redact", "..bad.."], envAdds);
    const journal = readJournal(envAdds);
    check("an invalid selector list fails the round before any capture and names the selector",
      start.status !== 0 && start.stderr.includes('"..bad.."') && !activeMarker(root));
    check("a failed selector validation releases the session and never starts recording",
      journal.includes("session-delete") && !journal.includes("recording-start"));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }
  {
    const { root, home, shimDir, env } = newAbRoundProject("bad-redact");
    const start = runRound(root, ["start", "--url", "https://app.example.test/", "--redact", "..bad.."], env);
    check("an invalid selector list fails an agent-browser round before the lock and names the selector",
      start.status !== 0 && start.stderr.includes('"..bad.."') && !activeMarker(root) &&
      !fs.existsSync(path.join(home, ".agent-browser", "agent-review.lock")));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    const start = runRound(root, ["start", "--url", "https://app.example.test/", "--redact", ":is(.secret,.token)"], env);
    const active = activeMarker(root);
    check("an agent-browser round accepts and stores a valid comma-bearing selector list",
      start.status === 0 && !!active && Array.isArray(active.redact) && active.redact.length === 1 && active.redact[0] === ":is(.secret,.token)");
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: a full round keeps refs, fixes labels, and sanitizes the capture ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    const start = runRound(root, ["start", "--url", "https://app.example.test/"], env);
    check("round starts with the capture shim", start.status === 0);
    for (const c of [
      ["click", "@e12"],
      ["click", '[data-email="someone@example.test"]'],
      ["eval", "document.querySelector('video').play()"],
      ["open", "https://user:pw@app.example.test/admin"],
      ["upload", "/Users/alice/secret-tax-return.pdf"],
      ["keyboard", "type", "@e1", "hello"],
      ["snapshot"],
    ]) {
      const r = runRound(root, ["run", "--", ...c], env);
      check(`run ${c[0]} exits 0`, r.status === 0);
    }
    const stop = runRound(root, ["stop", "--summary", "labels round"], env);
    check("round stops cleanly", stop.status === 0);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    const domText = rd ? fs.readFileSync(path.join(rd, "dom.json"), "utf8") : "";
    const dom = domText ? JSON.parse(domText) : null;
    const pairs = dom ? dom.segments.flatMap((sg) => sg.frames).filter((f) => f.kind === "action").map((f) => `${f.data.name}|${f.data.target}`) : [];
    check("a generated element ref survives into the timeline", pairs.includes("click|@e12"));
    check("a personal-data selector leaves only the fixed marker", pairs.includes("click|(selector)") && !domText.includes("someone@example.test"));
    check("a script body leaves only the fixed script label", pairs.includes("eval|(script)") && !domText.includes("querySelector"));
    check("a navigation URL leaves only the fixed navigation label", pairs.includes("open|(navigation)") && !domText.includes("user:pw"));
    check("a file path leaves only the fixed file label", pairs.includes("upload|(file)") && !domText.includes("secret-tax-return"));
    check("a keyboard command leaves only the fixed keyboard label", pairs.includes("keyboard|(keyboard)") && !domText.includes("hello"));
    check("an unrecognised command records the verb with no argument", pairs.includes("snapshot|null"));
    check("a sanitized network file is written", !!rd && fs.existsSync(path.join(rd, "network.har")));
    const harText = rd && fs.existsSync(path.join(rd, "network.har")) ? fs.readFileSync(path.join(rd, "network.har"), "utf8") : "";
    check("the sanitized capture carries no cookie, body, or credential content",
      !harText.includes("abc123secret") && !harText.includes("def456secret") && !harText.includes("hunter2") && !harText.includes("secret body") && !harText.includes("token=shh"));
    check("network completeness is recorded complete", !!meta && meta.completeness.network === "complete");
    check("no raw capture survives anywhere in the artifact directory", !!rd && rawCapturesUnder(path.join(root, ".agent-review")).length === 0);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: a malformed capture is a failure and leaves no raw file behind ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("malformed-har");
    runRound(root, ["start", "--url", "https://app.example.test/"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")) : null;
    check("a malformed capture is never promoted under the sanitized name",
      stop.status === 0 && !!rd && !fs.existsSync(path.join(rd, "network.har")));
    check("a malformed capture marks the network evidence partial and leaves no raw file behind",
      !!meta && meta.completeness.network === "partial" && rawCapturesUnder(path.join(root, ".agent-review")).length === 0);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: aborting a round leaves no raw capture and no sanitized network file ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    runRound(root, ["start", "--url", "https://app.example.test/"], env);
    const abort = runRound(root, ["abort"], env);
    const arBase = path.join(root, ".agent-review");
    const partials = fs.readdirSync(arBase).filter((n) => n.startsWith(".partial-"));
    check("aborting a round leaves no raw capture and no sanitized network file",
      abort.status === 0 && partials.length === 1 &&
      rawCapturesUnder(arBase).length === 0 &&
      !fs.existsSync(path.join(arBase, partials[0], "network.har")));
    check("no capture scratch directory survives termination",
      fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith("ar-netstop-")).length === 0);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: a stop that dies after the capture stops leaves no raw capture anywhere ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("browser-gone-after-record-stop");
    runRound(root, ["start", "--url", "https://app.example.test/"], env);
    const scratchBefore = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith("ar-netstop-")).length;
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    check("a stop failing after the capture stops leaves no raw capture in the package",
      stop.status !== 0 && rawCapturesUnder(path.join(root, ".agent-review")).length === 0);
    check("a stop failing after the capture stops leaves no capture scratch in the temp dir",
      fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith("ar-netstop-")).length === scratchBefore);
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- lifecycle: a symlinked comment-images leaf is refused, never promoted into a round ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    runRound(root, ["start", "--url", "https://app.example.test/"], env);
    const active = activeMarker(root);
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-outside-")));
    fs.symlinkSync(outside, path.join(root, ".agent-review", active.partialDir, "comment-images"));
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    check("stop refuses a symlinked comment-images leaf instead of promoting the package",
      stop.status !== 0 && /comment-images is a symlink/.test(stop.stderr) && !findRoundDir(root));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }

  // ---- lifecycle: start scrubs a stale raw capture, never through a symlinked leaf ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    const arBase = path.join(root, ".agent-review");
    const stale = path.join(arBase, ".partial-20260101T000000Z-01d111");
    fs.mkdirSync(stale, { recursive: true });
    fs.writeFileSync(path.join(stale, "network.raw.har"), "raw secrets");
    const outside = path.join(root, "outside-raw.har");
    fs.writeFileSync(outside, "raw secrets");
    const staleLink = path.join(arBase, ".partial-20260101T000000Z-01d222");
    fs.mkdirSync(staleLink, { recursive: true });
    fs.symlinkSync(outside, path.join(staleLink, "network.raw.har"));
    const start = runRound(root, ["start", "--url", "https://app.example.test/"], env);
    check("start scrubs a stale raw capture left by an interrupted run",
      start.status === 0 && !fs.existsSync(path.join(stale, "network.raw.har")));
    check("start never deletes through a symlinked stale leaf", fs.existsSync(outside));
    runRound(root, ["abort"], env);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }
}

// ---------- agent-browser backend lifecycle ----------

// End-to-end coverage of the default recording path: the shim above stands in for the
// agent-browser CLI on PATH, a throwaway HOME keeps the machine-wide lock hermetic, and the
// invocation journal pins down ordering the package contents alone cannot prove.
async function abLifecycleSuite() {
  console.log("\n-- agent-browser backend lifecycle --");

  const lockPath = (home) => path.join(home, ".agent-browser", "agent-review.lock");
  const readLock = (home) => { try { return JSON.parse(fs.readFileSync(lockPath(home), "utf8")); } catch { return null; } };
  const journalLines = (file) => { try { return fs.readFileSync(file, "utf8").split("\n").filter(Boolean); } catch { return []; } };
  const frameLogText = (root, partialDir, segId) => {
    if (!partialDir) return "";
    try { return fs.readFileSync(path.join(root, ".agent-review", partialDir, `frames-${segId}.jsonl`), "utf8"); } catch { return ""; }
  };
  const frameLog = (root, partialDir, segId) => frameLogText(root, partialDir, segId).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const readMeta = (rd) => { try { return JSON.parse(fs.readFileSync(path.join(rd, "meta.json"), "utf8")); } catch { return null; } };
  const cleanup = (root, home, shimDir) => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  };

  // ---- start -> run -> stop on the default backend ----
  {
    const { root, home, shimDir, env, journal } = newAbRoundProject("happy");
    const start = runRound(root, ["start", "--url", "https://example.test/app"], env);
    const active = activeMarker(root);
    check("ab start leaves an active marker naming the round and the agent-browser backend",
      start.status === 0 && !!active && /^\d{8}T\d{6}Z-[0-9a-f]{6}$/.test(active.roundId || "") && active.backend === "agent-browser");
    const lock = readLock(home);
    check("ab start acquires the machine-wide lock naming this project and round",
      !!active && !!lock && lock.project === root && lock.roundId === active.roundId);
    const jStart = journalLines(journal);
    const recStartIdx = jStart.findIndex((l) => l.startsWith("record start"));
    const openIdx = jStart.findIndex((l) => l === "open https://example.test/app");
    // the session is parked on a neutral page before capture starts and the round's URL is
    // opened only after, so the video cannot open on what the session was showing beforehand
    const neutralIdx = jStart.indexOf("open about:blank");
    check("ab start begins video capture on a neutral page, then opens the round URL",
      neutralIdx !== -1 && recStartIdx !== -1 && openIdx !== -1 &&
      neutralIdx < recStartIdx && recStartIdx < openIdx &&
      !jStart.slice(0, recStartIdx).some((l) => l.startsWith("open ") && l !== "open about:blank"));
    const segFrames = frameLog(root, active && active.partialDir, "s-0001");
    check("ab start boots the recorder and anchors the first segment on the opened document",
      !!active && active.segments.length === 1 && active.segments[0].bootId === "boot-1" &&
      segFrames.some((f) => f.kind === "sync" && f.data && f.data.id === "boot"));

    const runClick = runRound(root, ["run", "--", "click", "@e12"], env);
    check("ab run forwards the operator command to the agent-browser CLI",
      runClick.status === 0 && journalLines(journal).includes("click @e12"));
    const runFill = runRound(root, ["run", "--", "fill", "@e15", "hunter2"], env);
    const jFill = journalLines(journal);
    const cmdIdx = jFill.lastIndexOf("fill @e15 hunter2");
    const markIdx = cmdIdx === -1 ? -1 : jFill.slice(0, cmdIdx).reduce((acc, l, i) => (l.startsWith("eval markAction") ? i : acc), -1);
    check("ab run drains the intent marker before the command runs",
      runFill.status === 0 && markIdx !== -1 && cmdIdx > markIdx &&
      jFill.slice(markIdx, cmdIdx).some((l) => l.startsWith("eval drainSince")));
    const framesText = frameLogText(root, active && active.partialDir, "s-0001");
    const fillFrame = frameLog(root, active && active.partialDir, "s-0001").find((f) => f.kind === "action" && f.data && f.data.name === "fill");
    check("ab run records the action frame with the generated element ref and nothing else",
      !!fillFrame && fillFrame.data.target === "@e15" && !framesText.includes("hunter2"));

    const stop = runRound(root, ["stop", "--summary", "ab round"], env);
    const rd = findRoundDir(root);
    const meta = rd ? readMeta(rd) : null;
    check("ab stop promotes the partial package with meta, dom, and network evidence",
      stop.status === 0 && !!rd &&
      fs.existsSync(path.join(rd, "meta.json")) && fs.existsSync(path.join(rd, "dom.json")) && fs.existsSync(path.join(rd, "network.har")) &&
      fs.readdirSync(path.join(root, ".agent-review")).every((n) => !n.startsWith(".partial-")));
    check("ab stop clears the marker and releases the machine-wide lock",
      stop.status === 0 && !activeMarker(root) && !fs.existsSync(lockPath(home)));
    const jStop = journalLines(journal);
    const closeIdx = jStop.indexOf("close");
    check("ab stop closes the browser session the round started, after the video is saved",
      closeIdx !== -1 && closeIdx > jStop.lastIndexOf("record stop"));
    check("ab stop reports a clean round's completeness honestly",
      !!meta && meta.completeness.video === "complete" && meta.completeness.dom === "complete" &&
      meta.completeness.network === "complete" && meta.completeness.gaps.length === 0);
    cleanup(root, home, shimDir);
  }

  // ---- a command that replaces the document mid-round ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("bootflip");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const run = runRound(root, ["run", "--", "click", "@e2"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? readMeta(rd) : null;
    let dom = null;
    try { dom = rd ? JSON.parse(fs.readFileSync(path.join(rd, "dom.json"), "utf8")) : null; } catch {}
    const seg1 = dom && dom.segments.find((s) => s.id === "s-0001");
    const seg2 = dom && dom.segments.find((s) => s.id === "s-0002");
    const intent = seg1 && seg1.frames.find((f) => f.kind === "action" && f.data && f.data.name === "click");
    check("ab a command spanning a document change keeps the intent marker in the outgoing segment",
      run.status === 0 && stop.status === 0 && !!dom && dom.segments.length === 2 &&
      !!intent && intent.data.target === "@e2" && !intent.data.note);
    const boundary = seg2 && seg2.frames.find((f) => f.kind === "action" && f.data && typeof f.data.note === "string" && f.data.note.startsWith("boundary:"));
    check("ab a command spanning a document change lands the boundary marker in the new segment",
      !!boundary && boundary.data.name === "click" && boundary.data.target === "@e2");
    check("ab a document change mid-command records a navigation-tail gap on the outgoing segment",
      !!meta && meta.completeness.gaps.some((g) => g.segmentId === "s-0001" && g.reason === "navigation-tail"));
    cleanup(root, home, shimDir);
  }

  // ---- abort releases everything, and the machine is immediately reusable ----
  {
    const { root, home, shimDir, env, journal } = newAbRoundProject("happy");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const abort = runRound(root, ["abort"], env);
    check("ab abort clears the marker and releases the machine-wide lock",
      abort.status === 0 && !activeMarker(root) && !fs.existsSync(lockPath(home)));
    const j = journalLines(journal);
    const harStopIdx = j.findIndex((l) => l.startsWith("network har stop"));
    const recStopIdx = j.findIndex((l) => l === "record stop");
    check("ab abort stops the network capture before the video recorder", harStopIdx !== -1 && recStopIdx !== -1 && harStopIdx < recStopIdx);
    check("ab abort closes the browser session the round started",
      j.indexOf("close") > recStopIdx);
    const start2 = runRound(root, ["start", "--url", "https://example.test/app"], env);
    check("ab a fresh round starts immediately after abort", start2.status === 0 && !!activeMarker(root));
    runRound(root, ["abort"], env);
    cleanup(root, home, shimDir);
  }

  // ---- a failing command leaves the round active ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("run-fail");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const activeBefore = activeMarker(root);
    const run = runRound(root, ["run", "--", "click", "@e9"], env);
    const activeAfter = activeMarker(root);
    check("ab a failing run exits nonzero and leaves the round active",
      run.status !== 0 && !!activeBefore && !!activeAfter && activeAfter.roundId === activeBefore.roundId);
    runRound(root, ["abort"], env);
    cleanup(root, home, shimDir);
  }

  // ---- a wrapped command that never ran to completion is a failure, never exit 0 ----
  {
    const { root, home, shimDir, env, journal } = newAbRoundProject("run-signal");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const activeBefore = activeMarker(root);
    const run = runRound(root, ["run", "--", "click", "@e9"], env);
    const activeAfter = activeMarker(root);
    check("ab a wrapped command killed by a signal exits nonzero and leaves the round active",
      run.status !== 0 && !!activeBefore && !!activeAfter && activeAfter.roundId === activeBefore.roundId &&
      journalLines(journal).includes("click @e9") && /did not run to completion/.test(run.stderr));
    runRound(root, ["abort"], env);
    cleanup(root, home, shimDir);
  }
  {
    const { root, home, shimDir, env } = newAbRoundProject("run-flood");
    const env2 = { ...env, AR_AB_RUN_MAX_BUFFER: "4096" };
    runRound(root, ["start", "--url", "https://example.test/app"], env2);
    const run = runRound(root, ["run", "--", "snapshot"], env2);
    check("ab a wrapped command cut off by the output ceiling exits nonzero and leaves the round active",
      run.status !== 0 && !!activeMarker(root) && /did not run to completion/.test(run.stderr));
    runRound(root, ["abort"], env2);
    cleanup(root, home, shimDir);
  }

  // ---- capture teardown at stop: the cutoff drain, then network stop, then video stop ----
  {
    const { root, home, shimDir, env, journal } = newAbRoundProject("happy");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    runRound(root, ["stop", "--summary", "x"], env);
    const j = journalLines(journal);
    const markEndIdx = j.findIndex((l) => l === "eval markSync end");
    const harStopIdx = j.findIndex((l) => l.startsWith("network har stop"));
    const recStopIdx = j.findIndex((l) => l === "record stop");
    const lastDrainIdx = j.reduce((acc, l, i) => (l.startsWith("eval drainSince") ? i : acc), -1);
    check("ab stop stops network before video, between the cutoff and the confirmation drain",
      markEndIdx !== -1 && harStopIdx > markEndIdx && recStopIdx > harStopIdx && lastDrainIdx > recStopIdx);
    cleanup(root, home, shimDir);
  }

  // ---- a mutation landing in the stop window marks every channel past the cutoff partial ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("stop-tail");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const rd = findRoundDir(root);
    const meta = rd ? readMeta(rd) : null;
    let dom = null;
    try { dom = rd ? JSON.parse(fs.readFileSync(path.join(rd, "dom.json"), "utf8")) : null; } catch {}
    const seg1 = dom && dom.segments.find((sg) => sg.id === "s-0001");
    const endIdx = seg1 ? seg1.frames.findIndex((f) => f.kind === "sync" && f.data && f.data.id === "end") : -1;
    check("ab a mutation in the stop window is kept in the evidence but marks every channel past the cutoff partial",
      stop.status === 0 && !!meta && !!seg1 && endIdx !== -1 &&
      seg1.frames[seg1.frames.length - 1].kind === "mutation" &&
      meta.completeness.gaps.some((g) => g.reason === "stop-tail" && g.segmentId === "s-0001") &&
      meta.completeness.video === "partial" && meta.completeness.network === "partial" && meta.completeness.dom === "partial");
    cleanup(root, home, shimDir);
  }

  // ---- a cutoff marker that never lands in the evidence is admitted, not claimed ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("no-end-mark");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const meta = readMeta(findRoundDir(root));
    check("ab a stop whose end marker never persisted marks the stop tail unproven on every channel",
      stop.status === 0 && !!meta &&
      meta.completeness.gaps.some((g) => g.reason === "stop-tail") &&
      meta.completeness.video === "partial" && meta.completeness.network === "partial" && meta.completeness.dom === "partial");
    cleanup(root, home, shimDir);
  }

  // ---- sync confidence: a stored wall-clock calibration never claims measured video alignment ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const calibratedAt = "2026-07-20T00:00:00.000Z";
    fs.writeFileSync(path.join(root, ".agent-review", ".calibration.json"), JSON.stringify({
      schemaVersion: 1, offsetMs: 10, jitterMs: 150, calibratedAt, agentBrowser: "0.32.1",
    }));
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const meta = readMeta(findRoundDir(root));
    check("ab a fresh matching calibration caps sync confidence at medium, not high",
      stop.status === 0 && !!meta && meta.sync.confidence === "medium" && meta.sync.method === "calibrated-wall");
    check("ab the recorder page's clock disagreement is published as clock skew, named as such",
      !!meta && meta.sync.clockSkewMs === 1 && !("residualMs" in meta.sync));
    check("ab calibration age is published in the metadata",
      !!meta && !!meta.sync.calibration && meta.sync.calibration.calibratedAt === calibratedAt &&
      typeof meta.sync.calibration.ageMs === "number" && meta.sync.calibration.ageMs >= 0 &&
      meta.sync.calibration.offsetMs === 10 && meta.sync.calibration.jitterMs === 150);
    cleanup(root, home, shimDir);
  }
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    fs.writeFileSync(path.join(root, ".agent-review", ".calibration.json"), JSON.stringify({
      schemaVersion: 1, offsetMs: 10, jitterMs: 150, calibratedAt: "2026-01-01T00:00:00.000Z", agentBrowser: "0.0.0-stale",
    }));
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const meta = readMeta(findRoundDir(root));
    check("ab a calibration from another agent-browser version caps sync confidence at low",
      stop.status === 0 && !!meta && meta.sync.confidence === "low");
    cleanup(root, home, shimDir);
  }

  // ---- a drain that lost frames to buffer overflow ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("overflow");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    runRound(root, ["stop", "--summary", "x"], env);
    const meta = readMeta(findRoundDir(root));
    check("ab frames lost to buffer overflow reach the package as a gap",
      !!meta && meta.completeness.dom === "partial" &&
      meta.completeness.gaps.some((g) => g.reason === "overflow" && g.droppedFrames === 2));
    cleanup(root, home, shimDir);
  }

  // ---- a record stop that produced no artifact ----
  {
    const { root, home, shimDir, env } = newAbRoundProject("no-artifact");
    runRound(root, ["start", "--url", "https://example.test/app"], env);
    const stop = runRound(root, ["stop", "--summary", "x"], env);
    const meta = readMeta(findRoundDir(root));
    check("ab a record stop without an artifact finalizes with video completeness missing",
      stop.status === 0 && !!meta && meta.completeness.video === "missing");
    cleanup(root, home, shimDir);
  }

  // ---- calibration records the same shape a round does, from the same neutral page ----
  {
    const { root, home, shimDir, env, journal } = newAbRoundProject("happy");
    const cal = runRound(root, ["calibrate"], env);
    const j = journalLines(journal);
    const recStartIdx = j.findIndex((l) => l.startsWith("record start"));
    const clockIdx = j.findIndex((l) => l.startsWith("open data:text/html"));
    const neutralIdx = j.indexOf("open about:blank");
    check("ab calibrate begins video capture on a neutral page, then opens the clock page",
      cal.status === 0 && neutralIdx !== -1 && recStartIdx !== -1 && clockIdx !== -1 &&
      neutralIdx < recStartIdx && recStartIdx < clockIdx &&
      !j.slice(0, recStartIdx).some((l) => l.startsWith("open ") && l !== "open about:blank"));
    cleanup(root, home, shimDir);
  }
}

// ---------- resolution evidence ----------

// A minimal but valid round package. The recorded window and the declared completeness are the
// caller's, so a case can state exactly when a round was recorded and what evidence it holds.
// `metaText` writes meta.json verbatim, for the round whose metadata cannot be parsed at all.
function writeRound(root, id, { startedAt, endedAt, completeness, metaText } = {}) {
  const rd = path.join(root, ".agent-review", id);
  fs.mkdirSync(path.join(rd, "comment-images"), { recursive: true });
  fs.writeFileSync(path.join(rd, "video.webm"), Buffer.alloc(512, 3));
  fs.writeFileSync(path.join(rd, "meta.json"), metaText !== undefined ? metaText : JSON.stringify({
    schemaVersion: 1, roundId: id, startedAt, endedAt, summary: id, startUrl: "http://localhost/",
    git: null, viewport: { width: 1280, height: 720, dpr: 1 },
    versions: { skill: "1.0.0", recorder: "1", agentBrowser: "test", node: process.versions.node },
    sync: { confidence: "medium", method: "calibrated-wall", clockSkewMs: null, calibration: null, anchors: [] },
    completeness: completeness || { video: "complete", dom: "complete", network: "missing", gaps: [] },
  }));
  fs.writeFileSync(path.join(rd, "dom.json"), JSON.stringify({ schemaVersion: 1, roundId: id, segments: [] }));
  fs.writeFileSync(path.join(rd, "comments.json"), JSON.stringify({ schemaVersion: 1, roundId: id, reviewState: "open", submittedAt: null, comments: [] }));
  fs.writeFileSync(path.join(rd, "resolutions.json"), JSON.stringify({ schemaVersion: 1, roundId: id, items: {} }));
  return rd;
}

async function startServer(root) {
  const token = crypto.randomBytes(18).toString("base64url");
  const child = spawn(process.execPath, [SERVER, "serve", "--project", root, "--token", token], { stdio: "ignore" });
  const stateFile = path.join(root, ".agent-review", ".server.json");
  let st = null;
  for (let i = 0; i < 50 && !st; i++) {
    await new Promise((r) => setTimeout(r, 100));
    try { st = JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch {}
  }
  return { child, base: st ? `http://127.0.0.1:${st.port}/${token}` : null };
}

async function resolutionSuite() {
  console.log("\n-- resolution evidence --");
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-resolve-")));
  const REVIEWED = "20260717T100000Z-aaa111";   // the round the operator left feedback on
  const EARLIER = "20260717T090000Z-bbb222";    // recorded before that feedback existed
  const FIX = "20260717T130000Z-ccc333";        // recorded after; coverage only partial
  const NO_VIDEO = "20260717T140000Z-ddd444";   // recorded after; its video never landed
  const DELETED = "20260717T150000Z-eee555";    // recorded after; removed from the library later
  const UNREADABLE = "20260717T160000Z-fff666"; // recorded after; meta.json cannot be parsed
  const ABSENT = "20260717T170000Z-999999";     // never recorded at all
  const CID = "c-11111111-2222-3333-4444-555555555555";

  writeRound(root, REVIEWED, { startedAt: "2026-07-17T10:00:00.000Z", endedAt: "2026-07-17T10:01:00.000Z" });
  fs.writeFileSync(path.join(root, ".agent-review", REVIEWED, "comments.json"), JSON.stringify({
    schemaVersion: 1, roundId: REVIEWED, reviewState: "submitted", submittedAt: "2026-07-17T12:00:00.000Z",
    comments: [{ id: CID, videoTimeMs: 1200, text: "the error arrives too late", createdAt: "2026-07-17T11:58:00.000Z" }],
  }));
  writeRound(root, EARLIER, { startedAt: "2026-07-17T09:00:00.000Z", endedAt: "2026-07-17T09:05:00.000Z" });
  writeRound(root, FIX, {
    startedAt: "2026-07-17T13:00:00.000Z", endedAt: "2026-07-17T13:04:00.000Z",
    completeness: { video: "partial", dom: "partial", network: "missing", gaps: [{ segmentId: "s-0002", reason: "navigation-tail", droppedFrames: null }] },
  });
  writeRound(root, NO_VIDEO, {
    startedAt: "2026-07-17T14:00:00.000Z", endedAt: "2026-07-17T14:03:00.000Z",
    completeness: { video: "missing", dom: "complete", network: "missing", gaps: [] },
  });
  writeRound(root, DELETED, { startedAt: "2026-07-17T15:00:00.000Z", endedAt: "2026-07-17T15:02:00.000Z" });
  writeRound(root, UNREADABLE, { startedAt: "2026-07-17T16:00:00.000Z", endedAt: "2026-07-17T16:02:00.000Z", metaText: '{"schemaVersion": 1,' });

  const resolveIn = (id) => runRound(root, ["resolve", "--feedback-round", REVIEWED, "--comment", CID, "--in-round", id]);
  const resolutionsOf = (id) => JSON.parse(fs.readFileSync(path.join(root, ".agent-review", id, "resolutions.json"), "utf8"));

  let r = resolveIn(REVIEWED);
  check("resolve refuses the round the feedback was left on", r.status !== 0 && /cannot be its own fix/.test(r.stderr));

  r = resolveIn(EARLIER);
  check("resolve refuses a round recorded before the feedback it would answer", r.status !== 0 && /before the feedback it answers/.test(r.stderr));

  r = resolveIn(ABSENT);
  check("resolve refuses a round that is not in the library", r.status !== 0 && /is missing meta\.json/.test(r.stderr));

  r = resolveIn(NO_VIDEO);
  check("resolve refuses a round whose video evidence never landed", r.status !== 0 && /no video evidence/.test(r.stderr));

  r = resolveIn(UNREADABLE);
  check("resolve refuses a round whose metadata cannot be read", r.status !== 0 && /no readable meta\.json/.test(r.stderr));

  check("nothing was recorded while every resolution was refused", Object.keys(resolutionsOf(REVIEWED).items).length === 0);

  // The line the completeness gate draws: a round that cannot prove coverage through its cutoff
  // is still evidence, and rejecting it would leave resolve unusable for most real rounds.
  r = resolveIn(FIX);
  check("resolve accepts a later round whose coverage is only partial",
    r.status === 0 && resolutionsOf(REVIEWED).items[CID] && resolutionsOf(REVIEWED).items[CID].resolvedInRoundId === FIX);

  const srv = await startServer(root);
  try {
    const packageStatus = async (id) => {
      const x = await fetch(`${srv.base}/api/rounds/${id}`);
      return x.ok ? (await x.json()).status : `HTTP ${x.status}`;
    };
    const cardStatus = async (id) => {
      const x = await fetch(`${srv.base}/api/rounds`);
      const card = ((await x.json()).rounds || []).find((c) => c.roundId === id);
      return card ? card.status : null;
    };

    check("library reads feedback answered by a later round as addressed", srv.base && await packageStatus(REVIEWED) === "addressed");

    // the round the claim rests on leaves the library after the claim was recorded
    const claimed = resolveIn(DELETED).status === 0;
    fs.rmSync(path.join(root, ".agent-review", DELETED), { recursive: true, force: true });
    check("library flags feedback whose resolving round was deleted", claimed && srv.base && await cardStatus(REVIEWED) === "resolution-broken");

    // reclaiming disk space by deleting the biggest file in a package is the ordinary way a
    // recorded round quietly stops being evidence, long after the claim was written
    resolveIn(FIX);
    fs.rmSync(path.join(root, ".agent-review", FIX, "video.webm"));
    check("library flags feedback whose resolving round lost its video",
      srv.base && await packageStatus(REVIEWED) === "resolution-broken");

    const pend = runRound(root, ["pending", "--json"]);
    const pending = pend.status === 0 ? JSON.parse(pend.stdout) : [];
    check("pending re-lists feedback whose resolution no longer holds",
      pending.some((c) => c.commentId === CID && /is missing video\.webm/.test(c.brokenResolution || "")));

    // a resolutions.json edited outside the runner must not buy a label its evidence never earned
    fs.writeFileSync(path.join(root, ".agent-review", REVIEWED, "resolutions.json"), JSON.stringify({
      schemaVersion: 1, roundId: REVIEWED,
      items: { [CID]: { resolvedInRoundId: REVIEWED, resolvedAt: "2026-07-17T18:00:00.000Z" } },
    }));
    check("library refuses a hand-written resolution naming the reviewed round itself",
      srv.base && await packageStatus(REVIEWED) === "resolution-broken");
  } finally {
    if (srv.child) srv.child.kill("SIGTERM");
  }
  fs.rmSync(root, { recursive: true, force: true });
}

// Run an entry point under a doctored runtime version, as its own process, so the floor is
// exercised where it actually lives instead of only in the predicate behind it.
function runUnderRuntimeVersion(file, version, argv, cwd) {
  const src =
    `Object.defineProperty(process, "versions", { value: Object.assign({}, process.versions, { node: ${JSON.stringify(version)} }), configurable: true });` +
    `process.argv = [process.argv[0], ${JSON.stringify(file)}].concat(${JSON.stringify(argv)});` +
    `import(${JSON.stringify(pathToFileURL(file).href)}).catch((e) => { console.error(String(e)); process.exit(9); });`;
  return spawnSync(process.execPath, ["-e", src], { encoding: "utf8", cwd: cwd || os.tmpdir(), timeout: 30000 });
}

function mkFormControl(over) {
  return {
    nodeType: 1, type: "text", name: "", id: "", tagName: "INPUT", className: "",
    attributes: [], getAttribute: () => null, hasAttribute: () => false,
    matches: () => false, closest: () => null, value: "", ...over,
  };
}

function frameFromControls(controls) {
  const { api } = loadRecorderWithDom({
    querySelectorAll: (s) => ({ forEach: (fn) => { if (s === "input,select,textarea") controls.forEach(fn); } }),
  });
  const rec = new api.DomRecorder();
  rec.start();
  rec._push("mutation", {});
  return rec.frames[rec.frames.length - 1];
}

// A throwaway git worktree with one commit, isolated from the operator's own git configuration
// so a real diff.external on this machine cannot decide the outcome either way.
function newWorktree() {
  const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-prov-")));
  const env = {
    ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_SYSTEM: os.devNull,
    GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@test", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@test",
  };
  const git = (...a) => spawnSync("git", a, { cwd: repo, encoding: "utf8", env });
  git("init", "-q");
  fs.writeFileSync(path.join(repo, "a.txt"), "one\n");
  git("add", "-A");
  git("commit", "-qm", "init");
  return { repo, git };
}

async function robustnessSuite() {
  console.log("\n-- runtime floor, backend contract, provenance, bounded capture --");

  // ---- the runtime floor: a sentence naming both versions, at both entry points ----
  check("a runtime below the floor is refused by a message naming what is required and what is running",
    /Node 22 or newer is required/.test(nodeVersionProblem("20.1.0") || "") &&
    /Node 20\.1\.0/.test(nodeVersionProblem("20.1.0") || "") &&
    nodeVersionProblem("16.20.2") !== null && nodeVersionProblem("18.0.0") !== null);
  check("a runtime at or above the floor is accepted",
    nodeVersionProblem("22.0.0") === null && nodeVersionProblem("24.1.0") === null && nodeVersionProblem("v22.14.0") === null);
  check("a runtime version that cannot be read is not treated as proof of an old runtime",
    nodeVersionProblem("") === null && nodeVersionProblem("not-a-version") === null);
  {
    const runner = runUnderRuntimeVersion(ROUND, "20.1.0", ["pending"]);
    check("the runner refuses to run on a runtime below the floor",
      runner.status === 1 && /^round: Node 22 or newer is required; this is Node 20\.1\.0\./m.test(runner.stderr));
    const server = runUnderRuntimeVersion(SERVER, "20.1.0", ["stop", "--project", os.tmpdir()]);
    check("the review server refuses to run on a runtime below the floor",
      server.status === 1 && /^server: Node 22 or newer is required; this is Node 20\.1\.0\./m.test(server.stderr));
  }

  // ---- the agent-browser contract gate: only a version we can READ and prove too old is fatal ----
  for (const [version, expected] of [
    ["0.31.9", "fatal"], ["0.9.0", "fatal"],
    ["0.32.0", "in-contract"], ["0.32.7", "in-contract"],
    ["0.33.0", "warn"], ["1.0.0", "warn"], ["9.9.9", "warn"],
    ["unknown", "warn"], ["", "warn"], [null, "warn"],
  ]) {
    const p = abVersionProblem(version);
    const got = p === null ? "in-contract" : (p.fatal ? "fatal" : "warn");
    check(`agent-browser ${JSON.stringify(version)} is gated as ${expected}`, got === expected);
  }
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    const start = runRound(root, ["start", "--url", "https://example.test/app"], { ...env, AR_AB_SHIM_VERSION: "0.31.4" });
    check("a round refuses to start against a backend older than the recording contract",
      start.status !== 0 && /0\.31\.4 is older than the 0\.32\.x/.test(start.stderr) && !activeMarker(root));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }
  {
    const { root, home, shimDir, env } = newAbRoundProject("happy");
    const newerEnv = { ...env, AR_AB_SHIM_VERSION: "1.4.0" };
    const start = runRound(root, ["start", "--url", "https://example.test/app"], newerEnv);
    check("a round proceeds against a backend newer than the contract, warning instead of refusing",
      start.status === 0 && /agent-browser 1\.4\.0 is newer/.test(start.stderr) && !!activeMarker(root));
    runRound(root, ["abort"], newerEnv);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }

  // ---- provenance: two different worktrees must never produce the same hash ----
  {
    const { repo, git } = newWorktree();
    const differDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-differ-"));
    const differ = path.join(differDir, "differ.sh");
    fs.writeFileSync(differ, "#!/bin/sh\necho constant\n", { mode: 0o755 });
    fs.chmodSync(differ, 0o755);
    git("config", "diff.external", differ);
    fs.writeFileSync(path.join(repo, "a.txt"), "two\n");
    const first = gitInfo(repo).diffHash;
    fs.writeFileSync(path.join(repo, "a.txt"), "three\n");
    const second = gitInfo(repo).diffHash;
    check("an external differ configured on the operator's machine cannot make two different worktrees hash alike",
      typeof first === "string" && first !== second);

    git("config", "--unset", "diff.external");
    fs.writeFileSync(path.join(repo, "b.bin"), Buffer.from([0x00, 0x01, 0x02, 0x03]));
    git("add", "-A");
    git("commit", "-qm", "binary");
    fs.writeFileSync(path.join(repo, "b.bin"), Buffer.from([0x00, 0x01, 0x02, 0x09]));
    const bin1 = gitInfo(repo).diffHash;
    fs.writeFileSync(path.join(repo, "b.bin"), Buffer.from([0x00, 0x01, 0x02, 0xfe]));
    const bin2 = gitInfo(repo).diffHash;
    check("a changed binary file's content reaches the provenance hash", bin1 !== bin2);
    fs.rmSync(differDir, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
  {
    const { repo } = newWorktree();
    check("provenance outside a git worktree is absent, not invented", gitInfo(os.tmpdir()) === null || gitInfo(repo) !== null);
    const clean = gitInfo(repo);
    check("a capture that reached everything says so with an empty note list",
      !!clean && Array.isArray(clean.diffHashNotes) && clean.diffHashNotes.length === 0 && clean.dirty === false);
    // a dangling symlink is listed as untracked and cannot be read: the shortfall belongs in
    // the evidence, not in a silent skip
    fs.symlinkSync(path.join(repo, "nothing-here"), path.join(repo, "dangling"));
    const unreadable = gitInfo(repo);
    check("an untracked file that could not be read is named in the evidence rather than dropped",
      !!unreadable && unreadable.diffHashNotes.some((n) => /could not be read/.test(n)));
    fs.rmSync(repo, { recursive: true, force: true });
  }
  {
    const { repo } = newWorktree();
    for (let i = 0; i <= 2000; i++) fs.writeFileSync(path.join(repo, `u${i}.txt`), "");
    const capped = gitInfo(repo);
    check("untracked files past the capture limit are named in the evidence rather than dropped",
      !!capped && capped.diffHashNotes.some((n) => /past the 2000-file capture limit/.test(n)));
    fs.rmSync(repo, { recursive: true, force: true });
  }
  {
    // a worktree with one very large untracked file must cost a window, not the file
    const { repo } = newWorktree();
    fs.writeFileSync(path.join(repo, "big.bin"), Buffer.alloc(64 * 1024 * 1024, 7));
    const probe = `import(${JSON.stringify(pathToFileURL(ROUND).href)}).then((m) => {` +
      `const before = process.memoryUsage().rss;` +
      `const g = m.gitInfo(process.cwd());` +
      `process.stdout.write(JSON.stringify({ grew: process.memoryUsage().rss - before, hash: g.diffHash }));` +
      `});`;
    const r = spawnSync(process.execPath, ["-e", probe], { cwd: repo, encoding: "utf8", timeout: 120000 });
    let out = null;
    try { out = JSON.parse(r.stdout); } catch {}
    check("hashing a large untracked file costs a read window, not the size of the file",
      !!out && typeof out.hash === "string" && out.grew < 24 * 1024 * 1024);
    fs.rmSync(repo, { recursive: true, force: true });
  }

  // ---- the recorder's per-frame form values are bounded, and the bound is visible ----
  {
    const many = Array.from({ length: 250 }, (_, i) => mkFormControl({ id: `f${i}`, value: "v" }));
    const frame = frameFromControls(many);
    check("a frame holds a bounded number of form values", Object.keys(frame.values).length === 100);
    check("a frame whose form values hit the count bound is marked truncated", frame.truncated === true);
  }
  {
    const frame = frameFromControls([mkFormControl({ id: "note", value: "x".repeat(5000) })]);
    check("a long form value is stored bounded, not whole", frame.values["#note"] === "x".repeat(200));
    check("a frame whose form value was shortened is marked truncated", frame.truncated === true);
  }
  {
    const frame = frameFromControls([mkFormControl({ id: "note", value: "short" })]);
    check("a frame within both value bounds is not marked truncated",
      frame.values["#note"] === "short" && frame.truncated === undefined);
  }

  // ---- the review site: how a launcher is chosen, and what a failure leaves behind ----
  const { browserOpenCommand } = await import(pathToFileURL(SERVER).href);
  check("each supported platform gets its own browser launcher",
    browserOpenCommand("darwin").cmd === "open" && browserOpenCommand("linux").cmd === "xdg-open" &&
    browserOpenCommand("win32").cmd === "cmd");
  check("a platform with no known launcher has none, rather than a macOS command that will fail",
    browserOpenCommand("sunos") === null);
  {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-srvfail-")));
    buildFixture(root);
    // comment-images occupied by a FILE: writing the comment image throws inside the handler
    fs.rmSync(path.join(root, ".agent-review", ROUND_ID, "comment-images"), { recursive: true, force: true });
    fs.writeFileSync(path.join(root, ".agent-review", ROUND_ID, "comment-images"), "not a directory");
    // an empty PATH leaves no launcher to find, so the browser handoff must degrade in words
    const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), "ar-nopath-"));
    const opened = spawnSync(process.execPath, [SERVER, "open", "--project", root], {
      encoding: "utf8", timeout: 30000, env: { ...process.env, PATH: emptyPath },
    });
    check("opening the review site says plainly when it could not launch a browser, and prints the URL to open by hand",
      opened.status === 0 && /could not open a browser automatically/.test(opened.stdout) &&
      /http:\/\/127\.0\.0\.1:\d+\/[A-Za-z0-9_-]{24}\//.test(opened.stdout));
    let srvState = null;
    try { srvState = JSON.parse(fs.readFileSync(path.join(root, ".agent-review", ".server.json"), "utf8")); } catch {}
    if (srvState) {
      const resp = await fetch(`http://127.0.0.1:${srvState.port}/${srvState.token}/api/rounds/${ROUND_ID}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoTimeMs: 0, text: "hello", imageBase64: JPEG_B64 }),
      });
      check("an unhandled failure in the review server still answers the request", resp.status === 500);
      await new Promise((r) => setTimeout(r, 300));
      let log = "";
      try { log = fs.readFileSync(path.join(root, ".agent-review", ".server.log"), "utf8"); } catch {}
      check("an unhandled failure in the detached review server leaves a record an operator can read",
        /POST/.test(log) && /comment-images|ENOTDIR|EEXIST|Error/.test(log) && /api\/rounds/.test(log));
      check("the recorded failure masks the URL token",
        log.length > 0 && !log.includes(srvState.token) && log.includes("<token>"));
    } else {
      check("an unhandled failure in the review server still answers the request", false);
      check("an unhandled failure in the detached review server leaves a record an operator can read", false);
      check("the recorded failure masks the URL token", false);
    }
    spawnSync(process.execPath, [SERVER, "stop", "--project", root], { encoding: "utf8", timeout: 20000 });
    fs.rmSync(emptyPath, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function main() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-selftest-")));
  buildFixture(root);
  const token = crypto.randomBytes(18).toString("base64url");
  const child = spawn(process.execPath, [SERVER, "serve", "--project", root, "--token", token], { stdio: "ignore" });
  const stateFile = path.join(root, ".agent-review", ".server.json");
  let st = null;
  for (let i = 0; i < 50 && !st; i++) {
    await new Promise((r) => setTimeout(r, 100));
    try { st = JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch {}
  }
  if (!st) { console.error("server did not start"); child.kill("SIGTERM"); process.exit(1); }
  const B = `http://127.0.0.1:${st.port}/${token}`;

  try {
    let r = await fetch(`${B}/api/health`);
    check("health 200 + project", r.ok && (await r.json()).project === root);

    r = await fetch(`${B}/api/rounds`);
    const rounds = (await r.json()).rounds;
    check("library lists fixture round", rounds.length === 1 && rounds[0].roundId === ROUND_ID && rounds[0].status === "awaiting-review");

    r = await fetch(`${B}/api/rounds/${ROUND_ID}`);
    check("package get", r.ok && (await r.json()).meta.roundId === ROUND_ID);

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/video`);
    const full = await r.arrayBuffer();
    check("video full 200", r.status === 200 && full.byteLength === 10000);

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/video`, { headers: { Range: "bytes=100-199" } });
    const part = await r.arrayBuffer();
    check("video 206 single range", r.status === 206 && part.byteLength === 100 && r.headers.get("content-range") === "bytes 100-199/10000");

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/video`, { headers: { Range: "bytes=99999-" } });
    check("video 416 on invalid range", r.status === 416);

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/video`, { method: "HEAD" });
    check("video HEAD", r.status === 200 && r.headers.get("content-length") === "10000");

    // comment transaction
    r = await fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoTimeMs: 12840, text: "too late", imageBase64: JPEG_B64 }),
    });
    const created = r.status === 201 ? await r.json() : null;
    check("comment 201", !!created && /^c-/.test(created.id || ""));
    const imgPath = path.join(root, ".agent-review", ROUND_ID, "comment-images", `${created ? created.id : "x"}.jpg`);
    check("comment image durable", fs.existsSync(imgPath));
    const cj = JSON.parse(fs.readFileSync(path.join(root, ".agent-review", ROUND_ID, "comments.json"), "utf8"));
    check("comment persisted with timestamp", cj.comments.length === 1 && cj.comments[0].videoTimeMs === 12840);

    if (!created) {
      check("image served", false);
    } else {
      r = await fetch(`${B}/api/rounds/${ROUND_ID}/comment-images/${created.id}.jpg`);
      check("image served", r.status === 200 && (r.headers.get("content-type") || "").includes("image/jpeg"));
    }

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoTimeMs: 1, text: "x".repeat(4001), imageBase64: JPEG_B64 }),
    });
    check("oversized text 422", r.status === 422);

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoTimeMs: 1, text: "bad img", imageBase64: Buffer.from("not a jpeg").toString("base64") }),
    });
    check("non-JPEG 422", r.status === 422);

    // magic-byte envelope is the only image gate
    const fakeJpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1), Buffer.from([0xff, 0xd9])]);
    r = await fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoTimeMs: 1, text: "fake img", imageBase64: fakeJpeg.toString("base64") }),
    });
    check("magic-byte envelope accepted (only gate)", r.status === 201);

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoTimeMs: null, text: "non-finite", imageBase64: JPEG_B64 }),
    });
    check("non-finite timestamp 422", r.status === 422);

    // concurrent comments: all must land (no lost writes)
    const batch = await Promise.all([...Array(5)].map((_, i) =>
      fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoTimeMs: 1000 + i, text: `concurrent ${i}`, imageBase64: JPEG_B64 }),
      })));
    check("5 concurrent comments all 201", batch.every((x) => x.status === 201));
    const afterBatch = JSON.parse(fs.readFileSync(path.join(root, ".agent-review", ROUND_ID, "comments.json"), "utf8"));
    check("all 7 comments persisted (2 + 5)", afterBatch.comments.length === 7);

    // submit racing a comment: final state must be submitted, never reopened
    const race = await Promise.all([
      fetch(`${B}/api/rounds/${ROUND_ID}/submit-review`, { method: "POST" }),
      fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoTimeMs: 9, text: "racer", imageBase64: JPEG_B64 }),
      }),
    ]);
    const finalC = JSON.parse(fs.readFileSync(path.join(root, ".agent-review", ROUND_ID, "comments.json"), "utf8"));
    check("race leaves review submitted", finalC.reviewState === "submitted");
    check("racer comment got 201 (pre-submit) or 409 (post-submit), never both", [201, 409].includes(race[1].status));

    // symlinked round dir must be invisible to the library
    const secret = path.join(root, "secret-round");
    fs.mkdirSync(secret, { recursive: true });
    fs.writeFileSync(path.join(secret, "meta.json"), "{}");
    const linkName = "20260717T130000Z-def456";
    fs.symlinkSync(secret, path.join(root, ".agent-review", linkName));
    r = await fetch(`${B}/api/rounds`);
    check("symlinked round not listed", (await r.json()).rounds.every((x) => x.roundId !== linkName));

    // nested symlink: comments.json pointing outside the round must not be served
    const rd2 = path.join(root, ".agent-review", ROUND_ID);
    const outside = path.join(root, "outside-comments.json");
    fs.writeFileSync(outside, JSON.stringify({ schemaVersion: 1, roundId: ROUND_ID, reviewState: "open", submittedAt: null, comments: [{ id: "c-00000000-0000-0000-0000-000000000000", videoTimeMs: 1, text: "ESCAPE", createdAt: "2026-01-01T00:00:00Z" }] }));
    fs.renameSync(path.join(rd2, "comments.json"), path.join(rd2, "comments.json.bak"));
    fs.symlinkSync(outside, path.join(rd2, "comments.json"));
    r = await fetch(`${B}/api/rounds/${ROUND_ID}`);
    check("nested symlink JSON not served", r.status === 404 || !(await r.clone().json().catch(() => ({}))).comments);
    fs.unlinkSync(path.join(rd2, "comments.json"));
    fs.renameSync(path.join(rd2, "comments.json.bak"), path.join(rd2, "comments.json"));

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/submit-review`, { method: "POST" });
    check("submit-review 200", r.status === 200);

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoTimeMs: 5, text: "late", imageBase64: JPEG_B64 }),
    });
    check("comment after submit 409", r.status === 409);

    r = await fetch(`${B}/api/rounds/${ROUND_ID}/submit-review`, { method: "POST" });
    check("submit-review idempotent", r.status === 200);

    r = await fetch(`http://127.0.0.1:${st.port}/wrong-token/api/rounds`);
    check("bad token 404", r.status === 404);

    r = await fetch(`${B}/api/rounds/..%2F..%2Fmeta.json`);
    check("traversal rejected", r.status === 404 || r.status === 400);

    r = await fetch(`${B}/api/rounds`);
    const after = (await r.json()).rounds;
    check("status derived: submitted", after[0].status === "submitted");

    // ---- mixed v1/v2 library: a browser-control (schemaVersion 2) round coexists ----
    const V2_ID = "20260717T990000Z-def456";
    buildV2Round(root, V2_ID);
    r = await fetch(`${B}/api/rounds`);
    const mixed = (await r.json()).rounds;
    check("library lists both v1 and v2 rounds", mixed.some((x) => x.roundId === ROUND_ID) && mixed.some((x) => x.roundId === V2_ID));
    r = await fetch(`${B}/api/rounds/${V2_ID}`);
    const v2pkg = r.ok ? await r.json() : null;
    check("v2 package renders with schemaVersion 2", !!v2pkg && v2pkg.meta.schemaVersion === 2 && v2pkg.meta.versions.backend === "browser-control" && !("agentBrowser" in v2pkg.meta.versions));
    check("v2 round watchable (video + dom served)", !!v2pkg && v2pkg.dom.roundId === V2_ID && v2pkg.status === "awaiting-review");
    r = await fetch(`${B}/api/rounds/${V2_ID}/video`);
    const v2vid = await r.arrayBuffer();
    check("v2 video endpoint serves the artifact", r.status === 200 && v2vid.byteLength === 4096);

    // ---- round.mjs unit checks (a full round needs a real browser, so call directly) ----
    const har = { log: { entries: [{
      request: {
        url: "http://x.test/auth/0123456789abcdef0123456789abcdef01234567?ok=1&token=abc",
        headers: [{ name: "X-Csrf-Token", value: "csrf-secret" }, { name: "X-Request-Id", value: "rid" }],
        cookies: [],
      },
      response: {
        headers: [{ name: "X-Session-Id", value: "sess-secret" }, { name: "Content-Type", value: "text/html" }],
        cookies: [], content: {},
      },
    }] } };
    sanitizeHar(har);
    const ent = har.log.entries[0];
    check("custom secret headers redacted (request + response)",
      ent.request.headers[0].value === "[redacted]" && ent.response.headers[0].value === "[redacted]");
    check("ordinary headers kept",
      ent.request.headers[1].value === "rid" && ent.response.headers[1].value === "text/html");
    check("token-like path segment redacted", !ent.request.url.includes("0123456789abcdef"));
    check("query secret still redacted", !ent.request.url.includes("token=abc"));
    check("ordinary REST ids kept", redactUrl("http://x.test/users/12345/session/42") === "http://x.test/users/12345/session/42");

    // ---- pending must survive a dangling symlink round dir ----
    const pendRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-pending-")));
    fs.mkdirSync(path.join(pendRoot, ".agent-review"), { recursive: true });
    fs.symlinkSync(path.join(pendRoot, "gone-target"), path.join(pendRoot, ".agent-review", "20260717T140000Z-aaa111"));
    const pend = spawnSync(process.execPath, [path.join(__dirname, "..", "scripts", "round.mjs"), "pending", "--json"], { cwd: pendRoot, encoding: "utf8" });
    check("pending survives dangling symlink round", pend.status === 0);
    fs.rmSync(pendRoot, { recursive: true, force: true });

    // ---- the shutdown route is the ONLY way a server is stopped, so a valid request must
    // actually end the listener. This runs against a THROWAWAY server: refusal checks alone
    // pass just as well when the route is missing (an absent route also answers 404), so
    // without this positive case the whole mechanism can be deleted unnoticed. ----
    {
      const sRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ar-shutdown-")));
      fs.mkdirSync(path.join(sRoot, ".agent-review"), { recursive: true });
      const sTok = crypto.randomBytes(18).toString("base64url");
      const sChild = spawn(process.execPath, [SERVER, "serve", "--project", sRoot, "--token", sTok], { stdio: "ignore" });
      const sState = path.join(sRoot, ".agent-review", ".server.json");
      let sSt = null;
      for (let i = 0; i < 50 && !sSt; i++) {
        await new Promise((r) => setTimeout(r, 100));
        try { sSt = JSON.parse(fs.readFileSync(sState, "utf8")); } catch {}
      }
      check("a throwaway review server starts", !!sSt);
      if (sSt) {
        const sStop = spawnSync(process.execPath, [SERVER, "stop", "--project", sRoot], { encoding: "utf8", timeout: 15000 });
        await new Promise((r) => setTimeout(r, 400));
        let stillListening = false;
        try { const p = await fetch(`http://127.0.0.1:${sSt.port}/${sTok}/api/health`, { signal: AbortSignal.timeout(1000) }); stillListening = p.ok; } catch {}
        check("a valid shutdown request ends the listener", sStop.status === 0 && !stillListening);
        check("stopping a server clears its state file", !fs.existsSync(sState));
      }
      try { sChild.kill("SIGTERM"); } catch {}
      fs.rmSync(sRoot, { recursive: true, force: true });
    }

    // ---- the same route must stay gated by the token and by origin ----
    const wrongToken = await fetch(`http://127.0.0.1:${st.port}/${"z".repeat(24)}/api/shutdown`, { method: "POST" });
    check("shutdown refuses a wrong token", wrongToken.status === 404);
    const badOrigin = await fetch(`${B}/api/shutdown`, { method: "POST", headers: { Origin: "http://evil.test" } });
    check("shutdown refuses a foreign origin", badOrigin.status === 403);
    const stillServing = await fetch(`${B}/api/health`);
    check("the server survives both refused shutdown attempts", stillServing.ok);

    // ---- a state file naming a foreign pid over the real server's port/token must not get
    // that process signalled: the health answer must confirm the very pid being targeted ----
    const swapped = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
    fs.writeFileSync(stateFile, JSON.stringify({ pid: swapped.pid, port: st.port, token, project: root, startedAt: new Date().toISOString() }));
    const swapStop = spawnSync(process.execPath, [SERVER, "stop", "--project", root], { encoding: "utf8" });
    let swappedAlive = true;
    try { process.kill(swapped.pid, 0); } catch { swappedAlive = false; }
    const stillUp = await fetch(`${B}/api/health`);
    check("stop leaves a swapped-in foreign pid alive (health pid does not match)", swapStop.status === 0 && swappedAlive && /not reachable/.test(swapStop.stdout));
    check("the real server survives a state file naming a foreign pid", stillUp.ok);
    swapped.kill("SIGTERM");

    // ---- stop with a stale (foreign, unreachable) pid must not kill it, only clear state ----
    const foreign = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
    fs.writeFileSync(stateFile, JSON.stringify({ pid: foreign.pid, port: 1, token: "stale", project: root, startedAt: new Date().toISOString() }));
    const stop = spawnSync(process.execPath, [SERVER, "stop", "--project", root], { encoding: "utf8" });
    let foreignAlive = true;
    try { process.kill(foreign.pid, 0); } catch { foreignAlive = false; }
    check("stop leaves foreign pid alive", stop.status === 0 && foreignAlive);
    check("stale .server.json removed", !fs.existsSync(stateFile));
    foreign.kill("SIGTERM");
  } finally {
    child.kill("SIGTERM");
  }

  await resolutionSuite();
  await bcSuite();
  await securitySuite();
  await evidenceContentSuite();
  await abLifecycleSuite();
  await robustnessSuite();

  console.log(`\n${passed} passed, ${failed} failed`);
  fs.rmSync(root, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
}

main();
