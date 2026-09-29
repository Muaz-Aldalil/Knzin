# Implementation prompt: Seed sample content in Sanity

## Goal

Fill the `production` dataset with realistic, internally consistent sample content so the catalog,
course, lesson, and instructor pages have something to render and cross-course search has enough
breadth to actually have to rank.

Target volume (approved):

- **6 categories**
- **5 instructors**
- **10 courses**, each with **4 modules**, each module with **3 lessons** → **120 lessons**

This is content only. No schema changes, no pages, no ingestion pipeline, no search. The `video`,
`agentContext`, and `progress` documents are later tasks (AGENTS.md §8) and are **not** seeded here.

## Skills and docs read

- `AGENTS.md` — §5 (Studio workspace owns content authoring; web is read-only), §7 (content must be
  coherent top to bottom, structured as Portable Text not markdown, module/lesson numbering derived
  from order), §8 (the exact field list per type), §12 (private dataset, no client tokens),
  §13 (Studio checks include importing content).
- `sanity-best-practices` → `references/migrations.md` and the import section — NDJSON shape,
  deterministic `_id`s, `_sanityAsset` for uploading image assets by URL during import.
- Existing code is the source of truth for field names; nothing here invents a field.

## Code inspected

- `studio/schemaTypes/documents/{course,lesson,instructor,category}.ts` and
  `studio/schemaTypes/objects/{module,learningOutcome,resource,blockContent}.ts` — every required
  field, every `options.list` enum, every validation rule the seed must satisfy.
- `sanity/lib/queries.ts` — the projections the seed has to look good through. Notably
  `COURSE_CARD_FIELDS` derives `moduleCount`, `lessonCount`, and `durationSeconds` with
  `count()` / `math::sum()`, and `LESSON_BY_SLUG_QUERY` resolves a lesson's course with
  `references(^._id)`.
- `studio/sanity.cli.ts` — project/dataset come from `studio/.env`; CLI is already authenticated
  (`sanity dataset list` returns `production`).
- `studio/package.json` — `"type": "module"`, Node v24, no script runner and no extra deps.

## Decisions and assumptions

1. **Videos: one unique, topically-matched, real YouTube video per lesson.** Per the user's answer.
   There is no YouTube Data API key in this project, so the resolver fetches
   `youtube.com/results?search_query=...` for each lesson (search phrase authored per lesson,
   e.g. `"react server components tutorial"`), parses `ytInitialData`, and picks the best candidate.
   This was verified working before writing this prompt: the parse yields `videoId`, title, and
   duration for ~20 results per query.
   - Candidate filter: duration between 3 and 90 minutes (drops Shorts and multi-hour streams),
     title not already used, video id not already used anywhere in the seed.
   - Every chosen id is then confirmed against `https://www.youtube.com/oembed?...` — a non-200
     drops the candidate and the next one is tried. Nothing unverified reaches the dataset.
   - Results are cached to `studio/scripts/seed/videos.json` (committed) so the seed is
     reproducible and a re-run does zero network traffic. Requests are throttled (~1/sec).
2. **Lesson `duration` is the real video length** taken from the resolved video, not invented. This
   is what makes "a module equals the sum of its lessons, and a course equals the sum of its
   modules" true rather than asserted: no aggregate is stored anywhere, and the queries already
   derive module and course duration with `math::sum` over exactly these lessons.
3. **Images.** Approved source was Lorem Picsum. Two deviations I am proposing, both because the
   field's meaning now allows something strictly better — say the word and I will use picsum for
   all three:
   - `course.coverImage` → `picsum.photos` seeded on the course slug (as approved; deterministic).
   - `lesson.thumbnail` → the real poster frame of that lesson's video
     (`i.ytimg.com/vi/<id>/hqdefault.jpg`). The field is literally "poster frame", and now that the
     video is real, its own poster is the honest value.
   - `instructor.photo` → `randomuser.me` portrait. Picsum returns landscapes, so an instructor
     headshot slot would show scenery.
   All three upload as real Sanity assets at import time via `_sanityAsset`, so nothing hotlinks at
   runtime. Every image carries required `alt` text.
4. **Lesson slugs are globally unique**, prefixed with the course slug
   (`nextjs-app-router-server-components`). `LESSON_BY_SLUG_QUERY` matches on slug alone, so a bare
   `intro` slug repeated across courses would resolve to the wrong lesson.
5. **Deterministic `_id`s** — `category.<slug>`, `instructor.<slug>`, `course.<slug>`,
   `lesson.<lesson-slug>` — so `--replace` makes re-running the import idempotent instead of
   duplicating the catalog. Array items get stable `_key`s derived from their position and slug.
6. **Content is hand-authored, not templated.** Each lesson carries an authored title, a one-to-two
   sentence summary, and three key points that genuinely belong to its module's topic. Notes are
   assembled from those per lesson (intro paragraph → `h2` → bulleted key points → closing
   paragraph). Search quality depends on this being real topical text (AGENTS.md §7), so the
   generator formats authored content — it does not generate filler prose.
7. **Plain `.mjs` scripts, no new dependencies.** `studio/package.json` is already `"type": "module"`
   and Node 24 is available; nothing here needs TypeScript compilation or a runtime dep.
8. **Import runs through the authenticated CLI**, so no write token is added to any env file.
9. `studentCount` values are consistent, not random: a course's count equals its first lesson's
   count, and lesson counts decay monotonically through the curriculum (drop-off), so no lesson ever
   claims more students than its course.
10. Prices, levels, and the three `popular` flags are spread across the catalog so filtering and
    sorting have something to distinguish.

## Course lineup (all programming / development / AI)

| # | Course | Category | Level |
|---|---|---|---|
| 1 | Next.js App Router in Depth | Web Development | Intermediate |
| 2 | React Performance Engineering | Web Development | Advanced |
| 3 | TypeScript for Application Developers | Languages | Intermediate |
| 4 | Building AI Apps with LLMs | AI Engineering | Intermediate |
| 5 | Retrieval-Augmented Generation from Scratch | AI Engineering | Advanced |
| 6 | Python for Data Work | Data | Beginner |
| 7 | System Design Foundations | Backend & Infrastructure | Intermediate |
| 8 | PostgreSQL for Developers | Data | Intermediate |
| 9 | DevOps with Docker and Kubernetes | Backend & Infrastructure | Advanced |
| 10 | Practical Web Security | Security | Intermediate |

Categories: Web Development, AI Engineering, Backend & Infrastructure, Data, Languages, Security.
Instructors: 5, each owning 2 courses, with expertise tags that match what they teach.

## Files to touch

**New**

- `studio/scripts/seed/content.mjs` — the authored spec: categories, instructors, courses, modules,
  lessons (title, summary, key points, YouTube search phrase, resources).
- `studio/scripts/seed/resolve-videos.mjs` — YouTube search + oEmbed verification + throttling,
  writes/refreshes the cache.
- `studio/scripts/seed/videos.json` — committed cache of `{lessonSlug: {id, title, duration}}`.
- `studio/scripts/seed/build-ndjson.mjs` — expands the spec plus the cache into NDJSON.
- `studio/scripts/seed/seed.ndjson` — committed generated output.
- `studio/scripts/seed/README.md` — how to re-run, in three commands.

**Modified**

- `studio/package.json` — adds `seed:videos`, `seed:build`, `seed:import` scripts.

Nothing in the web app changes. No schema file changes.

## Requirements

- Every document validates against the existing schema: required fields present, `alt` on every
  image, enum values drawn only from the schema's `options.list`, `summary` ≤ 200 chars,
  `learningOutcomes` ≤ 6, `keyPoints` ≤ 6, `proTip` ≤ 280, `module.summary` ≤ 240,
  `resource.description` ≤ 160.
- Portable Text is well-formed: every block and span has a `_key` and `_type`, `markDefs` present.
- Referential integrity: every `course.instructor`, `course.category`, and `module.lessons[]`
  `_ref` resolves to a document in the same file. No lesson is referenced by two courses, and no
  lesson is orphaned.
- Video ids are unique across all 120 lessons.
- The build script fails loudly on any violation rather than emitting a bad NDJSON file — it
  self-checks required fields, length limits, reference targets, and uniqueness before writing.

## Security considerations

- No token is added to `.env.local`, `.env.example`, or any script. Import authenticates through
  the already-logged-in Sanity CLI.
- Nothing in this task runs in the request path, ships to the browser, or touches the web app's
  server/client boundary.
- The YouTube resolver only ever reads public search pages and the public oEmbed endpoint, is rate
  limited, and caches so re-runs are offline. No credentials, no API keys.
- Seeded content is fictional course material; instructor names are invented and portraits are
  synthetic placeholder images, so no real person is represented.

## Acceptance criteria

1. `production` contains exactly 6 categories, 5 instructors, 10 courses, 120 lessons.
2. Every course returns 4 modules and 12 lessons through `COURSES_LIST_QUERY`, with a
   `durationSeconds` equal to the sum of its lessons' real durations.
3. Every lesson resolves a parent course through `LESSON_BY_SLUG_QUERY`'s reverse reference.
4. Zero broken references, zero orphaned lessons, zero duplicate lesson slugs or video ids.
5. Every image field resolves to an uploaded Sanity asset (not a URL string).
6. Opening any course or lesson in the Studio shows no validation errors.
7. Re-running the import is idempotent: document count is unchanged.

## Checks to run

- `node studio/scripts/seed/build-ndjson.mjs` — must pass its own self-checks.
- `cd studio && npx sanity dataset import scripts/seed/seed.ndjson production --replace`
- GROQ verification via `npx sanity documents query` for: per-type counts; the module/lesson sums
  per course; broken references (`*[_type=="course" && !defined(instructor->_id)]`); orphaned
  lessons (`*[_type=="lesson" && count(*[_type=="course" && references(^._id)]) == 0]`); duplicate
  slugs.
- Web workspace: `npm run typecheck` and `npm run lint` (no web code changes expected, run as a
  regression check).
- No production build needed — no routes, config, or server modules change.

## Manual test steps

1. `cd studio && npm run dev`, open the Studio.
2. Courses → open **Next.js App Router in Depth**. Confirm cover image, instructor, category,
   4 modules, and 3 lessons per module, with no validation warnings in the sidebar.
3. Open one of its lessons. Confirm the thumbnail is the video's poster frame, the notes render as
   structured rich text, key points and resources are present, and the `videoUrl` opens a real,
   topically-relevant YouTube video.
4. In Vision, run `*[_type=="course"]{title, "modules": count(modules), "lessons":
   count(modules[].lessons[]), "duration": math::sum(modules[].lessons[]->duration)}` and confirm
   4 / 12 / a nonzero duration for all 10 rows.
5. In Vision, run the orphan and broken-reference queries above and confirm both return `[]`.
