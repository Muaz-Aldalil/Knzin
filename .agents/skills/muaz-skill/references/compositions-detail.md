# Composition Patterns — Detailed Reference

Visual structures, spacing, color strategy, and premium signals for each layout pattern. Use alongside `data/compositions.csv` (searchable) and `references/premium-design-guide.md` (brand values).

> **New patterns:** Forms, Auth, Onboarding, Navigation, Notifications, Empty States,
> and Data Display patterns are defined in `data/compositions.csv` (searchable).
> ASCII diagrams for these patterns will be added in a future update.

---

## Hero Patterns

### Split Hero Asymmetric
```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌──────────────┐  ┌──────────────────┐   │
│   │              │  │                  │   │
│   │   IMAGE      │  │   HEADLINE       │   │
│   │   (60%)      │  │   (40%)          │   │
│   │              │  │   Body text      │   │
│   │              │  │   [CTA Button]   │   │
│   └──────────────┘  └──────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Grid | 60/40 or 65/35 split |
| Section gap | 96px below |
| Image side | Product screenshot, illustration, or gradient mesh |
| Text side | Left-aligned, vertically centered |
| Mobile | Stack: image on top, text below |
| Premium signal | One column wider than the other — never 50/50. Image bleeds to edge on one side. |
| Color strategy | Image side carries visual weight; text side is clean canvas |
| Reference | Stripe homepage, Linear.app, Vercel.com |

### Full Bleed Hero with Overlay
```
┌─────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓ BACKGROUND IMAGE ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│   Gradient scrim (bottom 40%)                │
│   HEADLINE                                   │
│   Body text                                  │
│   [CTA Button]                               │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Image | Edge-to-edge, 70-90vh height |
| Scrim | Linear-gradient from transparent to 60-80% opacity at bottom |
| Text position | Bottom-left, 48-64px from edges |
| Mobile | Same layout, smaller text, reduced height |
| Premium signal | Text reads over gradient scrim, not over busy image. Scrim color matches brand. |
| Color strategy | Scrim uses brand dark or near-black with opacity |
| Reference | Apple.com product pages, Netflix.com, Spotify.com |

### Animated Text Hero
```
┌─────────────────────────────────────────────┐
│                                             │
│          The future of                      │
│          ┌─────────────┐                    │
│          │ design      │ ← morphing word    │
│          └─────────────┘                    │
│          Build faster                       │
│          [CTA Button]                       │
│                                             │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Animation | Word morphs/rotates every 3-4 seconds |
| Text size | 56-80px display |
| Animation type | Crossfade, typewriter, or slide-up per word |
| Mobile | Same animation, smaller text |
| Premium signal | Under 3 seconds per cycle. No jank on mobile. Purposeful — shows product versatility. |
| Color strategy | Animated word uses accent/primary color; rest is neutral |
| Reference | Apple.com product pages, Raycast.com |

---

## Feature Patterns

### Bento Grid
```
┌──────────────┬──────────────┐
│              │              │
│   LARGE      │   SMALL      │
│   (2x1)      │   (1x1)      │
│              │              │
├──────────────┼──────┬───────┤
│              │      │       │
│   SMALL      │  SM  │  SM   │
│   (1x1)      │      │       │
│              │      │       │
└──────────────┴──────┴───────┘
```
| Token | Value |
|---|---|
| Grid | 2-3 columns, cards span 1x or 2x |
| Card gap | 16-24px |
| Card padding | 24-32px |
| Large cards | 2x width or 2x height |
| Small cards | 1x1 uniform |
| Mobile | Single column, cards stack |
| Premium signal | Cards have DIFFERENT sizes — that's what makes it bento, not a grid. Visual hierarchy from size variation. |
| Color strategy | Cards use surface variants (#F6F9FC, #F5F5F5) or subtle tints |
| Reference | Apple.com MacBook/iPhone features, Linear.app features |

### Side-by-Side Feature
```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌──────────────┐  ┌──────────────────┐   │
│   │  IMAGE       │  │  HEADLINE        │   │
│   │  (left)      │  │  Description     │   │
│   │              │  │  [Learn more]    │   │
│   └──────────────┘  └──────────────────┘   │
│                                             │
│   ┌──────────────────┐  ┌──────────────┐   │
│   │  HEADLINE        │  │  IMAGE       │   │
│   │  Description     │  │  (right)     │   │
│   │  [Learn more]    │  │              │   │
│   └──────────────────┘  └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Layout | Alternating left/right per row |
| Image side | 40-50% width |
| Text side | 50-60% width, vertically centered |
| Section gap | 96-128px between rows |
| Mobile | Stack: image on top, text below (always) |
| Premium signal | Alternate placement per row. Don't repeat same side 3+ times. Image is product screenshot, not illustration. |
| Color strategy | Background alternates between white and surface (#F6F9FC) per row |
| Reference | Stripe.com features, Figma.com features |

---

## Pricing Patterns

### 3-Tier Grid
```
┌───────────┬───────────┬───────────┐
│           │ ★ HIGHLIGHT│           │
│  STARTER  │  PRO      │  TEAM     │
│           │           │           │
│  $9/mo    │  $29/mo   │  $99/mo   │
│           │           │           │
│  - Feature│  - Feature│  - Feature│
│  - Feature│  - Feature│  - Feature│
│           │           │           │
│  [Choose] │  [Choose] │  [Choose] │
└───────────┴───────────┴───────────┘
```
| Token | Value |
|---|---|
| Cards | 3 columns, equal width |
| Highlight | Middle card: larger, border, or color elevation |
| Card padding | 32-40px |
| Card gap | 24px |
| Annual toggle | Top of section, above cards |
| Mobile | Stack vertically, highlighted card first |
| Premium signal | Middle card is visually elevated (border, shadow, scale). Toggle for annual/monthly. Feature list below pricing. |
| Color strategy | Highlighted card uses primary color border or surface tint |
| Reference | Stripe.com pricing, Linear pricing, Vercel.com pricing |

### Feature Comparison Table
```
┌─────────────┬───────────┬───────────┬───────────┐
│  FEATURE    │  STARTER  │  PRO      │  TEAM     │
├─────────────┼───────────┼───────────┼───────────┤
│  Storage    │  10 GB    │  100 GB   │  Unlimited│
│  Users      │  1        │  10       │  Unlimited│
│  API access │  ✗        │  ✓        │  ✓        │
│  Priority   │  ✗        │  ✗        │  ✓        │
└─────────────┴───────────┴───────────┴───────────┘
```
| Token | Value |
|---|---|
| Layout | Full-width table, sticky header |
| Row height | 48-56px |
| Row gap | 1px hairline borders |
| Check marks | Use icons, not text "Yes/No" |
| Mobile | Convert to stacked cards per tier |
| Premium signal | Sticky table header. Hover highlight on rows. Specific metrics, not vague "unlimited everything". |
| Color strategy | Header row uses surface color. Alternating row tints for readability. |
| Reference | GitHub.com pricing, Atlassian pricing |

---

## Trust Patterns

### Testimonial Feature Block
```
┌─────────────────────────────────────────────┐
│                                             │
│   "This product saved us 40 hours per       │
│    month on manual reporting."              │
│                                             │
│   ┌─────┐                                   │
│   │ 📷  │  Sarah Chen                       │
│   └─────┘  VP of Engineering, Stripe        │
│                                             │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Layout | Full-width, centered, generous padding (80-120px vertical) |
| Quote size | 24-32px, serif or display font |
| Attribution | Photo (40-48px circle) + name + title + company |
| Max quote length | Under 200 characters |
| Mobile | Same layout, slightly smaller text |
| Premium signal | Real headshot (not stock). Specific metric in quote. Named person at named company. |
| Color strategy | Full-width background uses surface or brand tint |
| Reference | Apple.com customer stories, Stripe.com user stories |

### Logo Wall
```
┌─────────────────────────────────────────────┐
│                                             │
│   Trusted by                                │
│                                             │
│   [Logo] [Logo] [Logo] [Logo] [Logo]       │
│   [Logo] [Logo] [Logo] [Logo] [Logo]       │
│                                             │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Logo style | Grayscale only, uniform sizing |
| Grid | 4-6 columns, 2 rows max |
| Logo size | 80-120px width, auto height |
| Gap | 32-48px between logos |
| Mobile | 3 columns, scrollable |
| Premium signal | Grayscale prevents color clashes. No competitors' logos. recognizable brands only. |
| Color strategy | Logos at 60% opacity, full opacity on hover |
| Reference | Stripe.com customer logos, Linear.app customers |

---

## Layout Patterns

### Sidebar Navigation
```
┌────────┬──────────────────────────────┐
│ LOGO   │  Content Area                │
│        │                              │
│ Nav 1  │  ┌──────────────────────┐   │
│ Nav 2● │  │                      │   │
│ Nav 3  │  │  Main content        │   │
│ Nav 4  │  │                      │   │
│        │  │                      │   │
│        │  └──────────────────────┘   │
│ ────── │                              │
│ User   │                              │
└────────┴──────────────────────────────┘
```
| Token | Value |
|---|---|
| Sidebar width | 240-280px |
| Sidebar background | Surface or dark (matches brand) |
| Content area | Flex, fills remaining width |
| Nav items | 40-44px height, 16px text |
| Active state | Background tint or left border accent |
| Mobile | Drawer/hamburger, overlay on content |
| Premium signal | Collapsible sidebar. User info at bottom. Grouped nav items with section headers. |
| Color strategy | Sidebar uses surface1/surface2 ladder (Linear pattern) |
| Reference | Notion.so, Linear.app, Figma.com |

### Editorial Longform
```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────┐           │
│   │                             │           │
│   │  HEADLINE (48-64px)        │           │
│   │                             │           │
│   │  Body text at 680px max-   │           │
│   │  width. 17-21px. Generous  │           │
│   │  line-height (1.5-1.6).    │           │
│   │                             │           │
│   │  Pull quote in serif font.  │           │
│   │                             │           │
│   │  More body text...          │           │
│   │                             │           │
│   └─────────────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Max width | 680-720px (readability ceiling) |
| Body size | 17-21px (larger than standard 16px) |
| Line height | 1.5-1.6 for body |
| Heading size | 48-64px display |
| Section gap | 64px between sections |
| Mobile | Same max-width, slightly smaller headings |
| Premium signal | Typography IS the design. Wide body text with generous leading. Pull quotes break monotony. |
| Color strategy | Minimal — cream/warm background, dark text, one accent color for links |
| Reference | Medium.com, Substack.com, Apple Newsroom |

### Masonry Grid
```
┌──────┬──────┬──────┐
│      │      │      │
│  ██  │  ████│  ██  │
│  ██  │  ████│  ██  │
│      │  ████│      │
├──────┤      ├──────┤
│  ████│      │  ████│
│  ████│──────│  ████│
│  ████│  ██  │  ████│
│      │  ██  │      │
└──────┴──────┴──────┘
```
| Token | Value |
|---|---|
| Columns | 3-4 on desktop, 2 on tablet, 1 on mobile |
| Card width | Fixed per column (not responsive per card) |
| Card height | Varies by content |
| Gap | 16-24px |
| Mobile | Single column |
| Premium signal | Cards have varying heights but consistent widths. No strict row alignment. Content determines height. |
| Color strategy | Cards use consistent surface color; photography provides variation |
| Reference | Pinterest.com, Unsplash.com, Dribbble.com |

---

## Dashboard Patterns

### Bento Dashboard
```
┌──────────────┬──────────────────┐
│              │                  │
│   KPI CARD   │   CHART CARD     │
│   (large)    │   (large)        │
│              │                  │
├──────┬───────┼──────────────────┤
│      │       │                  │
│  SM  │  SM   │   TABLE CARD     │
│      │       │   (wide)         │
│      │       │                  │
└──────┴───────┴──────────────────┘
```
| Token | Value |
|---|---|
| Grid | 3-4 columns, mixed span |
| Card gap | 16-24px |
| Card padding | 20-24px |
| KPI cards | Large number, label, trend indicator |
| Chart cards | Full width or 2x span |
| Mobile | Stack vertically, KPIs first |
| Premium signal | Consistent card styling. Data density without clutter. Number formatting (commas, currency). |
| Color strategy | KPI cards use surface variants. Charts use brand palette. |
| Reference | Linear.app dashboard, Vercel.com analytics |

---

## CTA Patterns

### Sticky Footer CTA
```
┌─────────────────────────────────────────────┐
│  Page content scrolls here                   │
│                                             │
│  ...                                        │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  Ready to start?  [Get Started →]   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Height | 64-80px max |
| Position | Fixed bottom or sticky |
| Background | White/solid with top border or shadow |
| Content | Short copy + CTA button |
| Mobile | Same, reduced height (56px) |
| Premium signal | Only on long pages (>3 screen heights). Doesn't cover content. Subtle border or shadow separates from content. |
| Color strategy | Background matches page canvas. Button uses primary color. |
| Reference | Cal.com booking, Stripe.com pricing |

### Side CTA Block
```
┌─────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓                                         ▓▓│
│▓▓   Ready to transform your workflow?     ▓▓│
│▓▓                                         ▓▓│
│▓▓   [Start Free Trial]                    ▓▓│
│▓▓                                         ▓▓│
└─────────────────────────────────────────────┘
```
| Token | Value |
|---|---|
| Width | Full-width (breakout from container) |
| Padding | 64-96px vertical |
| Layout | Text left, CTA right (or centered) |
| Mobile | Stack vertically |
| Premium signal | Maximum 2 per page. Different background color than surrounding sections. Serves as section divider. |
| Color strategy | Uses brand primary or dark surface with white text |
| Reference | Linear.app changelog, Notion.so upgrade block |

---

## 7 Recurring Premium Patterns

1. **Alternating section backgrounds** — white → surface → white → surface (Apple, Stripe, Notion)
2. **Full-width breakouts** — CTA or image sections escape the container (Linear, Vercel)
3. **Typography as hero** — headline IS the visual, no image needed (Medium, Robinhood, Aesop)
4. **Product screenshots as proof** — show the real product, not illustrations (Linear, Vercel, Raycast)
5. **One CTA per section** — never two competing buttons in the same band
6. **96px section rhythm** — standard vertical gap between major bands
7. **Surface tint shifts for depth** — not shadows, but color temperature changes (Stripe, Linear, Apple)
