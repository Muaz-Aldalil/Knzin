# Project Brief Template

Fill this and paste as your first message. I'll skip the Q&A and go straight to building.

```
Goal        :
Stack       :
Pages       :
Users       :
Theme       :
Auth        :
Content     :
Brand       :
Languages   :
Perf budget :
Design refs :
Exclusions  :
Hard reqs   :
```

## Field guide

| Field | What to write | Example |
|---|---|---|
| **Goal** | One sentence — what does this do? | "SaaS dashboard for tracking ad campaign ROI" |
| **Stack** | Framework or toolchain | React + Vite / Next.js 15 / Astro / HTML+Tailwind / Vue / Nuxt / Angular / Svelte / Flutter |
| **Pages** | Every page or section needed | Home, Dashboard, Campaign detail, Settings, Billing |
| **Users** | Who uses it? | Admins (manage campaigns), Customers (view reports), Anonymous (landing) |
| **Theme** | Color direction | Light / Dark / Both / I have brand colors |
| **Auth** | Login method + persistence | None / Email+password (sessions) / Google SSO (OAuth+PKCE) / Magic link / Invite-only |
| **Content** | Where does text/data come from? | Static files / Headless CMS (Sanity / Strapi) / Custom API / Hardcoded |
| **Brand** | Existing assets? | Logo SVG, colors `#1e40af #f59e0b`, font Inter |
| **Languages** | i18n needs | English only / EN + AR (RTL) / Multi (which ones?) |
| **Perf budget** | Speed / size requirements | LCP < 2.5s, JS < 200KB gzip, Lighthouse >= 90 all |
| **Design refs** | Sites/apps to reference or avoid | "Like Linear's spacing, avoid Stripe's marketing pages" |
| **Exclusions** | What NOT to do | No payments, no analytics, no third-party logins, no dark mode |
| **Hard reqs** | Non-negotiable | Offline support / SEO rank #1 / Load under 1s / WCAG AAA |

If you don't know a field, leave it blank — I'll use defaults or ask.

## What NOT to include

- Don't paste API keys, tokens, or secrets — never.
- Don't send screenshots of your database schema unless it's public.
- Don't write "make it look premium" without a reference — name the product/pattern you mean.
- Don't dictate exact code details (folder names, hook names) — that's my job unless you insist.
