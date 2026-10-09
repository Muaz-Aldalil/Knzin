# Audit Mode — Performance, Accessibility & Security Review

Load this file when the request is to review, check, audit, or optimize an existing UI.

---

## Performance Audit

### Core Web Vitals (verify with Lighthouse or Web Vitals library)

| Metric | Target | How to check |
|---|---|---|
| LCP | < 2.5s | Largest image/text paint time |
| INP | < 200ms | Response to user interactions |
| CLS | < 0.1 | Layout shift score |
| FCP | < 1.5s | First content paint |
| TTFB | < 800ms | Server response time |

### Image Audit
- [ ] Modern formats (WebP/AVIF) in use
- [ ] Responsive `srcset` + `sizes` on all images
- [ ] `loading="lazy"` on below-fold images
- [ ] `width` + `height` or `aspect-ratio` declared (prevents CLS)
- [ ] Largest above-fold image < 200KB
- [ ] No oversized images (max dimensions match display size)

### Font Audit
- [ ] `font-display: swap` or `optional` set
- [ ] Font files preloaded (only critical weights)
- [ ] No render-blocking font requests
- [ ] Self-hosted or CDN with `crossorigin` attribute

### Bundle Audit
- [ ] Route-level code splitting active
- [ ] Dynamic imports for heavy components (charts, editors, etc.)
- [ ] No unused dependencies (audit with `npm prune`)
- [ ] Total JS < 200KB gzip, CSS < 50KB gzip
- [ ] Third-party scripts loaded with `async`/`defer`

### Rendering Audit
- [ ] No layout thrashing (batch DOM reads then writes)
- [ ] Animations use `transform` + `opacity` only
- [ ] Debounced/throttled scroll/resize handlers
- [ ] No `console.log` in production

---

## Accessibility Audit (WCAG 2.2 AA)

### Structure
- [ ] Semantic HTML landmarks: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`
- [ ] Heading hierarchy: h1 → h2 → h3, no level skips
- [ ] One `<h1>` per page
- [ ] Skip-to-content link present and functional

### Color & Contrast
- [ ] Body text contrast >= 4.5:1 against background
- [ ] Large text (>= 24px bold or >= 18px regular) contrast >= 3:1
- [ ] Focus indicators visible (2-4px ring, contrast >= 3:1 against adjacent)
- [ ] Color is never the sole indicator of state/meaning (add icon/text)
- [ ] Error state distinguishable by more than color (icon + message)

### Keyboard
- [ ] All interactive elements reachable via Tab
- [ ] Tab order matches visual layout
- [ ] No keyboard traps (focusable element that can't be Tab'd out of)
- [ ] All functionality available via keyboard (no drag-only operations)
- [ ] Visible focus on every interactive element

### Screen Reader
- [ ] Alt text on all meaningful images (decorative: `alt=""`)
- [ ] `aria-label` on icon-only buttons and links
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages use `aria-live="polite"` or `role="alert"`
- [ ] Dynamic content changes announced (aria-live regions)
- [ ] Landmarks have labels when multiple of same type

### Motion
- [ ] `prefers-reduced-motion` respected — animations disabled or simplified
- [ ] No auto-playing video/audio without user consent
- [ ] Animations <= 5 seconds or user-controllable
- [ ] No flashing content (> 3 flashes per second)

### Forms
- [ ] Required fields indicated (not by color alone)
- [ ] Error messages placed near the field, not in a distant summary
- [ ] Auto-complete attributes on common fields (`name`, `email`, `tel`)
- [ ] Touch targets >= 44x44px (mobile)
- [ ] Input type set correctly (`type="email"`, `type="tel"`, `type="number"`)

---

## Security Review

See full checklists: `references/security-levels.md`

### Quick check (all levels)
- [ ] No secrets/keys/tokens in client-side code or bundled JS
- [ ] CSP header present (even minimal)
- [ ] HTTPS enforced
- [ ] No `eval()` or `dangerouslySetInnerHTML`
- [ ] Sanitized dynamic content
- [ ] No sensitive data in URL params or browser history
- [ ] Error messages generic (no stack traces to users)

### L2+ additional
- [ ] Auth tokens in httpOnly cookies, not localStorage
- [ ] Login errors don't reveal whether email exists
- [ ] CSRF tokens on state-mutating endpoints
- [ ] Rate limiting on auth endpoints

### L3 additional
- [ ] Strict CSP (no `unsafe-inline`, `unsafe-eval`)
- [ ] Auto-logout on inactivity
- [ ] Re-authentication for sensitive actions

---

## Lighthouse CI (Automated Gate)

For automated verification, use the template at `templates/lighthouserc.json`:

1. Install: `npm install -D @lhci/cli`
2. Copy template to project root as `lighthouserc.json`
3. Build: `npm run build`
4. Run: `npx lhci autorun`

Requires Node 18+. For Vite projects, uses `npx serve dist -l 4173` to serve the build.

### Manual Checks (no bash)
If CI isn't available, verify:
- [ ] Lighthouse score >= 90 in Performance, Accessibility, Best Practices, SEO
- [ ] Bundle size checked with `npx vite build --report` or `npx source-map-explorer`
- [ ] Tested on real mobile device (375px viewport)
- [ ] Dark mode tested independently (if applicable)
- [ ] Reduced motion tested
