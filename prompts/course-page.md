# Implementation prompt: Course detail page

## Goal

Build the course detail route `/courses/[slug]`, reproducing `design/vertex-course.png` and wired to
the seeded Sanity content through the existing server-only data layer. Read-only: the page renders
stored content and nothing on it writes.

## Skills and docs read

- `AGENTS.md` — §3 UI work (reference image is the source of truth, reuse existing components,
  responsive down to mobile), §5 structure (pages are read-only, all Sanity reads are server side),
  §7 decisions (module/lesson numbers derived from order, content structured not markdown, progress
  is a real feature with a Clerk-keyed record — not built yet), §8 the course/module/lesson model,
  §12 (private dataset, token stays on the server), §13 checks.
- `~/.claude/skills/sanity-best-practices/references/typegen.md` — `sanity.cli.ts` typegen config,
  `overloadClientMethods` typing `client.fetch` off `defineQuery`, the extract + generate cycle.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` —
  `params` is a Promise, `PageProps<'/courses/[slug]'>` helper, `generateStaticParams`.
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` — remote images require
  `images.remotePatterns` in `next.config.ts`.

## Code inspected

- `sanity/lib/queries.ts` — `COURSE_BY_SLUG_QUERY` already projects everything this page needs
  (card fields, `moduleCount`, `lessonCount`, `durationSeconds`, `learningOutcomes`,
  `instructorDetail`, `modules[]` with per-module `durationSeconds` and dereferenced lessons), plus
  `COURSE_SLUGS_QUERY` for `generateStaticParams`. **No query changes needed.**
- `sanity/lib/fetch.ts` — `sanityFetch({query, params, tags})`, `CACHE_TAGS`.
- `sanity/lib/client.ts`, `sanity/lib/token.ts` — server-only, token-authenticated, `server-only`.
- `sanity/lib/image.ts` — `urlFor()`.
- `sanity.types.ts` — already current: `COURSE_BY_SLUG_QUERY_RESULT` and the `SanityQueries` type map
  are generated, so `client.fetch` is typed off `defineQuery` with no manual result types.
  `studio/sanity.cli.ts` points typegen at `../{app,components,lib,sanity}/**` and writes
  `../sanity.types.ts`; re-running `npm --prefix studio run typegen` is a no-op here.
- `studio/schemaTypes/documents/course.ts`, `objects/module.ts`, `objects/learningOutcome.ts`,
  `documents/lesson.ts` — field shapes; `learningOutcome.icon` is constrained to eight names
  (`sparkles, layers, code, rocket, shield, gauge, puzzle, workflow`).
- `studio/scripts/seed/content.mjs` + `seed.ndjson` — 10 courses, 4 modules × 3 lessons each,
  cover images uploaded to the Sanity CDN, outcome icons drawn only from the eight allowed names.
- `components/layout/page-frame.tsx`, `layout/site-header.tsx`, `nav/breadcrumbs.tsx`,
  `ui/button.tsx` (`buttonClasses` for `next/link`), `ui/badge.tsx`, `ui/progress-bar.tsx`,
  `ui/card.tsx`, `home/chart-decoration.tsx`, `lib/utils.ts` — all reused as-is.
- `app/globals.css` — Tailwind v4 `@theme` tokens and the `@utility` type scale.
- `app/page.tsx` — home page links courses to `/courses/<slug>`, which this route answers.
- `next.config.ts` — empty; no `images.remotePatterns` yet.

## Measurements taken from the reference

Sampled from `design/vertex-course.png` (1024×1536) by pixel scan, treated as 1:1 CSS px inside the
content column. Outer frame and header come from the existing `PageFrame` / `SiteHeader`.

- Content column runs x≈65→948; panels are canvas-coloured with a 1px `canvas-line` border — there
  is no white surface anywhere on this page.
- Breadcrumb ~44px below the header rule.
- Hero: cover 280×328, radius 16; 60px gap to the text column at x=404.
- `POPULAR` badge 82×26 (existing `Badge variant="popular"`), 32px above the title.
- Title: Playfair bold ~52px / 60px line height.
- Summary: ~17px / 31px, neutral-500, wraps at ~400px column width.
- Meta row (level · duration · modules · students): 14px labels, 16px lucide icons, ~36px gaps,
  ~44px below the summary.
- Buttons: primary 205×56 (radius 12, 16px label, trailing arrow), outline 142×56, 17px apart.
- "What you'll learn" panel: x 64→949, y 565→961, 28px padding, radius 16, 1px border.
  Heading Playfair ~24px. Two-column grid of four bordered cards, 24px gap, each ~405×154 with
  28px padding: 48px lucide icon (primary, 1.5 stroke), Playfair ~19px title, 15px/28px description.
- "Course Content": Playfair ~24px heading with `12 modules • 18h 24m` right-aligned, 13px
  neutral-500.
- Module list panel: bordered, radius 16, rows 60.5px tall separated by full-width hairlines.
  Row = 29px numbered circle at x≈95 (bordered, with a vertical connector line running between
  circles), Playfair ~15px title at x=153, 13px neutral-500 summary beneath, right-aligned duration
  at x≈873 and a 16px chevron at x≈910 (32px right padding).
- "Show all 12 modules": 249×45 bordered pill, centred and straddling the panel's bottom border.
- Sticky bar: bordered card spanning the content column, radius 16, ~72px tall, 24px padding.
  Left: "Your Progress" (13px neutral-500) over "35% complete" (15px, percentage in
  neutral-900 semibold). Centre: 320×8 track, primary fill. Right: primary CTA 218×57.
- The home page's blurred orange `ChartDecoration` sits behind the bottom of the page.

## Decisions and assumptions

1. **Progress is presentational** (confirmed with the user). No progress document, no server route,
   no Clerk read. The sticky bar renders at 0% with the label "Not started", and both
   "Continue Learning" CTAs link to the course's first lesson. The component takes
   `percentComplete` / `resumeHref` props so the real feature drops in without touching markup.
2. **Broken forward links are intentional** (confirmed with the user). The breadcrumb links to
   `/courses` and lesson rows link to `/lessons/<slug>`; both 404 until those routes are built.
   `/lessons/<slug>` is chosen because `LESSON_BY_SLUG_QUERY` already resolves a lesson by slug
   alone and derives its course by reverse reference.
3. **Module and lesson numbers are derived from array order** (§7), never stored: module index + 1,
   lesson label `"{module}.{lesson}"`.
4. **Icons stay inside the schema's eight allowed names.** The reference happens to show a database
   and a cloud glyph, which the schema does not offer and no seeded course uses; adding them would
   be a schema change, so the icon map covers exactly the eight allowed values and falls back to
   `Sparkles`. Flagged under "Needs your attention".
5. **The instructor is not rendered.** The reference has no instructor on this page, and §3 makes
   the reference the source of truth for visuals. Flagged under "Needs your attention".
6. **Accordion is a client component**; the page stays a server component and passes plain data
   down. Rows expand to reveal that module's lessons (number, title, duration, free-preview badge)
   as links. The reference only shows the collapsed state, so the expanded row is built from the
   existing design-system primitives.
7. **"Show all N modules" only renders when a course has more than six modules.** The seeded courses
   have four, so the toggle will not appear against seeded data — the reference shows twelve.
8. Seeded cover images are photographs, not the reference's black Next.js tile, so the hero art will
   look different from the mock. That is content, not layout.
9. **Typegen is re-run as a check**, not a change: `sanity.types.ts` was already up to date with the
   queries, so the page compiles against the generated projection type and the file is untouched.

## Files to touch

- `app/courses/[slug]/page.tsx` — new. Server component: fetch, `notFound()`, `generateMetadata`,
  `generateStaticParams`, hero, outcomes panel, course content, sticky bar, decoration.
- `components/course/course-hero.tsx` — new. Cover, badge, title, summary, meta row, CTAs.
- `components/course/learning-outcomes.tsx` — new. Panel + outcome cards + the icon map.
- `components/course/course-content.tsx` — new, `"use client"`. Module accordion + show-all toggle.
- `components/course/course-progress-bar.tsx` — new, sticky bar (presentational).
- `lib/format.ts` — new. `formatDuration(seconds)` → `18h 24m` / `45m`, `formatCount(n)` → `2.1k`,
  `formatLevel(level)` → `Intermediate`, `moduleLabel` / `lessonLabel` helpers.
- `next.config.ts` — add `images.remotePatterns` for `cdn.sanity.io`.
- `lib/routes.ts` — new. `coursesHref` / `courseHref` / `lessonHref`, so link shapes live in one
  place as routes land.
- `sanity.types.ts` — regenerated as a check; already current, so unchanged (do not hand-edit).
- No changes to `sanity/lib/queries.ts`, the Studio schema, or the seed.

## Requirements

- Server component page; every Sanity read goes through `sanityFetch` with
  `tags: [CACHE_TAGS.course, CACHE_TAGS.lesson]`.
- `generateStaticParams` from `COURSE_SLUGS_QUERY`; unknown slug → `notFound()`.
- `generateMetadata` returns the course title and summary.
- Cover image via `next/image` + `urlFor(...)`, with the stored `alt`, sized for the 280×328 box at
  2x, `priority` on the hero image.
- Derived values only: duration from `durationSeconds`, counts from `moduleCount` / `lessonCount`,
  module numbers from order. Nothing invented, nothing hardcoded that Sanity supplies.
- Optional fields degrade: no `learningOutcomes` → the panel is not rendered; no `popular` → no
  badge; missing `studentCount` → the meta item is dropped; a module with no summary just omits it.
- Responsive down to mobile: hero stacks (cover above text, full width), outcome grid collapses to
  one column, module rows keep the number and title but let the duration wrap, the sticky bar
  stacks and the progress track goes full width. Desktop must match the reference exactly.
- Accessibility: accordion buttons carry `aria-expanded` and `aria-controls`, the chevron is
  `aria-hidden` and rotates on open, every interactive element keeps the project's
  `focus-visible:ring-2 ring-primary-500` treatment, and the numbered circles are decorative.
- Reuse `Badge`, `Breadcrumbs`, `buttonClasses`, `ProgressBar`, `PageFrame`, `SiteHeader`,
  `ChartDecoration`, `cn`. No new UI primitives, no `cva`, no new dependencies.
- Tokens over raw hex; lucide-react for icons; lookup maps for variants.

## Security considerations

- The Sanity client and token stay server side; the new client component receives only plain
  serialisable content props and never imports anything under `sanity/lib/`.
- No token, project id, or dataset value reaches the browser beyond the already-public
  `NEXT_PUBLIC_*` values used by `urlFor`.
- The page is public (browsing is public per §7); nothing here is gated and nothing writes.
- `images.remotePatterns` is scoped to `https://cdn.sanity.io/**`, not a wildcard host.

## Acceptance criteria

1. `/courses/nextjs-app-router-in-depth` renders the seeded course: title, summary, level, total
   duration, module count, student count, popular badge, cover image.
2. "What you'll learn" shows the course's four seeded outcomes with their mapped icons.
3. Course Content lists all four seeded modules in order, numbered 1–4, each with its summary and
   its summed duration; the show-all toggle is absent at four modules.
4. Expanding a module reveals its three lessons, labelled `1.1`–`1.3`, each linking to
   `/lessons/<slug>` with its duration and a free-preview badge where applicable.
5. The sticky bar renders at 0% / "Not started" and both CTAs link to the first lesson of the first
   module.
6. An unknown slug returns the 404 page.
7. Desktop layout matches `design/vertex-course.png`; the page is usable at 375px wide with no
   horizontal scroll.
8. `sanity.types.ts` contains `COURSE_BY_SLUG_QUERYResult`, and the page compiles against it with
   no `any` and no hand-written result types.

## Checks to run

From the repo root unless stated:

1. `npm --prefix studio run typegen` — regenerate `sanity.types.ts` from the schema + queries.
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build` (routes and config changed)
5. `npm run dev` and exercise the manual steps below.

## Manual test steps

1. `npm --prefix studio run typegen`, then `npm run dev`.
2. Open `http://localhost:3000/courses/nextjs-app-router-in-depth`. Confirm the hero (cover, badge,
   title, summary, meta row, both buttons) matches the reference layout.
3. Compare against `design/vertex-course.png` side by side at 1440px wide.
4. Click a module row: it expands to its lessons; click again: it collapses. Check the chevron
   rotates and keyboard focus rings are visible when tabbing through.
5. Click a lesson link: it navigates to `/lessons/<slug>` and 404s (expected until that route
   exists). Same for "All Courses" → `/courses`.
6. Confirm the sticky bar stays pinned above the page bottom while scrolling and its CTA points at
   the first lesson.
7. Resize to 375px: hero stacks, outcomes go single column, nothing scrolls horizontally.
8. Open `/courses/does-not-exist` and confirm the 404 page.
9. Visit `/` and click through a course card to confirm the home page's links resolve.
