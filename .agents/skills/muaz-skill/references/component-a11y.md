# Component Accessibility Patterns (WCAG 2.2 AA — copy-pasteable)

Load during Phase 4 whenever you build interactive components: modals, accordions, tabs, forms, menus, or toasts. These are the canonical accessible implementations — use them instead of re-inventing focus management.

---

## Universal Rules (every component)

1. **Semantic element first** — use the native HTML element before any custom role: `<button>` not `div role="button"`, `<dialog>` not `div role="dialog"`, `<select>` not a custom dropdown.
2. **Visible focus ring** — `:focus-visible` outline: 2px ring, 2px offset, high contrast against both themes. Never `outline: none` without a replacement. (WCAG 2.2 2.4.13 Focus Appearance)
3. **Focus not obscured** — focused element must never be fully hidden by a sticky header/overlay; scroll it into view and keep a visible margin (WCAG 2.2 2.4.11).
4. **Keyboard parity** — every mouse interaction has a keyboard equivalent; Tab order matches visual order.
5. **Don't trap content by color** — always pair color with icon/text.
6. **Reduced motion** — wrap every transition/animation in `@media (prefers-reduced-motion: reduce)`.
7. **Touch targets** — min 44x44px (exceeds WCAG 2.2 2.5.8 24x24 minimum), 8px gap between adjacent targets.
8. **`lang` + RTL** — `lang` set on `<html>`; use logical CSS properties so RTL just works.
9. **Accessible authentication** — never require solving a puzzle/captcha as the only path; offer alternatives (WCAG 2.2 3.3.8). Don't block paste into password fields.
10. **Status messages announced** — async success/failure/loading via live regions (`role="status"`/`role="alert"`), not silent DOM swaps (WCAG 2.2 4.1.3).

---

## Skip Link (every page)

```html
<a class="skip-link" href="#main">Skip to main content</a>
```

```css
.skip-link {
  position: absolute; inset-inline-start: 1rem; inset-block-start: -3rem;
  padding: 0.75rem 1rem; background: var(--color-bg); color: var(--color-text);
  z-index: var(--z-tooltip); border-radius: var(--radius-sm);
  transition: inset-block-start 0.2s;
}
.skip-link:focus { inset-block-start: 1rem; }
```

```html
<main id="main">…</main>
```

---

## Modal / Dialog (focus trap)

Prefer the native `<dialog>` element — it handles focus containment, `Escape`, and the light-dismiss backdrop for free.

```html
<dialog id="confirm-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
  <h2 id="dialog-title">Delete project?</h2>
  <p id="dialog-desc">This action cannot be undone.</p>
  <form method="dialog">
    <button value="cancel" class="btn-secondary">Cancel</button>
    <button value="confirm" class="btn-danger">Delete</button>
  </form>
</dialog>
```

```js
const dialog = document.getElementById('confirm-dialog');
document.getElementById('open-btn').addEventListener('click', () => dialog.showModal());
// Native: focus moves to first focusable element, Escape closes, background is inert.
```

- When using a custom overlay (no `<dialog>`): on open, save the previously focused element and return focus to it on close. Move focus into the dialog. Trap Tab within it (focus wrap). Manage `aria-hidden`/`inert` on background content.
- `role="dialog" aria-modal="true"` on the overlay container when native `<dialog>` isn't an option.
- Escape route: always closable by Escape + explicit close button (never close only on outside click).

---

## Accordion

```html
<div class="accordion">
  <h3>
    <button class="accordion__trigger" aria-expanded="false" aria-controls="panel-1" id="trigger-1">
      Shipping policy
    </button>
  </h3>
  <div id="panel-1" role="region" aria-labelledby="trigger-1" hidden>
    <p>…content…</p>
  </div>
</div>
```

```js
trigger.addEventListener('click', () => {
  const open = trigger.getAttribute('aria-expanded') === 'true';
  trigger.setAttribute('aria-expanded', String(!open));
  panel.hidden = open;                       // use [hidden], not display:none via class
});
```

- `aria-expanded` reflects state; `aria-controls` points to the panel; panel is `region` labelled by the trigger.
- Keyboard: Enter/Space toggle (native button behavior) — no custom key handling needed.
- Only one open at a time? Leave that to a small JS state change; don't remove the button semantics.

---

## Tabs

Follow WAI-ARIA tabs pattern **only when tab behavior is required** (arrow keys switch tabs). For simple content switching where arrow-key nav is unnecessary, a disclosure list (accordion) or in-page anchors are simpler and more accessible.

```html
<div role="tablist" aria-label="Account sections">
  <button role="tab" id="tab-overview" aria-selected="true"  aria-controls="panel-overview">Overview</button>
  <button role="tab" id="tab-billing"  aria-selected="false" aria-controls="panel-billing"  tabindex="-1">Billing</button>
</div>
<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">…</div>
<div role="tabpanel" id="panel-billing"  aria-labelledby="tab-billing"  hidden>…</div>
```

- Roving tabindex: selected tab `tabindex="0"`, others `tabindex="-1"`.
- Arrow keys move focus+selection Left/Right (Up/Down in vertical); Home/First, End/Last.
- On activation, show the panel, set `aria-selected="true"`, move the `tabindex`.
- `aria-selected` must be a real attribute value (`true`/`false`), not `aria-selected="true"` set via presence.

---

## Form Fields (errors announced to screen readers)

```html
<div class="form-row">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required
         autocomplete="email"
         aria-describedby="email-hint email-error"
         aria-invalid="true" />
  <p id="email-hint" class="hint">We'll email a confirmation link.</p>
  <p id="email-error" class="error" role="alert">Enter a valid email address.</p>
</div>
```

- Visible `<label>` per field — never placeholder-only.
- `aria-describedby` lists hint + error ids; error uses `role="alert"` (announced immediately).
- `aria-invalid="true"` on the invalid input; remove it (or set `false`) when valid.
- For a summary of errors on submit: focus the first invalid field and/or use a `<div role="alert">` summary listing the fields.
- `autocomplete` on every applicable field (email, name, tel, postal-code, one-time-code, new-password, current-password).
- Validation on blur (not keystroke) for inline fields; full re-validate on submit.

---

## Toasts / Notifications (non-intrusive announcements)

- Toast text: `role="status"` (polite, for success/neutral) or `role="alert"` (assertive, for errors) — **never both**.
- Put the live region in the DOM **before** content updates, or screen readers miss the announcement.
- Don't wrap auto-dismissing critical errors in `role="status"` only — pair with a persistent inline error.
- Buttons inside toasts: use `aria-label="Close notification"` and keep focus management (focus moves to toast when it opens if it contains actions).

```html
<div aria-live="polite" class="toast-region"></div>
```

---

## Icon buttons

```html
<button class="icon-btn" aria-label="Close">
  <svg aria-hidden="true" focusable="false"><path d="…" /></svg>
</button>
```

- `aria-label` on the button (not the svg). `aria-hidden="true"` + `focusable="false"` on decorative SVG.
- Never set `aria-label` on an element that also has visible text — use `aria-labelledby` or let the text win.

---

## Custom select / combobox (only when necessary)

Prefer native `<select>`. If a searchable combobox is required, implement the ARIA combobox pattern:
`role="combobox"` + `aria-expanded` + `aria-controls` (listbox id) + `aria-activedescendant` pointing to the active option id, `role="listbox"` + `role="option"` children with `aria-selected`. Keyboard: arrows move `aria-activedescendant`, Enter commits, Escape closes. This is the hardest pattern — only build it when a native select genuinely can't do the job.

---

## Accessible name ordering

Accessible name comes from, in order: `aria-labelledby` → `aria-label` → associated `<label>` / element text. Use `aria-labelledby` when the visible text is elsewhere on the page (e.g. section heading labels a panel).

---

## Automated + manual verification

- **Automated**: `jest-axe`/`@axe-core/playwright` in CI + Lighthouse a11y >= 0.95 (see `templates/lighthouserc.json`). Run axe on every route.
- **Manual protocol** (do all of these before Phase 5):
  1. Keyboard-only walkthrough: Tab through the whole page — focus order logical, every control operable, focus ring visible at all times.
  2. Screen reader pass: NVDA (Win) / VoiceOver (macOS) on the 3 core flows — confirm labels, state changes, and errors are announced.
  3. Color contrast spot-check: text >= 4.5:1, large text >= 3:1, focus ring and icon-only indicators >= 3:1 against both themes.
  4. Zoom 200% and reflow at 320px width — no content loss or horizontal scroll.
  5. `prefers-reduced-motion` on — no distracting motion.
  6. Talkback/VoiceOver with screen reader on the primary task; ensure no dead ends.

---

## Checklist
- [ ] Skip link present and first in focus order
- [ ] Modals: native `<dialog>` (or focus-trap pattern), Escape closes, focus returns on close
- [ ] Accordions: `aria-expanded` + `aria-controls`, `hidden` for panels
- [ ] Tabs: roving tabindex + arrow keys (only if tab semantics required)
- [ ] Forms: visible labels, `aria-describedby`, `aria-invalid`, `role="alert"` errors, autocomplete
- [ ] Toasts: `role="status"`/`role="alert"` live regions, no double-role
- [ ] Icon buttons: `aria-label`, decorative SVG `aria-hidden`
- [ ] Focus ring visible on every interactive element in both themes
- [ ] Focused element never obscured by sticky chrome (2.4.11)
- [ ] Auth/captcha not the only path (3.3.8); password paste not blocked
- [ ] Async status changes announced via live regions (4.1.3)
- [ ] `prefers-reduced-motion` respected
- [ ] axe + Lighthouse a11y run and pass
