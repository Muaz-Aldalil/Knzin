# Design Reference Workflow

Extract design DNA from URLs, screenshots, or Figma files. Use when the user says "make it look like X", "reference this design", "clone this style", or provides a URL/screenshot/Figma link.

---

## Decision Path

```
REFERENCE / INSPIRED-BY / CLONE / COPY [website/design]
  → Load this file
  → Extract design DNA first, then run build pipeline
```

---

## 1 — Website URL Extraction

**Tools:** webfetch + agent vision

### Steps
1. Fetch the URL with `webfetch` (markdown format)
2. Identify key pages (homepage, pricing, about)
3. Extract design tokens from the CSS/HTML:
   - Colors: hex values from inline styles, CSS variables, class names
   - Typography: font-family declarations, font-size values
   - Spacing: padding/margin patterns
   - Layout: grid/flex patterns
   - Border radius, shadows, effects
4. Analyze the visual structure (sections, hierarchy, flow)
5. Output as Design DNA JSON

### What to Extract
```json
{
  "source": "https://example.com",
  "type": "website",
  "colors": {
    "primary": "#xxx",
    "secondary": "#xxx",
    "accent": "#xxx",
    "background": "#xxx",
    "surface": "#xxx",
    "text": "#xxx"
  },
  "typography": {
    "display": { "family": "xxx", "weight": 700, "tracking": "-0.02em" },
    "body": { "family": "xxx", "weight": 400, "size": "16px" }
  },
  "spacing": {
    "sectionGap": "96px",
    "cardPadding": "24px",
    "gridGap": "16px"
  },
  "layout": {
    "pattern": "split-hero | bento | editorial | masonry",
    "maxWidth": "1200px",
    "columns": "12-column grid"
  },
  "effects": {
    "borderRadius": "8px",
    "shadows": "subtle, multi-layer",
    "animations": "scroll-reveal, hover-scale"
  },
  "tone": "professional | playful | luxurious | brutalist",
  "mood": "description of the overall feel"
}
```

---

## 2 — Screenshot Analysis

**Tools:** Agent vision (model can analyze images)

### Steps
1. Receive screenshot from user
2. Analyze visual elements:
   - Color palette (identify dominant, accent, neutral colors)
   - Typography (serif/sans/mono, weight, size hierarchy)
   - Layout structure (grid type, spacing, alignment)
   - Visual style (flat, 3D, minimal, dense)
   - Effects (shadows, gradients, borders, animations if visible)
3. Cross-reference with style database:
   - Run `python scripts/search.py "<detected style keywords>"`
   - Match against 84 styles in styles.csv
4. Output as Design DNA JSON (same format as above)

### Vision Analysis Checklist
- [ ] Primary color identified (hex estimate)
- [ ] Background color identified
- [ ] Font style identified (serif/sans/mono)
- [ ] Heading weight identified (light/regular/bold/black)
- [ ] Layout pattern identified
- [ ] Spacing density identified (tight/normal/generous)
- [ ] Visual effects identified (shadows, borders, gradients)
- [ ] Overall tone identified (1-2 words)

---

## 3 — Figma Integration

### Without MCP (manual extraction)
1. Ask user for Figma file link or screenshots
2. Use webfetch to access Figma file (if public)
3. Extract from screenshots/exports using vision
4. Cross-reference with design token values

### With MCP (if Figma MCP server configured)
1. Connect to Figma via MCP server
2. Extract:
   - Color styles → hex values
   - Text styles → font, size, weight, line-height, tracking
   - Effect styles → shadow, blur values
   - Component structure → layout patterns
   - Spacing values → padding, margin, gap
3. Map Figma tokens to CSS/Tailwind tokens
4. Output as Design DNA JSON

### Figma Token Mapping
| Figma Property | CSS Token | Tailwind |
|---|---|---|
| Fill color | `--color-*` | `text-*`, `bg-*` |
| Stroke color | `--color-border` | `border-*` |
| Font family | `--font-*` | `font-*` |
| Font size | `--text-*` | `text-*` |
| Line height | `--leading-*` | `leading-*` |
| Letter spacing | `--tracking-*` | `tracking-*` |
| Padding | `--space-*` | `p-*` |
| Border radius | `--radius-*` | `rounded-*` |
| Shadow | `--shadow-*` | `shadow-*` |

---

## 4 — Mobbin MCP Workflow (Recommended)

When user has NO design reference — use Mobbin to search real shipped screens before designing.

### Steps
1. Search Mobbin for "[pattern]" (e.g., "pricing page", "onboarding flow", "SaaS dashboard")
2. Get 3-5 real examples from shipped products
3. Analyze patterns: layout structure, component choices, whitespace strategy
4. Document findings: "3/5 use 3-tier grid, 4/5 have annual toggle, 2/5 use feature tables"
5. Cite specific examples in blueprint DESIGN EVIDENCE field
6. Design from those patterns, not from training data

### Search Strategy
| What You're Building | Search On Mobbin |
|---|---|
| Pricing page | "pricing", "plan comparison", "subscription" |
| Dashboard | "dashboard", "analytics", "admin panel" |
| Onboarding | "onboarding", "welcome flow", "signup" |
| Landing page | "landing page", "product launch", "hero section" |
| Settings | "settings", "preferences", "account" |
| Profile | "profile", "user account", "my page" |
| Checkout | "checkout", "payment", "cart" |

### What to Look For
- **Layout structure**: How many columns? What's the visual hierarchy?
- **Component patterns**: Cards, tables, lists — which one and why?
- **Whitespace strategy**: Generous or dense? Section gaps?
- **Typography hierarchy**: How do they differentiate headings from body?
- **CTA placement**: Where are the primary actions?

### Citing Evidence
In blueprint field 13, format as — aesthetic citations get `[PRODUCT]`; factual/a11y/perf claims must cite `[STANDARD]` sources (WCAG 2.2, W3C, MDN, official framework docs); judgment is `[HEURISTIC]`:
```
DESIGN EVIDENCE:
- Stripe.com pricing: 3-tier grid, annual toggle, feature comparison table [PRODUCT]
- Linear.app pricing: clean cards, highlighted middle tier, no feature table [PRODUCT]
- Vercel.com pricing: usage-based, simple 2-tier, calculator [PRODUCT]
- WCAG 2.2 SC 1.4.3: contrast >= 4.5:1 for normal text [STANDARD]
- MDN <table>: tabular data must use real <table>, not divs [STANDARD]
```

---

## 5 — Figma MCP Workflow

When user HAS a Figma link — extract design DNA via MCP.

### Steps
1. Connect to Figma via MCP server
2. Extract: colors, typography, layout, components
3. Cross-reference with search engine results
4. Merge: Figma aesthetic + product-appropriate structure
5. Output as Design DNA JSON

### What to Extract
- Color styles → hex values
- Text styles → font, size, weight, line-height, tracking
- Effect styles → shadow, blur values
- Component structure → layout patterns
- Spacing values → padding, margin, gap

---

## 6 — Higgsfield MCP Workflow

When project needs custom visuals — generate with AI.

### Steps
1. Identify visual needs: hero images, illustrations, product shots
2. Generate consistent style across all assets
3. Use same prompt pattern for visual consistency
4. No stock photos — everything custom-generated

### When to Use
- Hero section needs a custom image
- Product showcase needs illustrations
- Brand needs custom artwork
- Stock photos would feel generic

### When to Skip
- Text-heavy pages (no images needed)
- Dashboard/analytics (data visualization, not images)
- User already has brand assets

---

## 7 — Merged Workflow

For best results, combine reference extraction with product reasoning:

```
1. Extract Design DNA from reference (URL/screenshot/Figma)
2. Run search.py with project description → get product-appropriate style
3. Merge: reference DNA provides aesthetic, product reasoning provides structure
4. If conflict: reference aesthetic wins for visual style,
   product reasoning wins for layout/structure decisions
5. Output merged Design DNA → blueprint → code
```

### Conflict Resolution
| Decision | Reference Wins | Product Reasoning Wins |
|---|---|---|
| Color palette | When user says "match this" | When colors don't fit product type |
| Typography | When user says "use this font" | When font doesn't support needed languages |
| Layout | When user says "clone this" | When layout doesn't fit content type |
| Motion | When user says "this animation style" | When animation hurts accessibility |
| Spacing | When user says "this density" | When density hurts readability |

---

## 8 — Output Format

Always output extracted design DNA as structured JSON before proceeding to blueprint. This ensures:
1. Decisions are documented and traceable
2. User can review and adjust before code
3. Blueprint has concrete values (not vibes)
4. Anti-slop checks have specific targets

The Design DNA JSON becomes the source citation in the blueprint's structured fields.
