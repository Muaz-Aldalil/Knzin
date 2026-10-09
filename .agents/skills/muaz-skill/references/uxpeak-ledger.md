# UXpeak Technique Ledger (U1–U149)

> Status: v5.4.0 — last reviewed 2026-09

Distilled UI/UX techniques from the @uxpeak YouTube channel (21 video transcripts, 2026-09 research pass). Each technique carries its source video ID. This file is the provenance behind candidate `data/ux-guidelines.csv` rows (No. 101+) and any enrichment of `landing.csv` / `motion.csv`.

Fidelity tags: `[auto]` auto-captions (all 21 transcripts are YouTube auto-generated subs) · `[pilot]` manual distillation during Phase 0.5 calibration · `[tool]` tutorial-only, no transferable rules extracted.

## A. Psychology & persuasion (U1–U22)

- **U1.** Smart defaults: pre-select the most common choice for every field; 70–90% of users never change defaults, so a default reads as a recommendation. The user's job shifts from "fill this out" to "scan and adjust." [pilot — 2TlIg3VokY8]
- **U2.** Goal gradient: the closer people feel to finishing, the faster they move; you choose where the starting line is (pre-fill 2 of 10 stamps, show "0% complete" never). [pilot — 2TlIg3VokY8]
- **U3.** Reciprocity: give something first (free report, sample) and users feel a pull to return the favor; free samples raise purchases up to 2,000%. [pilot — 2TlIg3VokY8]
- **U4.** Anchoring: the first number sets the anchor; a gift creates a debt — sequence what users see first deliberately. [pilot — 2TlIg3VokY8]
- **U5.** IKEA effect: when people build something themselves they value it more; let users create/choose before asking for commitment. [pilot — 2TlIg3VokY8]
- **U6.** Endowment effect: just feeling ownership is enough; give the user something that belongs to them on the sign-up screen so closing the tab costs something. [pilot — 2TlIg3VokY8]
- **U7.** Reframe the hard question into an easy one: "Is this worth $19/month?" on a fresh user is homework; lead with "How your free trial works" so the question becomes "Can I try this for free?" [auto — zr37ibqXl1U]
- **U8.** Transparent trial timeline: "Day 5: we'll send a reminder before you're charged" triggers transparency bias — revealing a downside increases trust and conversion. [auto — zr37ibqXl1U]
- **U9.** Lock the destination before showing choices: commitment consistency — showing the user's own confirmed intent shrinks the remaining decision to a small either/or. [auto — zr37ibqXl1U]
- **U10.** Every element asks the user a question — design the question. Audit each element for the question it implies and harden the easy question; never ship a screen that asks users to negotiate risk or price. [auto — zr37ibqXl1U]
- **U11.** Status badge above the title (best-seller / top-rated) triggers the halo effect, framing perceived value before a single detail is read. [auto — oYskl2ZBoBc]
- **U12.** Embed de-risking details inside the choice card ("save 15%, cancel anytime") where the objection forms, not in fine print below. [auto — oYskl2ZBoBc]
- **U13.** Design the post-purchase wait as a stress-reducer: confident status message, humanized courier (photo, name, call/message), progress as a visual timeline — not raw order data. [auto — Xzh8xjimmp8]
- **U14.** Personalize with the user's name ("Hi Emily") — recognition measurably increases engagement at zero cost. [auto — YlN28RNChl0]
- **U15.** Emoji as semantic reinforcement, not decoration: pair each option with an icon that maps to its value. [auto — YlN28RNChl0]
- **U16.** Informative feedback, not just acknowledgment: pair every response with guidance or comparison ("2 hours more than last night") to create a sense of progress. [auto — YlN28RNChl0]
- **U17.** Recognition over recall for people and accounts: avatars/photos of the recipient remove the need to verify by number. [auto — YlN28RNChl0]
- **U18.** Make the source of money explicit when accounts multiply: show which account funds a transaction and allow switching during it. [auto — YlN28RNChl0]
- **U19.** Quantify discovery CTAs ("See all artists · 12") — a real count signals abundance, sets expectations, and triggers curiosity. [auto — SIoOS6tFw1Y]
- **U20.** Anchor the brand with one recurring face: reuse one consistent figure across hero and featured sections as a brand anchor. [auto — SIoOS6tFw1Y]
- **U21.** Ambient glow as a targeting tool, not decoration: a soft glowing accent around the one action you want noticed steers the eye. [auto — BZ0QER_0ZWI]
- **U22.** Probe users with open-ended questions: leading or yes/no questions collect confirmation instead of real needs. [auto — 03Xw8UyC6uo]

## B. Navigation & wayfinding (U23–U42)

- **U23.** Cap bottom nav at 3–5 tabs (max 6): more shrinks tap targets and induces choice paralysis; cover only top-level, frequently used destinations. [auto — wLJ40GV2XEc]
- **U24.** Keep low-frequency and utility items (help, logout, legal) out of the bottom nav — they belong in profile/menu; cramming them in violates Jacob's law. [auto — wLJ40GV2XEc]
- **U25.** Don't drop top-nav elements (back, forward, logo) into the bottom bar — users have learned these live at the top. [auto — wLJ40GV2XEc]
- **U26.** Center the primary CTA in the bottom nav: the center is simultaneously the most prominent and most thumb-reachable position on large phones. [auto — wLJ40GV2XEc]
- **U27.** Differentiate the active state with at least two visual changes (outline-to-filled icon plus color, or color plus bolder label) — one weak signal loses orientation. [auto — wLJ40GV2XEc]
- **U28.** Use one icon style across tabs; the only exception is the active tab switching to filled. [auto — wLJ40GV2XEc]
- **U29.** Choose labels based on your audience, not defaults: icon-only bars alienate older or less app-literate users; test before stripping labels. [auto — wLJ40GV2XEc]
- **U30.** Give every tab a ≥44×44px hit area even when the visible icon is smaller. [auto — wLJ40GV2XEc]
- **U31.** Simple, universally recognized icons (magnifying glass for search) — test meaning with real users before favoring artistic creativity. [auto — wLJ40GV2XEc]
- **U32.** Keep labels short and single-line (~10–12px); labels guide, they shouldn't overshadow content. [auto — wLJ40GV2XEc]
- **U33.** Keep the nav neutral; reserve color for actions — per-tab colors turn navigation into a guessing game. [auto — wLJ40GV2XEc]
- **U34.** Render inactive states with reduced opacity, not contrast-killing colors; verify ≥3:1 contrast for UI components. [auto — wLJ40GV2XEc]
- **U35.** Separate the bar from content with one subtle signal (hairline border, tinted background, or small shadow) — never a harsh oversized shadow. [auto — wLJ40GV2XEc]
- **U36.** Use badges sparingly and readable: badge every minor update and users go numb; keep numerals legible with contrasting color. [auto — wLJ40GV2XEc]
- **U37.** Add tap feedback and motion only on solid fundamentals — animation can't rescue a bar whose structure is wrong. [auto — wLJ40GV2XEc]
- **U38.** Never swap usability for creative layouts: unconventional shapes/positions look striking but confuse navigation if they make tapping harder. [auto — wLJ40GV2XEc]
- **U39.** Active nav state = full intensity, inactives dimmed (~60% opacity) so the current screen reads at a glance. [auto — cJmbncvBYJM]
- **U40.** Dual-code the active tab (shape/elevation AND color): color-only active states fail for colorblind and low-vision users. [auto — rI4A7whqvgo]
- **U41.** Always show which item is active in a carousel/selector: a dedicated indicator (colored underline/bar) that relocates with selection — never rely on centering alone. [auto — xgk5N4rCJIw]
- **U42.** Structure footers into labeled, color-differentiated columns (darker group titles, lighter list items, divider aligned to column width) — dense flat link lists are hard to scan. [auto — SIoOS6tFw1Y]

## C. Mobile & thumb ergonomics (U43–U48)

- **U43.** Respect the home indicator / safe area: leave ≈34px above the home indicator and verify on a real device — canvas mockups don't reveal collisions. [auto — wLJ40GV2XEc]
- **U44.** Put primary CTAs inside the thumb zone: most phones are used one-handed; top placement forces stretching or grip changes. [auto — gG4urkinFQI]
- **U45.** Bank space for the fixed bottom nav early: reserve the nav's height in the layout from the start so content never runs beneath it. [auto — cJmbncvBYJM]
- **U46.** One-axis filter scroll keeps the layout stable: categorical/tab filters live in a horizontally scrollable chip row so content below keeps stable width. [auto — 6lSvKk7lTl0]
- **U47.** Pin the nav, scroll only the content region: constrain the scrollable area to the space above the persistent nav. [auto — 6lSvKk7lTl0]
- **U48.** Define responsive rules up front, not after publishing: fluid widths and constraints from the start, audited at several breakpoints. [auto — 5cqpf1rdeFc]

## D. Conversion & commerce (U49–U65)

- **U49.** Soft CTA instead of shouting; surface the calculated total on the button to kill pre-click uncertainty. [auto — GGg61sdEjeI]
- **U50.** Keep buying controls visible while scrolling: sticky title + sticky bottom action bar (quantity + CTA) act on late decisions. [auto — GGg61sdEjeI]
- **U51.** Predefine popular quantity options (500g/1kg/2kg from real order data) with a custom selector still available — one-tap presets beat stepper taps. [auto — GGg61sdEjeI]
- **U52.** Button copy: "Start" and "My free trial", never "Subscribe" — light verbs imply beginnings, "my" creates ownership, a number kills uncertainty ("start in two taps"). [auto — zr37ibqXl1U]
- **U53.** Reframe cost as convenience: "2 minutes away" + a green "cheaper" badge turns a cost decision into an already-made smart choice. [auto — zr37ibqXl1U]
- **U54.** Put the total and cancellation policy on the button area ("Reserve €445 total", "free cancellation before March 26") — answer the two top objections before they form. [auto — zr37ibqXl1U]
- **U55.** Add a "sold this week" momentum anchor: "500+ sold this week" flips "am I the guinea pig?" into "hundreds buy this now." [auto — oYskl2ZBoBc]
- **U56.** Pre-select the best-value plan with side-by-side cards: visually weighted cards with the desired option pre-checked, tinted, and tagged "most popular." [auto — oYskl2ZBoBc]
- **U57.** Progressive disclosure of bigger bundles: clean baseline, then reveal tiered bundles with escalating discounts only after the user picks the lower-value path. [auto — oYskl2ZBoBc]
- **U58.** Soft-sell the CTA copy ("Start my journey") and customize trust badges to what this shopper secretly worries about (vegan, third-party tested, guarantee). [auto — oYskl2ZBoBc]
- **U59.** Cut gates between users and value: surface a curated feed as the first screen; interaction cost compounds for new users. [auto — gG4urkinFQI]
- **U60.** Remove steps: recent recipients + one clear CTA beat button clutter; expose likely choices on the very first screen. [auto — YlN28RNChl0]
- **U61.** Preview the consequence of an action before it's final: show the projected new balance during a transfer, in real time. [auto — YlN28RNChl0]
- **U62.** Show real product content to raise conversion: a value-proposition backdrop lifted conversion to 22%, actual interior pages doubled it to 48%. [auto — 8pMUkEbAM7g]
- **U63.** Treat product presentation as an iterated conversion lever: A/B test progressively richer presentations; the first variant is never final. [auto — 8pMUkEbAM7g]
- **U64.** Write newsletter copy around user benefit, not existence: lead with the value the subscriber receives and keep it tight. [auto — SIoOS6tFw1Y]
- **U65.** Let users manipulate the product, not just view it: interactive models (rotate, open, animate) reduce "can I see the back?" doubt and boost brand recall. [auto — BZ0QER_0ZWI]

## E. Color (U66–U75)

- **U66.** Overlay icons need a contrast container, not just placement: back overlaid icons with a small tinted container plus a thin outline so contrast holds across any image. [auto — GGg61sdEjeI]
- **U67.** Soften divider lines — separators shouldn't shout: light, subtle dividers quietly structure space without competing with content. [auto — GGg61sdEjeI]
- **U68.** Tint shadows toward the background color: compose the shadow from a darker tint of the background, not gray/black, so elevation blends with the scene. [auto — 8pMUkEbAM7g]
- **U69.** Match theme brightness to audience context: choose light vs. dark from audience preference and primary usage time, not "because it feels standard." [auto — SIoOS6tFw1Y]
- **U70.** Tint ambient shadows and glows to the subject's hue: sample the featured object's accent color for its glow/shadow so it feels lit by its own scene. [auto — J6DjxHXXZGw]
- **U71.** Re-sync every visual variable when the featured item changes: update shadows, glows, accent colors, and copy as one set — never swap only the image. [auto — J6DjxHXXZGw]
- **U72.** Sample UI colors from the hero artwork: pick page background and adjacent fills directly from the hero image so art and UI read as one composition. [auto — cJmbncvBYJM]
- **U73.** Pull chrome and state colors from the app theme: source nav surface, inactive, and active fills from one palette shared across the product. [auto — rI4A7whqvgo]
- **U74.** Pair bold typography with a limited color palette: busy palettes and timid type dilute focus; restrict the palette and scale type boldly. [auto — Dn8vQGO4RoE]
- **U75.** Synchronize the whole page theme to the active item: feed the selected item's palette into page background, shadows, and accent text — one cohesive scene per state. [auto — xgk5N4rCJIw]

## F. Typography (U76–U81)

- **U76.** Use one font family and build hierarchy with size/weight/color/line-height — adding second/third fonts to signal importance is a tell. [auto — GGg61sdEjeI]
- **U77.** Give small uppercase labels breathing room (letter-spacing) and strip badge clutter: a badge should read in under a second. [auto — GGg61sdEjeI]
- **U78.** Keep paragraphs quiet: more line-height, less contrast than headlines — body text should not fight for attention. [auto — GGg61sdEjeI]
- **U79.** Scale line height proportionally, not in fixed pixels: headings ~110–130%, paragraphs ~150%; the larger the text, the tighter its line height. [auto — SIoOS6tFw1Y]
- **U80.** Contrast headings from body copy via color in addition to size and weight. [auto — SIoOS6tFw1Y]
- **U81.** Giant type makes word choice a design decision: when typography replaces imagery, every word must carry the message — edit copy ruthlessly. [auto — BZ0QER_0ZWI]

## G. Layout & hierarchy (U82–U101)

- **U82.** Align to one consistent layout grid: define a consistent margin (e.g. content starts 24px from the left on every section); drift reads as untrustworthy. [auto — GGg61sdEjeI]
- **U83.** Place the rating next to the product title: at the moment users learn what the product is, they ask "can I trust it?" — answer immediately. [auto — GGg61sdEjeI]
- **U84.** Feature icons must share one visual logic: unify style, fill, and palette; limit color to intentional accents. [auto — GGg61sdEjeI]
- **U85.** Whitespace is about relationship, not amount: excess space in the wrong spot makes sections feel unrelated; tighten gaps so the page scans as one flow. [auto — GGg61sdEjeI]
- **U86.** Let the hero photo transport, don't thumbnail it: emotion precedes information; give the hero more than half the screen with trust badges. [auto — zr37ibqXl1U]
- **U87.** Differentiate information with size, weight, color, and icons — identical styling kills scannability. [auto — 8pMUkEbAM7g]
- **U88.** Make data values dominate their labels: the figure ("591 sales") is the answer users came for; size it far above the field name. [auto — 8pMUkEbAM7g]
- **U89.** Align every section to a grid and centralize styles: define palette/typography once as shared styles so one change propagates everywhere. [auto — SIoOS6tFw1Y]
- **U90.** Orient hero imagery so the subject leads toward the copy: flip/adjust the hero subject to face the headline and CTA. [auto — SIoOS6tFw1Y]
- **U91.** Break grid monotony with a deliberate offset card: differentiate one card in a row when one item should be the focal point. [auto — SIoOS6tFw1Y]
- **U92.** Give the primary data visual priority over supporting labels: rank elements by what the user must actually decide, and size/position accordingly. [auto — YlN28RNChl0]
- **U93.** Align control positions with reading order (F-pattern): put selectable controls along the natural left-start reading flow. [auto — YlN28RNChl0]
- **U94.** Make the primary task giant and tuck secondary inputs inside it: size the main input largest and embed secondary controls (currency/unit) inside it. [auto — YlN28RNChl0]
- **U95.** Render options as cards, not plain vertical lists: cards carry labels, colors, and icons that add context and make options simultaneously understandable. [auto — gG4urkinFQI]
- **U96.** Escalate fidelity only as decisions lock in: lo-fi → mid-fi → hi-fi as layout and content decisions firm up; don't polish concepts that haven't survived validation. [auto — 03Xw8UyC6uo]
- **U97.** Minimalism is a trust and performance signal: audit every element; if it has no job, delete it and let whitespace carry the hierarchy. [auto — BZ0QER_0ZWI]
- **U98.** One spacing rhythm for icon+label and sections: pair elements at one small interval (4px icon↔label) and separate sections at one larger interval (12px), consistently. [auto — cJmbncvBYJM]
- **U99.** Structure-based containers beat rigged frames: use auto-layout containers that self-manage spacing and alignment instead of pixel-dragged placement. [auto — 6lSvKk7lTl0]
- **U100.** Category screens need visual rhythm, not image mash-ups: unified stylized images on soft color-coded backgrounds read in seconds. [auto — Xzh8xjimmp8]
- **U101.** Divide tabs evenly across the full bar width: equal intervals with centered icons keep symmetry and predictable tap zones. [auto — rI4A7whqvgo]

## H. Interaction & feedback (U102–U121)

- **U102.** Confirm selection with a dual visual response: change text color AND enlarge the selected item — two visible changes mark the chosen option. [auto — YlN28RNChl0]
- **U103.** Turn data entry into a journey (sliders/swipes) instead of a form: swipeable options match natural thumb gestures where choices form a spectrum. [auto — YlN28RNChl0]
- **U104.** Surface the selection front-and-center with live feedback: center the chosen option and update supporting text in real time. [auto — YlN28RNChl0]
- **U105.** Make control states visually explicit: distinguish enabled vs. disabled controls with color/opacity — never render clickable and non-clickable identically. [auto — SIoOS6tFw1Y]
- **U106.** Test with high-fidelity interactive prototypes: feedback on static wireframes misses real interaction failures; observe users on a near-final clickable prototype. [auto — 03Xw8UyC6uo]
- **U107.** Show products as interactive 3D models, not flat photos: rotatable/detailable views let users inspect construction and set industrial goods apart. [auto — Dn8vQGO4RoE]
- **U108.** Open with a distinctive landing animation: a memorable sequence that flows into the page sets tone — but never delay content for pure spectacle. [auto — Dn8vQGO4RoE]
- **U109.** Bridge digital and physical context with AR product previews where physical size and fit matter. [auto — Dn8vQGO4RoE]
- **U110.** Scroll is a pacing mechanism, not a reveal trigger: choreograph scroll so each section introduces a beat that builds on the last; never trigger unrelated animations with no through-line. [auto — BZ0QER_0ZWI]
- **U111.** Move background layers against the foreground for depth: counter-move a subtle background layer to sell parallax separation during animation. [auto — J6DjxHXXZGw]
- **U112.** Carousels must move in both directions — and motion must be tuned per direction: wire previous AND next and verify the reverse animation looks right. [auto — xgk5N4rCJIw]
- **U113.** Rotate the object in the direction its container moves: give entering/leaving items a rotation matching their travel orbit so they feel real, not pasted-on. [auto — xgk5N4rCJIw]
- **U114.** Reserve scroll-driven 3D/motion for one signature moment: one scroll-anchored 3D or parallax hero carries the wow; don't animate content indiscriminately. [auto — 5cqpf1rdeFc]
- **U115.** Embed playback progress inside the audio visual: a waveform whose bars change color conveys intensity and position; clamp time labels to the visual. [auto — cJmbncvBYJM]
- **U116.** Match input method to frequency and precision, not data type: scroll wheels/sliders for casual one-time setup; text fields/steppers for frequent precise entry. [auto — Xzh8xjimmp8]
- **U117.** Design the search focus moment, not just the bar: offer recent searches, popular items, and recommendations beneath the field — ignorable by experts, supportive for the unsure. [auto — Xzh8xjimmp8]
- **U118.** Replace drop-downs with visible choice swatches: outcome-exposed swatches (with icons) let users see all choices with zero effort. [auto — oYskl2ZBoBc]
- **U119.** Answer the objection at the exact moment of hesitation: a contextual micro-message ("light, tart, not overly sweet") delivers reassurance precisely when doubt appears. [auto — oYskl2ZBoBc]
- **U120.** Use soft, diffuse shadows: low-opacity, diffuse elevation reads clean and polished; sharp high-contrast shadows dominate the UI. [auto — 8pMUkEbAM7g]
- **U121.** One consistent eased transition for tab swaps: a single shared easing and duration governs all state changes — no snapping, no per-tab variation. [auto — rI4A7whqvgo]

## I. Content & imagery (U122–U138)

- **U122.** Product images must work inside the catalog, not alone: shoot on a consistent clean background so every grid tile follows the same rules. [auto — GGg61sdEjeI]
- **U123.** Make the image match how the product is sold: show the product in the units/quantities you actually sell (a single strawberry for a by-weight product mismatches). [auto — GGg61sdEjeI]
- **U124.** Drop redundant labels; let the price speak: a currency-marked number already reads as a price; extra labels demand labeling every control. [auto — GGg61sdEjeI]
- **U125.** Don't bake quantity into the title when quantity is adjustable: the title describes the product; variable purchasing belongs in the buying area. [auto — GGg61sdEjeI]
- **U126.** Show the real product, not decorative art: users can't commit to something they can't visualize; real product/story content does the convincing. [auto — zr37ibqXl1U]
- **U127.** Write titles in sensory, spatial language: "steps from the sand" puts the user at the place and carries the sale before price is seen. [auto — zr37ibqXl1U]
- **U128.** Spell out dates and night counts: day names ("Friday, March 28") make the trip feel real; a "5 nights" badge removes the arithmetic. [auto — zr37ibqXl1U]
- **U129.** Close the imagination gap in the hero: depict the product in its consumption context so value reads instantly (images beat text). [auto — oYskl2ZBoBc]
- **U130.** Use specific, non-round numbers: "4.9 stars, 221 reviews" feels authentic; round numbers read as estimates or placeholders. [auto — oYskl2ZBoBc]
- **U131.** Use narrative/scroll storytelling to explain complex technical products: sequence technical differentiators into a scroll-driven journey instead of static spec paragraphs. [auto — Dn8vQGO4RoE]
- **U132.** State audience assumptions before any visual decision: explicit assumptions (age, taste, context) drive every choice of palette, typography, and imagery. [auto — SIoOS6tFw1Y]
- **U133.** Match asset aspect ratio to screen orientation: set the generation ratio to the target surface (2:3 splash, 3:2 wide hero) before creating the asset. [auto — cJmbncvBYJM]
- **U134.** Reference-first art direction: build a moodboard of direction-setting references before generating assets instead of reverse-engineering style afterward. [auto — cJmbncvBYJM]
- **U135.** Add recognition cues to dense lists (senders, threads): sender faces/company logos (or colored initial avatars) let users scan via recognition instead of recall. [auto — gG4urkinFQI]
- **U136.** Pin a specific problem statement before designing: name the user and the concrete need; a broad statement can't guide design choices. [auto — 03Xw8UyC6uo]
- **U137.** Write conversational microcopy, not form-speak: "How long did you sleep last night?" processes faster than survey phrasing. [auto — YlN28RNChl0]
- **U138.** Keep background imagery at reduced prominence behind content: low opacity/contrast decorative backgrounds decorate rather than drown the copy. [auto — xgk5N4rCJIw]

## J. Accessibility (U139–U142)

- **U139.** Back text on imagery with a scrim or blur: a translucent layer plus controlled opacity keeps overlay text readable on any photo. [auto — SIoOS6tFw1Y]
- **U140.** Overlay a gradient scrim directly on imagery behind text: darken the photo's edge/region behind the copy (same layer) so text clears WCAG contrast. [auto — GFYc5ZT-vFI]
- **U141.** Dim placeholder text to signal an empty field: low-contrast placeholders clarify the field is inactive; never weight/color them identically to real input. [auto — cJmbncvBYJM]
- **U142.** Give every nav tab a ≥44px touch target: keep the whole tab tappable even when the visible icon is smaller. [auto — rI4A7whqvgo]

## K. Onboarding & personalization (U143–U147)

- **U143.** Personalize the experience by user stage: new users get simplicity (welcome + goal-setting + curated picks), repeat users get their daily plan, engaged users get stats. [auto — Xzh8xjimmp8]
- **U144.** Offer selection presets over free-text input: tappable likely options (with icons) plus an "other" escape hatch beat typing (typos, inconsistent answers, guessing). [auto — YlN28RNChl0]
- **U145.** Turn empty states into guided onboarding moments: value-led message, illustration, 1–2 suggested next actions, and a create CTA — never "No projects" dead ends. [auto — gG4urkinFQI]
- **U146.** Harness the splash screen for brand + promise: show the app name plus one catchy value line on the loading frame. [auto — cJmbncvBYJM]
- **U147.** Hand off with explicit UI specifications: package dimensions, spacing, responsive rules, and interaction notes so the shipped product stays true to the vision. [auto — 03Xw8UyC6uo]

## L. Pricing (U148–U149)

- **U148.** Show one number, never a range: ranges become max-cost anchors and force multi-option mental negotiation; one firm price per option compares in ~2 seconds. [auto — zr37ibqXl1U]
- **U149.** Anchor with a crossed-out reference price: €129 struck through → €89 with a −31% badge makes the same price feel like a deal. [auto — zr37ibqXl1U]

## Gaps & notes

- **No transferable rules:** `_kUq8p94NnU` (3D animated hamburger Figma tutorial) — tool tutorial, ~0 transferable rules. `8IpIo3SQOI0` (Figma animation) — no subtitles available, skipped.
- **Fidelity:** all entries `[auto]` (YouTube auto-captions); pilot entries `[pilot]` (manual distillation, Phase 0.5).
- **Overlap with existing `ux-guidelines.csv` rows 1–100:** U30/U142 (≥44px targets) and U34 (inactive contrast) overlap rows on touch targets/contrast — Phase 2 conflict-check will dedupe or enrich rather than duplicate.
- **Overlap with deai-ledger:** U85 (whitespace relationship) and U97 (minimalism) echo T-sections on AI-slop; kept because they carry distinct actionable framing (relationship-not-amount; audit-and-delete).
- **Motion relevance:** U110 (scroll as pacing), U114 (one signature 3D moment), U121 (consistent easing) are the only motion-adjacent rules; they confirm the existing `motion.csv` tiering rather than adding a new technique — no motion.csv enrichment expected.