# Implementation prompt: Sanity content model, standalone Studio, and web data layer

## Goal

Stand up the content foundation for Vertex in two parts:

1. **A standalone Sanity Studio workspace** at `studio/`, holding the schema for `course`,
   `module` (embedded object), `lesson`, `instructor`, and `category`, plus their supporting
   objects. The embedded Studio scaffold currently in the Next.js app is removed.
2. **A server-only read layer** in the web app: a Sanity client that holds the read token, a typed
   fetch helper with cache tags, and the GROQ queries the catalog / course / lesson / instructor
   pages will consume.

No pages, no UI, no ingestion, no search in this task. Nothing renders yet — this is the data
foundation those tasks build on.

**Explicitly out of scope** (later tasks, per AGENTS.md §8): the `video` document and its ingestion
pipeline, the agent Context document, and the `progress` document with its write route.

## Skills and docs read

- `AGENTS.md` — §2 loop, §5 structure (standalone Studio; server-only data access; browser holds no
  token), §6 stack, §7 fixed decisions (Portable Text not markdown; modules embedded; derived
  numbering; provider embeds), §8 the data model, §12 traps (private dataset, token on server,
  env-driven ids), §13 checks.
- `sanity-best-practices` → `references/schema.md` — `defineType`/`defineField`/`defineArrayMember`,
  icons imported from per-icon subpaths (root named exports removed in v5), references vs nested
  objects, generated `_id`s, validation patterns.
- `sanity-best-practices` → `references/nextjs.md` — §1 standalone Studio (Option A) and §5 the
  migration steps off an embedded Studio; §3 caching table; §7 error handling.
- `sanity-best-practices` → `references/typegen.md` — `typegen` block in `sanity.cli.ts`, monorepo
  `path`/`generates` pointing at the web app, `defineQuery` requirement, unique query names,
  `sanity.types.ts` must be inside tsconfig `include`.
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md` — server components
  fetch with any async I/O; credentials stay server-side.
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and `09-revalidating.md` —
  both are gated on `cacheComponents: true`. Our `next.config.ts` does **not** enable it, so the
  previous model applies (`fetch` options `next: { tags, revalidate }` + `revalidateTag`), per
  `02-guides/caching-without-cache-components.md`.

## Code inspected

- `sanity.config.ts`, `sanity.cli.ts`, `app/studio/[[...tool]]/page.tsx` — the embedded Studio
  scaffold from `sanity init`, uncommitted. Being replaced by `studio/`.
- `sanity/schemaTypes/index.ts` — empty `schema.types` array; nothing to preserve.
- `sanity/env.ts` — `apiVersion` (default `2026-08-15`), `dataset`, `projectId` with `assertValue`.
- `sanity/lib/client.ts` — `useCdn: true`, no token. `sanity/lib/image.ts` — `urlFor` builder.
  `sanity/lib/live.ts` — scaffolded `defineLive`, unused.
- `sanity/structure.ts` — default `S.documentTypeListItems()`.
- `components/cards/course-card.tsx` — needs `title`, `description`, `level`, `duration`, `modules`
  as display strings, plus a logo tile.
- `components/cards/lesson-card.tsx` / `lesson-video-card.tsx` — need `moduleLabel` ("Module 5") and
  `lessonLabel` ("Lesson 5.1"), i.e. numbering derived from order, plus a formatted `timestamp`.
- `components/cards/resource-card.tsx` — needs resource `type`, `size`, `href`.
- `app/layout.tsx` — `ClerkProvider` wraps children; no Sanity provider present.
- `proxy.ts` — `clerkMiddleware()`, everything public today.
- `package.json` — `next 16.3.1`, `next-sanity 13.3.3`, `sanity 5.31.1`, `@sanity/vision 5.31.1`,
  `@sanity/image-url`, `styled-components`. Scripts: `dev`, `build`, `start`, `lint`.
- `tsconfig.json` — `include: ["**/*.ts", ...]`, `paths: { "@/*": ["./*"] }`,
  `exclude: ["node_modules", "agent", ".agents", ".claude"]`.
- `.gitignore` — `.env*` with no exception, so `.env.example` is currently ignored.
- `.env.local` — has Clerk keys plus `NEXT_PUBLIC_SANITY_DATASET` and
  `NEXT_PUBLIC_SANITY_PROJECT_ID`. No Sanity token yet.

## Decisions and assumptions

Both were put to the user in the question panel and confirmed:

1. **Standalone Studio.** `studio/` becomes its own workspace with its own `package.json`. The
   embedded route and root Sanity config files are deleted. Rationale: AGENTS.md §5/§12, plus
   Studio auto-updates, Vite-speed builds, TypeGen watch, and `sanity deploy` — which the Context
   MCP requires later (§12: the MCP only serves a dataset with a *deployed Studio application*).
2. **Server-only client plus a tagged fetch helper.** No `defineLive`. The dataset is private, so a
   browser token is not an option; `live.ts` is deleted rather than left half-wired.

Further decisions I am making, flagged here rather than buried in code:

- **Durations are stored as seconds** (`number`), not display strings. `12:45` and `4h 30m` are
  formatted in the web app, and a course's total duration is summed from its lessons. Storing
  presentation strings would fail the "data over presentation" test in `schema.md` §1.
- **Numbering is never stored.** `Module 5` / `Lesson 5.1` are computed from array order at render
  time (AGENTS.md §8). No `order` or `number` fields.
- **`level` is a `string` with `options.list`** (`beginner` / `intermediate` / `advanced`), not a
  free string — per `schema.md` §4C.
- **`popular` and `freePreview` stay booleans.** Both are genuinely binary display flags, and
  free preview is a label, not access control (AGENTS.md §7).
- **Lesson `keyPoints` is an array of strings.** The design's "In this lesson you will" is a plain
  bulleted list; a nested object would add editing friction for no data.
- **Course `learningOutcomes` is an array of objects** (`icon`, `title`, `description`) because
  AGENTS.md §8 names all three. `icon` is a `string` constrained to a list of lucide icon names the
  web app already ships, so an author cannot pick an icon the frontend can't render.
- **Portable Text for `lesson.notes` and `instructor.bio`**, defined once as a shared
  `blockContent` object type. Notes allow headings, lists, links, code, and images; bio is the same
  type kept simple by convention.
- **Resource `size` is not stored.** `resource-card.tsx` shows a size, but resources are external
  URLs, so a size would be author-typed and rot. The card's `size` prop will be fed the resource
  `type` label or left blank by the page task; noted under "Needs your attention".
- **A lesson does not store its parent course** (AGENTS.md §8). The lesson query derives the course
  with a reverse reference: `*[_type == "course" && references(^._id)][0]`.
- **Generated document IDs throughout** (`schema.md` §6). No slug-derived or deterministic `_id`s.
- **`useCdn: false`** on the server client. The dataset is private and reads are token
  authenticated; freshness matters more than CDN latency, and Next's own cache sits in front.
- **`apiVersion` stays env-driven** from `sanity/env.ts` (`NEXT_PUBLIC_SANITY_API_VERSION`,
  defaulting to `2026-08-15`) — §12 says get specifics from config, not hardcoding.
- **TypeGen output `sanity.types.ts` is committed** at the web root. It keeps `tsc` and `next build`
  working without a Studio install in CI. It is already covered by tsconfig `include`.

## Files I expect to touch

**New — Studio workspace**

- `studio/package.json` — deps `sanity`, `@sanity/vision`, `@sanity/icons`, `styled-components`,
  `react`, `react-dom`; scripts `dev`, `build`, `deploy`, `deploy-graphql` (omit), `typegen`.
- `studio/sanity.config.ts` — `defineConfig` with `projectId`/`dataset` from env, `structureTool`,
  `visionTool`.
- `studio/sanity.cli.ts` — `defineCliConfig` with the `typegen` block:
  `path: '../{app,components,sanity,lib}/**/*.{ts,tsx}'`, `generates: '../sanity.types.ts'`.
- `studio/structure.ts` — grouped desk: Courses, Lessons, Instructors, Categories.
- `studio/schemaTypes/index.ts` — exports the `schema.types` array.
- `studio/schemaTypes/documents/course.ts`, `lesson.ts`, `instructor.ts`, `category.ts`
- `studio/schemaTypes/objects/module.ts`, `learningOutcome.ts`, `resource.ts`, `blockContent.ts`
- `studio/.env.example`, `studio/tsconfig.json`, `studio/.gitignore` (ignores `schema.json`,
  `dist/`, `.sanity/`).

**Modified — web**

- `sanity/lib/client.ts` — `import 'server-only'`, token, `useCdn: false`.
- `sanity/env.ts` — unchanged (client-safe values only); token lives in its own module.
- `package.json` — drop `sanity`, `@sanity/vision`, `styled-components`; add `server-only`; add a
  `typecheck` script.
- `tsconfig.json` — add `"studio"` to `exclude` so the web type check ignores the Studio workspace.
- `eslint.config.mjs` — ignore `studio/**` and `sanity.types.ts`.
- `.gitignore` — add `!.env.example` so the canonical env list is committed (§12).
- `.env.local` — add `SANITY_API_READ_TOKEN` (value supplied by the user).

**New — web**

- `sanity/lib/token.ts` — `server-only` module reading and asserting `SANITY_API_READ_TOKEN`.
- `sanity/lib/fetch.ts` — the typed `sanityFetch` helper.
- `sanity/lib/queries.ts` — all `defineQuery` definitions.
- `sanity.types.ts` — TypeGen output (committed).
- `.env.example` — canonical env list.

**Deleted**

- `sanity.config.ts`, `sanity.cli.ts` (root), `app/studio/` (whole route),
  `sanity/schemaTypes/`, `sanity/structure.ts`, `sanity/lib/live.ts`.

## Requirements

### Schema

Every type uses `defineType`/`defineField`/`defineArrayMember`, carries an icon imported from its
own `@sanity/icons/<Name>` subpath, and defines a `preview` that shows something useful in lists.

**`course`** (document)

| field | type | notes |
|---|---|---|
| `title` | string | required |
| `slug` | slug | required, sourced from title, `maxLength: 96` |
| `summary` | text | required, max 200, the card description |
| `coverImage` | image | `hotspot: true`, required `alt` string field |
| `level` | string | list: beginner / intermediate / advanced, radio, required |
| `price` | number | required, min 0, `0` means free |
| `popular` | boolean | optional, `initialValue: false` |
| `studentCount` | number | display only, min 0 |
| `learningOutcomes` | array of `learningOutcome` | max 6 |
| `instructor` | reference → `instructor` | required |
| `category` | reference → `category` | required |
| `modules` | array of `module` | required, min 1 |

**`module`** (object, embedded in course only)

`title` (string, required), `summary` (text), `lessons` (array of
`reference → lesson`, required, min 1, `unique()`). Preview shows the title and lesson count.

**`lesson`** (document)

`title` (string, required), `slug` (slug, required), `videoUrl` (url, required, https only, with a
`custom` rule accepting only YouTube / Vimeo / Bunny hosts — AGENTS.md §9 supported providers),
`thumbnail` (image + hotspot + alt), `duration` (number, seconds, required, positive integer),
`freePreview` (boolean, default false), `studentCount` (number), `notes` (`blockContent`),
`keyPoints` (array of string, max 6), `proTip` (text, optional), `resources` (array of `resource`).

**`instructor`** (document): `name`, `slug`, `photo` (image + hotspot + alt), `expertise` (array of
string, `unique()`), `bio` (`blockContent`).

**`category`** (document): `title`, `slug`, `description` (text).

**`learningOutcome`** (object): `icon` (string, `options.list` of lucide names available in the app),
`title` (string, required), `description` (text, required).

**`resource`** (object): `type` (string, list: pdf / link / repo / code / slides, required),
`title` (required), `description` (text), `url` (url, required).

**`blockContent`** (object/array type): standard block with H2–H4, normal, quote, bullet and number
lists, strong/em/code marks, an external `link` annotation with `href` validated as an https URI,
plus an inline `image` member with `alt`.

Slug uniqueness relies on Sanity's built-in per-type slug uniqueness; no custom async validator.

### Studio

- `studio/sanity.config.ts` reads `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` from
  `studio/.env` (the Studio's own env convention), asserted with a clear error like the web app's
  `assertValue`.
- `structure.ts` lists Courses, Lessons, Instructors, Categories as named groups rather than the
  default flat `documentTypeListItems()`.
- TypeGen wired in `sanity.cli.ts` so `npm run typegen` inside `studio/` extracts the schema and
  writes `../sanity.types.ts`.

### Data layer

- `sanity/lib/token.ts` and `sanity/lib/client.ts` both start with `import 'server-only'`. The token
  never appears in a module reachable from a client component. `sanity/lib/image.ts` stays free of
  `server-only` — it uses only public project id and dataset, so client components can call `urlFor`.
- `sanityFetch<T>` signature: `{ query, params, tags, revalidate }`, defaulting to
  `revalidate: false` when tags are supplied (tag-driven invalidation) and a 1-hour time
  revalidate otherwise, passed through `client.fetch(query, params, { next: { tags, revalidate } })`.
  Return type inferred from `defineQuery` via TypeGen's `overloadClientMethods`.
- Every query is a uniquely named `defineQuery` in `sanity/lib/queries.ts`. Minimum set:
  - `COURSES_LIST_QUERY` — catalog cards: title, slug, summary, level, price, popular,
    studentCount, cover image, instructor name, category title, module count, and total duration
    summed over lessons (`math::sum(modules[].lessons[]->duration)`).
  - `COURSE_SLUGS_QUERY` — slugs for `generateStaticParams`.
  - `COURSE_BY_SLUG_QUERY` — full detail, including `modules[]{ _key, title, summary,
    lessons[]->{ _id, title, "slug": slug.current, duration, freePreview } }` with `_key` projected
    on every array item (`schema.md` §4A).
  - `LESSON_SLUGS_QUERY`, `LESSON_BY_SLUG_QUERY` — lesson detail plus the parent course derived by
    reverse reference, projecting enough of `modules` for the page to compute `Lesson 5.1`.
  - `INSTRUCTORS_LIST_QUERY`, `INSTRUCTOR_BY_SLUG_QUERY` — the instructor page and its courses.
  - `CATEGORIES_LIST_QUERY` — catalog filters.
- All queries project `"slug": slug.current` rather than returning the slug object, and never
  return whole Portable Text bodies in list queries.
- No React components, no route files, no rendering. The data layer is imported by nothing yet;
  a temporary smoke script proves it (see Test steps), and is deleted afterwards.

## Security considerations

- `SANITY_API_READ_TOKEN` is server-only: no `NEXT_PUBLIC_` prefix, and both modules that reference
  it are guarded by `server-only`, which makes a client import a build error rather than a leak.
- `.env.example` carries key names and empty values only — never real values. `.gitignore` keeps
  `.env*` ignored and re-includes only `.env.example`.
- The Studio's own env vars (`SANITY_STUDIO_*`) are separate from the web app's and carry no token.
- The read token needs **Viewer** rights only. No write token is created in this task.
- `next build` must not emit the token into any client chunk; the build check plus a grep over
  `.next/static` is part of the acceptance criteria.

## Acceptance criteria

1. `studio/` runs on its own (`npm run dev` → http://localhost:3333) and shows Courses, Lessons,
   Instructors, Categories in the desk.
2. A course can be authored end to end: create instructor → category → two lessons → a course with
   one module referencing both lessons, all validation passing.
3. The embedded Studio is gone: no `app/studio/`, no root `sanity.config.ts` / `sanity.cli.ts`, and
   `/studio` 404s in the web app.
4. `npm run typegen` in `studio/` writes `sanity.types.ts` at the web root with `Course`, `Lesson`,
   `Instructor`, `Category`, `Module` and a `*_QUERY_RESULT` type per query.
5. Web `tsc --noEmit` and `eslint` pass; `next build` succeeds.
6. `grep -r "sk" .next/static` finds no Sanity token; importing `sanity/lib/client` from a client
   component fails the build.
7. Each query returns the shape the corresponding card component needs, verified against real
   authored content.

## Checks to run

From the web root:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

From `studio/`:

```bash
npm run typegen
npm run build
```

Plus a `.next/static` token grep, and `npx sanity documents query` (or Vision) against each query
with real content.

## Manual test steps

1. `cd studio && npm install && npm run dev` — Studio opens at http://localhost:3333 with the four
   groups in the desk.
2. Create, in order: an instructor, a category, two lessons (each with a real YouTube URL and a
   duration in seconds), then a course with one module referencing both lessons. Confirm required
   fields block publishing when empty, and that a non-YouTube/Vimeo/Bunny `videoUrl` is rejected.
3. `npm run typegen` in `studio/` — `sanity.types.ts` appears at the web root and contains the
   document types.
4. In Vision, run `COURSES_LIST_QUERY` and `COURSE_BY_SLUG_QUERY` — confirm the module and lesson
   arrays come back with `_key` values and the summed duration is non-zero.
5. From the web root, run the temporary smoke script (`npx tsx scripts/smoke.ts`, deleted after) to
   confirm the server client authenticates against the private dataset with the token, then
   `npm run build` and visit `/studio` to confirm a 404.

## Needs your attention (before I can finish)

- **A read token.** Create a Viewer token in sanity.io/manage → API → Tokens and add it to
  `.env.local` as `SANITY_API_READ_TOKEN=`. Steps 5 and criterion 7 are blocked without it, and I
  will not be able to verify queries against real data.
- **Studio deploy.** `npx sanity deploy` needs an interactive login and a studio hostname choice.
  It is not required for this task, but the Context MCP will not serve the dataset until it is done
  (AGENTS.md §12), so it should happen before the search task.
- **Resource size.** `resource-card.tsx` shows a `size` ("1.2 MB") that I am deliberately not
  storing. Tell me if you'd rather have an author-typed `size` field on `resource`.
