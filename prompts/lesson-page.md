# Implementation prompt: Lesson page

## Goal

Build the lesson route `/lessons/[slug]`, reproducing `design/vertext-lesson.png` and wired to the
seeded Sanity content, with the lesson's video playing on the page through the provider's own embed.
Read-only: nothing on the page writes.

## Skills and docs read

- `AGENTS.md` — §3 UI work (reference image is the source of truth, reuse existing components,
  responsive down to mobile, "collapse the lesson sidebar"), §5 (pages are read-only, all Sanity
  reads server side, browser holds no token), §7 (playback stays on the site through a provider
  embed, no custom player, result links carry a start-seconds query param, progress is presentational
  here as on the course page, the Notes tab and the free-preview badge are presentational), §8 (the
  lesson model: notes in Portable Text, key points, pro tip, resources; a lesson does not store its
  course, derive it by reverse reference), §12 (private dataset, token server-only), §13 checks.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — `params` and
  `searchParams` are Promises; reading `searchParams` opts the page into dynamic rendering.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
  (already applied on the course route) — `PageProps<'/lessons/[slug]'>`, `generateStaticParams`.
- `~/.claude/skills/sanity-best-practices` — TypeGen (`defineQuery` → generated result types) and
  Portable Text rendering with `@portabletext/react`.

## Code inspected

- `sanity/lib/queries.ts` — `LESSON_BY_SLUG_QUERY` already returns the lesson fields (videoUrl,
  thumbnail, duration, studentCount, notes, keyPoints, proTip, resources) and derives the course by
  reverse reference with its modules and dereferenced lessons. **It is missing** what the design's
  sidebar and meta row need: the course cover image, the course level, and a per-module duration.
  `LESSON_SLUGS_QUERY` already exists for `generateStaticParams`.
- `sanity.types.ts` — `LESSON_BY_SLUG_QUERY_RESULT` is generated; it regenerates after the query
  change via `npm --prefix studio run typegen`. Never hand-edited.
- `studio/schemaTypes/documents/lesson.ts` — `videoUrl` is validated to YouTube, Vimeo, or Bunny
  Stream hosts only; `thumbnail` (with required `alt`) and `duration` (seconds) are required;
  `resources[].type` is one of `code | link | pdf | repo | slides`.
- `studio/scripts/seed/seed.ndjson` — 10 courses, 120 lessons, every `videoUrl` a
  `https://www.youtube.com/watch?v=…`, thumbnails uploaded from YouTube posters, seeded notes,
  keyPoints, proTip, and resources on every lesson. Lesson durations are short (~5–10m).
- `app/courses/[slug]/page.tsx`, `components/course/*` — the page shape this route mirrors:
  server component fetch → `notFound()` → `generateMetadata` → `generateStaticParams`, with client
  components receiving plain serialisable props. `CourseContent` is the accordion pattern the lesson
  sidebar follows (derived numbering, `aria-expanded`/`aria-controls`, chevron rotation).
- `components/layout/page-frame.tsx`, `layout/site-header.tsx`, `nav/breadcrumbs.tsx`,
  `ui/button.tsx` (`buttonClasses`), `ui/badge.tsx`, `lib/format.ts`, `lib/routes.ts`,
  `lib/utils.ts` — reused as-is.
- `components/cards/resource-card.tsx` — existing card requires `type` **and** `size` in a footer
  row; the lesson design's resource card is a different composition (icon tile, title, description,
  trailing external-link glyph, no size). Not reusable without changing the search-result card.
- `app/globals.css` — Tailwind v4 `@theme` tokens (`canvas`, `canvas-line`, `primary-*`,
  `neutral-*`) and the `@utility` type scale.
- `instrumentation-client.ts`, `components/course/course-content.tsx` — PostHog is initialised
  globally and events are captured from client components with `posthog.capture`.
- `package.json` — `@portabletext/react` is present only transitively (via `next-sanity`); it needs
  to become a direct dependency. `@tailwindcss/typography` is **not** installed, and this page does
  not add it.

## Measurements taken from the reference

Sampled from `design/vertext-lesson.png` (1024×1536) and treated as 1:1 CSS px inside the frame,
matching how the home and course pages were built.

- Two-column body under the existing header: sidebar x≈33→310 (≈278 wide) with a 1px `canvas-line`
  right border, content column x≈347→957.
- Sidebar top: "← Back to course" 15px primary at y≈128; course row at y≈170–222 — 48px rounded-md
  course tile, 15px course title, 13px neutral-500 "35% complete" over a 3px progress track.
- "Module 5 of 12" header row: 14px neutral-900 with a 16px chevron, on a hairline.
- Module rows: ~66px tall, 29px numbered circle at x≈75 with a vertical connector between circles,
  14px title, 13px neutral-500 duration beneath, right-side state glyph — a 20px primary
  check-circle for completed modules, a chevron for the rest.
- Active module: filled primary-500 circle with white number, chevron up, and a tinted expanded
  block listing that module's lessons: 8px dot marker (filled primary for the current lesson, hollow
  neutral-300 otherwise) on a vertical connector, 14px title, 13px duration, primary "Now playing"
  label and a 28px filled primary play button on the current row.
- Content column: breadcrumb at y≈128; `LESSON 5.1` badge (primary-100/primary-500, uppercase,
  tracked); Playfair bold ~44px title with a 40px bordered bookmark button right-aligned; 17px/30px
  neutral-500 summary; meta row (clock + duration, bars + level, users + students) at 14px with 16px
  icons and ~34px gaps.
- Video: full-width 16:9 black surface, radius 12, y≈383→731.
- Tabs: "Lesson Content" / "Notes" at 15px, active in primary-500 with a 2px underline, on a
  full-width hairline.
- Body: Playfair ~20px "Overview" heading, 15px/28px neutral-700 prose, hairline, "In this lesson
  you will:" 15px semibold with 18px primary check-circle bullets at 15px/32px.
- Pro Tip: primary-100 panel, radius 12, 24px padding, lightbulb icon, Playfair 16px "Pro Tip",
  15px/26px body.
- Resources: hairline, Playfair ~20px heading, three bordered cards in a grid (radius 12, 20px
  padding): 32px rounded icon tile, 14px title, 13px/20px neutral-500 description, 16px
  external-link glyph bottom-right.
- Footer bar: full-width, hairline top, ~84px tall — bordered "← Previous Lesson" pill on the left
  with the previous lesson's title (14px) and duration (13px neutral-500) beside it, the next
  lesson's title and duration right-aligned, then a primary "Next Lesson →" button (~150×48).

## Decisions and assumptions

1. **Playback is the provider's embed, never a custom player** (§7). The design's player chrome
   (scrubber, 1x, CC, gear, fullscreen) is YouTube's own chrome in the mock; we render the poster
   frame with a centred play button, and on click swap in the provider `<iframe>` with `autoplay=1`.
   That keeps the design's poster-first look, avoids shipping the YouTube IFrame API, and means no
   third-party frame loads until the learner asks for it. Flagged under "Needs your attention".
2. **`?t=<seconds>` is the start-seconds param** (§7), so a future search result links to
   `/lessons/<slug>?t=765`. It is parsed server side, clamped to `0…duration`, passed to the embed
   as the provider's own start parameter (`start` for YouTube, `#t=` for Vimeo, `t` for Bunny), and
   auto-plays on load when present. `lessonHref` grows an optional `startSeconds` argument.
3. **Provider support is YouTube, Vimeo, and Bunny embeds** (§9), resolved by a new `lib/video.ts`
   parser. Every seeded lesson is YouTube, so Vimeo and Bunny are code paths without seed coverage —
   playback only, no ingestion (§9 marks a provider fully supported only when both exist).
4. **Progress stays presentational**, consistent with the course page. The sidebar renders 0%, no
   module shows the completed check, and no lesson is marked complete; the current lesson still gets
   its "Now playing" treatment because that is derived from the URL, not from progress. Components
   take `percentComplete` / `completedLessonIds` props so the real feature drops in later.
5. **The Notes tab is presentational** (§7): it renders an empty state ("Your notes live here soon"),
   with no storage and no writes.
6. **The bookmark button is presentational**, like the header's notification bell — an accessible
   button with no backend.
7. **Overview renders the lesson's `notes` Portable Text** with `@portabletext/react` and local
   serialisers styled to the reference (paragraph, h2/h3, bullet/number lists, links, strong/em,
   code). No `@tailwindcss/typography` — the project does not use it and the design's prose is a
   handful of styles.
8. **Prev/next are the adjacent lessons in curriculum order**, flattened across modules. The
   reference happens to show module titles there; lesson titles are what "Previous Lesson" /
   "Next Lesson" mean, and the seeded lesson titles read the same way. Flagged.
9. **Breadcrumb is `All Courses › <course> › <module> › <lesson>`**, matching the reference, with the
   module derived from the curriculum (not a link — modules have no route).
10. **Numbers are derived from array order** (§7): "Module 5 of 12", "LESSON 5.1", never stored.
11. **The lesson summary line** under the title is the first plain-text paragraph of `notes`; the
    lesson schema has no summary field, and inventing one is a schema change. Flagged.
12. **Level and course cover come from the parent course**, so `LESSON_BY_SLUG_QUERY` gains
    `coverImage` and `level` on the course projection plus a per-module `durationSeconds`.
13. **Responsive**: below `lg` the sidebar becomes a collapsed disclosure above the content
    ("Course content" summary that expands to the module list), the meta row wraps, the resources
    grid goes single column, and the footer bar stacks with the two buttons full width. Desktop must
    match the reference exactly.
14. **Analytics**: capture `lesson_viewed` on mount, `video_played` (with `start_seconds`),
    `lesson_tab_changed`, and `lesson_resource_clicked`. Watch-progress and lesson-completion events
    (§7) need player telemetry plus the progress backend, neither of which exists yet — out of scope
    here. Flagged.

## Files to touch

- `sanity/lib/queries.ts` — extend `LESSON_BY_SLUG_QUERY`: `course.coverImage`, `course.level`, and
  `modules[].durationSeconds` (`math::sum(lessons[]->duration)`).
- `sanity.types.ts` — regenerated by `npm --prefix studio run typegen`. Not hand-edited.
- `app/lessons/[slug]/page.tsx` — new. Server component: fetch, `notFound()`, `generateMetadata`,
  `generateStaticParams`, start-seconds parsing, curriculum derivation, layout.
- `components/lesson/lesson-sidebar.tsx` — new, `"use client"`. Back link, course row with progress,
  module accordion with the active module expanded, lesson rows, mobile disclosure.
- `components/lesson/lesson-header.tsx` — new. Lesson badge, title, bookmark button, summary, meta.
- `components/lesson/lesson-video.tsx` — new, `"use client"`. Poster + play button → provider iframe,
  start seconds, `video_played` capture.
- `components/lesson/lesson-tabs.tsx` — new, `"use client"`. Lesson Content / Notes tabs.
- `components/lesson/lesson-notes.tsx` — new. Portable Text serialisers for the Overview prose.
- `components/lesson/lesson-key-points.tsx` — new. "In this lesson you will:" list + Pro Tip panel.
- `components/lesson/lesson-resources.tsx` — new. Resources grid and its card (icon per resource
  type), distinct from the search-result `ResourceCard`.
- `components/lesson/lesson-footer-nav.tsx` — new. Previous/next lesson bar.
- `lib/video.ts` — new. `parseVideoUrl(url)` → `{provider, id, embedUrl(startSeconds, autoplay)}`
  for YouTube (`youtube-nocookie.com/embed/<id>`), Vimeo (`player.vimeo.com/video/<id>`), Bunny
  (`iframe.mediadelivery.net/embed/<lib>/<id>`); returns null for anything else.
- `lib/routes.ts` — `lessonHref(slug, startSeconds?)`.
- `lib/format.ts` — add `formatTimestamp(seconds)` → `12:45` / `1:28:00` for the start-seconds label.
- `package.json` — add `@portabletext/react` as a direct dependency.
- No Studio schema changes, no seed changes, no new route handlers.

## Requirements

- Server component page; the only Sanity read goes through `sanityFetch` with
  `tags: [CACHE_TAGS.lesson, CACHE_TAGS.course]`.
- `generateStaticParams` from `LESSON_SLUGS_QUERY`; unknown slug → `notFound()`.
- `generateMetadata` returns the lesson title and a description from its notes.
- Derived values only: module/lesson numbering from order, module duration from the GROQ sum,
  durations formatted from seconds, student count formatted. Nothing invented, nothing hardcoded
  that Sanity supplies.
- Optional fields degrade: no `keyPoints` → the list is dropped; no `proTip` → no panel; no
  `resources` → no section; no `notes` → Overview is omitted; no parent course → the sidebar,
  breadcrumb course crumb, and footer nav are omitted rather than faked; unparseable `videoUrl` →
  the poster renders with a plain "Video unavailable" state instead of an iframe.
- The iframe carries `title`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media;
  picture-in-picture"`, `allowFullScreen`, `loading="lazy"`, and `referrerPolicy="strict-origin-when-cross-origin"`.
- Accessibility: tabs use `role="tablist"`/`role="tab"`/`role="tabpanel"` with `aria-selected` and
  keyboard arrow support; the accordion uses `aria-expanded`/`aria-controls`; the current lesson row
  is `aria-current="page"`; decorative circles, dots, and chevrons are `aria-hidden`; every
  interactive element keeps `focus-visible:ring-2 ring-primary-500`.
- Reuse `PageFrame`, `SiteHeader`, `Breadcrumbs`, `Badge`, `buttonClasses`, `formatDuration`,
  `formatCount`, `formatLevel`, `lessonLabel`, `cn`. No new UI primitives, no `cva`, no new
  dependencies beyond `@portabletext/react`.
- Tokens over raw hex; lucide-react for icons; lookup maps for variants.

## Security considerations

- The Sanity client and token stay server side; client components receive plain serialisable props
  and never import from `sanity/lib/`.
- Resource and video URLs come from content: only `https:` URLs are rendered as links, external
  links carry `rel="noopener noreferrer"`, and the embed src is built from a parsed provider id
  rather than by interpolating the stored URL into an iframe.
- `?t=` is parsed as an integer, clamped to the lesson duration, and never reflected into markup.
- The page is public (browsing is public per §7); nothing here is gated and nothing writes.
- No new `images.remotePatterns` host: posters come from `cdn.sanity.io`, already allowed.

## Acceptance criteria

1. `/lessons/nextjs-app-router-in-depth-file-system-routing` renders the lesson: badge with its
   derived `LESSON x.y` label, title, summary, duration, level, student count.
2. The video area shows the lesson poster; clicking play loads the YouTube embed and the video plays
   on the page, never navigating to YouTube.
3. `/lessons/<slug>?t=120` starts the embed at 2:00 and auto-plays.
4. The sidebar lists every module of the parent course with its summed duration, the current lesson's
   module is expanded, its lessons are listed with durations, and the current lesson shows the
   "Now playing" treatment; "Back to course" links to `/courses/<course-slug>`.
5. Lesson Content shows Overview (rendered notes), "In this lesson you will:" from `keyPoints`, the
   Pro Tip panel, and the Resources grid; the Notes tab switches to its empty state.
6. The footer bar links to the previous and next lessons in curriculum order, with their titles and
   durations; the first and last lessons of a course omit the respective side.
7. An unknown slug returns the 404 page.
8. Desktop layout matches `design/vertext-lesson.png`; the page is usable at 375px wide with no
   horizontal scroll and the sidebar collapsed.
9. `sanity.types.ts` regenerates with the extended `LESSON_BY_SLUG_QUERY_RESULT`, and the page
   compiles against it with no `any` and no hand-written result types.

## Checks to run

From the repo root unless stated:

1. `npm install @portabletext/react`
2. `npm --prefix studio run typegen` — regenerate `sanity.types.ts` after the query change.
3. `npm run typecheck`
4. `npm run lint`
5. `npm run build` (new route and server modules)
6. `npm run dev` and exercise the manual steps below.

## Deviations found while implementing

1. **The lead paragraph is removed from the body.** Using the notes' first paragraph as the summary
   (decision 11) printed it twice on screen, so `splitLeadParagraph` drops that block from Overview.
2. **The footer nav spans both columns**, not just the content column — re-reading the reference,
   "Previous Lesson" sits under the sidebar.
3. **Seed `_key` collision fixed** (`studio/scripts/seed/build-ndjson.mjs`). Rendering the notes
   surfaced a real seed defect: `keyOf` truncated the joined key to 60 chars, so every block in a
   long-slugged lesson got the identical `_key` — 39 of 120 lessons, and React logged duplicate-key
   warnings. Over-long keys now keep a digest of the full input. `seed.ndjson` is rebuilt; the live
   dataset keeps the old keys until it is re-imported, which is the user's call.
4. `lucide-react` has no `Github` icon at this version; repo resources use `FolderGit2`.

## Manual test steps

1. `npm run dev`, then open `http://localhost:3000/courses/nextjs-app-router-in-depth` and click a
   lesson in the curriculum accordion — it lands on that lesson page.
2. Compare against `design/vertext-lesson.png` side by side at 1440px wide.
3. Click the play button: the YouTube embed loads in place and plays without leaving the site.
4. Open the same lesson with `?t=120` and confirm playback starts at 2:00.
5. Expand and collapse sidebar modules; confirm the current lesson's module starts expanded and the
   current row is highlighted; click another lesson and confirm it navigates.
6. Switch to the Notes tab and back; confirm keyboard arrows move between tabs and focus rings show.
7. Click a resource card: it opens the external URL in a new tab.
8. Click "Previous Lesson" and "Next Lesson" and confirm they move through the curriculum in order.
9. Resize to 375px: the sidebar collapses to a disclosure, the resources grid is single column, the
   footer bar stacks, nothing scrolls horizontally.
10. Open `/lessons/does-not-exist` and confirm the 404 page.
11. In PostHog (or the dev console with debug on) confirm `lesson_viewed` and `video_played` fire.
