# Full-Stack Deployment Guidance

This reference helps you deploy a full-stack web app — frontend, backend, database, and secrets. It assumes you are a frontend developer with little or no backend experience. It explains deployment concepts in plain language and gives concrete recommendations for common deployment topologies.

---

## What deployment is and why it matters

**Deployment** is putting your app on the internet so people can use it. For a full-stack app, deployment means:
- **Frontend:** Hosting the frontend (HTML, CSS, JavaScript, React components, etc.) so it's accessible at a URL.
- **Backend:** Hosting the backend (API routes, Server Actions, separate server) so it can receive requests and process them.
- **Database:** Hosting the database (PostgreSQL, etc.) so the backend can connect to it and store/retrieve data.
- **Secrets:** Managing environment variables and secrets (database connection strings, API keys, payment provider secrets) so the app can access external services securely.

**Why it matters:** A full-stack app has more pieces than a simple frontend-only app. Each piece needs to be hosted, configured, and connected. Getting deployment right means the app is accessible, secure, and reliable. Getting it wrong means downtime, security issues, or the app not working at all.

**The basic deployment picture:**
```
User → Frontend (Vercel/Netlify) → Backend (Vercel API routes, or Railway/Render) → Database (Supabase/Neon/Vercel Postgres/Railway)
                                                              ↓
                                                  External services (Stripe, Clerk, email, etc.)
                                                              ↓
                                                  Secrets (env vars on the hosting platform)
```

---

## Default deployment topologies

### All-on-Vercel (for Next.js full-stack apps) — simplest

**What it is:** Deploy everything on Vercel — frontend, API routes, Server Actions, serverless functions, and database (Vercel Postgres, or connect to Supabase/Neon for the database). This is the simplest deployment for Next.js apps.

**How it works:**
- **Frontend + API routes + Server Actions + serverless functions:** All on Vercel. Push to Git, Vercel deploys automatically. Preview deployments for pull requests. Environment variables configured in Vercel dashboard.
- **Database:** Vercel Postgres (managed PostgreSQL on Vercel), or connect to Supabase/Neon (managed PostgreSQL elsewhere). If using Vercel Postgres, it's all on Vercel. If using Supabase/Neon, the database is on their platform, and the connection string goes in Vercel's environment variables.
- **Secrets:** All environment variables (database connection string, Stripe keys, Clerk keys, etc.) configured in Vercel dashboard. These are available to both the frontend (public vars with NEXT_PUBLIC_ prefix) and the backend/server-side (server-only vars, not exposed to client).

**When to use:** Next.js full-stack apps. This is the simplest path — everything on Vercel, automatic deployments from Git, minimal setup.

**Tradeoffs:**
- **Vercel-optimized for Next.js:** Best experience if you're using Next.js. For non-Next.js frontends, Vercel works but isn't as deeply integrated.
- **Serverless limits:** API routes run as serverless functions — execution time limits (10s on Hobby, 60s on Pro), cold starts (though Vercel optimizes), no long-running processes.
- **Database on Vercel Postgres:** Managed, but limited compared to dedicated database services (Supabase, Neon) — check if Vercel Postgres meets your needs (storage, connections, features).
- **Pricing:** Vercel's pricing scales with usage (bandwidth, serverless execution, etc.). Can be affordable for small/medium apps, expensive for high-traffic apps.

### Frontend on Vercel + Backend on Railway/Render + Database on Supabase/Neon — for separate-backend apps

**What it is:** Deploy each piece on the platform best for it:
- **Frontend:** Vercel (or Netlify) — best for frontend hosting, especially Next.js.
- **Backend:** Railway or Render — simple deployment for backend services (Node.js, Python, etc.), good developer experience, predictable pricing.
- **Database:** Supabase or Neon — managed PostgreSQL, good DX, generous free tier. Supabase adds auth/storage/realtime if needed. Neon is serverless PostgreSQL with branching.

**How it works:**
- **Frontend on Vercel:** Push to Git, Vercel deploys automatically. Environment variables for backend URL, public keys (NEXT_PUBLIC_), etc.
- **Backend on Railway/Render:** Deploy the backend (Git integration, Docker, or build command). Environment variables for database connection string, API keys, secrets. The backend connects to the database and external services.
- **Database on Supabase/Neon:** Create the database, get the connection string, add it to the backend's environment variables. The backend connects to the database via the connection string.
- **Secrets:** Environment variables on each platform — Vercel for frontend public vars, Railway/Render for backend secrets (database connection string, API keys, etc.). Never put secrets in code or frontend env vars (without NEXT_PUBLIC_ prefix).

**When to use:** Separate-backend apps — apps with a separate Node.js/Express backend (or Python, etc.) that need a long-running server, or apps that outgrew Next.js API routes. Each piece on the platform best for it.

**Tradeoffs:**
- **More pieces to manage:** Three deployments (frontend, backend, database) instead of one (all-on-Vercel). More to configure, monitor, update.
- **More environment variables to manage:** Backend URL on the frontend, database connection string on the backend, secrets on each platform. Keep track of what goes where.
- **Connection between pieces:** The frontend needs to know the backend URL (environment variable on Vercel). The backend needs to know the database connection string (environment variable on Railway/Render). Make sure these are configured correctly.

### All-on-Supabase (for BaaS apps) — minimal backend code

**What it is:** Frontend on Vercel/Netlify, everything else on Supabase — auth, database, storage, realtime, edge functions. The frontend talks directly to Supabase via the SDK (with RLS controlling access).

**How it works:**
- **Frontend on Vercel/Netlify:** Standard frontend deployment. Environment variables for Supabase URL and anon key (NEXT_PUBLIC_ for the client-side SDK).
- **Everything else on Supabase:** Database (PostgreSQL), auth, storage, realtime — all managed by Supabase. The frontend uses the Supabase SDK to interact with these services directly. RLS controls data access per user.
- **Secrets:** Supabase URL and anon key as environment variables on the frontend (NEXT_PUBLIC_ for client-side use). The anon key is public (it's used by the client SDK and is safe to expose — RLS protects the data). Any server-side secrets (if using Supabase edge functions or a separate backend) go in Supabase dashboard or the separate backend's environment variables.

**When to use:** BaaS apps — apps where auth + database + storage + realtime covers your needs, simple apps, prototypes, apps where you want minimal backend code.

**Tradeoffs:**
- **Tied to Supabase:** Less control than a separate backend. Can't implement complex backend logic that doesn't fit Supabase's model.
- **Security depends on RLS:** You must configure RLS correctly. Without RLS, any client could query any data. With RLS, each user can only access their own data (or data they're allowed to access). RLS configuration is critical.
- **Not for complex backend logic:** Custom backend processing, integrations that need a server, complex workflows — Supabase BaaS may not cover these. You can add a separate backend (e.g., Supabase Edge Functions, or a separate server) if needed.

---

## Environment variables and secrets — what goes where

**Environment variables** are values your app reads from its environment (not from code). They're used for configuration that varies by environment (development, staging, production) and for secrets that shouldn't be in code.

**Frontend (public) environment variables:**
- **Prefix:** `NEXT_PUBLIC_` (for Next.js) — these are embedded in the frontend bundle and sent to the browser.
- **What goes here:** Public values that the frontend needs — Supabase URL and anon key (safe to expose — RLS protects data), public API keys (e.g., Google Maps API key with restrictions), feature flags, public configuration.
- **What NEVER goes here:** Secrets — database connection strings, API keys with write access, payment provider secret keys, auth provider secrets. These must never be in the frontend bundle.

**Backend (server-side) environment variables:**
- **No special prefix** (or any prefix you choose) — these are available to server-side code only, never sent to the browser.
- **What goes here:** Database connection strings, API keys with write access, payment provider secret keys (Stripe secret key), auth provider secrets (Clerk secret key, NextAuth secret), webhook secrets, email provider API keys, any secret that should never be exposed to the client.
- **These are safe** because they're only available to server-side code — the frontend can't access them.

**How to manage environment variables:**
- **Local development:** `.env.local` file (gitignored) — contains your local environment variables. Create a `.env.example` file (committed to Git) with the variable names but placeholder values, so others know what variables they need.
- **Production:** Set environment variables on the hosting platform's dashboard (Vercel, Railway, Render, Supabase, etc.). Don't commit `.env` files with real secrets to Git.
- **CI/CD:** If you have CI/CD, set secrets in the CI/CD system (GitHub Actions secrets, etc.) so they're available during deployment.

**What never goes in code:**
- **Database connection strings:** Never hardcoded in code. Always in environment variables.
- **API keys with write access:** Stripe secret key, Clerk secret key, GitHub token, etc. Never in code.
- **Payment provider secrets:** Stripe webhook secret, PayPal client secret, etc. Never in code.
- **Auth provider secrets:** Clerk secret key, NextAuth secret, OAuth client secrets. Never in code.
- **Any secret:** If it would be bad if exposed (cost money, compromise security, access data), it goes in environment variables, not code.

**Practical guidance:**
- **Use `.env.local` for local dev** (gitignored). Use `.env.example` (committed) to document what variables are needed.
- **Set production variables on the hosting platform** (Vercel dashboard, Railway dashboard, etc.). Never commit real secrets to Git.
- **Prefix public vars with `NEXT_PUBLIC_`** (for Next.js). Never put secrets in public vars.
- **Keep a list of what variables are needed** (in `.env.example` or documentation) so you and your team know what to configure.

---

## Basic CI/CD — when you need it and how to set it up

**CI/CD (Continuous Integration / Continuous Deployment)** is the automated process of testing, building, and deploying your app when you push code.

**When you need CI/CD:**
- **Team size > 1:** Multiple people pushing code — CI/CD ensures changes are tested before merging and deployed consistently.
- **Frequent deploys:** You deploy often — CI/CD automates the process.
- **Need automated testing before deploy:** You want confidence that deploys don't break things — CI/CD runs tests before deploying.
- **Want consistent deployments:** CI/CD ensures every deploy goes through the same process (test, build, deploy).

**When you don't need CI/CD (yet):**
- **Solo developer, infrequent deploys:** You can deploy manually (push to Git, Vercel auto-deploys; or deploy via platform dashboard). CI/CD is nice to have but not essential.
- **Simple app, low risk:** If the app is simple and breaking changes are easy to fix, manual deploys are fine.

**Simple CI/CD setup (GitHub Actions + Vercel):**
For many apps, Vercel's built-in Git integration provides CI/CD automatically — push to Git, Vercel deploys. This is the simplest CI/CD. For more control (run tests before deploy, custom build steps), add GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**What this does:** On push to main, it checks out the code, sets up Node.js, installs dependencies, runs lint, runs tests, builds the app, and deploys to Vercel. If lint, tests, or build fail, the deploy stops — nothing broken gets deployed.

**Practical guidance:** For most apps, Vercel's built-in Git integration (push to deploy) is sufficient. Add GitHub Actions for automated testing before deploy if you want that safety net. Keep CI/CD simple — you don't need complex pipelines for a small team.

---

## Things to keep in mind as a frontend developer deploying a full-stack app

- **Frontend and backend are separate deployments (usually):** The frontend is on Vercel/Netlify, the backend is on Railway/Render/Fly.io (or Vercel if using API routes). Each has its own environment variables, its own deployment process.
- **The frontend needs to know the backend URL:** If the backend is separate, the frontend needs the backend URL (as an environment variable). On Vercel, set `NEXT_PUBLIC_API_URL` (or similar) to the backend URL.
- **The backend needs to know the database connection string:** The backend connects to the database via a connection string (environment variable on the backend's hosting platform).
- **Secrets stay on the server:** Database connection strings, API keys, secrets — these go in environment variables on the server/backend platform, never in the frontend code.
- **Public vars go in the frontend (with NEXT_PUBLIC_ prefix):** Supabase URL and anon key, public API keys — these go in the frontend's environment variables with the NEXT_PUBLIC_ prefix.
- **Test in production-like environment:** Use preview deployments (Vercel preview deployments for pull requests) to test changes before merging to production. This catches issues before they reach production.
- **Monitor after deploy:** After deploying, check that the app works — visit the URL, test key flows (login, purchase, etc.). Monitor for errors (Vercel provides error tracking, or use a service like Sentry).

---

## Quick decision guide

| Your situation | Recommendation |
|---|---|
| Next.js full-stack app, simplest deployment | **All-on-Vercel** — frontend + API routes + Server Actions + serverless functions on Vercel, database on Vercel Postgres or Supabase/Neon |
| Separate backend (Node.js/Express, Python, etc.) | **Frontend on Vercel/Netlify + backend on Railway/Render + database on Supabase/Neon** — each piece on the platform best for it |
| Simple app, want minimal backend code, auth + database + storage + realtime covers your needs | **All-on-Supabase** — frontend on Vercel/Netlify, everything else on Supabase (auth, database, storage, realtime) |
| Need in-person payments + online | **Square** for payments + appropriate hosting for frontend/backend |
| Not sure? | **All-on-Vercel** (if using Next.js) or **Frontend on Vercel + backend on Railway + database on Supabase/Neon** (if separate backend). Start simple, add complexity only when needed. |

---

## What's next

- **Database** — `references/database.md` for choosing and setting up your database (PostgreSQL + Prisma recommended).
- **Auth** — `references/auth.md` for adding authentication (Clerk recommended for most apps).
- **Payments** — `references/payments.md` for integrating Stripe or PayPal (checkout flows, webhooks, what to store).
- **Backend structure** — `references/backend.md` for how to structure your backend and connect it to the frontend.
