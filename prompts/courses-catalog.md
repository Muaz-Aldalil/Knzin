# Implementation prompt: All Courses catalog

## Goal

Build `/courses`, the catalog the home page's "View all courses" link and the course page's
breadcrumb already point at. Every seeded course, read from Sanity, in the home page's existing card
grid. Deliberately simple: no filters, no search, no sort, no pagination.

## Skills and docs read

- `AGENTS.md` — §3 (no design image exists for this page, so reuse existing components and Tailwind
  patterns rather than inventing a look), §5 (read-only page, server-side Sanity), §7, §13, §14
  ("keep it small").
- Carried over from `prompts/course-page.md` and `prompts/home-courses-from-sanity.md`: the query
  layer, TypeGen types, `next/image` + `cdn.sanity.io`, and the card grid markup.

## Code inspected

- `app/page.tsx` — the card grid this page reuses verbatim: `sm:grid-cols-2 lg:grid-cols-3`,
  `CourseCard layout="stacked"`, cover image as the 72px tile, meta from `lib/format`.
- `sanity/lib/queries.ts` — `COURSES_LIST_QUERY`, popular first then alphabetical. **No query
  changes needed.**
- `components/layout/page-frame.tsx`, `layout/site-header.tsx` (`activeHref`), `nav/breadcrumbs.tsx`,
  `cards/course-card.tsx`, `home/chart-decoration.tsx`.
- `lib/format.ts`, `lib/routes.ts` — `coursesHref`, `courseHref`, `formatLevel`, `formatDuration`,
  `pluralize`.

## Decisions and assumptions

1. **No design reference exists for this page**, so it borrows the home page's section header
   (Playfair heading + card grid) and the course page's frame, padding, and breadcrumb. Nothing new
   is designed.
2. **No filters, sort, or pagination** — the user asked to keep it simple, and `CATEGORIES_LIST_QUERY`
   stays unused until a design calls for it.
3. **All courses render**, unlike the home page's three-card preview.
4. A course count sits beside the heading, mirroring the course page's right-aligned meta line.
5. The card grid is extracted into `components/cards/course-grid.tsx` so the home page and the
   catalog cannot drift apart; `app/page.tsx` is refactored to use it with a `limit`.

## Files to touch

- `app/courses/page.tsx` — new. Server component: fetch, breadcrumb, heading + count, grid, empty
  state.
- `components/cards/course-grid.tsx` — new. The shared grid, moved out of `app/page.tsx`.
- `app/page.tsx` — use the shared grid instead of its inline copy.
- No changes to the queries, the schema, or the seed.

## Requirements

- Read via `sanityFetch({query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson]})`.
- `generateMetadata`/`metadata` gives the page a title and description.
- Courses without a slug are skipped; an empty result shows a short empty state instead of a bare
  grid.
- Responsive down to mobile with no horizontal scroll; cards keep their existing focus rings.
- Breadcrumb: `All Courses` as the current page (no link back to itself).

## Security considerations

- Same as the other pages: server-only client and token, no writes, only `NEXT_PUBLIC_*` values
  reach the browser through `urlFor`.

## Acceptance criteria

1. `/courses` lists all ten seeded courses with cover art, level, duration, and module count.
2. Each card links to a course page that loads.
3. The home page's "View all courses" link and the course page's "All Courses" breadcrumb both
   resolve — no 404s left in the flows built so far.
4. The home page still shows exactly three cards and looks unchanged.

## Checks to run

`npm run typecheck`, `npm run lint`, `npm run build`, then `npm run dev`.

## Manual test steps

1. Open `http://localhost:3000/courses` and count ten cards.
2. Click a card, then use the breadcrumb to come back.
3. From `/`, click "View all courses".
4. Resize to 375px and confirm no horizontal scroll.
