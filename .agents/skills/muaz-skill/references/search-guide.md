# Search Engine Guide

How to use `python scripts/search.py` for design system generation and domain lookups.

On Windows use `python`, not `python3`. Always run from the skill directory or use the full path.

---

## Design System Generation (always start here)

```bash
python scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

Searches all domains in parallel, applies reasoning rules, returns complete design system:
pattern, style, colors, typography, effects, anti-patterns, pre-delivery checklist.

**Examples:**
```bash
python scripts/search.py "SaaS dashboard fintech" --design-system -p "FinDash"
python scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"
python scripts/search.py "e-commerce luxury fashion" --design-system -p "LuxeShop"
```

### Persist to Project (Master + Overrides)

```bash
python scripts/search.py "<query>" --design-system --persist -p "Project" [--page "dashboard"]
```

Creates `design-system/<project>/MASTER.md` + `design-system/<project>/pages/<page>.md`.

When building a specific page, check `design-system/<project>/pages/[page].md` first.
If it exists → overrides MASTER.md. Otherwise → use MASTER.md exclusively.

---

## Domain Searches (supplement after design system)

```bash
python scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Domain | Use for | Example keywords |
|---|---|---|
| `product` | Product type recommendations | SaaS, e-commerce, healthcare, fintech |
| `style` | UI style options | minimalism, glassmorphism, dark mode |
| `color` | Color palettes by product type | saas, ecommerce, healthcare, beauty |
| `typography` | Font pairings | elegant, playful, professional |
| `landing` | Page structure patterns | hero-centric, conversion-optimized |
| `ux` | UX best practices + anti-patterns | animation, accessibility, navigation |
| `motion` | Motion direction patterns | cinematic, scroll-scrubbed, glass drift |
| `chart` | Chart type recommendations | trend, comparison, funnel, real-time |
| `icons` | Icon library + import lookup | lucide, heroicons, search, settings |
| `react` | React/Next.js performance tips | memo, rerender, suspense, bundle |
| `web` | App interface guidelines (iOS/Android/RN) | accessibilityLabel, touch targets |
| `google-fonts` | Individual font lookup | sans serif, variable font, noto |
| `prompt` | AI prompt keywords for styles | glassmorphism, minimalism |
| `design` | Detailed design system prompts | Bauhaus, Cyberpunk, Material, Terminal, etc. |
| `compositions` | Layout patterns and strategies | hero, bento, editorial, split, masonry |

---

## Stack-Specific Guidelines

```bash
python scripts/search.py "<keyword>" --stack <stack>
```

Available stacks: react, nextjs, vue, nuxtjs, nuxt-ui, svelte, astro, angular, laravel, html-tailwind, shadcn, swiftui, flutter, jetpack-compose, react-native, threejs

---

## Output Formats

```bash
python scripts/search.py "fintech crypto" --design-system           # ASCII box (default)
python scripts/search.py "fintech crypto" --design-system -f markdown  # Markdown
```

---

## Tips

- Use multi-dimensional keywords: `"entertainment social vibrant"` not just `"app"`
- Run `--design-system` first, then `--domain` to deep-dive any dimension
- If results are truncated, add `--max-length 0` (removes truncation limit)
- Stack files are in `data/stacks/` — `--stack` gives implementation-specific best practices
