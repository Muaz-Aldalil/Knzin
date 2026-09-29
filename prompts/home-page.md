# Implementation prompt: Vertex home page

## Goal

Reproduce `design/vertex-home.png` as the site's home route (`/`), replacing the Create Next App
boilerplate in `app/page.tsx`. Presentational only: no Sanity, no Clerk, no PostHog, no data
fetching. Course content is a local placeholder array shaped so it can be swapped for a GROQ fetch
later without touching the markup.

## Skills and docs read

- `AGENTS.md` — §3 UI work (reference image is the source of truth, reuse existing components,
  responsive down to mobile), §5 structure (pages are read-only display), §13 checks, §14.
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` — App Router page
  conventions, `PageProps`/`LayoutProps` global helpers, `<Link>` for navigation.
- `node_modules/next/dist/docs/01-app/01-getting-started/` index — confirmed 12-images / 13-fonts /
  11-css conventions already applied by the design-system task still hold.
- No Sanity/Clerk/PostHog/Context skill applies: nothing here talks to a datastore or an LLM.

## Code inspected

- `app/globals.css` — Tailwind v4 `@theme` tokens (primary/neutral/surface, radius, shadows) and the
  `@utility` type scale (`text-display-1`, `text-heading-3`, `text-body`, `text-small`, …).
- `app/layout.tsx` — Inter + Playfair wired as `--font-inter` / `--font-playfair`; body is
  `min-h-full flex flex-col`, so a page can own the full column height.
- `app/page.tsx` — CNA boilerplate, to be replaced entirely.
- `components/nav/navbar.tsx` — logo + `Courses` / `My Learning` links, `activeHref`, focus rings.
- `components/brand/logo.tsx` — `Logo` / `LogoMark`, sized by prop.
- `components/ui/button.tsx` — `Button` / `ButtonLink`, variants primary/secondary/tertiary/text,
  sizes `lg` (h-11, 16px) and `md`, optional trailing `icon`.
- `components/ui/search-input.tsx` — h-11 search field with leading icon and `⌘ K` kbd hint.
- `components/ui/card.tsx` — `Card` (white, neutral border, 16px radius, sm shadow) + `CardFooter`.
- `components/cards/course-card.tsx` — horizontal layout: logo tile left of a sans title, meta row
  (level / duration / modules) with lucide icons.
- `lib/utils.ts` — `cn()`.
- `prompts/design-system.md` — the conventions this build must stay inside (tokens over hex,
  server components by default, lucide icons, lookup-map variants, no `cva`).

## Measurements taken from the reference

Sampled from `design/vertex-home.png` (1024×1536) and treated as 1:1 CSS px.

- Framed content column: vertical hairlines at x≈33 and x≈990 → **960px column**, centered, with
  diagonally striped gutters filling the rest of the viewport.
- Header: 96px tall, bottom hairline, 40px horizontal padding, avatar 48px.
- Eyebrow pill: 210×40, ~11px uppercase, ~0.12em tracking, primary-500 on a near-white fill.
- Hero heading: Playfair bold ~60px / 74px line height, two lines, centered.
- Hero subtitle: ~18px / 33px, two lines, neutral-500.
- CTA: 230×64, radius 12, ~17px label + 20px arrow.
- Search field: 750×88, radius 12, 40px padding, ~18px placeholder, `⌘ K` kbd at the right.
- Full-bleed hairline between hero and courses (y≈742).
- Section content padding: 48px (cards start at x=82). "All Courses" ≈30px Playfair bold;
  "View all courses →" primary-500, ~15px.
- Cards: 3 across, ~276px wide, ~20px gap, 373px tall, 28px padding, 72px logo tile (radius 16)
  above a ~22px Playfair title, ~15px/25px description, hairline divider, meta row (16px icons,
  12px labels).
- Footer note: centered star + ~17px label with a hairline running out to both edges.
- Bottom decoration: two clusters of blurred orange bars fading upward, cropped by the page edge.

## Decisions and assumptions

1. **Warm canvas as new tokens, existing system untouched.** Both reference images sit on a warm
   off-white (#FBF8F5) with warm hairlines (≈#F0E7E0), while the documented system's Neutral 50 is
   the cool #FAFAFC. Rather than redefine `--color-background` (section 01 of the design-system
   sheet documents it), add `--color-canvas: #fbf8f5` and `--color-canvas-line: #f0e7e0` to
   `@theme` and apply them at the home page frame. `/design-system` is unaffected.
2. **Primary stays `#F97316`.** The CTA samples as a slightly muted coral in the PNG render, but the
   design-system sheet documents Primary 500 = #F97316 in text. The token wins; no new orange.
3. **Existing components are extended, not duplicated.**
   - `Button`/`ButtonLink` gain a `size="xl"` (h-16, px-7, 17px) for the hero CTA.
   - `SearchInput` gains `size?: "md" | "lg"`; `lg` is the 88px hero field (larger icon, 18px
     placeholder, same markup and a11y).
   - `CourseCard` gains `layout?: "row" | "stacked"`; `stacked` is the home card (logo tile above,
     Playfair title, divider above the meta row). `row` stays the current default so
     `/design-system` renders unchanged.
4. **New, genuinely missing pieces** (nothing in the library covers them):
   - `components/layout/page-frame.tsx` — the 960px column, its side hairlines, and the striped
     gutters (CSS `repeating-linear-gradient`, no image).
   - `components/layout/site-header.tsx` — composes the existing `Navbar` with the right-side
     actions (notification bell, avatar).
   - `components/ui/avatar.tsx` — circular avatar; renders initials on a neutral fill.
   - `components/brand/course-marks.tsx` — inline SVG marks for Next.js, Docker and TypeScript.
   - `components/home/hero.tsx`, `components/home/chart-decoration.tsx` — the two composed sections
     that only the home page uses.
5. **Avatar is initials, not a photo.** The reference shows a user photo; there is no such asset in
   the repo and the real one will come from Clerk's `<UserButton />` later. A neutral initials
   avatar of the same 48px circle is the placeholder. Flagged for the user.
6. **The Docker mark is an approximation.** Hand-authored simplified whale + container stack in
   Docker blue, since no brand asset exists and the PNG is too low-res to trace. Flagged.
7. **Placeholder data lives in `app/page.tsx`** as a typed `const courses` using the three cards from
   the reference verbatim, so the later swap is a single `await` at the top of the component.
8. **Everything is a server component.** No `"use client"`; the search field is an uncontrolled
   native input and the `⌘ K` shortcut is a visual hint only (real behaviour ships with search).
9. **The bell is presentational** per AGENTS.md §7 (notifications have no backend); it renders as a
   button with an accessible label and no handler.
10. **Nav/CTA hrefs** point at `/courses` (Explore Courses, View all courses) and `/my-learning`.
    Those routes do not exist yet, so they will 404 until built — expected, not a regression.
11. **The bottom bar decoration is `aria-hidden`** and built from divs with a vertical gradient and
    blur, matching the two-cluster rhythm in the reference. It is cropped by section overflow.

## Files expected to change

| File | Change |
| --- | --- |
| `app/globals.css` | add `--color-canvas`, `--color-canvas-line` |
| `app/page.tsx` | replace boilerplate with the home page |
| `components/layout/page-frame.tsx` | new |
| `components/layout/site-header.tsx` | new |
| `components/ui/avatar.tsx` | new |
| `components/brand/course-marks.tsx` | new |
| `components/home/hero.tsx` | new |
| `components/home/chart-decoration.tsx` | new |
| `components/ui/button.tsx` | add `xl` size |
| `components/ui/search-input.tsx` | add `size` prop |
| `components/cards/course-card.tsx` | add `stacked` layout |

## Requirements

- Desktop matches the reference: layout, spacing, type, colour, and the framed column with striped
  gutters.
- Responsive with no horizontal scroll at 375px: grid goes 1 → 2 (md) → 3 (lg) columns; hero type
  scales down; the frame's side hairlines and gutters collapse below 960px; header padding tightens
  and the nav wraps; search and CTA go full width on small screens.
- Tokens only — no raw hex in components beyond the brand marks' own colours.
- Semantic landmarks (`<header>`, `<main>`, `<section>`) with headings in order; the decoration and
  all icons are `aria-hidden`; the bell and search input keep accessible names; the existing
  focus-ring convention is applied to every new interactive element.
- No new dependencies.

## Security considerations

Nothing sensitive: no tokens, no env vars, no network calls, no user input leaves the browser, no
server route. The page is fully static. The one rule to hold is that the placeholder data stays
placeholder — no client-side fetch is introduced ahead of the server-side Sanity client.

## Acceptance criteria

1. `/` renders the reference: header, hero (pill, heading, subtitle, CTA, search), divider,
   All Courses section with three stacked cards, footer note, bar decoration.
2. `/design-system` is visually unchanged.
3. At 375px the page has no horizontal overflow and every section stays legible.
4. Type check, lint and production build all pass.
5. No `"use client"` anywhere in the new code; no new dependency in `package.json`.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` and view `/` and `/design-system`

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/`.
2. Compare side by side with `design/vertex-home.png` top to bottom: header, hero, divider, cards,
   footer note, bar decoration.
3. Hover the CTA, "View all courses", the nav links and a card — colours shift, nothing jumps.
4. Tab through the page: logo → Courses → My Learning → bell → avatar → CTA → search → card links,
   each with a visible focus ring.
5. Resize to 1440, 1024, 768 and 375 — check the striped gutters, the grid reflow, and that nothing
   overflows horizontally.
6. Open `http://localhost:3000/design-system` and confirm it looks the same as before.
