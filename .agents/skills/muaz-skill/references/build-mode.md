## Build Mode — Full Pipeline for Building New Projects

Load this file when the request is to build, create, design, or scaffold a website/page/UI.

---

## PHASE 1A — AUTO-DETECT (run before intake questions)

Before asking ANY questions, read the project. This is mandatory — never ask what you can read.

### Detection Steps (in order)

1. **Read `package.json`** → stack, dependencies, scripts, framework version
2. **Read `tailwind.config.*`** → colors, fonts, spacing, theme config
3. **Read `src/app/` or `src/pages/`** → page inventory, routing structure
4. **Read `src/components/`** → component count, naming patterns
5. **Read `*.css` or `globals.css`** → design tokens, CSS variables, existing palette
6. **Read `README.md`** → project description, goals, tech choices
7. **Read `.env*`** → API providers, auth services, endpoints
8. **Read `next.config.*` or `vite.config.*`** → build config, deployment target
9. **Run `git log --oneline -5`** → recent changes, contributors
10. **Read `tsconfig.json`** → TypeScript strict mode, path aliases

### Fallback Logic

| Detection result | Action |
|---|---|
| ALL detection fails | Skip to asking all questions from scratch |
| Partial detection | Show summary, ask only gaps |
| Full detection | Pre-fill defaults, confirm with user |

### Project Type Detection (for skip logic)

| Type | Trigger keywords | Questions to skip |
|---|---|---|
| Landing page | "landing", "page", "coming soon" | AUTH, API, STATE |
| Portfolio | "portfolio", "personal", "blog" | AUTH, API, STATE |
| Docs | "docs", "documentation", "wiki" | AUTH, API, STATE |
| SaaS | "saas", "dashboard", "admin", "app" | None |
| E-commerce | "shop", "store", "ecommerce", "cart" | None |
| Blog | "blog", "news", "articles" | AUTH, STATE |

### Detection Summary Format

```
I analyzed your project. Here's what I found:

STACK: [detected or "Not detected — starting from scratch"]
DESIGN SYSTEM: [detected or "None found — will generate"]
PAGES: [detected list or "No routing detected"]
COMPONENTS: [count or "None found"]
BRAND: [detected assets or "No brand assets found"]

Is this correct? I'll ask about what's missing next.
```

---

## PHASE 2 — DESIGN SYSTEM REASONING

Always generate a design system first.

### Primary: Search Engine
```bash
python scripts/search.py "<query>" --design-system [-p "Project Name"]
```
Returns: pattern, style, colors, typography, effects, anti-patterns, checklist.

### Secondary: Design Reference
If user provided a URL, screenshot, or Figma link:
1. Load design-reference-workflow.md
2. Extract design DNA (colors, typography, layout, effects)
3. Cross-reference with search engine results
4. Merge: reference aesthetic + product-appropriate structure

### Design Domain Search
```bash
python scripts/search.py "<style name>" --domain design
```
Returns: detailed design system prompts for 16 styles.

### Composition Patterns
```bash
python scripts/search.py "<layout type>" --domain compositions
```
Returns: layout patterns with use cases, anti-patterns, and real product examples.

### Fallback: Universal Color & Typography Rules
```
COLORS: Primary (actions) / Secondary (surfaces) / Accent (<=10% of screen) /
        Background (offset +/-3-5% from pure black/white) / Text (>=4.5:1 contrast)
        Never more than 4 intentional colors + neutrals.

TYPE:   Display (expressive headings) / Body (16px min, 1.6 line-height) /
        Mono (only when semantic). Google Fonts only.
```

---

## PHASE 2.5 — PRE-FLIGHT (Mandatory before blueprint)

Complete every item before writing the blueprint.

### Design Thinking Checklist

```
1. INSPIRATION: Name 3 real products this design is inspired by.
   → Must be from premium-design-guide.md or compositions-detail.md
2. DIFFERENCE: What's different about YOUR version?
   → Cannot be identical to any single reference.
3. KEY MOVE: What's the ONE design move that makes this premium?
   → YOURS: [must name one]
4. COMPOSITION: Which layout pattern?
   → Run: python scripts/search.py "<query>" --domain compositions
5. STYLE: Which design system?
   → Run: python scripts/search.py "<query>" --domain design
6. CONTENT: Write the actual headline and body copy.
   → No placeholder text. No "lorem ipsum".
```

**Gate:** If any item is blank or vague, fix it before Phase 3.

---

## PHASE 3 — STRUCTURED BLUEPRINT

### Mandatory Fields (all required before Phase 4)

```
BLUEPRINT: [Project Name]
Source: [AGENTIC]|[CHAT+SEARCH]|[PURE CHAT]
Design Reference: [URL/screenshot/Figma if provided, else "none"]

1. GOAL: [one sentence — what this does]
2. PERSONAS: [who uses this — one line]
3. STACK: [React|Next|Vue|HTML+Tailwind|etc]
4. PATTERN: [landing|dashboard|ecommerce|portfolio|docs|etc — from search engine]
5. STYLE: [style name — must come from search engine or design reference]
6. THEME: [light|dark|both]
7. COLORS:
   - Primary: [hex] — [why: source citation]
   - Secondary: [hex] — [why: source citation]
   - Accent: [hex] — [why: source citation]
   - Background: [hex] — [why]
   - Surface: [hex] — [why]
   - Text: [hex] — [contrast ratio]
8. TYPOGRAPHY:
   - Display: [font] [weight] [tracking] — [source]
   - Body: [font] [weight] [size] — [source]
   - Mono: [font] — [if needed, else "none"]
9. LAYOUT: [editorial|split|bento|masonry|single-col — must differ from industry default]
10. KEY EFFECTS: [scroll reveals, hover states, transitions — specific, not "animations"]
11. ANTI-PATTERNS: [what's avoided for this specific project]
12. ACCEPTANCE: [testable conditions, checkbox list]
13. DESIGN EVIDENCE: [2-5 citations, each labeled with its Evidence Class]
    — aesthetic decisions → [PRODUCT]: real screens from Mobbin/search/user reference
    — factual / a11y / performance claims → [STANDARD]: WCAG 2.2, W3C, MDN, official docs
    — judgment calls → [HEURISTIC]: reasoning stated, labeled as judgment
14. FALLBACK/EXCEPTION: [one line — when this design is the WRONG answer + pivot]
```

### Full-Stack Addendum (only for apps that need backend)

For apps that require backend capabilities (SaaS, dashboards, e-commerce, apps with user accounts, payments, databases — detected via Phase 1A keywords like "saas", "dashboard", "shop", "store", "ecommerce", "cart", or answered in intake Group 5), add these fields after field 14. These fields record the full-stack decisions; the reference files contain the implementation guidance.

```
15. BACKEND STACK: [Next.js API routes / separate Node.js backend / Python / Laravel / serverless / Supabase BaaS — from references/backend.md decision framework]
16. DATABASE: [PostgreSQL + Prisma / MySQL / MongoDB / Supabase / Firebase / None — from references/database.md]
    - Basic schema: [key tables and relationships — see references/database.md schema patterns]
17. AUTH IMPLEMENTATION: [Clerk / NextAuth / Auth0 / Supabase Auth / Firebase Auth / custom — from references/auth.md]
    - Flow: [sign-in method, session management, protected routes — see references/auth.md]
18. PAYMENT INTEGRATION: [Stripe / PayPal / other / none — only if payments needed, from references/payments.md]
    - Checkout flow: [hosted checkout / custom / payment links — see references/payments.md]
    - Webhook handler: [endpoint + signature verification + idempotency — see references/payments.md]
    - What's stored: [customer IDs, payment intent IDs — never raw card data]
19. DEPLOYMENT TOPOLOGY: [all-on-Vercel / frontend+Vercel + backend+Railway + db+Supabase/Neon / all-on-Supabase — from references/deployment.md]
    - Frontend: [hosting platform + public env vars]
    - Backend: [hosting platform + server-only env vars]
    - Database: [hosting platform + connection string]
    - Secrets: [what goes where — never in frontend code]
```

Note: These fields point to the reference files for implementation details. The reference files (database.md, auth.md, payments.md, backend.md, deployment.md) contain the step-by-step guidance. The blueprint records what you decided; the reference files explain how to build it.

### Decision Briefs (per major design choice)

Every **named design choice** gets a Decision Brief with all five parts:

```
DECISION BRIEF — [choice, e.g., "Typography pairing"]
  Advantages           : what improves by choosing it
  Disadvantages        : what you give up or accept
  Alternatives         : what else exists — including doing nothing
  Appropriate when     : the conditions where it is the right call
  Inappropriate when   : the conditions where it is the WRONG call (→ field 14)
```

### Decision Framework (per major architectural choice)

For stack/framework, state-management, data-fetching, and security-level choices:

```
Problem       : what is being decided
Constraints   : time, scale, team size, compliance, performance budget
Options       : the fair list (including doing nothing)
Tradeoffs     : advantages/disadvantages of each option
Decision      : the pick, and under which conditions
Consequences  : what this commits you to later
```

### Design Tokens Output

Always output 3 formats immediately after blueprint:
- CSS custom properties (with dark mode override block)
- Tailwind config extension
- JS/TS tokens object

### Design Lock

After blueprint is confirmed, write `.design-lock.md`:
```markdown
# Design Lock — [Project Name]
Locked: [date]
Style: [style name]
Colors: [primary hex]
Typography: [display font] + [body font]
Layout: [layout pattern]
```
Re-read at every session start. Override only with explicit user confirmation.

---

## PHASE 4 — CODE GENERATION

### 4a — Project Init

| Stack | Command |
|---|---|
| React + Vite | `npm create vite@latest . -- --template react-ts` |
| Next.js | `npx create-next-app@latest . -- --typescript --tailwind --app` |
| Vue | `npm create vue@latest .` |
| Nuxt | `npx nuxi init .` |
| Astro | `npm create astro@latest . -- --template basics --typescript` |
| Svelte | `npm create vite@latest . -- --template svelte-ts` |
| HTML+Tailwind | `npm create vite@latest . -- --template vanilla` + `npm install -D tailwindcss @tailwindcss/vite` |
| React Native | `npx react-native init ProjectName --template react-native-template-typescript` |
| Flutter | `flutter create . --platforms=ios,android,web` |
| SwiftUI | Xcode → New Project → iOS App (SwiftUI) |

### 4b — Universal Code Quality

```
STRUCTURE     -> semantic HTML, mobile-first CSS, logical section order
PERFORMANCE   -> no unused imports, lazy-load images, font preconnect+swap,
                 critical CSS inline, no layout shift
ACCESSIBILITY -> WCAG AA contrast, aria-label on icon buttons, visible focus,
                 keyboard nav, alt text, prefers-reduced-motion respected
INTERACTIONS  -> cursor-pointer on all clickables, 150-300ms hover transitions,
                 44x44px min touch targets
ICONS         -> SVG only (Heroicons/Lucide/Phosphor), never emoji as UI icon
STATES        -> every interactive/data component handles:
                 Loading (skeleton) / Error (inline+retry) / Empty (CTA) / Disabled
```

### 4z — Anti-Slop Generation Rules (enforce during code, not after)

```
VISUAL BANS:
  NO gradient heroes — use palette from blueprint
  NO gradient text on headings — solid color only
  NO symmetric 3-column feature grids as the sole layout
  NO centered hero → features → pricing → testimonials → footer (SaaS template)
  NO stock photo + gradient overlay hero
  NO glassmorphism / frosted glass as decorative element
  NO rounded-full pill buttons as the only button style
  NO purple/indigo/teal as primary unless blueprint explicitly calls for it

CONTENT BANS:
  NO "Revolutionize your workflow" / "Empower your team" / "Seamlessly integrate"
  NO "Built for modern teams" / "The future of X" / "Unlock your potential"
  NO filler buzzword copy — use specific, concrete language

LAYOUT RULES:
  LAYOUT must be named in blueprint and must differ from the industry default
  Every page must have a distinct section structure — no two pages identical
  COLOR reasoning required: "Primary is X because Y" — not just a hex dump
  TYPOGRAPHY must be a pairing with rationale, not "Inter + Inter"
```

### 4c — Stack-Specific Rules

```
HTML+Tailwind -> Play CDN is DEV-ONLY; compile CSS bundle for production
React/Next    -> functional+hooks, lucide-react icons, next/font for fonts
Vue/Nuxt      -> <script setup>, scoped styles, useHead() for fonts
Svelte/Astro  -> component-native styles, minimal JS, CSS animations preferred
Angular       -> services for state, SCSS + CSS custom properties
SwiftUI       -> @State/@Binding, native fonts, SF Symbols
Flutter       -> Widget tree, Material/Cupertino, ThemeData
React Native  -> StyleSheet, platform-specific extensions, FlashList
```

### 4d — Animation Decision Framework

| Need | Best tool | When NOT to use |
|---|---|---|
| Micro-interactions (hover, press) | CSS transitions | Don't need JS lib |
| Scroll reveals | IntersectionObserver + CSS | Can use Framer if already in project |
| Page transitions | View Transitions API or Framer | No JS needed for native VT |
| Shared element / hero animations | Framer Motion `LayoutGroup` | CSS can't do this |
| Complex timelines | GSAP or CSS `@keyframes` | Framer overhead for simple sequences |

**Defaults:** CSS for hover/press/scroll reveals, Framer only when you need layout animations or shared elements. Always respect `prefers-reduced-motion`.

### 4e — Font Strategy

- **Source:** Google Fonts only for display/body. System fonts for UI.
- **Preloading:** Preload only the hero heading weight. Preconnect to Google Fonts origin.
- **font-display**: `swap` for body text. `optional` if layout stability critical.
- **Variable vs Static:** Variable fonts preferred. Fallback to static for wide support.
- **Performance:** Max 2 families, max 3 weights per family.

### 4f — State Management Decision

| Need | Solution | When to skip |
|---|---|---|
| Server data (API, cache) | TanStack Query, SWR | If app has no async data |
| Client state (theme, sidebar) | Context + useReducer, Zustand, Pinia | If only 1-2 values, prop drilling is fine |
| URL state (filters, page) | useSearchParams | If state doesn't need to be shareable |
| Form state | React Hook Form, Vue FormKit | If form has 1-3 fields, uncontrolled is fine |
| Global app state | Zustand, Pinia, Context | If only passed down one level, props are simpler |

**Rule:** Start with the simplest solution. Add complexity only when you have a concrete problem.

### 4g — RTL / Bilingual Guidance

- **Always use logical CSS properties**: `inset-inline-start` instead of `left`, `margin-inline-end` instead of `margin-right`. Tailwind: `ms-4`/`me-4` instead of `ml-4`/`mr-4`.
- **Set `dir` at document root**: toggle `<html dir="rtl">` based on language state.
- **Flip directional icons** in RTL: CSS `scaleX(-1)` for simple cases.
- **Font pairing across scripts**: match x-height and weight. For Arabic: Noto Sans Arabic, IBM Plex Sans Arabic, Cairo, or Tajawal paired with Inter.
- **Testing**: test every page in both LTR and RTL.

### 4h — SEO (public-facing sites)

- Meta tags (title, description, OG, Twitter) set per page
- JSON-LD structured data for Organization, Product, Article, FAQ, BreadcrumbList
- Canonical URL on every page
- Sitemap.xml generated via framework plugin
- robots.txt — allow all for public, disallow `/admin` `/api` for authenticated
- hreflang tags for i18n sites
- OG image: 1200×630px, < 200KB, unique per page type, branded

### 4i — Error Monitoring & RUM

- SDK init at app entry with `beforeSend` stripping PII
- Error Boundaries wrapping route-level components
- Source maps uploaded after build, never public
- Session replay sampled at 10% (100% on error)
- Console.log stripped in production
- Alert when error rate > 1% of page loads

### 4j — PWA & Offline

- Service worker strategy per resource: NetworkFirst (API), StaleWhileRevalidate (static), CacheFirst (fonts/images)
- manifest.json with icons (192+512), theme_color, display: standalone
- Install prompt deferred until user signal
- Offline fallback page for uncached requests
- Push notification permission flow (opt-in only)

### 4k — Real-Time Communication

- Socket.io for bi-directional (chat, collab, live dashboards). SSE for server→client only.
- Reconnection strategy: exponential backoff (1s → 10s max), infinite retries
- Auth token in handshake, refresh on reconnect after expiry
- Connection status UI: connected / reconnecting / failed

### 4l — Feature Flags (optional)

- Tier 1: inline config for prototypes (< 5 flags)
- Tier 2: PostHog/Flagsmith for gradual rollout (1% → 10% → 50% → 100%)
- Single gateway component per flag, not scattered conditionals
- Kill switch: toggle OFF → feature hidden, no deploy needed
- Remove flags older than 6 months

### 4m — Forms & Validation

- Multi-step wizard: validate per-step, preserve state on back, final validate on submit
- Dynamic field arrays with min/max limits, stable IDs per row
- File upload: drag & drop zone, size+type validation, preview, progress bar
- Draft auto-save: debounced to 1s to localStorage, restore on mount
- Cross-field validation (password match), async validation (email unique)
- Submit button disabled during pending, server errors mapped to fields

### 4n — API Patterns

- Pagination: cursor for infinite scroll/feeds, offset for admin tables with page jump
- Optimistic updates: update cache immediately, rollback on error, idempotency key
- Request deduplication: merge concurrent same-endpoint GETs
- Retry with backoff: exponential 1s→10s, jitter, 5xx/network only, max 3 retries
- Race condition: cancel inflight on unmount (AbortController), stale query detection
- Loading/empty/error states per data fetch

### 4o — Analytics

- Platform: Plausible/Umami for privacy-first, PostHog for product analytics, GA4 for enterprise
- Auto page views on route change, outbound link clicks, form submissions
- Custom events for key actions with snake_case naming
- GDPR consent banner with accept/reject, no analytics until consent
- No PII in event properties
- Cookie-less analytics preferred (Plausible/Umami = no cookie banner)

### 4p — Internationalization (i18n)

- ICU message syntax for all translations (no string concatenation)
- Per-locale pluralization rules (English: one/other, Arabic: one/two/few/many/other)
- `Intl` built-ins for date, number, currency, relative time — no moment.js
- Translation files organized by feature namespace, flat keys
- Pseudo-locale testing to catch hardcoded strings and overflow
- RTL: `dir="rtl"` at root, logical CSS, directional icons flipped
### 4q — Backend Code Generation (full-stack apps only)

**Trigger:** The blueprint has Full-Stack Addendum fields (15-19), or the app is a SaaS/dashboard/e-commerce/app with auth/database/payments. Load `references/database.md`, `references/auth.md`, `references/payments.md`, `references/backend.md`, `references/deployment.md` as needed based on the blueprint decisions. Skip for landing pages, portfolios, docs, blogs.

**What to generate (in dependency order - each step depends on the previous):**

1. **Database:** `prisma/schema.prisma` (models based on app type - see `database.md` schema patterns) + `lib/prisma.ts` (PrismaClient singleton). For e-commerce: User (with clerkId), Product (price as Decimal), Order (userId, status, total, stripeSessionId), OrderItem (orderId, productId, quantity, price at purchase), StripeEvent (stripeEventId @id for webhook idempotency). For apps without a database: skip.

2. **Auth:** Provider setup based on chosen auth (Clerk/NextAuth/Auth0/Supabase Auth/Firebase Auth/custom - see `auth.md`). For Clerk: `app/providers.tsx` (ClerkProvider wrapper), `middleware.ts` (authMiddleware with publicRoutes - include `/api/webhooks/stripe` so Stripe can call webhooks unsigned), usage examples (SignIn/SignUp/UserButton, useAuth/useUser). For NextAuth: API route config, SessionProvider, useSession. Link auth user to database (store clerkId or user ID in User model). For apps without auth: skip.

3. **Payments (only if payments needed):** `lib/stripe.ts` (Stripe client singleton), `app/api/create-checkout-session/route.ts` (hosted checkout session creation - see `payments.md` snippet), `app/api/webhooks/stripe/route.ts` (webhook handler with signature verification via `constructEvent`, idempotency via event ID check against StripeEvent model, order creation on `checkout.session.completed` - see `payments.md` snippet). For apps without payments: skip. For custom checkout (Stripe Elements): generate PaymentIntent flow instead of hosted checkout.

4. **API routes / Server Actions:** App data operations based on blueprint (list products, get order, create order, get user data, etc.). Thin routes that delegate to services or call Prisma directly. Auth verification on protected routes (Clerk middleware or session check). For apps with no custom API needs: skip.

5. **Deployment:** `.env.example` (all environment variables with comments - public vs server-side distinction, see `deployment.md`). Include DATABASE_URL, Clerk keys (NEXT_PUBLIC_ + secret), Stripe keys (secret + webhook secret + optional publishable), NEXT_PUBLIC_SITE_URL. `.env.local` note (gitignored, local dev). Production vars set in hosting platform dashboard.

**How to generate:**

- **Use the reference file snippets as templates.** The code snippets in `database.md` (Prisma models, Prisma Client usage, transactions), `auth.md` (ClerkProvider, authMiddleware, Clerk components/hooks, NextAuth config), `payments.md` (checkout session creation, webhook handler with constructEvent + idempotency + order creation) are the basis. Adapt them to the specific app. Do not write from scratch.
- **Generate complete, copy-paste-ready files.** Every file should be complete - imports, exports, all code. Not partial snippets.
- **Explain every file:** complex files (webhook handler, auth config, checkout endpoint) get full explanation - what it does, what to configure, what to change, key parts, watch out for, how to test. Simple files (lib/prisma.ts, lib/stripe.ts, .env.example, providers.tsx, middleware.ts) get short explanation - what it does, what to configure, what to change.
- **Flag when not to generate:** no payments: no Stripe code. No database: no Prisma schema. Hosted checkout: no custom UI code. App does not need orders: no Order/OrderItem models. App uses Supabase BaaS: generate Supabase client + RLS guidance instead of Prisma. App uses Firebase: generate Firebase SDK setup instead of Prisma.

**Common mistakes to flag:**

- **Storing raw card data** - never do this (PCI-DSS violation). Store customer IDs, payment intent IDs, tokens only.
- **Not verifying webhook signatures** - always verify via `constructEvent`. Without this, anyone can send fake webhooks.
- **Not handling webhook idempotency** - always check if event ID already processed. Without this, Stripe retries create duplicate orders/charges. Use the StripeEvent model.
- **Exposing secrets in frontend code** - never put server-side vars (DATABASE_URL, STRIPE_SECRET_KEY, etc.) in NEXT_PUBLIC_ vars or client-side code.
- **Not configuring RLS with Supabase** - always configure. Without RLS, any client can query any data.
- **Webhook endpoint not registered in Stripe dashboard** - the webhook URL must be registered (Stripe dashboard > Developers > Webhooks > Add endpoint) for webhooks to be sent. Flag this in the explanation.

**Caveats:**

- Generated code is a starting point, not final. The user reviews, configures, tests, and adapts it.
- Stripe webhook signature verification is mandatory. Always include `constructEvent` + signature verification.
- Webhook idempotency is mandatory. Handle the same webhook twice without double-charging.
- Environment variable distinction: `.env.local` (local dev, gitignored, NOT committed, actual values) vs `.env.example` (committed, placeholders, documents needed vars) vs production (hosting platform dashboard). Never commit real secrets.
- Public vs server-side: `NEXT_PUBLIC_*` vars are embedded in the frontend bundle and sent to the browser - only public data here. Server-side vars (no prefix) are available to server-side code only - never sent to browser. Database URL, secret keys, webhook secrets, auth secrets are server-side only.
- Next.js API routes on Vercel are serverless - execution time limits (10s Hobby, 60s Pro), cold starts, no long-running processes.
- With Supabase, security depends on RLS. Generate RLS guidance - without RLS, any client can query any data.
- For production pricing: replace hardcoded `price_data` with a lookup from the Product model, or use a Stripe Price ID. The sample uses `price_data` for simplicity.

**Stop-and-check signals:** Pause and confirm with the user before generating payments code (confirm the app needs payments), before generating a separate backend (confirm vs Next.js API routes), before generating CI/CD (confirm vs Vercel auto-deploy), and before generating code that assumes something about the app that might be wrong (flag it and ask).

---

## PHASE 5 — PRE-DELIVERY CHECKLIST + QUALITY GATE

### Step 1: Anti-Slop Check
```bash
python scripts/anti_slop.py <project-directory> --fail-on MEDIUM
```
Fallback: `bash scripts/anti-slop.sh <dir>` (git bash). If bash unavailable: manual checklist in quality-gate.md.

### Step 2: Self-Score (0-160)
Load quality-gate.md. Score 8 dimensions (0-20 each):
1. Visual Coherence
2. Layout & Structure
3. Typography Quality
4. Motion & Interaction
5. Content & Copy
6. Design Grounding
7. Accessibility
8. Responsive & Cross-Device

### Step 3: Enforcement
| Score | Action |
|---|---|
| 128-160 | Ship. Paste score + anti-slop output. |
| 96-127 | Revise weakest dimension(s), re-score. Max 3 iterations. |
| < 96 | Redesign from Phase 3. Blueprint needs rethinking. |

### Step 4: Verifiable Proof
Paste in final response:
1. anti-slop output (full script output)
2. Self-score with rationale per dimension
3. Total score and ship/revise/redesign decision
4. If revised: what changed between iterations

**Highest-leverage rule:** Do not claim "done" without tool-verified proof. Verbal assertions without tool evidence are defects.

### Web UI Checklist
```
VISUAL        -> colors/type match blueprint exactly, no lorem ipsum,
                 sections in order, theme handled if specified
FUNCTIONALITY -> cursor-pointer, real hrefs, all states implemented,
                 no console errors
RESPONSIVE    -> 375/768/1024/1440px verified, no horizontal overflow
ACCESSIBILITY -> contrast >=4.5:1, focus visible, alt text, labels
PERFORMANCE   -> lazy-load images, font-display: swap, no CLS
SECURITY      -> apply rules for detected level
I18N/RTL      -> dir="rtl" if applicable, logical CSS properties
ACCEPTANCE    -> every blueprint criterion satisfied or flagged with fix plan
ANTI-PATTERN  -> no purple-AI-gradient-on-white, no Inter-for-display,
                 no generic-card-grid-as-sole-design, no emoji icons,
                 no gradient text, no stock-photo+gradient-hero,
                 no default-SaaS-page-structure, no filler-buzzword-copy,
                 no glassmorphism-decoration, no pill-buttons-only
MAINTAINABILITY -> no fetch() in components, no magic numbers, no `any`,
                 files grouped by feature, all API states handled
```

### Deployment
- [ ] Build passes: `npm run build` or framework equivalent
- [ ] TypeScript: `npx tsc --noEmit` — 0 errors
- [ ] Lint: `npx eslint . --max-warnings 0` — 0 warnings
- [ ] Choose platform: Vercel, Netlify, Railway, or Firebase
- [ ] Environment variables configured in deploy platform
- [ ] Custom domain connected with SSL active
- [ ] Analytics: Plausible, Vercel Analytics, or Umami
- [ ] Favicon + OG image set and previewed
- [ ] 404 page styled
- [ ] Sitemap.xml + robots.txt (for content sites)
- [ ] Error monitoring SDK initialized
- [ ] SEO meta tags + JSON-LD structured data verified
- [ ] CI/CD pipeline configured: lint → tsc → test → build → Lighthouse
- [ ] Storybook built and Chromatic visual regression set up
- [ ] Docker image builds
- [ ] PWA manifest.json + service worker
- [ ] Feature flags documented with rollout plan
- [ ] Forms: validation schemas, error states, disabled-submit pattern
- [ ] API patterns: retry/backoff, pagination, optimistic updates
- [ ] Analytics initialized with GDPR consent flow
- [ ] i18n: ICU messages, pseudo-locale tested, RTL verified

### Performance Budget Enforcement
- [ ] Run Lighthouse: target >= 90 all categories
- [ ] Or automate: `npx lhci autorun`
- [ ] Check bundle size: JS < 200KB gzip, CSS < 50KB gzip
- [ ] Use `npx size-limit` or `npx bundlesize` to enforce budgets in CI
- [ ] Check Largest Contentful Paint element — is it optimized?
- [ ] Check no render-blocking resources
- [ ] RUM monitoring active (Core Web Vitals from real users)
- [ ] PWA Lighthouse audit passing