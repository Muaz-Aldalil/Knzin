/* UI Review Loop — DOM recorder (v1). Single canonical file: the round runner injects it as a
 * classic script; projects import the same file for side effects (import "./recorder.js").
 *
 * Classic script on purpose: the round runner injects it via
 * `agent-browser eval "$(cat recorder.js)" + bootstrap`, so NO module syntax.
 * Exposes AgentReviewRecorder = { DomRecorder, startRecorderIfEnabled, RECORDER_VERSION, REDACTION }
 * on window in the page, on globalThis elsewhere — so Node (the round runner, the test harness)
 * imports this same file and reads the SAME redaction policy the recorder enforces in the page.
 *
 * What it records per frame (see references/formats.md):
 *   - every DOM mutation on <body> (MutationObserver, coalesced per microtask),
 *     EXCLUDING the recorder's own overlay subtree;
 *   - the user event NEAR each change (capture-phase listeners) as `nearbyEvent` —
 *     temporal context, never asserted causality;
 *   - fetch boundaries, SPA navigations (pushState/replaceState/popstate),
 *     page lifecycle (visibilitychange/pageshow/pagehide);
 *   - runner-driven markers: markAction (chip overlay), markSync (fullscreen sync flash);
 *   - form values and visible text per frame.
 *
 * Redaction boundary — what actually reaches the saved timeline and the review site:
 *   - REDACTED: password-type inputs, fields with credential-shaped names/ids, fields
 *     whose autocomplete attribute carries a sensitive standardized token (the set
 *     below), controls matched by the operator's --redact selectors, and credentials
 *     in recorded URLs (userinfo, sensitive query params, secret-bearing path
 *     segments, credential-bearing fragments);
 *   - CAPTURED VERBATIM, by design: the page's visible text and the values of every
 *     other form field. An email, postal address, phone number, or date of birth
 *     typed into an ordinarily-named field IS recorded, saved to disk, and served by
 *     the review site — the reviewer needs to see what was on screen;
 *   - NEVER redacted: video pixels. Whatever is on screen while recording is in the
 *     recording, and no selector affects that;
 *   - TRUSTED: operator-written text (summaries, action labels, comments, the
 *     selector list itself) is recorded as-is and never scanned for secrets.
 *   To redact every form value, start the round with `--redact input,select,textarea`.
 *   That covers the timeline only — it cannot affect video.
 *
 * Evidence hygiene: overlays are fixed-position, pointer-events:none, text only via
 * CSS ::after attr() content (invisible to innerText), and the observer filters the
 * overlay subtree — the recorder never records itself.
 */
(() => {
"use strict";

const RECORDER_VERSION = "1";
const OVERLAY_ATTR = "data-ar-overlay";
const MAX_TEXT = 700;
const MAX_MUTS = 30;
// Per-frame form-value bounds. Every frame carries a values map and the buffer retains up to
// `max` frames, so an unbounded map is unbounded memory in the operator's own browser. 100
// controls at 200 characters each is the shape of a form under review; past either bound the
// video is the evidence. A frame whose values were bounded is marked truncated, which
// finalization turns into a `truncation` gap — a quietly shortened capture would be
// indistinguishable from a short form.
const MAX_VALUES = 100;
const MAX_VALUE_CHARS = 200;
// Chunked-drain sizing. A backend that transports a drain result as one JSON value
// (browser-control caps that value at 32 KiB) needs each chunk to fit under budget. The chunk
// is measured as the UTF-8 byte length of the COMPLETE return value (envelope fields + frames
// + JSON punctuation), so a frame cannot smuggle bytes past the cap. CHUNK_OVERHEAD is the
// smallest budget the runner may sensibly ask for.
const DEFAULT_CHUNK_BYTES = 24 * 1024;
const CHUNK_OVERHEAD = 256;
// Credential-name tokens, matched on separator/digit boundaries only — a bare substring
// rule would eat ordinary names like author, assignee, design, or postcode. The same token
// list drives field-name sensitivity below, URL parameter names, and (via the REDACTION
// export) the runner's network-header rules, so the three can never drift apart.
const SENSITIVE_NAME_TOKENS = [
  "pass(?:word|phrase)?", "token", "secret", "api[-_]?key", "card", "ccv", "cvc", "cvv", "ssn",
  "auth(?:orization|entication)?", "sig(?:nature)?", "session", "csrf",
  // second-factor and key material
  "otp", "pin", "mfa", "2fa", "verification", "backup", "recovery", "seed", "mnemonic",
  "private[-_]?key", "jwt", "bearer",
];
const SENSITIVE_RE = new RegExp(`(^|[-_])(${SENSITIVE_NAME_TOKENS.join("|")})([-_\\d]|$)`, "i");
// Sensitive standardized autocomplete tokens, spelled EXACTLY as the HTML standard
// spells them — matching below is exact per token, so an approximate name silently
// matches nothing. Modifier tokens (home/work/mobile/fax, shipping/billing) are
// grouping hints, not field identities; they need no entry because the match is
// "any token in the attribute", e.g. autocomplete="home tel" hits "tel".
const SENSITIVE_AUTOCOMPLETE = new Set([
  // credentials
  "username", "current-password", "new-password", "one-time-code",
  // payment cards
  "cc-name", "cc-given-name", "cc-additional-name", "cc-family-name",
  "cc-number", "cc-exp", "cc-exp-month", "cc-exp-year", "cc-csc", "cc-type",
  // email and instant messaging
  "email", "impp",
  // street addresses and their components
  "street-address", "address-line1", "address-line2", "address-line3",
  "address-level1", "address-level2", "address-level3", "address-level4",
  "postal-code", "country", "country-name",
  // telephone numbers and their components
  "tel", "tel-country-code", "tel-national", "tel-area-code", "tel-local",
  "tel-local-prefix", "tel-local-suffix", "tel-extension",
  // birthdays
  "bday", "bday-day", "bday-month", "bday-year",
]);
// OAuth parameters redact by EXACT name only (code, state, … are ordinary words), while the
// credential tokens above match on word boundaries — a bare substring rule would eat
// ordinary names like status_code, postcode, and statement.
const SENSITIVE_EXACT_PARAMS = new Set([
  "code", "state", "id_token", "access_token", "refresh_token", "credential", "assertion",
]);
// path-segment names that typically precede a token inside the URL path itself
// (/auth/<token>, /reset/<40-hex>); reset/verify/confirm cover the classic signed links
const SECRET_PATH_RE = /(pass(word)?|token|secret|api[-_]?key|session|csrf|auth|sig|signature|reset|verify|confirm)/i;
const TOKEN_LIKE = /^[A-Za-z0-9_.~+-]{20,}$/; // long opaque value — never an ordinary REST id
const REDACTED = "[redacted]";

// Captured AT LOAD, never resolved per call: on backends that inject the recorder after page
// script has run, a hostile page could otherwise replace the URL global (or DOM primitives)
// and switch redaction off while the frozen export still looks inert.
const URLImpl = typeof URL !== "undefined" ? URL : null;
const elGetAttribute = typeof Element !== "undefined" ? Element.prototype.getAttribute : null;
const elClosest = typeof Element !== "undefined" ? Element.prototype.closest : null;

function cssEscape(s) {
  return (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/["\\\]]/g, "\\$&");
}

function isSensitiveParam(k) {
  const n = String(k).toLowerCase();
  return SENSITIVE_RE.test(n) || SENSITIVE_EXACT_PARAMS.has(n);
}

function redactPathname(p) {
  if (typeof p !== "string" || p.length < 2) return p;
  const segs = p.split("/");
  let touched = false;
  for (let i = 0; i + 1 < segs.length; i++) {
    if (SECRET_PATH_RE.test(segs[i]) && TOKEN_LIKE.test(segs[i + 1])) {
      segs[i + 1] = REDACTED;
      touched = true;
      i++;
    }
  }
  return touched ? segs.join("/") : p;
}

// The base a relative URL resolves against is computed PER CALL, never captured at load: a
// page navigation would otherwise leave later URLs resolving against a stale base. Node has no
// location, so a dummy base keeps relative redaction working there.
function urlBase() {
  return (typeof location !== "undefined" && location && location.href) ? location.href : "http://ar.invalid/";
}

// A fragment is redacted only when it carries credential material: a key=value set naming a
// sensitive parameter (the OAuth implicit flow puts access_token in the fragment) or a bare
// token-like value. Plain route and anchor fragments survive — hash-routed apps navigate via
// pushState, and erasing every fragment would erase which screen the round actually tested.
function redactFragment(hash) {
  const h = hash.slice(1); // without the leading '#'
  if (!h) return hash;
  if (h.includes("=")) {
    for (const pair of h.split("&")) {
      const k = pair.split("=", 1)[0];
      if (k && isSensitiveParam(k)) return REDACTED;
    }
    return hash;
  }
  return TOKEN_LIKE.test(h) ? REDACTED : hash;
}

// redact sensitive query params, secret-bearing path segments, and userinfo before a URL is
// recorded anywhere; fragments are redacted conditionally (see redactFragment). Relative
// inputs stay relative, absolute inputs stay absolute; an input nothing matched is returned
// verbatim.
function redactUrl(u) {
  if (typeof u !== "string" || !u || !URLImpl) return u;
  const absolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(u);
  try {
    const url = absolute ? new URLImpl(u) : new URLImpl(u, urlBase());
    let touched = false;
    if (url.username || url.password) { url.username = ""; url.password = ""; touched = true; }
    for (const k of [...url.searchParams.keys()]) {
      if (isSensitiveParam(k)) { url.searchParams.set(k, REDACTED); touched = true; }
    }
    const rp = redactPathname(url.pathname);
    if (rp !== url.pathname) { url.pathname = rp; touched = true; }
    if (url.hash) {
      const rh = redactFragment(url.hash);
      if (rh !== url.hash) { url.hash = rh; touched = true; }
    }
    if (!touched) return u;
    return absolute ? url.toString() : url.pathname + url.search + url.hash;
  } catch { return u; }
}

function isSensitive(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.type === "password") return true;
  const getAttr = (name) => (elGetAttribute ? elGetAttribute.call(el, name) : el.getAttribute(name));
  const ac = (getAttr("autocomplete") || "").toLowerCase();
  if (ac && ac.split(/\s+/).some((t) => SENSITIVE_AUTOCOMPLETE.has(t))) return true;
  if (SENSITIVE_RE.test(el.name || "") || SENSITIVE_RE.test(el.id || "")) return true;
  const extra = window.__arRedact;
  if (Array.isArray(extra)) {
    // closest(), not matches(): naming a container protects every control inside it. The
    // runner validates the list in the page before capture starts, so a bad selector
    // throwing here is a real defect — never swallowed.
    const closest = (s) => (elClosest ? elClosest.call(el, s) : el.closest(s));
    for (const s of extra) {
      if (closest(s)) return true;
    }
  }
  return false;
}

function sel(el) {
  if (!el || el.nodeType !== 1) return null;
  if (el.id) return "#" + cssEscape(el.id);
  const tgt = [...(el.attributes || [])].find((a) => a.name.endsWith("-target"));
  if (tgt) return `[${tgt.name}="${cssEscape(tgt.value)}"]`;
  if (el.name && /^(input|select|textarea)$/i.test(el.tagName)) {
    return `${el.tagName.toLowerCase()}[name="${cssEscape(el.name)}"]`;
  }
  const cls = (typeof el.className === "string" && el.className.trim())
    ? "." + el.className.trim().split(/\s+/).slice(0, 2).map(cssEscape).join(".") : "";
  return el.tagName.toLowerCase() + cls;
}

// UTF-8 byte length of a string — the recorder measures bytes, never string .length.
function byteLen(s) { return new TextEncoder().encode(s).length; }

// UTF-8 byte size of the COMPLETE chunk return value with a given frame set. `more` serializes
// as its longer literal ("false") to keep the estimate conservative regardless of the real flag.
function returnBytes(bootId, firstRetained, frames, nextCursor) {
  return byteLen(JSON.stringify({ bootId, firstRetained, frames, nextCursor, more: false }));
}

// Stage-1 shrink of a single oversized frame: strip the unbounded payload (form values and
// visible text) and cap the mutation list, keeping the ordered structural record. data and
// nearbyEvent are kept — a large data.url is handled by the skeleton fallback below.
function truncateFrame(f) {
  const mutations = Array.isArray(f.mutations) ? f.mutations.slice(0, MAX_MUTS) : [];
  return {
    i: f.i, t: f.t, dt: f.dt, kind: f.kind, data: f.data,
    nearbyEvent: f.nearbyEvent || null,
    mutations, values: {}, text: "", truncated: true,
  };
}

// Stage-2 fallback when even a stripped frame busts the budget (e.g. a 40 KB data.url): reduce
// to a skeleton that keeps only identity, timing, and kind. The frame is never dropped, so the
// ordered record and the truncation gap survive.
function skeletonFrame(f) {
  return { i: f.i, t: f.t, dt: f.dt, kind: f.kind, truncated: true, data: { note: "truncated" } };
}

class DomRecorder {
  constructor({ max = 1000 } = {}) {
    this.max = max;
    this.frames = [];
    this.bootId = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
    this.started = false;
    this.pendingEvent = null;
    this._index = 0;
    this._confirmedUpTo = -1;   // last frame index the runner has durably persisted
    this._events = ["input", "change", "click", "keydown", "submit", "focusin", "focusout"];
  }

  start(root = document.body) {
    if (this.started || !root) return false;
    this.started = true;
    this.root = root;
    this.t0 = performance.now();
    this.bootWallTimeMs = Date.now();
    this._buildOverlay();

    this._onEvent = (e) => {
      const t = e.target;
      if (this._inOverlay(t)) return;
      const sensitive = isSensitive(t);
      // a sensitive control is never identified by its selector: its own id or name can
      // carry personal data (<input id="ssn-123-45-6789">) and would leak through it
      const rec = { type: e.type, selector: sensitive ? "(sensitive field)" : sel(t) };
      // individual keystrokes are never recorded: captured one keydown at a time, typed
      // content would be reassemblable character by character, defeating the value cap
      if (t && "value" in t && !sensitive) rec.value = String(t.value).slice(0, 40);
      if ((e.type === "click" || e.type === "submit") && !sensitive) {
        const txt = ((t && (t.innerText || t.value)) || "").trim().slice(0, 30);
        if (txt) rec.text = txt;
      }
      this.pendingEvent = rec;
      if (e.type === "click" && typeof e.clientX === "number") this._ripple(e.clientX, e.clientY);
    };
    this._events.forEach((t) => document.addEventListener(t, this._onEvent, true));

    this._origFetch = window.fetch;
    if (this._origFetch) {
      const self = this;
      window.fetch = function (...args) {
        const url = redactUrl(String((args[0] && args[0].url) || args[0] || ""));
        self._push("fetch:start", { url });
        return self._origFetch.apply(this, args)
          .then((res) => { self._push("fetch:end", { url, status: res.status }); return res; })
          // the error's NAME only — its message can carry credentials (Error("Bearer …"))
          .catch((err) => { self._push("fetch:error", { url, error: String((err && err.name) || "fetch failed") }); throw err; });
      };
    }

    const self = this;
    const wrapHistory = (fn, cause) => function (...args) {
      const r = fn.apply(this, args);
      self._push("navigation", { url: redactUrl(location.href), sameDocument: true, cause });
      return r;
    };
    this._origPushState = history.pushState;
    this._origReplaceState = history.replaceState;
    history.pushState = wrapHistory(history.pushState, "pushState");
    history.replaceState = wrapHistory(history.replaceState, "replaceState");
    this._onPopstate = () => this._push("navigation", { url: redactUrl(location.href), sameDocument: true, cause: "popstate" });
    this._onVisibility = () => this._push("lifecycle", { event: "visibilitychange", state: document.visibilityState });
    this._onPagehide = (e) => this._push("lifecycle", { event: "pagehide", persisted: !!e.persisted });
    this._onPageshow = (e) => { if (e.persisted) this._push("lifecycle", { event: "pageshow", persisted: true }); };
    window.addEventListener("popstate", this._onPopstate);
    document.addEventListener("visibilitychange", this._onVisibility);
    window.addEventListener("pagehide", this._onPagehide);
    window.addEventListener("pageshow", this._onPageshow);

    this.obs = new MutationObserver((muts) => this._queue(muts));
    this.obs.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });

    this._push("sync", { id: "boot", wallTimeMs: this.bootWallTimeMs });
    window.__recReady = true;
    return true;
  }

  stop() {
    if (!this.started) return;
    this.obs && this.obs.disconnect();
    if (this._origFetch) window.fetch = this._origFetch;
    if (this._origPushState) history.pushState = this._origPushState;
    if (this._origReplaceState) history.replaceState = this._origReplaceState;
    this._events.forEach((t) => document.removeEventListener(t, this._onEvent, true));
    window.removeEventListener("popstate", this._onPopstate);
    document.removeEventListener("visibilitychange", this._onVisibility);
    window.removeEventListener("pagehide", this._onPagehide);
    window.removeEventListener("pageshow", this._onPageshow);
    this.overlay && this.overlay.remove();
    this.started = false;
  }

  // ---- runner-facing markers ----

  markSync(id) {
    this._push("sync", { id, wallTimeMs: Date.now() });
    this.clearSync();
    const el = document.createElement("div");
    el.setAttribute(OVERLAY_ATTR, "1");
    el.setAttribute("data-ar-sync", "1");
    el.setAttribute("data-label", `SYNC ${id}`);
    this.overlay.appendChild(el);
    this._syncEl = el;
    return true;
  }

  clearSync() {
    if (this._syncEl) { this._syncEl.remove(); this._syncEl = null; }
  }

  markAction(name, target, note) {
    const label = ((note ? "⚠ " : "") + (target ? `${name} ${target}` : String(name))).slice(0, 80);
    const data = { name: String(name), target: target || null };
    if (note) data.note = String(note);
    this._push("action", data);
    if (this._chip) this._chip.remove();
    const chip = document.createElement("div");
    chip.setAttribute(OVERLAY_ATTR, "1");
    chip.setAttribute("data-ar-chip", "1");
    chip.setAttribute("data-label", label);
    this.overlay.appendChild(chip);
    this._chip = chip;
    setTimeout(() => { if (this._chip === chip) { chip.remove(); this._chip = null; } }, 900);
  }

  // ---- draining (incremental, crash-safe) ----

  // Read frames with i > cursor WITHOUT dropping them. Pair with confirmDrain().
  drainSince(cursor) {
    const out = this.frames.filter((f) => f.i > cursor);
    return {
      bootId: this.bootId,
      frames: out,
      firstRetained: this.frames.length ? this.frames[0].i : this._index,
      monoNow: Math.round(performance.now() - this.t0),
      wallNow: Date.now(),
    };
  }

  // Drop persisted frames AFTER the runner confirms durability.
  confirmDrain(cursor) {
    this.frames = this.frames.filter((f) => f.i > cursor);
    this._confirmedUpTo = Math.max(this._confirmedUpTo, cursor);
  }

  // Bounded read of frames with i > cursor, sized so the WHOLE return value fits `budgetBytes`
  // of UTF-8 JSON (measured on the complete candidate return, not a per-frame estimate). Same
  // durability contract as drainSince (read without dropping; pair with confirmDrain).
  // Invariants the runner relies on: a single frame larger than the budget is returned shrunk
  // (stage 1) or skeletonized (stage 2), never dropped; a chunk with remaining frames sets
  // more:true; a chunk is never both empty and more:true. `firstRetained` reports the live
  // buffer floor so the runner can detect overflow exactly as drainSince does.
  drainChunk(cursor, budgetBytes) {
    const budget = (typeof budgetBytes === "number" && budgetBytes > CHUNK_OVERHEAD)
      ? budgetBytes : DEFAULT_CHUNK_BYTES;
    const avail = this.frames.filter((f) => f.i > cursor);
    const firstRetained = this.frames.length ? this.frames[0].i : this._index;
    const out = [];
    for (let k = 0; k < avail.length; k++) {
      let f = avail[k];
      if (returnBytes(this.bootId, firstRetained, out.concat([f]), f.i) > budget) {
        if (out.length > 0) break; // this frame belongs to the next chunk
        // oversized single frame: shrink, then skeletonize if still over — never drop it
        f = truncateFrame(f);
        if (returnBytes(this.bootId, firstRetained, [f], f.i) > budget) f = skeletonFrame(f);
        out.push(f);
        break;
      }
      out.push(f);
    }
    const more = out.length < avail.length;
    const nextCursor = out.length ? out[out.length - 1].i : cursor;
    return { bootId: this.bootId, firstRetained, frames: out, nextCursor, more };
  }

  // Audit drivers: drop all retained frames (call before the interaction you care about).
  // Frame indices keep climbing, so runner cursors stay valid — but never call this during
  // an active review round: retained-but-undrained evidence would be lost.
  clear() {
    this.frames = [];
    this.pendingEvent = null;
  }

  dumpCompact() {
    // Legacy-compatible reading for coverage-audit drivers and ad-hoc debugging.
    return this.frames.map((f) => ({
      i: f.i, t: f.t, dt: f.dt, kind: f.kind,
      data: f.data,
      url: f.data ? f.data.url : undefined,
      status: f.data ? f.data.status : undefined,
      trigger: f.nearbyEvent
        ? `${f.nearbyEvent.type} ${f.nearbyEvent.selector}${f.nearbyEvent.value != null ? ` =${JSON.stringify(f.nearbyEvent.value)}` : ""}`
        : null,
      nearbyEvent: f.nearbyEvent,
      mutations: f.mutations, values: f.values, text: f.text,
    }));
  }

  // ---- internals ----

  _buildOverlay() {
    const el = document.createElement("div");
    el.setAttribute(OVERLAY_ATTR, "1");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
    const st = document.createElement("style");
    st.textContent = `
[data-ar-ripple]{position:fixed;width:56px;height:56px;border-radius:9999px;pointer-events:none;
  border:3px solid rgba(124,108,255,.95);box-shadow:0 0 0 8px rgba(124,108,255,.25);
  transform:translate(-50%,-50%) scale(.2);opacity:.95;animation:arRipple .55s ease-out forwards}
@keyframes arRipple{to{transform:translate(-50%,-50%) scale(1);opacity:0}}
[data-ar-chip]{position:fixed;top:12px;left:12px;pointer-events:none;
  background:rgba(16,16,26,.92);border:1px solid rgba(124,108,255,.6);border-radius:8px;padding:6px 10px}
[data-ar-chip]::after{content:attr(data-label);color:#e8e8f2;font:600 12px/1.4 system-ui,sans-serif}
[data-ar-sync]{position:fixed;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;
  background:rgba(10,10,20,.88)}
[data-ar-sync]::after{content:attr(data-label);color:#fff;font:700 9vw/1 system-ui,sans-serif;letter-spacing:.06em}`;
    el.appendChild(st);
    (document.documentElement || this.root).appendChild(el);
    this.overlay = el;
  }

  _ripple(x, y) {
    if (!this.overlay) return;
    const r = document.createElement("div");
    r.setAttribute(OVERLAY_ATTR, "1");
    r.setAttribute("data-ar-ripple", "1");
    r.style.left = x + "px";
    r.style.top = y + "px";
    this.overlay.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }

  _inOverlay(node) {
    let n = node && (node.nodeType === 1 ? node : node.parentNode);
    while (n) {
      if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute(OVERLAY_ATTR)) return true;
      n = n.parentNode;
    }
    return false;
  }

  _queue(muts) {
    const clean = muts.filter((m) => !this._inOverlay(m.target));
    if (!clean.length) return;
    this._pending = (this._pending || []).concat(clean);
    if (this._scheduled) return;
    this._scheduled = true;
    queueMicrotask(() => {
      this._scheduled = false;
      const m = this._pending; this._pending = [];
      this._push("mutation", {}, m);
    });
  }

  _push(kind, data = {}, muts = null) {
    const t = Math.round(performance.now() - this.t0);
    const prev = this.frames[this.frames.length - 1];
    const frame = {
      i: this._index++, t, dt: prev ? t - prev.t : 0, kind, data,
      nearbyEvent: this.pendingEvent,
      mutations: muts ? this._summarize(muts) : [],
      values: this._values(),
      text: this._text(),
    };
    if (muts && frame.mutations._truncated) frame.truncated = true;
    if (this.valuesBounded) frame.truncated = true;
    if (kind !== "fetch:start") this.pendingEvent = null;
    this.frames.push(frame);
    if (this.frames.length > this.max) this.frames.shift(); // overflow surfaces via firstRetained
  }

  _summarize(muts) {
    const seen = new Set();
    const out = [];
    // mutation targets get the same treatment as event targets: a sensitive control is
    // identified by a fixed marker, never by a selector built from its own attributes
    const targetOf = (el) => (isSensitive(el) ? "(sensitive field)" : sel(el));
    for (const m of muts) {
      let o;
      if (m.type === "attributes") o = { type: "attributes", target: targetOf(m.target), name: m.attributeName };
      else if (m.type === "characterData") o = { type: "characterData", target: targetOf(m.target.parentNode) };
      else o = { type: "childList", target: targetOf(m.target), added: m.addedNodes.length, removed: m.removedNodes.length };
      const k = JSON.stringify(o);
      if (!seen.has(k)) { seen.add(k); out.push(o); }
      if (out.length >= MAX_MUTS) { out._truncated = true; break; }
    }
    return out;
  }

  _values() {
    const v = {};
    let pos = 0;
    let kept = 0;
    this.valuesBounded = false;
    this.root.querySelectorAll("input,select,textarea").forEach((el) => {
      const index = pos++; // document order, counted over every control so position is stable
      if (el.type === "password") return; // never appears, even redacted
      if (kept >= MAX_VALUES) { this.valuesBounded = true; return; }
      // a sensitive control is keyed by POSITION, never by sel(): its own id or name can
      // carry personal data (<input id="ssn-123-45-6789">) and would leak through the key
      if (isSensitive(el)) { v[`(field ${index})`] = REDACTED; kept++; return; }
      let key = sel(el) || el.name;
      if (!key) return;
      const value = String(el.value);
      if (value.length > MAX_VALUE_CHARS) this.valuesBounded = true;
      const bounded = value.slice(0, MAX_VALUE_CHARS);
      if (el.type === "checkbox" || el.type === "radio") {
        key += `[value="${cssEscape(bounded)}"]`; // same-name groups must not collide
        if (el.checked) { v[key] = bounded; kept++; }
        return;
      }
      v[key] = bounded;
      kept++;
    });
    return v;
  }

  _text() {
    let t = (this.root.innerText || "").replace(/\s+/g, " ").trim();
    const extra = Array.isArray(window.__arRedact) ? window.__arRedact : [];
    // no try/catch: the operator's selector list is validated before capture starts, so a
    // rejection from the selector engine is a real defect and must surface, not be ignored
    for (const s of extra) {
      this.root.querySelectorAll(s).forEach((el) => {
        const v = (el.innerText || "").replace(/\s+/g, " ").trim();
        if (v) t = t.split(v).join(REDACTED);
      });
    }
    return t.slice(0, MAX_TEXT);
  }

  // One-shot UI-affordance audit (used by the coverage-audit workflow). Empty lists = clean.
  auditAffordances(root = document.body) {
    const hidden = (el) => !(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const cs = (el) => getComputedStyle(el);
    const interactive = [...root.querySelectorAll('button, [role="button"], a[href], summary, label[for], select, [data-action]')]
      .filter((el) => !el.disabled && !hidden(el) && !this._inOverlay(el))
      .filter((el) => {
        const action = el.getAttribute && el.getAttribute("data-action");
        if (!action) return true;
        if (el.tagName === "FORM") return false;
        return action.split(/\s+/).some((a) => a && !/@(window|document)/.test(a));
      });
    const noPointer = interactive
      .filter((el) => !el.matches('input:not([type=button]):not([type=submit]):not([type=reset]), textarea'))
      .filter((el) => cs(el).cursor !== "pointer")
      .map((el) => ({ el: sel(el), cursor: cs(el).cursor, text: (el.textContent || "").trim().slice(0, 30) }));
    const notAnimating = [...root.querySelectorAll('[class*="animate-"]')]
      .filter((el) => !hidden(el) && cs(el).animationName === "none")
      .map((el) => ({ el: sel(el), class: el.getAttribute("class") }));
    const notFocusable = interactive
      .filter((el) => !el.matches("button, a[href], select, summary, input, textarea") && el.tabIndex < 0)
      .map((el) => ({ el: sel(el), text: (el.textContent || "").trim().slice(0, 30) }));
    return { interactiveScanned: interactive.length, noPointer, notAnimating, notFocusable };
  }
}

// App-served boot (project-integrated usage): dev/test only + explicit opt-in flag.
function startRecorderIfEnabled() {
  const env = document.querySelector('meta[name="rails-env"]') && document.querySelector('meta[name="rails-env"]').content;
  if (env !== "development" && env !== "test") return;
  const wants = new URLSearchParams(location.search).has("record_dom") ||
    (typeof localStorage !== "undefined" && localStorage.getItem("dom_recorder") === "on");
  if (!wants) return;
  window.__rec = new DomRecorder();
  const boot = () => window.__rec.start(document.body);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}

// The shared redaction policy, exported so the round runner and the test harness enforce the
// SAME rules the recorder does. INERT on purpose: frozen snapshots and predicate functions only,
// never the live rule objects — the recorder consults its own closure constants, so page code
// holding this view cannot mutate the policy; and because the URL/DOM primitives are captured
// at load, replacing those globals afterwards cannot switch redaction off either.
const REDACTION = Object.freeze({
  exactParams: Object.freeze([...SENSITIVE_EXACT_PARAMS]),
  autocomplete: Object.freeze([...SENSITIVE_AUTOCOMPLETE]),
  nameTokens: Object.freeze([...SENSITIVE_NAME_TOKENS]),
  isSensitiveParam,
  redactUrl,
});

// window-first: in the page (and for projects copying this file) the export lives on window;
// in Node it lands on globalThis, where the runner and the test harness read it.
(typeof window !== "undefined" ? window : globalThis).AgentReviewRecorder =
  { DomRecorder, startRecorderIfEnabled, RECORDER_VERSION, REDACTION };
})();
