# Backend Decision Framework

This reference helps you choose a backend approach for your web app and understand how the backend fits together. It assumes you are a frontend developer with little or no backend experience. It explains backend concepts in plain language and gives concrete recommendations for choosing and structuring a backend.

---

## What a backend is and why it matters

**A backend** is the server-side part of your app — the code that runs on a server, not in the browser. It handles things the frontend can't or shouldn't do: talking to the database, processing payments, sending emails, enforcing security, business logic that shouldn't be exposed to the client.

**Why a backend matters:** The frontend (what the user sees in the browser) is inherently insecure — anything in the browser can be inspected, modified, or bypassed. You can't trust the frontend with sensitive operations: checking if a user is allowed to do something, processing payments, accessing the database, charging a credit card. The backend is where these operations happen securely.

**What a backend does:**
- **Database access:** Queries the database, creates/updates/deletes data. The frontend doesn't connect directly to the database (usually) — the backend does.
- **Authentication/authorization:** Verifies who the user is, checks what they're allowed to do. Even if you use an auth provider (Clerk, NextAuth), your backend verifies the session/token before allowing operations.
- **Business logic:** The rules of your app — how orders are processed, how subscriptions work, how inventory is managed. This lives in the backend.
- **API endpoints:** The interface the frontend uses to talk to the backend — fetch data, create an order, update a profile, etc.
- **Integration with external services:** Payments (Stripe), emails (SendGrid, Resend), analytics, etc. The backend integrates with these services.
- **Background jobs:** Things that happen asynchronously — sending emails, processing webhooks, generating reports. These run in the backend.

**What a backend is NOT:** The backend is not the frontend. The frontend is what the user interacts with (UI, interactions, animations). The backend is what powers the app behind the scenes. They're separate concerns, even if they're in the same codebase (e.g., Next.js with API routes).

---

## Backend options — choosing your approach

### 1. Next.js API routes / Server Actions — for Next.js apps (simplest)

**What it is:** Next.js gives you API routes (files in `app/api/` or `pages/api/` that handle requests) and Server Actions (server-only functions that can be called from client components). These run on the server — Node.js or serverless — and let you do backend operations without a separate server.

**Why this is the default for Next.js apps:**
- **Simplest:** Co-located with your frontend — no separate server to deploy, manage, or monitor. You already have Next.js; API routes/Server Actions are built in.
- **No extra infrastructure:** Everything runs on Vercel (or wherever you deploy Next.js). Frontend + API routes + Server Actions on the same platform.
- **Good for most Next.js apps:** If your backend needs are moderate (CRUD operations, simple business logic, integration with external services), API routes/Server Actions are sufficient.

**Tradeoffs:**
- **Tied to Next.js:** API routes/Server Actions are Next.js-specific. Not reusable for non-Next.js frontends.
- **May outgrow them:** For complex backends with significant business logic, background jobs, websockets, etc., API routes/Server Actions may not be enough. A separate backend may be better.
- **Serverless considerations:** On Vercel, API routes run as serverless functions — cold starts (though Vercel optimizes this), execution time limits (10s on Hobby, 60s on Pro), no long-running processes.

**When to use:** Building a Next.js app with moderate backend needs (CRUD, simple business logic, external service integrations). This is the simplest path and the default for Next.js apps.

### 2. Separate Node.js/Express backend — for complex apps

**What it is:** A separate server (Node.js with Express, Fastify, Hono, etc.) that runs independently of the frontend. The frontend talks to it via HTTP (REST API, GraphQL, etc.). The backend handles database access, business logic, API endpoints, external service integrations.

**Why choose a separate backend:**
- **Independent of frontend:** The backend can serve multiple frontends (web, mobile, etc.). You can change the frontend without affecting the backend.
- **More control:** You control the server, the runtime, the deployment. Easier to scale independently, add background jobs, websockets, etc.
- **Better for complex backends:** Significant business logic, background processing, long-running tasks, websockets, high throughput — a separate backend handles these better than serverless API routes.
- **Language choice:** Node.js (JavaScript/TypeScript) is the most common, but you could use other languages (Python, Go, etc.) for the backend.

**Tradeoffs:**
- **More setup:** Separate server to deploy, manage, monitor. More infrastructure.
- **More deployment complexity:** Frontend on Vercel/Netlify, backend on Railway/Render/Fly.io/AWS — two deployments to manage.
- **More to maintain:** Separate codebase, separate deployment pipeline, separate monitoring.

**When to use:** Complex apps with significant backend logic, multiple frontends, need for independent scaling, long-running processes, websockets, or when you're not using Next.js. If your backend needs are simple, API routes/Server Actions are simpler.

### 3. Python / FastAPI — for Python shops or data-heavy apps

**What it is:** A Python backend (FastAPI, Django, Flask) that runs independently. FastAPI is modern, fast, async, with automatic OpenAPI docs and type hints. Django is a full-featured framework (ORM, admin, auth). Flask is lighter.

**Why choose Python:**
- **Python team:** Your team knows Python. Use what your team is good at.
- **Data-heavy / ML:** Your app is data-heavy or needs ML/AI capabilities. Python is the language of data/ML.
- **Different from JavaScript:** Different ecosystem, different tooling. Not the default if your team is JavaScript-focused.

**Tradeoffs:** Python runtime — different from JavaScript/TypeScript. Different ecosystem, different tooling. Need Python hosting (or serverless Python).

**When to use:** Your team uses Python, your app is data-heavy or needs ML, or you prefer Python for the backend.

### 4. Laravel — for PHP shops

**What it is:** A PHP framework (Laravel) with built-in ORM (Eloquent), authentication, queues, validation, testing, good developer experience. A full-stack framework — batteries included.

**Why choose Laravel:**
- **PHP team:** Your team knows PHP/Laravel.
- **Rapid development:** Laravel's built-in features (auth, ORM, queues, etc.) enable rapid development.
- **Full-stack framework:** Good if you like Laravel's conventions and want a framework that covers a lot.

**Tradeoffs:** PHP runtime — different from JavaScript/TypeScript. Different ecosystem. Opinionated — good if you like Laravel's conventions, less ideal if you want minimal setup.

**When to use:** Your team uses PHP/Laravel, or you want a full-stack framework with batteries included.

### 5. Serverless functions (Vercel, Cloudflare) — for sporadic workloads

**What it is:** Functions that run on-demand, scale automatically, pay per execution. Vercel functions (integrate with Next.js, easy to deploy). Cloudflare Workers (edge runtime, very fast, low cost, different runtime — Web APIs / Cloudflare-specific APIs, not Node.js).

**Why choose serverless functions:**
- **Sporadic/low-volume workloads:** Webhooks, scheduled jobs (cron), lightweight APIs, event-driven tasks. Pay-per-use is cost-effective.
- **Event-driven tasks:** Things that happen in response to events (webhook received, scheduled time, etc.).
- **Low maintenance:** No server to manage. Platform handles scaling, availability.

**Tradeoffs:**
- **Cold starts:** (Though Vercel optimizes this; Cloudflare Workers have near-zero cold starts.)
- **Execution time limits:** Vercel: 10s on Hobby, 60s on Pro. Cloudflare: 10ms-30s depending on plan. Not for long-running tasks.
- **Not for high-throughput consistent traffic:** Serverless is cost-effective for sporadic workloads; for consistent high traffic, a long-running server may be more cost-effective.
- **Vendor lock-in:** Vercel or Cloudflare-specific features.

**When to use:** Sporadic workloads, webhooks, scheduled jobs, lightweight APIs, event-driven tasks. Good for offloading specific tasks from your main backend.

### 6. Supabase BaaS — for simple apps

**What it is:** A Backend-as-a-Service — PostgreSQL database, auth, file storage, real-time subscriptions, edge functions, auto-generated APIs (REST + GraphQL via PostgREST), row-level security (RLS). The frontend talks directly to Supabase via the SDK — no separate backend server needed for many use cases.

**Why choose Supabase BaaS:**
- **Simple apps:** Auth + database + storage + realtime in one. Minimal backend code.
- **Less backend code:** The BaaS covers many needs — you write less backend code.
- **Good for prototypes, small apps:** Fast to start, covers the basics.

**Tradeoffs:**
- **Less control:** Tied to Supabase's features and limits. Can't implement complex backend logic that doesn't fit Supabase's model.
- **Vendor lock-in:** Though data is standard PostgreSQL (you can migrate the data), you lose managed features if you leave.
- **Security depends on RLS:** You must configure RLS correctly to protect data. RLS controls data access per user — if configured incorrectly, data can be exposed.
- **Not for complex business logic:** Custom backend processing, integrations that need a server, complex workflows — Supabase BaaS may not cover these.

**When to use:** Simple apps, prototypes, apps where auth + database + storage + realtime covers your needs. Good starting point — you can add a separate backend later if you outgrow the BaaS.

---

## How to choose — a simple decision framework

| Your situation | Recommendation |
|---|---|
| Building a Next.js app, backend needs are moderate (CRUD, simple business logic, external integrations) | **Next.js API routes / Server Actions** (simplest, built-in) |
| Building a complex app with significant backend logic, multiple frontends, need independent scaling, long-running processes, websockets | **Separate Node.js/Express backend** (more control, better for complex backends) |
| Building a simple app, want minimal backend code, auth + database + storage + realtime covers your needs | **Supabase BaaS** (minimal backend code, fast to start) |
| Sporadic workloads, webhooks, scheduled jobs, lightweight APIs | **Serverless functions** (Vercel or Cloudflare — pay per execution, low maintenance) |
| Team uses Python, app is data-heavy or needs ML | **Python / FastAPI** (use what your team knows) |
| Team uses PHP/Laravel, want a full-stack framework | **Laravel** (batteries included, rapid development) |
| Not sure? | **Start with Next.js API routes / Server Actions** (if using Next.js) or **Supabase BaaS** (if you want minimal backend code). You can add a separate backend later if you outgrow them. |

**Default recommendation:** If you're using Next.js, start with **Next.js API routes / Server Actions** — simplest, built-in, no extra infrastructure. If your backend needs are simple and you want minimal code, consider **Supabase BaaS**. If your app is complex or you're not using Next.js, use a **separate Node.js/Express backend**. You can always add a separate backend later if API routes/Server Actions or Supabase don't cover your needs.

---

## How the backend connects to the frontend

The backend exposes an interface the frontend uses to talk to it. The three main patterns:

### REST API (most common)

**What it is:** The frontend makes HTTP requests (GET, POST, PUT, DELETE) to the backend's API endpoints. The backend returns data (usually JSON). This is the most common pattern.

**How it works:**
- Backend defines routes: `GET /api/users`, `POST /api/orders`, `PUT /api/profile`, etc.
- Frontend calls these routes: `fetch("/api/users")`, `fetch("/api/orders", { method: "POST", body: ... })`.
- Backend processes the request (validates, checks auth, queries database, applies business logic) and returns a response.

**Example:**
```typescript
// Frontend — fetch users from backend
const response = await fetch("/api/users");
const users = await response.json();

// Backend — API route (Next.js API route or separate backend)
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  return NextResponse.json(users);
}
```

### Server Actions (Next.js-specific)

**What it is:** Server-only functions that can be called directly from client components. Instead of creating an API endpoint and calling it with fetch, you define a server function and call it like a regular function from the client.

**How it works:**
- Define a server action: `"use server"` at the top of a function file or function.
- Call it from a client component: `await createOrder(formData)`.
- The function runs on the server — it can access the database, process payments, etc.

**Example:**
```typescript
// app/actions/orders.ts
"use server";
import { prisma } from "@/lib/prisma";

export async function createOrder(formData: FormData) {
  const userId = await getCurrentUserId(); // from session
  const productId = formData.get("productId") as string;
  const quantity = Number(formData.get("quantity"));

  await prisma.order.create({
    data: {
      userId,
      items: { create: { productId, quantity, price: /* ... */ } }
    }
  });
}
```
```tsx
// Client component — call the server action
import { createOrder } from "@/app/actions/orders";

function OrderForm() {
  return (
    <form action={createOrder}>
      <input name="productId" defaultValue="abc" />
      <input name="quantity" defaultValue="1" />
      <button type="submit">Order</button>
    </form>
  );
}
```

**Why Server Actions are nice:** Less boilerplate than REST API — no need to define an endpoint and call it with fetch. The function is called directly. Good for form submissions and data mutations.

### BaaS client SDK (Supabase, Firebase)

**What it is:** The frontend talks directly to the BaaS (Supabase, Firebase) via their client SDK. No separate backend server for many operations — the frontend queries the database, authenticates, uploads files, etc., directly via the SDK.

**How it works:**
```typescript
// Supabase — query users directly from the frontend
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const { data: users, error } = await supabase.from("users").select("*");
```

**Tradeoffs:** The frontend talks directly to the database (via the BaaS). This is both a feature (less backend code) and a limitation (less control, security depends on RLS). You must configure RLS correctly — without RLS, any client could query any data. With RLS, each user can only access their own data (or data they're allowed to access).

---

## Basic backend structure — how to organize your code

If you have a separate backend (Node.js/Express, Python/FastAPI, etc.), here's a common structure:

```
backend/
├── src/
│   ├── api/              # API routes/endpoints
│   │   ├── users.ts      # GET/POST /api/users
│   │   ├── orders.ts     # GET/POST /api/orders
│   │   └── ...
│   ├── services/         # Business logic (the "what the app does")
│   │   ├── order-service.ts  # order processing logic
│   │   ├── payment-service.ts # payment handling logic
│   │   └── ...
│   ├── models/           # Data access (database queries)
│   │   ├── user-model.ts     # queries for users
│   │   ├── order-model.ts    # queries for orders
│   │   └── ...
│   ├── middleware/       # Cross-cutting concerns
│   │   ├── auth.ts           # auth verification
│   │   ├── error-handler.ts  # error handling
│   │   └── ...
│   └── ...
├── prisma/
│   └── schema.prisma     # Database schema (if using Prisma)
├── .env                  # Environment variables (gitignored)
└── package.json
```

**What goes where:**
- **API routes (`/api`):** The endpoints the frontend calls. Handle the HTTP request, validate input, call the service, return the response. Keep them thin — they should delegate to services, not contain business logic.
- **Services (`/services`):** The business logic — what the app actually does. Order processing, payment handling, user management. This is where the real logic lives. Services are called by API routes (and sometimes by other services).
- **Models / data access (`/models`):** Database queries — Prisma Client calls, data access layer. Separates database access from business logic. Services call models to query the database.
- **Middleware (`/middleware`):** Cross-cutting concerns — auth verification (check the request is from an authenticated user), error handling (catch errors and return proper responses), logging, etc. Middleware runs before the request reaches the handler.

**Why this structure:** Separation of concerns. API routes handle HTTP, services handle business logic, models handle data access, middleware handles cross-cutting concerns. Each layer has a clear responsibility. This makes the code easier to understand, test, and maintain.

**For Next.js API routes / Server Actions:** The structure is similar, but co-located with the frontend. API routes in `app/api/`, Server Actions in `app/actions/`. Services and models can be in shared directories (e.g., `lib/services/`, `lib/models/`) that both the frontend and backend use.

---

## Things to keep in mind as a frontend developer

- **Auth is server-side:** Even if you use an auth provider (Clerk, NextAuth), your backend verifies the session/token before allowing operations. Don't trust the frontend alone — verify on the server.
- **Database access is server-side:** The frontend doesn't connect directly to the database (usually). The backend does. (Exception: BaaS like Supabase, where the frontend talks to the database via the SDK — but then RLS controls access.)
- **Secrets stay on the server:** API keys, database connection strings, payment provider secrets — these go in environment variables on the server, never in the frontend code.
- **Validation happens on the server:** Validate input on the server, not just the frontend. The frontend can be bypassed. Server-side validation is the real validation.
- **Error handling is server-side:** Handle errors on the server and return proper error responses. Don't expose internal errors to the frontend — return user-friendly error messages.
- **Logging:** Log important events (requests, errors, payment events) on the server. This helps with debugging and monitoring.

---

## What's next

- **Database** — `references/database.md` for choosing and setting up your database (PostgreSQL + Prisma recommended).
- **Auth** — `references/auth.md` for adding authentication (Clerk recommended for most apps).
- **Payments** — `references/payments.md` for integrating Stripe or PayPal (checkout flows, webhooks, what to store).
- **Deployment** — `references/deployment.md` for deploying your full-stack app (frontend + backend + database + secrets).
