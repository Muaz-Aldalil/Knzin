# Implementation prompt: Home page courses from Sanity

## Goal

Replace the placeholder `courses` array in `app/page.tsx` with real seeded content read through the
existing server-only data layer, without changing the home page's design.

## Skills and docs read

- `AGENTS.md` — §3 (reference image is the source of truth, reuse existing components), §5 (pages
  are read-only, Sanity reads are server side), §7 (nothing invented, derived values not stored),
  §12 (private dataset, token stays on the server), §13 checks.
- Carried over from `prompts/course-page.md`: the same query layer, TypeGen types, and
  `next/image` + `cdn.sanity.io` setup landed there.

## Code inspected

- `app/page.tsx` — `HomeCourse[]` placeholder with hardcoded titles, levels, durations, module
  counts, and brand-mark logos; renders three `CourseCard layout="stacked"` items in a
  `sm:grid-cols-2 lg:grid-cols-3` grid, each wrapped in a `Link` to `/courses/<slug>`.
- `sanity/lib/queries.ts` — `COURSES_LIST_QUERY` already projects title, slug, summary, level,
  `moduleCount`, `lessonCount`, `durationSeconds`, `coverImage`, ordered popular-first then
  alphabetical. **No query changes needed.**
- `components/cards/course-card.tsx` — `logo` is a `ReactNode` with a letter-tile fallback; the
  stacked layout expects a 72px tile.
- `components/brand/course-marks.tsx` — the hardcoded Next.js / Docker / TypeScript marks, used
  only by the placeholder.
- `lib/format.ts`, `lib/routes.ts` — `formatDuration`, `formatLevel`, `pluralize`, `courseHref`.
- `sanity.types.ts` — `COURSES_LIST_QUERY_RESULT` is generated and current.

## Decisions and assumptions

1. **The section keeps showing three cards.** The design is one row of three beside a
   "View all courses" link, so this is a preview, not the full catalog. The page takes the first
   three of `COURSES_LIST_QUERY` (popular first, then alphabetical) rather than rendering all ten
   and turning one row into four.
2. **The logo tile becomes the course `coverImage`**, rendered as a 72px rounded tile via
   `next/image` + `urlFor`. The brand marks in `components/brand/course-marks.tsx` are left in
   place — `app/design-system/page.tsx` still uses them — but the home page stops using them.
3. Meta comes from the data: `formatLevel(level)`, `formatDuration(durationSeconds)`, and
   `pluralize(moduleCount, "module")`. Missing values render as an empty string rather than a
   guess.
4. Layout, spacing, typography, and the card markup are untouched.

## Files to touch

- `app/page.tsx` — fetch, map, drop the placeholder array and the brand-mark imports.
- No changes to `components/cards/course-card.tsx`, the queries, the schema, or the seed.

## Requirements

- Read via `sanityFetch({query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson]})`
  in the server component; no client-side fetching, no token in the browser.
- Skip courses without a slug; if the fetch returns nothing, the grid renders empty and the rest of
  the page still renders.
- Cover images use the stored `alt`, sized for the 72px tile at 2x.

## Security considerations

- Same as the course page: server-only client and token, only `NEXT_PUBLIC_*` values reach the
  browser through `urlFor`, and the page performs no writes.

## Acceptance criteria

1. The home page's three cards show real seeded courses with their cover art, level, duration, and
   module count — no hardcoded copy left in `app/page.tsx`.
2. Card links resolve to working `/courses/<slug>` pages.
3. The section looks the same as `design/vertex-home.png` apart from the content itself.

## Checks to run

`npm run typecheck`, `npm run lint`, `npm run build`, then `npm run dev` and load `/`.

## Manual test steps

1. Open `http://localhost:3000/` and confirm the three cards match seeded courses.
2. Click each card and confirm the course page loads.
3. Compare the section against `design/vertex-home.png`.
