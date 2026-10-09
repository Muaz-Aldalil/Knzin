/* UI Review Loop — UI. One page, two views: library (/) and watch (/round/:id).
 * Rules honored: user content only via textContent; capture while paused + seeked;
 * comments are plain text + timestamp; the frame JPEG is captured at submit.
 */
(() => {
"use strict";

const parts = location.pathname.split("/").filter(Boolean);
const TOKEN = parts[0];
const API = `/${TOKEN}/api`;
const app = document.getElementById("app");

// ---------- tiny DOM helpers ----------

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

const ICONS = {
  play: '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z"/></svg>',
  pause: '<svg viewBox="0 0 16 16"><path d="M3.5 2.5h3.4v11H3.5zM9 2.5h3.4v11H9z"/></svg>',
  plus: '<svg viewBox="0 0 16 16"><path d="M7.2 3h1.6v4.2H13v1.6H8.8V13H7.2V8.8H3V7.2h4.2z"/></svg>',
  back: '<svg viewBox="0 0 16 16"><path d="M10.5 3L5.8 8l4.7 5 1.1-1.1L8 8.3l3.6-3.6z"/></svg>',
};

function icon(name) {
  const span = document.createElement("span");
  span.innerHTML = ICONS[name];
  return span.firstChild;
}

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

const STATUS_LABEL = {
  "awaiting-review": "awaiting review",
  "in-review": "in review",
  "submitted": "submitted",
  "addressed": "addressed",
};

async function api(path, opts) {
  const r = await fetch(`${API}${path}`, opts);
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { msg = (await r.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

function errbox(msg) {
  app.replaceChildren(h("div", { class: "errbox", role: "alert" }, msg));
}

// ---------- library ----------

async function renderLibrary() {
  app.replaceChildren(h("div", { class: "loading", role: "status" }, "Loading rounds…"));
  let data;
  try { data = await api("/rounds"); }
  catch (e) { return errbox(`Could not load rounds: ${e.message}`); }

  const head = h("div", { class: "masthead" },
    h("div", {},
      h("h1", {}, "UI Review Loop", h("span", { class: "dot" }, ".")),
      h("div", { class: "sub" }, `${data.rounds.length} recorded round${data.rounds.length === 1 ? "" : "s"}`)),
  );

  if (!data.rounds.length) {
    app.replaceChildren(head, h("div", { class: "empty" },
      h("p", {}, "No rounds recorded yet."),
      h("p", {}, "Ask your agent to record one with ", h("code", {}, "round.mjs start --url <url>"), ".")));
    return;
  }

  const grid = h("div", { class: "grid" });
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      io.unobserve(en.target);
      primePoster(en.target);
    }
  }, { rootMargin: "200px" });

  for (const r of data.rounds) {
    const video = h("video", { muted: true, playsinline: true, preload: "none", src: `${API}/rounds/${r.roundId}/video` });
    const shimmer = h("div", { class: "shimmer" });
    const poster = h("div", { class: "poster", dataset: { seek: "1.5" } }, video, shimmer);
    if (r.commentCount) poster.append(h("div", { class: "count" }, `${r.commentCount} 💬`));

    const meta = h("div", { class: "meta" },
      h("span", {}, fmtDate(r.startedAt)),
      r.branch ? h("span", { class: "chip" }, r.branch) : null,
      r.dirty ? h("span", { class: "dirty", title: "uncommitted changes" }, "●dirty") : null,
      r.syncConfidence === "low" || r.syncConfidence === "unavailable"
        ? h("span", { class: "chip warn", title: "DOM-to-video sync is low confidence" }, "sync ~") : null,
      // a round that knows it lost evidence must not look like one that captured everything
      (r.incomplete || []).length
        ? h("span", {
          class: "chip warn",
          title: `not fully captured: ${r.incomplete.join(", ")}${r.gapCount ? ` — ${r.gapCount} gap${r.gapCount > 1 ? "s" : ""}` : ""}`,
        }, `evidence: ${r.incomplete.join("/")} partial`) : null,
    );

    // a real anchor, not a div playing one: click, Enter, focus, and open-in-new-tab all come
    // from the browser instead of from hand-written handlers that only approximate them
    const card = h("a", { class: "card", href: `/${TOKEN}/round/${r.roundId}`, "aria-label": `open round ${r.roundId}` },
      poster,
      h("div", { class: "body" },
        h("div", { class: "top" },
          h("span", { class: `badge ${r.status}` }, STATUS_LABEL[r.status] || r.status)),
        h("p", { class: "summary" }, r.summary || "(no summary)"),
        meta));
    poster.dataset.primed = "";
    poster._video = video;
    poster._shimmer = shimmer;
    io.observe(poster);
    grid.append(card);
  }
  app.replaceChildren(head, grid);
}

function primePoster(poster) {
  const video = poster._video;
  const done = () => poster._shimmer.remove();
  video.preload = "metadata";
  video.addEventListener("loadedmetadata", () => {
    const t = Math.min(parseFloat(poster.dataset.seek || "0.75"), Math.max(0, (video.duration || 1) - 0.1));
    video.currentTime = isFinite(t) ? t : 0.75;
  }, { once: true });
  video.addEventListener("seeked", () => { video.pause(); done(); }, { once: true });
  video.addEventListener("error", done, { once: true });
  video.load();
}

// ---------- watch ----------

async function renderWatch(roundId) {
  app.replaceChildren(h("div", { class: "loading", role: "status" }, "Loading round…"));
  let pack;
  try { pack = await api(`/rounds/${roundId}`); }
  catch (e) { return errbox(`Could not load round: ${e.message}`); }

  const { meta, dom, comments, status } = pack;
  const reviewOpen = comments.reviewState === "open";

  // --- player ---
  const video = h("video", { src: `${API}/rounds/${roundId}/video`, playsinline: true, preload: "auto" });
  const playBtn = h("button", { class: "icon-btn", "aria-label": "play/pause" }, icon("play"));
  const timeEl = h("span", { class: "time" }, "0:00.0", h("b", {}, " / "), "0:00.0");
  const seek = h("input", { class: "seek", type: "range", min: "0", max: "1000", value: "0", step: "1", "aria-label": "seek" });
  const rail = h("div", { class: "rail" });

  const togglePlay = () => { video.paused ? video.play() : video.pause(); };
  playBtn.addEventListener("click", togglePlay);
  video.addEventListener("play", () => playBtn.replaceChildren(icon("pause")));
  video.addEventListener("pause", () => playBtn.replaceChildren(icon("play")));
  video.addEventListener("click", togglePlay);
  video.addEventListener("loadedmetadata", () => {
    timeEl.childNodes[2].textContent = ` ${fmtTime(video.duration)} `;
    buildRail();
  });
  video.addEventListener("timeupdate", () => {
    timeEl.childNodes[0].textContent = fmtTime(video.currentTime);
    if (video.duration) {
      seek.value = String(Math.round((video.currentTime / video.duration) * 1000));
      seek.style.setProperty("--played", `${(video.currentTime / video.duration) * 100}%`);
    }
  });
  seek.addEventListener("input", () => {
    if (video.duration) video.currentTime = (seek.value / 1000) * video.duration;
  });

  // --- video-time mapping (wall clock → video ms) ---
  function buildMapper() {
    const anchors = (meta.sync && meta.sync.anchors || []).filter((a) => a.videoTimeMs != null);
    const segs = (dom && dom.segments) || [];
    const bootWalls = new Map(segs.map((s) => [s.id, s.bootWallTimeMs]));
    if (anchors.length) {
      const a0 = anchors[0];
      const offset = a0.wallTimeMs - a0.videoTimeMs; // unit slope, calibrated offset
      return { map: (segId, t) => { const bw = bootWalls.get(segId); return bw == null ? null : bw + t - offset; }, confident: meta.sync.confidence === "high" };
    }
    const span = (() => {
      const walls = segs.map((s) => [s.bootWallTimeMs, s.endedWallTimeMs]).filter(([a]) => a != null);
      if (!walls.length) return null;
      const start = Math.min(...walls.map(([a]) => a));
      const end = Math.max(...walls.map(([, b]) => b || start + 1000));
      return { start, end };
    })();
    return {
      map: (segId, t) => {
        const bw = bootWalls.get(segId);
        if (bw == null || !span || !video.duration) return null;
        return ((bw + t - span.start) / Math.max(1, span.end - span.start)) * video.duration * 1000;
      },
      confident: false,
    };
  }

  function buildRail() {
    rail.replaceChildren();
    if (!video.duration) return;
    const mapper = buildMapper();
    const segs = (dom && dom.segments) || [];
    const durMs = video.duration * 1000;
    const legend = h("span", { class: "legend" },
      h("span", { title: "something the agent did — click, fill, key" }, h("i", { style: `background:var(--accent)` }), "action"),
      h("span", { title: "network request the page made (AJAX)" }, h("i", { style: `background:var(--blue)` }), "fetch"),
      h("span", { title: "full page navigation — link, redirect, open" }, h("i", { style: `background:var(--orange)` }), "page change"));
    rail.append(legend);
    for (const seg of segs) {
      for (const f of seg.frames || []) {
        let cls = null, label = null;
        if (f.kind === "action") { cls = "action"; label = f.data && (f.data.name + (f.data.target ? " " + f.data.target : "")); }
        else if (f.kind === "fetch:start") { cls = "fetch"; label = "fetch " + (f.data && f.data.url || ""); }
        else if (f.kind === "navigation") { cls = "navigation"; label = "page change → " + (f.data && f.data.url || ""); }
        if (!cls) continue;
        const ms = mapper.map(seg.id, f.t);
        if (ms == null || ms < 0 || ms > durMs) continue;
        const noted = f.data && f.data.note;
        const tick = h("button", {
          class: `tick ${cls}${mapper.confident ? "" : " lowconf"}${noted ? " noted" : ""}`,
          style: `left:${(ms / durMs) * 100}%`,
          title: `${label || cls} @ ${fmtTime(ms / 1000)}${mapper.confident ? "" : " (approx)"}${noted ? `\n⚠ ${f.data.note}` : ""}`,
          "aria-label": `seek to ${label || cls}`,
        });
        tick.addEventListener("click", () => { video.currentTime = ms / 1000; });
        rail.append(tick);
      }
    }
    // Where the DOM evidence stopped being provable. A gap names a segment, not a span, so it is
    // marked at that segment's last recorded frame — the point past which the rail shows nothing
    // because nothing was captured, not because nothing happened.
    for (const g of (meta && meta.completeness && meta.completeness.gaps) || []) {
      const seg = segs.find((s) => s.id === g.segmentId);
      const last = seg && (seg.frames || [])[(seg.frames || []).length - 1];
      if (!last) continue;
      const ms = mapper.map(seg.id, last.t);
      if (ms == null || ms < 0 || ms > durMs) continue;
      const dropped = g.droppedFrames ? ` — ${g.droppedFrames} frames lost` : "";
      rail.append(h("span", {
        class: "tick gap",
        style: `left:${(ms / durMs) * 100}%`,
        title: `evidence gap: ${g.reason}${dropped}\nthe timeline is incomplete from here`,
      }));
    }
  }

  // --- comments ---
  const commentsCol = h("div", { class: "panel" });
  const listEl = h("div", { class: "panel" });

  function commentCard(c) {
    const t = c.videoTimeMs / 1000;
    const seekThere = () => { video.currentTime = t; video.pause(); };
    const img = h("img", { src: `${API}/rounds/${roundId}/comment-images/${c.id}.jpg`, alt: "frame at comment", title: "seek to this moment" });
    img.addEventListener("click", seekThere);
    const chip = h("button", { class: "chip accent", title: "seek to this moment" }, fmtTime(t));
    chip.addEventListener("click", seekThere);
    const card = h("div", { class: "comment" },
      img,
      h("div", { class: "cbody" },
        h("div", { class: "ctime" }, chip),
        h("p", { class: "text" }, c.text),
        h("div", { class: "date" }, fmtDate(c.createdAt))));
    card._t = t;
    return card;
  }

  for (const c of (comments.comments || []).slice().sort((a, b) => a.videoTimeMs - b.videoTimeMs)) {
    listEl.append(commentCard(c));
  }

  let composerEl = null;
  function openComposer() {
    if (!reviewOpen || composerEl) return;
    video.pause();
    const pinned = video.currentTime;
    // a placeholder is not a label — it is unspoken by some assistive tech and vanishes on the
    // first keystroke; name the field so it is announced whatever is typed
    const ta = h("textarea", { placeholder: "What’s wrong at this moment?", "aria-label": `Comment on the frame at ${fmtTime(pinned)}`, maxlength: "4000" });
    // role=alert so a save failure is spoken, matching the page's global error box; the reviewer
    // may be looking at the video, not the composer, when the submit comes back
    const err = h("div", { class: "date", style: "color:var(--amber)", role: "alert" });
    const submitBtn = h("button", { class: "btn primary" }, "Add comment");
    const cancelBtn = h("button", { class: "btn" }, "Cancel");
    composerEl = h("div", { class: "composer" },
      h("div", { class: "stamp" }, h("span", { class: "chip accent" }, fmtTime(pinned))),
      ta, err,
      h("div", { class: "actions" }, cancelBtn, submitBtn));
    commentsCol.insertBefore(composerEl, listEl);
    ta.focus();
    cancelBtn.addEventListener("click", () => { composerEl.remove(); composerEl = null; });
    ta.addEventListener("keydown", (e) => { if (e.key === "Escape") { composerEl.remove(); composerEl = null; } });
    submitBtn.addEventListener("click", async () => {
      const text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      submitBtn.disabled = true;
      err.textContent = "";
      try {
        // the user may have played/seeked while composing — return to the pinned moment
        video.pause();
        if (Math.abs(video.currentTime - pinned) > 0.05) {
          video.currentTime = pinned;
          await new Promise((res2, rej2) => {
            video.addEventListener("seeked", res2, { once: true });
            setTimeout(() => rej2(new Error("seek back to the comment moment timed out")), 4000);
          });
        }
        const imageBase64 = await captureFrame(video);
        const created = await api(`/rounds/${roundId}/comments`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoTimeMs: Math.round(pinned * 1000), text, imageBase64 }),
        });
        const card = commentCard({ id: created.id, videoTimeMs: Math.round(pinned * 1000), text, createdAt: created.createdAt });
        // keep the list sorted by video time
        const after = [...listEl.children].find((el) => el._t > pinned);
        card._t = pinned;
        after ? listEl.insertBefore(card, after) : listEl.append(card);
        countEl.textContent = `Comments (${listEl.children.length})`;
        composerEl.remove(); composerEl = null;
      } catch (e2) {
        err.textContent = `Couldn’t save — draft kept. ${e2.message}`;
        submitBtn.disabled = false;
      }
    });
  }

  const addBtn = h("button", { class: "btn" }, icon("plus"), " Comment");
  addBtn.addEventListener("click", openComposer);
  const countEl = h("span", {}, `Comments (${(comments.comments || []).length})`);
  commentsCol.append(
    h("h2", {}, countEl, reviewOpen ? addBtn : null),
    listEl);

  // --- submit review (two-step) ---
  let submitReviewBtn = null;
  if (reviewOpen) {
    submitReviewBtn = h("button", { class: "btn primary" }, "Submit review");
    let armed = false;
    submitReviewBtn.addEventListener("click", async () => {
      if (!armed) {
        armed = true;
        submitReviewBtn.className = "btn confirm";
        submitReviewBtn.textContent = "Confirm — this locks comments";
        setTimeout(() => { if (submitReviewBtn.isConnected && !armedDone) { armed = false; submitReviewBtn.className = "btn primary"; submitReviewBtn.textContent = "Submit review"; } }, 4000);
        return;
      }
      armedDone = true;
      submitReviewBtn.disabled = true;
      try {
        await api(`/rounds/${roundId}/submit-review`, { method: "POST" });
        location.reload();
      } catch (e) { submitReviewBtn.disabled = false; submitReviewBtn.textContent = `Retry (${e.message})`; }
    });
  }
  let armedDone = false;

  // --- layout ---
  const banner = !reviewOpen
    ? h("div", { class: `banner ${status}` }, status === "addressed"
      ? "Review submitted and fully addressed by the agent."
      : "Review submitted — the agent will work through these comments next round.")
    : null;

  const topbar = h("div", { class: "topbar" },
    (() => { const b = h("a", { class: "back", href: `/${TOKEN}/` }, icon("back"), " Library"); return b; })(),
    h("span", { class: "title" }, (meta && meta.summary) || roundId),
    meta && meta.git && meta.git.branch ? h("span", { class: "chip" }, meta.git.branch) : null,
    // warn on low/unavailable only — "medium" is the ceiling for a calibrated round, so warning
    // above it would light on every round and mean nothing
    meta && meta.sync && (meta.sync.confidence === "low" || meta.sync.confidence === "unavailable")
      ? h("span", { class: "chip warn", title: "DOM-to-video sync is low confidence; event rail positions are approximate" }, "sync approximate") : null,
    (() => {
      const c = meta && meta.completeness;
      if (!c) return null;
      const short = ["video", "dom", "network"].filter((k) => c[k] !== "complete");
      if (!short.length) return null;
      const gaps = Array.isArray(c.gaps) ? c.gaps : [];
      const why = gaps.length ? ` (${[...new Set(gaps.map((g) => g.reason))].join(", ")})` : "";
      return h("span", {
        class: "chip warn",
        title: `${short.map((k) => `${k}: ${c[k]}`).join(", ")}${why} — this round did not capture everything`,
      }, `evidence: ${short.join("/")} partial`);
    })(),
    h("span", { class: "spacer" }),
    submitReviewBtn);

  const player = h("div", { class: "player" },
    video,
    h("div", { class: "controls" },
      h("div", { class: "row" }, playBtn, timeEl, seek),
      rail));

  const hintbar = reviewOpen
    ? h("div", { class: "hintbar" },
      h("span", {}, h("kbd", {}, "space"), "play/pause"),
      h("span", {}, h("kbd", {}, "j"), h("kbd", {}, "l"), "±10s"),
      h("span", {}, h("kbd", {}, "←"), h("kbd", {}, "→"), "±5s"),
      h("span", {}, h("kbd", {}, "c"), "comment here"))
    : null;

  app.replaceChildren(
    topbar,
    banner || "",
    h("div", { class: "stage" }, player, commentsCol),
    hintbar || "");

  // --- keyboard ---
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT") && t !== seek) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case " ": case "k": e.preventDefault(); togglePlay(); break;
      case "j": video.currentTime = Math.max(0, video.currentTime - 10); break;
      case "l": video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); break;
      case "ArrowLeft": video.currentTime = Math.max(0, video.currentTime - 5); break;
      case "ArrowRight": video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); break;
      case "c": if (reviewOpen) { e.preventDefault(); openComposer(); } break;
    }
  });
}

// Capture the currently displayed frame (video is paused; wait out any in-flight seek).
// The server refuses a comment image over 4 MiB. A native-resolution frame off a large video can
// exceed that, which would lose the operator's comment at submit — so the frame is scaled to a
// review-legible cap and, if a busy frame is still too large, re-encoded at stepped-down quality
// until it fits. The cap is generous: a comment image only has to show what the operator means.
const FRAME_MAX_EDGE = 1600;
const FRAME_MAX_BYTES = 3.5 * 1024 * 1024; // headroom under the server's 4 MiB ceiling
function encodeUnderLimit(canvas, qualities) {
  return new Promise((resolve, reject) => {
    const tryNext = (i) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("frame capture failed"));
        // accept once it fits, or when the last (lowest) quality is all that is left
        if (blob.size <= FRAME_MAX_BYTES || i === qualities.length - 1) {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result).split(",")[1]);
          fr.onerror = () => reject(new Error("frame read failed"));
          fr.readAsDataURL(blob);
        } else tryNext(i + 1);
      }, "image/jpeg", qualities[i]);
    };
    tryNext(0);
  });
}
function captureFrame(video) {
  return new Promise((resolve, reject) => {
    const grab = () => {
      try {
        const w = video.videoWidth, hgt = video.videoHeight;
        if (!w || !hgt) return reject(new Error("video not ready"));
        const scale = Math.min(1, FRAME_MAX_EDGE / Math.max(w, hgt));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale); canvas.height = Math.round(hgt * scale);
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        encodeUnderLimit(canvas, [0.85, 0.7, 0.55, 0.4]).then(resolve, reject);
      } catch (e) { reject(e); }
    };
    if (video.seeking) {
      video.addEventListener("seeked", grab, { once: true });
      setTimeout(() => reject(new Error("seek timeout")), 4000);
    } else if (video.readyState >= 2) grab();
    else {
      video.addEventListener("loadeddata", grab, { once: true });
      setTimeout(() => reject(new Error("video load timeout")), 4000);
    }
  });
}

// ---------- route ----------

if (parts[1] === "round" && parts[2]) renderWatch(parts[2]);
else renderLibrary();

})();
