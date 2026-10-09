#!/usr/bin/env node
/* UI Review Loop — review server. Serves the operator-facing library + watch pages and the
 * comment write-path for ONE project, loopback-only, behind an unguessable URL token.
 *
 *   server.mjs open --project <dir>     start (or reuse) the detached server, open browser
 *   server.mjs restart --project <dir>  kill + start fresh
 *   server.mjs stop --project <dir>     stop it
 *   server.mjs serve --project <dir> --token <t>   (internal: the detached child)
 *
 * Zero dependencies. The server process is intentionally independent of any agent session.
 */
"use strict";

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
// The one rule deciding whether a resolution holds, shared with the runner that writes them.
// Importing it rather than restating it is what keeps the write path and the operator's label
// from drifting apart; round.mjs runs nothing on import.
import { resolutionProblem, RESOLUTION_ARTIFACTS, nodeVersionProblem } from "./round.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);
const SKILL_DIR = path.resolve(__dirname, "..");
const UI_DIR = path.join(SKILL_DIR, "assets", "ui");

const ROUND_ID_RE = /^\d{8}T\d{6}Z-[0-9a-f]{6}$/;
const COMMENT_ID_RE = /^c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_TEXT = 4000;
const MAX_JPEG = 4 * 1024 * 1024;
const MAX_BODY = 6 * 1024 * 1024;
// The detached server has no terminal, so its stderr is pointed at a file in the artifact
// directory and truncated once it passes this ceiling — a record an operator can read, that
// cannot grow without bound.
const SERVER_LOG_MAX_BYTES = 1024 * 1024;

// ---------- shared helpers ----------

function die(msg, code = 1) { process.stderr.write(`server: ${msg}\n`); process.exit(code); }

// An unhandled request failure answers 500; without this it also leaves nothing behind, so a
// reproducible failure has no trace to debug from. One line to stderr — the stream the
// detached server already points at .agent-review/.server.log — carrying what failed and
// where. The token is the URL's only secret, so it is masked out of the recorded path, and
// writing the record must never itself become the failure.
function logRequestFailure(req, e, token) {
  try {
    const where = String((req && req.url) || "?").split(token).join("<token>");
    process.stderr.write(`server: ${new Date().toISOString()} ${(req && req.method) || "?"} ${where} failed — ${(e && e.stack) || e}\n`);
  } catch {}
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function atomicWriteJson(file, obj) {
  // random, exclusively-created temporary: a pre-placed link at a predictable name must
  // never receive the payload, and rename() only ever replaces the leaf itself
  const tmp = `${file}.tmp-${process.pid}-${crypto.randomBytes(6).toString("hex")}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), { flag: "wx" });
  fs.renameSync(tmp, file);
}

// The single way every command obtains the artifact directory. lstat rejects a symlinked
// .agent-review (mkdir would silently follow it) and anything that is not a real directory;
// realpath equality then proves the directory is the project's own. Read-only commands use
// the non-creating variant.
function arDir(root, { create = true } = {}) {
  const dir = path.join(root, ".agent-review");
  let lst = null;
  try { lst = fs.lstatSync(dir); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  if (lst && lst.isSymbolicLink()) die(".agent-review is a symlink — refusing to use it; remove the link so the tool can use a real directory");
  if (lst && !lst.isDirectory()) die(".agent-review is not a directory — refusing to use it; remove the file so the tool can use a real directory");
  if (!lst) {
    if (!create) return null;
    fs.mkdirSync(dir, { mode: 0o700 });
  }
  const real = fs.realpathSync(dir);
  if (real !== path.join(fs.realpathSync(root), ".agent-review")) die(".agent-review does not resolve inside this project — refusing to use it");
  if (create) { try { fs.chmodSync(dir, 0o700); } catch {} }
  return real;
}

// Status is derived from the resolutions AND from the rounds they point at, every read. A
// resolution entry is a claim, not a fact: the round it names can be deleted, replaced by an
// unreadable package, or have been unable to support the claim from the moment it was written.
// A claim that no longer holds reads as `resolution-broken` rather than falling back to
// `submitted` — silently reverting would hide that anything was ever claimed, and an operator
// would have to re-derive the truth the library exists to state.
function deriveStatus(comments, resolutions, base, roundId) {
  const list = (comments && comments.comments) || [];
  const items = (resolutions && resolutions.items) || {};
  if (comments && comments.reviewState === "submitted") {
    let held = 0;
    let broken = false;
    for (const c of list) {
      const item = c && items[c.id];
      if (!item) continue;
      const problem = resolutionProblem({
        feedbackRoundId: roundId, comments, comment: c, inRoundId: item.resolvedInRoundId,
        ...resolvingRound(base, item.resolvedInRoundId),
      });
      if (problem) broken = true;
      else held++;
    }
    if (broken) return "resolution-broken";
    if (list.length > 0 && held === list.length) return "addressed";
    return "submitted";
  }
  return list.length > 0 ? "in-review" : "awaiting-review";
}

function roundDir(base, roundId) {
  if (!ROUND_ID_RE.test(roundId)) return null;
  const dir = path.join(base, roundId);
  try {
    if (fs.lstatSync(dir).isSymbolicLink()) return null;
    const real = fs.realpathSync(dir);
    if (!real.startsWith(base + path.sep)) return null;
    return real;
  } catch { return null; }
}

// realpath a file inside an already-verified round dir, rejecting symlinked leaves outright
function safeFile(rd, ...names) {
  const file = path.join(rd, ...names);
  try {
    if (fs.lstatSync(file).isSymbolicLink()) return null;
    const real = fs.realpathSync(file);
    if (!real.startsWith(rd + path.sep)) return null;
    return real;
  } catch { return null; }
}

// What a resolving round still holds, read through the same containment rules as any other
// package read. Deleted, symlinked, and unparseable all surface as an absent artifact or a null
// meta, both of which are refused downstream.
function resolvingRound(base, roundId) {
  const rd = typeof roundId === "string" ? roundDir(base, roundId) : null;
  const missingArtifacts = RESOLUTION_ARTIFACTS.filter((f) => !rd || !safeFile(rd, f));
  const metaFile = rd && safeFile(rd, "meta.json");
  return { meta: metaFile ? readJson(metaFile) : null, missingArtifacts };
}

// ---------- the HTTP server ----------

function createServer(projectRoot, token) {
  const base = arDir(projectRoot);

  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    // style allows inline because the UI positions rail ticks and legend swatches via the
    // style attribute; script stays strict ('self' only) and all user content is textContent.
    "Content-Security-Policy": "default-src 'self'; media-src 'self' blob:; img-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
  };

  // serialize all state mutations per round dir — the single-operator ceiling makes a
  // promise-chain mutex sufficient (no lost comments, no submit/comment races)
  const locks = new Map();
  function withLock(key, fn) {
    const prev = locks.get(key) || Promise.resolve();
    const next = prev.then(fn, fn);
    locks.set(key, next.catch(() => {}));
    return next;
  }

  function readJsonSafe(rd, name) {
    const f = safeFile(rd, name);
    return f ? readJson(f) : null;
  }

  function send(res, status, body, headers = {}) {
    const isBuf = Buffer.isBuffer(body);
    const data = isBuf ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    res.writeHead(status, {
      "Content-Type": headers["Content-Type"] || (isBuf ? "application/octet-stream" : "application/json"),
      "Content-Length": data.length,
      "Cache-Control": "no-store",
      ...securityHeaders,
      ...headers,
    });
    res.end(data);
  }

  function serveVideo(res, file, rangeHeader, method) {
    let size;
    try { size = fs.statSync(file).size; } catch { return send(res, 404, { error: "no video" }); }
    // no-store like every other response: the video is recorded evidence, and a cached copy left
    // in the reviewer's browser is one more place it lives after the round is gone. The 416 below
    // carries no body, so it does not need it.
    const type = { "Content-Type": "video/webm", "Accept-Ranges": "bytes", "Cache-Control": "no-store" };
    if (rangeHeader) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
      let start, end;
      if (m && m[1] !== "") { start = parseInt(m[1], 10); end = m[2] === "" ? size - 1 : Math.min(parseInt(m[2], 10), size - 1); }
      else if (m && m[2] !== "") { const n = parseInt(m[2], 10); start = Math.max(0, size - n); end = size - 1; }
      if (start == null || Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
        res.writeHead(416, { "Content-Range": `bytes */${size}`, ...securityHeaders });
        return res.end();
      }
      res.writeHead(206, { ...type, ...securityHeaders, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
      if (method === "HEAD") return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...type, ...securityHeaders, "Content-Length": size });
    if (method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let n = 0;
      req.on("data", (c) => {
        n += c.length;
        if (n > MAX_BODY) { reject(new Error("body too large")); req.destroy(); return; }
        chunks.push(c);
      });
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });
  }

  async function handleCommentPost(req, res, rd, roundId) {
    // body read OUTSIDE the lock — a stalled upload must not block other comments/submits
    let body;
    try { body = JSON.parse((await readBody(req)).toString("utf8")); }
    catch { return send(res, 400, { error: "invalid JSON body" }); }
    const { videoTimeMs, text, imageBase64 } = body || {};
    if (typeof videoTimeMs !== "number" || !Number.isFinite(videoTimeMs) || videoTimeMs < 0) {
      return send(res, 422, { error: "videoTimeMs must be a finite non-negative number" });
    }
    if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT) return send(res, 422, { error: `text required, max ${MAX_TEXT} chars` });
    if (typeof imageBase64 !== "string" || !imageBase64) return send(res, 422, { error: "imageBase64 required" });
    const img = Buffer.from(imageBase64, "base64");
    if (img.length > MAX_JPEG) return send(res, 422, { error: "image too large" });
    if (img.length < 4 || img[0] !== 0xff || img[1] !== 0xd8 || img[2] !== 0xff || img[img.length - 2] !== 0xff || img[img.length - 1] !== 0xd9) {
      return send(res, 422, { error: "image is not a valid JPEG" });
    }
    return withLock(rd, async () => {
      const commentsFile = safeFile(rd, "comments.json");
      const comments = commentsFile && readJson(commentsFile);
      if (!comments) return send(res, 404, { error: "round not found" });
      // state check INSIDE the lock — no submit/comment race
      if (comments.reviewState !== "open") return send(res, 409, { error: "review already submitted" });
      const id = "c-" + crypto.randomUUID();
      const createdAt = new Date().toISOString();
      // image first; the comment succeeds only after the image is durable
      const imgDir = path.join(rd, "comment-images");
      fs.mkdirSync(imgDir, { recursive: true });
      const imgDirReal = fs.realpathSync(imgDir);
      if (!imgDirReal.startsWith(rd + path.sep)) return send(res, 500, { error: "internal" });
      const imgTmp = path.join(imgDirReal, `.${id}.tmp`);
      fs.writeFileSync(imgTmp, img);
      fs.renameSync(imgTmp, path.join(imgDirReal, `${id}.jpg`));
      comments.comments.push({ id, videoTimeMs: Math.round(videoTimeMs), text: text.trim(), createdAt });
      atomicWriteJson(commentsFile, comments);
      return send(res, 201, { id, createdAt });
    });
  }

  function handleSubmitReview(res, rd) {
    return withLock(rd, async () => {
      const commentsFile = safeFile(rd, "comments.json");
      const comments = commentsFile && readJson(commentsFile);
      if (!comments) return send(res, 404, { error: "round not found" });
      if (comments.reviewState !== "submitted") {
        comments.reviewState = "submitted";
        comments.submittedAt = new Date().toISOString();
        atomicWriteJson(commentsFile, comments);
      }
      return send(res, 200, { reviewState: "submitted", submittedAt: comments.submittedAt });
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const host = req.headers.host || "";
      if (!/^127\.0\.0\.1:\d+$/.test(host) && !/^localhost:\d+$/.test(host)) return send(res, 403, { error: "bad host" });
      const u = new URL(req.url, "http://127.0.0.1");
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] !== token) return send(res, 404, { error: "not found" });
      const seg = parts.slice(1);
      const method = req.method || "GET";

      if (method === "POST") {
        const origin = req.headers.origin;
        if (origin && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) return send(res, 403, { error: "bad origin" });
      }

      // static UI
      const indexHtml = () => fs.readFileSync(path.join(UI_DIR, "index.html"), "utf8").replaceAll("__TOKEN__", token);
      if (method === "GET" && seg.length === 0) {
        return send(res, 200, indexHtml(), { "Content-Type": "text/html; charset=utf-8" });
      }
      if (method === "GET" && seg[0] === "round" && seg.length === 2 && ROUND_ID_RE.test(seg[1])) {
        return send(res, 200, indexHtml(), { "Content-Type": "text/html; charset=utf-8" });
      }
      if (method === "GET" && seg[0] === "ui" && seg.length === 2 && ["app.css", "app.js"].includes(seg[1])) {
        const file = path.join(UI_DIR, seg[1]);
        const type = seg[1].endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
        return send(res, 200, fs.readFileSync(file), { "Content-Type": type });
      }

      // API
      if (seg[0] === "api" && seg[1] === "health" && method === "GET") {
        // the pid lets callers confirm the process a state file names is really this one
        return send(res, 200, { ok: true, project: projectRoot, pid: process.pid });
      }
      if (seg[0] === "api" && seg[1] === "shutdown" && method === "POST") {
        // the only sanctioned way to stop the server: the serving process exits ITSELF when
        // the token holder asks. No external signal is ever aimed at a pid read from a file,
        // so no file contents can redirect the shutdown at an unrelated process.
        send(res, 200, { ok: true, shuttingDown: true });
        res.on("finish", () => {
          server.close(() => process.exit(0));
          setTimeout(() => process.exit(0), 500).unref();
        });
        return;
      }
      if (seg[0] === "api" && seg[1] === "rounds" && seg.length === 2 && method === "GET") {
        const cards = [];
        if (fs.existsSync(base)) {
          for (const name of fs.readdirSync(base)) {
            if (name.startsWith(".") || !ROUND_ID_RE.test(name)) continue;
            const rd = path.join(base, name);
            try {
              const lst = fs.lstatSync(rd);
              if (lst.isSymbolicLink() || !lst.isDirectory()) continue; // symlinked rounds are not data
            } catch { continue; }
            const meta = readJsonSafe(rd, "meta.json");
            const comments = readJsonSafe(rd, "comments.json");
            const resolutions = readJsonSafe(rd, "resolutions.json");
            if (!meta || !comments) continue;
            cards.push({
              roundId: name,
              startedAt: meta.startedAt,
              summary: meta.summary,
              branch: meta.git ? meta.git.branch : null,
              dirty: meta.git ? meta.git.dirty : null,
              syncConfidence: meta.sync ? meta.sync.confidence : "unavailable",
              // which evidence channels fell short, so a card can say so instead of looking
              // identical to a round that captured everything
              incomplete: meta.completeness
                ? ["video", "dom", "network"].filter((c) => meta.completeness[c] !== "complete")
                : [],
              gapCount: meta.completeness && Array.isArray(meta.completeness.gaps) ? meta.completeness.gaps.length : 0,
              commentCount: (comments.comments || []).length,
              status: deriveStatus(comments, resolutions, base, name),
            });
          }
        }
        cards.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
        return send(res, 200, { rounds: cards });
      }
      if (seg[0] === "api" && seg[1] === "rounds" && seg.length === 3 && method === "GET") {
        const rd = roundDir(base, seg[2]);
        if (!rd) return send(res, 404, { error: "round not found" });
        const meta = readJsonSafe(rd, "meta.json");
        const dom = readJsonSafe(rd, "dom.json");
        const comments = readJsonSafe(rd, "comments.json");
        const resolutions = readJsonSafe(rd, "resolutions.json");
        if (!meta || !comments) return send(res, 404, { error: "round incomplete" });
        return send(res, 200, { meta, dom, comments, resolutions, status: deriveStatus(comments, resolutions, base, seg[2]) });
      }
      if (seg[0] === "api" && seg[1] === "rounds" && seg.length === 4 && seg[3] === "video" && (method === "GET" || method === "HEAD")) {
        const rd = roundDir(base, seg[2]);
        if (!rd) return send(res, 404, { error: "round not found" });
        const vf = safeFile(rd, "video.webm");
        if (!vf) return send(res, 404, { error: "no video" });
        return serveVideo(res, vf, req.headers.range, method);
      }
      if (seg[0] === "api" && seg[1] === "rounds" && seg.length === 5 && seg[3] === "comment-images" && method === "GET") {
        const rd = roundDir(base, seg[2]);
        const m = /^(c-[0-9a-f-]{36})\.jpg$/.exec(seg[4] || "");
        if (!rd || !m || !COMMENT_ID_RE.test(m[1])) return send(res, 404, { error: "not found" });
        const file = safeFile(rd, "comment-images", `${m[1]}.jpg`);
        if (!file) return send(res, 404, { error: "not found" });
        return send(res, 200, fs.readFileSync(file), { "Content-Type": "image/jpeg" });
      }
      if (seg[0] === "api" && seg[1] === "rounds" && seg.length === 4 && seg[3] === "comments" && method === "POST") {
        const rd = roundDir(base, seg[2]);
        if (!rd) return send(res, 404, { error: "round not found" });
        return await handleCommentPost(req, res, rd, seg[2]);
      }
      if (seg[0] === "api" && seg[1] === "rounds" && seg.length === 4 && seg[3] === "submit-review" && method === "POST") {
        const rd = roundDir(base, seg[2]);
        if (!rd) return send(res, 404, { error: "round not found" });
        return await handleSubmitReview(res, rd);
      }
      return send(res, 404, { error: "not found" });
    } catch (e) {
      logRequestFailure(req, e, token);
      try { send(res, 500, { error: "internal" }); } catch {}
    }
  });
  return server;
}

// ---------- process management ----------

function serverStateFile(dir) { return path.join(dir, ".server.json"); }

// tokens are generated as crypto.randomBytes(18).toString("base64url") — exactly 24 chars
// from that alphabet; anything else is not a token this tool wrote
const TOKEN_RE = /^[A-Za-z0-9_-]{24}$/;

// The state file is untrusted input: an unvalidated port can redirect the health probe (and
// the token in its URL) to a foreign host, and the pid is only ever a hint for liveness —
// never a signal target.
function validServerState(s, root) {
  if (!s || typeof s !== "object") return false;
  if (!Number.isInteger(s.pid) || s.pid < 1) return false;
  if (!Number.isInteger(s.port) || s.port < 1 || s.port > 65535) return false;
  if (typeof s.token !== "string" || !TOKEN_RE.test(s.token)) return false;
  if (s.project !== root) return false;
  return true;
}

function loadServerState(root) {
  const dir = arDir(root, { create: false });
  if (!dir) return null;
  const f = serverStateFile(dir);
  try { if (fs.lstatSync(f).isSymbolicLink()) return null; } catch { return null; }
  const s = readJson(f);
  return validServerState(s, root) ? s : null;
}

function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function healthy(root, st) {
  if (!pidAlive(st.pid)) return false;
  try {
    // a connected-but-hung server must not stall stop/open/restart for undici's
    // multi-minute default timeout — 1.5s is generous for a loopback health probe
    const r = await fetch(`http://127.0.0.1:${st.port}/${st.token}/api/health`, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return false;
    const j = await r.json();
    if (!j || j.project !== root) return false;
    // a server answering health WITHOUT a pid predates the pid check: it is reachable but
    // unmanageable — it cannot be confirmed as the named process and may lack the shutdown
    // route, so callers must keep its state file and point at lsof rather than delete state
    if (j.pid == null) return "unmanageable";
    // the serving process must confirm it is the very process the state file names —
    // otherwise a swapped pid would be signalled on someone else's word
    return j.pid === st.pid;
  } catch { return false; }
}

// How a URL is handed to the operator's browser, per platform. `open` is macOS only; on any
// other platform it fails in a way the operator cannot act on.
function browserOpenCommand(platform = process.platform) {
  if (platform === "darwin") return { cmd: "open", args: [] };
  if (platform === "win32") return { cmd: "cmd", args: ["/c", "start", ""] };
  if (platform === "linux" || platform === "freebsd" || platform === "openbsd") return { cmd: "xdg-open", args: [] };
  return null;
}

// An unsupported platform, a missing launcher, and a launcher that fails all end the same way
// for the operator: say plainly that the page was not opened, and print the URL to open by
// hand. The server is already running either way, so this never fails the command.
function openBrowser(url) {
  const byHand = () => process.stdout.write(`could not open a browser automatically — open this URL yourself: ${url}\n`);
  const launcher = browserOpenCommand();
  if (!launcher) return byHand();
  let child;
  try { child = spawn(launcher.cmd, [...launcher.args, url], { detached: true, stdio: "ignore" }); }
  catch { return byHand(); }
  child.on("error", byHand);
  child.unref();
}

// Where the detached server's stderr goes. A symlinked or unopenable log is never written
// through — the server still starts, it just loses the record, which is the safe direction.
function serverLogTarget(dir) {
  const file = path.join(dir, ".server.log");
  try { if (fs.lstatSync(file).isSymbolicLink()) return "ignore"; }
  catch (e) { if (!e || e.code !== "ENOENT") return "ignore"; }
  try { if (fs.statSync(file).size > SERVER_LOG_MAX_BYTES) fs.truncateSync(file, 0); } catch {}
  try { return fs.openSync(file, "a", 0o600); } catch { return "ignore"; }
}

async function cmdOpen(root, { force = false } = {}) {
  arDir(root);
  if (!force) {
    const st = loadServerState(root);
    if (st && (await healthy(root, st))) {
      const url = `http://127.0.0.1:${st.port}/${st.token}/`;
      console.log(`review server already running: ${url}`);
      openBrowser(url);
      return;
    }
  } else {
    await cmdStop(root, { quiet: true });
  }
  const token = crypto.randomBytes(18).toString("base64url");
  const child = spawn(process.execPath, [__filename, "serve", "--project", root, "--token", token], {
    detached: true, stdio: ["ignore", "ignore", serverLogTarget(arDir(root))],
  });
  child.unref();
  // the child writes .server.json once listening
  const t0 = Date.now();
  for (;;) {
    const st = loadServerState(root);
    if (st && st.pid === child.pid && (await healthy(root, st))) {
      const url = `http://127.0.0.1:${st.port}/${st.token}/`;
      console.log(`review server: ${url}`);
      openBrowser(url);
      return;
    }
    if (Date.now() - t0 > 5000) die("server failed to start (no .server.json / health check)");
    await new Promise((r) => setTimeout(r, 120));
  }
}

async function cmdStop(root, { quiet = false } = {}) {
  const dir = arDir(root, { create: false });
  const st = dir ? loadServerState(root) : null;
  const clearState = () => {
    if (!dir) return;
    // the state path may be a directory, not just a file — remove whatever it is, and say so
    // precisely when even that fails
    try { fs.rmSync(serverStateFile(dir), { force: true, recursive: true }); }
    catch { process.stderr.write(`server: could not remove ${serverStateFile(dir)} — remove it by hand\n`); }
  };
  if (!st) {
    if (!quiet) console.log("no review server running");
    clearState();
    return;
  }
  const health = await healthy(root, st);
  if (health === "unmanageable") {
    // reachable but not provably this process: keep the state file (the server is alive and
    // still serving) and say so even under quiet — restart is the path that overwrites the
    // state file, so the operator must learn the old listener is still out there
    console.log(`the review server on 127.0.0.1:${st.port} answers health but predates the current health protocol — left its state file in place; find the listener with 'lsof -nP -iTCP:${st.port} -sTCP:LISTEN' and stop that process by hand`);
    return;
  }
  if (!health) {
    if (!quiet) console.log("server not reachable — removed stale state");
    clearState();
    return;
  }
  // ask the serving process to exit itself; never signal a pid read from a file
  let accepted = false;
  try {
    const r = await fetch(`http://127.0.0.1:${st.port}/${st.token}/api/shutdown`, { method: "POST", signal: AbortSignal.timeout(1500) });
    accepted = r.ok;
  } catch { accepted = false; }
  if (!accepted) {
    if (!quiet) console.log(`the review server on 127.0.0.1:${st.port} did not accept the shutdown request — it may predate the shutdown route; find the listener with 'lsof -nP -iTCP:${st.port} -sTCP:LISTEN' and stop that process by hand`);
    return; // the state file stays: the server is alive and still manageable
  }
  // wait for the listener to actually go away — accepting the request is not being stopped
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if (!(await healthy(root, st))) {
      clearState();
      if (!quiet) console.log("review server stopped");
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!quiet) console.log(`the process behind 127.0.0.1:${st.port} accepted shutdown but is still listening — find it with 'lsof -nP -iTCP:${st.port} -sTCP:LISTEN' and stop it by hand`);
}

function cmdServe(root, token) {
  // validate before binding the socket: a token the tool would never generate must not
  // start a server no other command can manage
  if (!TOKEN_RE.test(token)) die("the --token value is not a token this tool generates — refusing to listen");
  const server = createServer(root, token);
  server.listen(0, "127.0.0.1", () => {
    const port = server.address().port;
    atomicWriteJson(serverStateFile(arDir(root)), {
      pid: process.pid, port, token, project: root, startedAt: new Date().toISOString(),
    });
  });
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

// ---------- main ----------

async function main() {
  const runtimeProblem = nodeVersionProblem();
  if (runtimeProblem) die(runtimeProblem);
  const [cmd, ...rest] = process.argv.slice(2);
  const get = (name) => { const i = rest.indexOf(name); return i === -1 ? null : rest[i + 1]; };
  const projectArg = get("--project") || process.cwd();
  const root = fs.realpathSync(projectArg);
  switch (cmd) {
    case "open": return cmdOpen(root);
    case "restart": return cmdOpen(root, { force: true });
    case "stop": return cmdStop(root);
    case "serve": {
      const token = get("--token");
      if (!token) die("serve requires --token");
      return cmdServe(root, token);
    }
    default: die("usage: server.mjs <open|restart|stop> --project <dir>", 2);
  }
}

export { browserOpenCommand };

// commands run only when this file IS the command; importing it (the self-test reads the
// platform table) must not start a server
const isDirectRun = process.argv[1] && fs.realpathSync(process.argv[1]) === __filename;
if (isDirectRun) main();
