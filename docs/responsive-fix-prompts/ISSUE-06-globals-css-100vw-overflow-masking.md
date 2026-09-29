# FIX PROMPT: ISSUE-06

## Role
Act as a **Senior Frontend Architect specializing in CSS rendering pipelines, viewport units, and global stylesheets**.

## Description of the Problem
[globals.css](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css) applies `overflow-x: hidden` and `max-width: 100vw` to both `html` and `body`. In desktop browsers with vertical scrollbars, `100vw` includes the scrollbar width, causing a synthetic horizontal overflow that is then aggressively masked by `overflow-x: hidden`, while also interfering with CSS `position: sticky` on child navigation components.

## Context
* **Application Domain:** Knzin Vocational Micro-Course & Promotional Raffle Platform (Iraqi Market)
* **Affected Component(s):** [globals.css](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css)
* **Affected Route(s):** All routes
* **Related Issues:** ISSUE-01

## Evidence
In [globals.css#L13-L27](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css#L13-L27):
```css
html {
  overflow-x: hidden;
  max-width: 100vw;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-tajawal), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  max-width: 100vw;
}
```

## Root Cause
Defensive layout rules applied globally to the root document shell rather than managing overflow at specific component boundaries.

## Objective
Clean up root document styles in [globals.css](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css) so that `width: 100%` is respected, `position: sticky` works reliably across all browsers, and `100vw` scrollbar sizing conflicts are eliminated.

## Constraints
* Ensure this fix is applied **after or alongside ISSUE-01**, so that removing `overflow-x: hidden` from `html` does not expose uncontained header blowouts.
* Preserve font-family, background, foreground, and custom scrollbar definitions.

## Tasks
1. In [globals.css](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css):
   * Remove `overflow-x: hidden;` and `max-width: 100vw;` from `html`.
   * In `body`, replace `max-width: 100vw;` with `width: 100%;`.

## Acceptance Criteria
* `document.documentElement.clientWidth` equals `window.innerWidth` minus scrollbar width.
* Sticky navigation bar (`HeaderHUD`) remains sticky and functional during page scrolling across all modern browsers (Chrome, Firefox, Safari, Edge).

## Verification
* Test scrolling on desktop (Windows Chrome/Edge with classic scrollbars enabled).
* Test sticky header behavior at top of page and after scrolling down 500px.

## Scope
* **Must Change:** [globals.css](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/app/globals.css)
* **Must Not Change:** Component files, layout JSX structure.
