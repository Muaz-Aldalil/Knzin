# De-AI Technique Ledger (T1–T108)

Distilled techniques for making AI-generated UI look designed, extracted from ~40 YouTube videos across 12 channels + 5 writeups (2026-09 research pass). Each technique carries its source. This file is the provenance behind `anti_slop.py` `source` fields and `quality_gate.py` numeric gates.

Fidelity tags: `[full]` full transcript · `[near]` near-full indexed transcript · `[sub]` substantial excerpts · `[desc]` description/chapters only · `[writeup]` third-party process writeup · `[verbatim]` creator's own written post.

## A. Doctrine — never let AI choose (T1–T5)

- **T1.** Never let AI pick colors (bright clashing defaults). [near — corbin, DesignCode, Sailop]
- **T2.** Never let AI pick layout (bloated sidebars, repeated KPIs, awkward spacing). [near — corbin]
- **T3.** Never let AI pick the font (Inter / trendy serif defaults). [near — Memberstack, DesignCode, Sailop]
- **T4.** Name-the-tell vocabulary before fixing: selected state, menu spacing, eyebrow treatment, section density, glow lights, hero media, font pairing, pricing rhythm, border treatment, hover state. "You cannot fix what you cannot name." [full — DesignCode]
- **T5.** Every model has a taste profile (GPT-5.5 dense/glowy, Gemini 3.1 Pro detailed-but-generic, Opus 4.8 basic/purple). Supply taste or inherit the model's. [near — DesignCode]

## B. De-defaulting system — color & type (T6–T13)

- **T6.** 60-30-10 rule (60 neutral / 30 secondary / 10 accent). [sub — corbin 7 Colors]
- **T7.** Backgrounds stay in the background (neutral gray/tinted; border often beats fill). [sub — corbin]
- **T8.** Icons colorless unless communicating status. [sub — corbin]
- **T9.** Adapt brand colors for WCAG (rotate hue / complements), don't obey failing ones. [sub — corbin]
- **T10.** Grays beat pure black/white for hierarchy; reserve white for the top action. [sub — corbin]
- **T11.** Dark mode is not inverted light mode (brighter borders, light-gray text, desaturated logo). [sub — corbin]
- **T12.** Red for destructive always; hover = lighter, active = darker, disabled = desaturated. [sub — corbin]
- **T13.** Kill purple-gradient hero + random glow lights ("very 2025"); earth tones/off-white + serif as worked alternative. [near — DesignCode, Sailop]

## C. Layout & component fixes (T14–T21)

- **T14.** Emojis → professional icon library (Phosphor/Lucide). Fastest credibility upgrade. [full — corbin]
- **T15.** Gradient letter-avatars → account card; sidebar links → popover; busy buttons → triple-dot; chips → icons. [full — corbin]
- **T16.** Sparse flyouts → modals, advanced options collapsed by default. [full — corbin]
- **T17.** Billing: 2-column + donut charts, ≤4 plans, price big / name small, show discount + next-plan diff. [full — corbin]
- **T18.** Analytics: shaded-region maps over bar charts; split-compare toggles; icon-rich rows. [full — corbin]
- **T19.** Landing = presentation, not complexity (real screenshots, skewed cards); vibe-coded landings lose customers. [full — corbin]
- **T20.** Replace 3-card features grid (table / dl-dt-dd / prose) and 3-tier highlighted pricing. [writeup — Sailop]
- **T21.** Asymmetrize sections (60/40, 70/30); custom hero (never h1+p+2 buttons); non-4-col footer. [writeup — Sailop]

## D. Taste loop workflow (T22–T27)

- **T22.** Never prompt from zero: reference → DESIGN.md → prompt → critique → polish → save back. [near/full — DesignCode, Aura]
- **T23.** Reference before generating (screenshot / live URL import), then instruct transformation, never clone. [near — DesignCode]
- **T24.** DESIGN.md = portable taste (type, color, spacing, radius, motion, shadows, behavior, modes, forbiddens). [near/full — DesignCode, Aura]
- **T25.** AGENTS.md = minimal always-on rules; full taste in memory/skills/DESIGN.md per task. [near — DesignCode]
- **T26.** Screenshot-feedback loop (AI has no eyes: show, describe, fix, repeat). [near — Memberstack, Monday.com]
- **T27.** Design in code, document back (70–90% AI components + engineer QA; Figma becomes sketching + docs). [sub — Sneak Peek/Intercom, Shopify]

## E. Media & assets (T28–T31)

- **T28.** Contextual images per section role; illustration↔photo mismatch is a top tell. [near — DesignCode, Aura]
- **T29.** Feed pre-built libraries, not blank prompts (shadcn blocks, Kibo/ReUI/Skipper UI, transitions.dev, tailork templates). [near — AM Design, Memberstack]
- **T30.** Generate brand assets (no-background icons, product shots), don't accept default asset taste. [near — Riley Brown, DesignCode]
- **T31.** Sound + one signature animation; never fade-in-up-everywhere. [near — Riley Brown; Sailop]

## F. Toolchain & architecture (T32–T35)

- **T32.** shadcn MCP + "use blocks" instruction; tweakcn theme-swap; fix the missing-Tailwind-config first render. [near — Memberstack]
- **T33.** Figma MCP both directions (AI HTML→Figma hand-elevation; Figma→production via Builder.io). [near — DesignCourse, corbin]
- **T34.** Specify architecture early (Realtime broadcast, paginate at 50, signed URLs) or inherit demo-grade defaults. [near — Build Great Products]
- **T35.** Match tool to stage (Lovable ship / v0 components / Bolt explore / Claude Code-Cursor control; usable page in 25–35 min regardless). [near — Build Great Products, Delv]

## G. Batch 1 — AM/Memberstack/corbin depth (T36–T50)

- **T36.** Temporary-route iteration (/logos: generate 20, keep 10 + 19 new, propagate winner, delete route). [near — corbin]
- **T37.** Screenshot-reference mega-prompt one-shot upgrades ("copy the UI found on X" + screenshots). [near — corbin]
- **T38.** Screenshot-to-fix for behavior bugs (show, don't describe). [near — corbin]
- **T39.** SEO is a stack decision (raw-HTML crawlability, e.g. Astro; index/sitemap checks). [near — corbin]
- **T40.** New chat per feature (long chats spiral; default to fresh context). [near — corbin]
- **T41.** Console-paste debugging, "play dumb" (fastest fix path). [near — corbin]
- **T42.** Annotation-app visual fixes (mark screenshot → prompt → remove annotation text). [near — corbin]
- **T43.** Mega-prompt payloads for restyles (one big specified payload beats ten nudges). [near — corbin]
- **T44.** Stress-test with N+1 items (five thumbnails broke the grid). [near — corbin]
- **T45.** Graduate the tool with the product (builders = start; terminal agents = finish). [desc — corbin thesis]
- **T46.** The exact phrase: "Build auth pages using Shadcn blocks with default styling." [writeup — Memberstack guides]
- **T47.** Docs-as-context (`.claude/` folder + Context7 MCP + plan-mode-first). [writeup — Memberstack boilerplate]
- **T48.** Theme-swap via tweakcn (42 prebuilts; selection over invention). [near — Memberstack]
- **T49.** Component library as AI preset (import atoms, not pages; brand-PDF → default prompt). [near — Magic Patterns]
- **T50.** Prototypes are medium-fidelity by design (judge communication, export to Figma). [near — Magic Patterns]

## H. Batch 2 — Riley/DesignCourse/Sneak Peek (T51–T67)

- **T51.** One dense prompt as whole spec (frontend+backend+DB+payments; human = PM with root access). [writeup — Riley couch build]
- **T52.** Route models by task (broad generator + narrow specialist). [writeup — couch build]
- **T53.** Conversational debugging with checkpoint verification (no logs; test upload/analysis/history/payments in turn). [writeup — couch build]
- **T54.** Monetization as a tab (tap-to-configure RevenueCat; verify one sandbox subscriber; one-tap Expo publish). [writeup — couch build]
- **T55.** Ship tiny billable proofs (YapThread ~$12K/mo). [writeup — platform record]
- **T56.** Code→design→code round-trip (Figma MCP imports layout 1:1 with tokens + auto-layout; hand-edit; push back). [near — DesignCourse]
- **T57.** Prompt the MCP precisely ("use Figma, not generate Figma design"; named layers; specified behaviors). [near — DesignCourse]
- **T58.** Four-idea prompt cycle (4 variants → pick → human-refine → link-back → live code, zero hand-written). [sub — DesignCourse/Rewiz]
- **T59.** Junior+senior framing (AI volume, human eye). [sub — DesignCourse]
- **T60.** Patterns-vs-pages split (loop wins on patterns; landings stay bespoke). [sub — DesignCourse]
- **T61.** Reprompt non-determinism ("what screenshots are you taking?"; expect re-rolls). [near — DesignCourse]
- **T62.** Placement questions, not just build orders ("where should logo.svg go — don't change code"). [near — DesignCourse]
- **T63.** Crit legend + live-tweet + moderator (searchable Slack log; presenter doesn't read live). [sub — Sneak Peek/Slack]
- **T64.** Flow first, craft second (align clicks before Figma redlines). [sub — Sneak Peek/Ramp]
- **T65.** Async-first critique (focus + inclusion; live for debate). [sub — Sneak Peek/Ramp, Firefox]
- **T66.** AI prototypes need their own crit slot. [desc — Sneak Peek, pointer]
- **T67.** Code Connect or reinvent (map every component to its import path; compounding returns; real upfront cost). [writeup — Roger Wong/Intercom]

## I. Batch 3 — BuilderOS/3-prompt/Juxtopposed/Jesse (T68–T82)

- **T68.** Phase-skills pipeline (ideate→plan/design→build→launch; enter at any stage). [near — Build Great Products]
- **T69.** Idea-generator interview (expertise → shared pain → customer → MVP). [near — BuilderOS]
- **T70.** Fast AI validation smoke test (Reddit/blogs/forums → pivot-or-proceed; no validation theater). [near — BuilderOS]
- **T71.** PRD before first build prompt (architecture + AI-friendly PRD + proven stack). [near — BuilderOS]
- **T72.** Screenshot → design.json → showcase → design-system.json (3-prompt pipeline). [near — Build Great Products]
- **T73.** Route models by strength (GPT-5-class visual extraction; Sonnet-class code). [near — Build Great Products]
- **T74.** Build the system on the AI-native foundation (React+Vite+Tailwind mapping = portable). [near — Build Great Products]
- **T75.** Living-guide discipline (tweak UI → regenerate guide). [near — Build Great Products]
- **T76.** /goal with explicit success criteria for long sessions; watch token burn. [desc — Build Great Products, pointer]
- **T77.** Product-OS shape (define/design/develop/distribute + secure-by-default CLAUDE.md + gitignored scaffolding). [desc — Build Great Products, pointer]
- **T78.** "A screenshot isn't a workflow." Loop Figma→Claude→GitHub→Vercel→Supabase→iterate; demo vs product = fix + redeploy. [verbatim — Jesse Showalter]
- **T79.** One-task comparative audit (same dish, ~20 apps). [near — Juxtopposed]
- **T80.** Star ratings with tangible receipts, never vibes. [near — Juxtopposed]
- **T81.** Portable audit checks (fee-inclusive pricing, multi-basket, sortable food-attached reviews, unavailable-fallback, radio-vs-checkbox, full-page menu, price contrast, ad-crowding, gratuitous AI tabs). [near — Juxtopposed]
- **T82.** Anchor audits in lab research (Baymard 390-parameter benchmark). [writeup — Baymard]

## J. Batch 4 — Malewicz/Mizko/Flux (T83–T97)

- **T83.** Annotate-before-generate (stories → flow → MANUALLY annotate every node + fix AI mistakes → export JSON → generate). [verbatim — Malewicz PRO workflow]
- **T84.** Lo-fi HTML before hi-fi (test clickable → hand-tweak → Sketch → MCP back + style export). [verbatim — Malewicz]
- **T85.** Semantic round-trip (frames named after div/section). [verbatim — Malewicz]
- **T86.** Split rule: AI draws boxes/arrows; human defines contents, kills redundancies and slop. ~20% faster, far more edge cases. [verbatim — Malewicz]
- **T87.** Bullshit-detector curriculum (audit-before-create training). [desc — Malewicz course, pointer]
- **T88.** Role-based 8pt grid (32 outer / 24 inner / 16 group / 32 action-gap); radius 8→4; brand-tinted soft shadows. [near — Malewicz tutorial]
- **T89.** F-pattern CTA architecture (competing top+main CTAs both converted — test the obvious). [near — Malewicz agency guide]
- **T90.** Projects-first menu; justify every logo (link to case or write it). [near — Malewicz]
- **T91.** Show-value-then-clear-doubts ("blueprint sellers are lying"); split audiences into pages. [near — Malewicz fintech case]
- **T92.** Dual color-coded pathways (beginners: guidance, zero jargon; experts: shortcuts; −40% funnel, both happier). [near — Malewicz]
- **T93.** Mobile-last-but-best + breakpoint-native systems (desktop learns usage; dedicated mobile; never stacked-desktop). [near — Malewicz]
- **T94.** Honest metrics + question mining (never 10x; fix prospects' literal questions). [near — Malewicz]
- **T95.** Self-redesign without attachment (business shift, not refresh; +400% views cited). [near — Malewicz]
- **T96.** CMS-bind after AI-generate ("what AI builders miss = content maintenance"). [near — Flux]
- **T97.** Foundations-before-tools + high-end moat (box model/flex first; team-scale sites need mature systems). [near — Flux]

## K. Batch 5 — CharliMarie/Mizko closers (T98–T108)

- **T98.** Heatmap→recording→change loop (behavior beats opinion). [near — CharliMarieTV]
- **T99.** Dual buy buttons in header (ready buyers skip the pitch). [near — CharliMarieTV]
- **T100.** Licensing modal over page (lift tabs higher; fewer exits). [near — CharliMarieTV]
- **T101.** Exit-intent question mining ("what's holding you back?"). [near — CharliMarieTV]
- **T102.** Use-case pre-header + device-native assets. [near — CharliMarieTV]
- **T103.** First-impressions budget (seconds to hook; Easter-egg interactivity; kill high-learning-curve cleverness). [near — Mizko]
- **T104.** Boring layouts convert (simplicity; minimal transitions; buyer-question content). [near — Mizko]
- **T105.** Answer-architecture pages (proof → contents → fit → changelog → preview button; one click deep). [near — Mizko]
- **T106.** Eat your own kit (the site is the proof). [near — Mizko]
- **T107.** Labels≠paragraphs type system (tight vs generous leading; 2px increments; 16px base; H6-18→H1-52). [near — Mizko]
- **T108.** Metadata hierarchy (small semibold labels; size = importance). [near — Mizko]

## Emphasis re-rank (repetition = importance)

1. Kill default blue/purple + Inter (8 sources) — T1–T3, T13
2. Reference-driven constrained prompting (7) — T22–T25, T72
3. Name-the-tell vocabulary (6) — T4, T81
4. Screenshot-feedback loop (5) — T26, T38, T42
5. Annotate/human-define before generating (4) — T59, T83, T86
6. Round-trip Figma↔code with semantic names (4) — T56–T58, T84–T85
7. Boring layouts + role spacing convert (4) — T88, T95, T104, T107
8. Question-mining over opinion (3) — T92, T94, T101
9. Landing = trust surface (3) — T19, T89, T91
10. CMS-bind + foundations moat (3) — T89, T96–T97

## Contradictions resolved

- shadcn scaffold-with vs unmodified-is-tell → sequence: scaffold, then de-default.
- Code-first vs Figma-first vs hi-fi-craft → stage-dependent (solo speed / team system / finish pass).
- Mobile-first vs desktop-first vs mobile-last-but-best → learn on desktop, design mobile natively (T93).
- Bespoke vs constrained-remix landings → flagships bespoke, rest remix.
- No-gradients vs tinted-neutrals/colored-shadows → decorative banned, functional required.

## Gaps (not covered — transcript visuals lost; deferred slots)

- AM Design follow-ups ×2, Punit Chawla ×3 (no indexed on-goal titles after 3 attempts).
- Malewicz RAW 9-step video, How-NOT course, Trends 2026-27 (pointers, LinkedIn-verified).
- Visual-only content throughout (demos, before/afters, cursor work).

## Skill-map (where the ledger lands)

- New `anti_slop.py` labels: T4 family (SELECTED_STATE_BORDER_ONLY, EYEBROW_CAPS_CRAMPED, RANDOM_STATUS_PILL, GLOW_LIGHTS), T14 EMOJI_AS_ICON, T20 (THREE_CARD_GRID, THREE_TIER_PRICING), T81 audit family.
- New `quality_gate.py` numeric gates: T6–T12 color system, T88 spacing, T107 type scale.
- Workflow: T26+T61 → Phase 5; T58 → Phase 2.5; T83 → blueprint field 14; T63–T65 → review step.

> Status: v5.4.0 — last reviewed 2026-09
