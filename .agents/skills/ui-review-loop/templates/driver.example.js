// Browser-audit driver skeleton (Playwright). Reads coverage.json, walks every view/state,
// fires every inventoried element, asserts its declared expectations against the DOM
// recorder's timeline, and prints COVERAGE n/n (inventoried) + violations only.
//
// Audits run UNRECORDED by default — a 100% sweep makes a long, unwatchable video. When the
// operator should see evidence, record a SHORT agent-review round of just the failing or
// representative flow instead.
//
// Conventions that keep it reliable (see references/coverage-audit.md "Gotchas"):
//   * navClick for anything that navigates — never a bare click + waitForURL.
//   * window.__rec.clear() before each interaction whose dynamics you assert.
//   * expectations read from dumpCompact(), not from screenshots.
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3000';
const coverage = JSON.parse(fs.readFileSync(`${__dirname}/coverage.json`, 'utf8'));

// --- PREFLIGHT (fail closed, BEFORE any interaction) --------------------------------
// The audit clicks EVERY inventoried control, including state-changing ones (sends,
// resolves, deletes). Running it against the wrong target must be impossible.
// (1) Approved origin, checked here; (2) live recorder, (3) isolated test account, and
// (4) seed/reset strategy, checked below where marked — keep every one of them throwing.
function preflightOrigin(base) {
  const h = new URL(base).hostname;
  const ok = h === '127.0.0.1' || h === 'localhost' || h.endsWith('.localhost') ||
             (process.env.AUDIT_STAGING_HOST && h === process.env.AUDIT_STAGING_HOST);
  if (!ok) throw new Error(`AUDIT REFUSED: "${base}" is not loopback or the approved staging host`);
}
preflightOrigin(BASE);

// (3) Isolated test account and (4) seed/reset — project-specific. The audit REFUSES to
// run until you replace these bodies with real checks. That is deliberate: an exhaustive
// driver clicks state-changing controls, so "forgot to wire safety" must be a thrown
// error, not a scrolled-past comment.
async function preflightTestAccount(page) {
  throw new Error('AUDIT REFUSED: preflightTestAccount() not implemented — prove the logged-in account is a throwaway (fixture marker, test-domain email, seeded tenant)');
}
async function preflightSeedReset(page) {
  throw new Error('AUDIT REFUSED: preflightSeedReset() not implemented — prove seed/reset ran for THIS run (fixture task, tenant wipe, rollback)');
}

const hits = new Set(), violations = [];
const hit = (view, id) => hits.add(`${view}/${id}`);
const bad = (view, id, expected, got) => violations.push({ view, id, expected, got });

// POST -> redirect often lands on the SAME URL; waitForURL insta-matches and your assert
// runs mid-flight. Wait for the actual navigation instead.
async function navClick(page, selector, urlRe) {
  const el = await page.$(selector);
  if (!el) throw new Error('missing ' + selector);
  await Promise.all([
    page.waitForNavigation({ url: urlRe, timeout: 60000, waitUntil: 'load' }),
    el.click({ noWaitAfter: true })
  ]);
}

// Recorder helpers — the timeline is the source of truth for dynamics.
const rec = {
  clear: (p) => p.evaluate(() => window.__rec && window.__rec.clear()),
  frames: (p) => p.evaluate(() => (window.__rec ? window.__rec.dumpCompact() : [])),
  sawFetch: async (p, urlPart) =>
    (await rec.frames(p)).some(f => f.kind === 'fetch:end' && (!urlPart || (f.url || '').includes(urlPart))),
  sawMutation: async (p, triggerPart) =>
    (await rec.frames(p)).some(f => f.kind === 'mutation' && (!triggerPart || (f.trigger || '').includes(triggerPart))),
  affordances: (p) => p.evaluate(() => window.__rec && window.__rec.auditAffordances())
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  // Enable the recorder for the whole session (dev/test only — it refuses to boot elsewhere).
  await page.goto(BASE + '/?record_dom=1', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.setItem('dom_recorder', 'on'));

  // Preflight (2): the recorder must be LIVE and recording — a constructed-but-stopped
  // (or stubbed) recorder is no evidence. Refuse without it.
  await page.reload({ waitUntil: 'load' });
  if (!(await page.evaluate(() => !!(window.__rec && window.__rec.started))))
    throw new Error('AUDIT REFUSED: DOM recorder not recording (expected ?record_dom=1 / localStorage boot)');

  // ... login with an ISOLATED TEST ACCOUNT here ...
  await preflightTestAccount(page);
  await preflightSeedReset(page);

  // Example: one view's walk — repeat per coverage.json entry, hitting EVERY element id.
  // await page.goto(BASE + '/support', { waitUntil: 'load' });
  // await rec.clear(page);
  // await page.fill('input[name=q]', 'probe');                          // expects: ["value","mut"]
  // // values are keyed by SELECTOR and sampled when a frame fires — a bare fill with no
  // // DOM reaction emits nothing, so assert the value on the mutation it triggers:
  // const sawValue = (await rec.frames(page)).some(f => f.kind === 'mutation' && f.values &&
  //   Object.entries(f.values).some(([k, v]) => k.includes('[name="q"]') && v === 'probe'));
  // if (!sawValue) bad('landing-signed-in', 'sidebar-search', 'value on a reacting frame', 'no mutation frame carried it');
  // hit('landing-signed-in', 'sidebar-search');
  //
  // const a = await rec.affordances(page);                              // expects: [] (no violations)
  // if (a && (a.noPointer.length || a.notAnimating.length || a.notFocusable.length))
  //   bad('landing-signed-in', 'affordances', 'clean sweep', JSON.stringify(a));
  // hit('landing-signed-in', 'affordances');

  // Reconcile the EXACT id set — a matching count can still hide drifted ids.
  const allIds = coverage.views.flatMap(v => v.elements.map(e => `${v.id}/${e.id}`));
  const missing = allIds.filter(id => !hits.has(id));
  const unknown = [...hits].filter(id => !allIds.includes(id));
  console.log(`COVERAGE ${allIds.length - missing.length}/${allIds.length} (inventoried)`);
  console.log(`VIOLATIONS ${violations.length}`);
  violations.forEach(v => console.log(' ', JSON.stringify(v)));
  missing.forEach(id => console.log('  MISSING ' + id));
  unknown.forEach(id => console.log('  UNKNOWN  ' + id));
  await browser.close();
  process.exit(violations.length || missing.length || unknown.length ? 1 : 0);
})();
