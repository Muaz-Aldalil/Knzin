# Auth Implementation Guidance

This reference helps you add authentication to your web app. It assumes you are a frontend developer with little or no backend experience. It explains auth concepts in plain language and gives concrete recommendations for choosing and implementing auth.

---

## What auth is and why it matters

**Authentication** is how your app knows who a user is. When a user logs in, your app verifies their identity (email + password, Google login, etc.) and creates a session — a way to remember "this request is from user X" on subsequent requests.

**Why it matters:** Auth lets you build features that are user-specific — dashboards, settings, purchased content, private data, team collaboration. Without auth, every visitor sees the same thing. With auth, each user sees their own data.

**What auth is NOT:** Auth is not authorization. Auth is "who are you?" Authorization is "what are you allowed to do?" This reference focuses on authentication (knowing who the user is). Authorization (roles, permissions, access control) builds on top of auth — once you know who the user is, you can check what they're allowed to do.

**The basic auth flow:**
1. User enters credentials (email + password, or clicks "Sign in with Google").
2. Your app verifies the credentials (checks password against hashed version, or confirms with Google that the user owns the account).
3. Your app creates a session (stores a session ID in a cookie, or issues a JWT token).
4. On subsequent requests, the browser sends the session cookie/JWT, and your app knows who the user is.
5. When the user logs out, the session is destroyed.

---

## Auth options — choosing your approach

There are three main approaches to adding auth to your app:

### 1. Auth provider (managed service) — Clerk, Auth0

You use a third-party service that handles auth for you. You install their SDK, add their components or hooks, and they manage user accounts, sessions, password hashing, MFA, social login, etc.

**Clerk** — best for most apps (especially Next.js/React):
- **What it is:** A managed auth provider with pre-built UI components (SignIn, SignUp, UserButton, UserProfile), sessions, MFA, passkeys, social login, organization/multi-tenant support, user management dashboard, webhook events.
- **Why it's the default for most apps:** Fastest setup (~30-45 minutes to basic auth). Pre-built UI means you don't build login/sign-up pages. Built-in MFA, passkeys, social login. Good developer experience. Transparent pricing ($0.02/MAU after free tier; free tier covers small apps).
- **What you get:** Working auth with minimal code. You place `<ClerkProvider>` around your app, add `<SignIn />` and `<SignUp />` components where needed, use `useAuth()` hook to know who's logged in, protect routes with middleware.
- **Tradeoffs:** Cost at scale ($0.02/MAU after free tier — can add up for large apps). Vendor lock-in (you're tied to Clerk's features and pricing). Less control than building your own auth (but the control you give up is the auth plumbing you'd rather not build anyway).

**Auth0** — best for enterprise/SSO/compliance:
- **What it is:** A managed enterprise auth platform with broad provider support, SSO (SAML, OIDC, WS-Fed), MFA, passwordless, anomaly detection, user management, roles/permissions, rules/actions (serverless functions for custom logic), compliance certifications (SOC2, HIPAA, ISO, GDPR).
- **Why choose Auth0:** Enterprise deals requiring SSO. Regulated industries (healthcare, finance) needing compliance. Apps needing advanced security features. Complex identity requirements (multiple identity providers, enterprise directories).
- **Tradeoffs:** Expensive at scale. Complex (enterprise features add complexity). Overkill for small/medium apps that just need basic auth.

**When to use an auth provider:** You want to ship auth fast, don't want to build auth UI and plumbing, are okay with paying per-user (Clerk) or want enterprise features (Auth0). This is the right choice for most apps — building auth from scratch is expensive in time and risk.

### 2. Self-hosted auth library — NextAuth / Auth.js

You use a library that gives you auth building blocks. You configure providers, set up a database adapter, handle callbacks, and you build your own sign-in UI (or use minimal pre-built pages). The library handles session management, OAuth flows, JWT/session storage.

**NextAuth / Auth.js** — best for full control + lowest cost:
- **What it is:** A flexible auth library with many providers (Google, GitHub, Twitter, etc.), email/password, magic links, sessions (database or JWT), callbacks, adapters for many databases/ORMs (Prisma, Drizzle, MongoDB, etc.).
- **Why choose NextAuth:** Full control over auth. Lowest cost (free — you pay only for your infrastructure, no per-user fees). Self-hosted (no vendor lock-in). Flexible (many providers, custom flows, callbacks).
- **Tradeoffs:** More setup than Clerk (configure providers, database adapter, callbacks, build your own sign-in UI or use minimal pre-built pages). No pre-built UI components (you build the login/sign-up pages). You manage security (the library helps, but you're responsible for the implementation). More code to maintain.
- **What you get:** Flexible, self-hosted auth with your chosen providers. You own the auth implementation. Good for apps that want control and low cost, and have the time/skill to set up and maintain auth.

**When to use NextAuth:** You want full control, lowest cost, self-hosted auth, no vendor lock-in. You have the time and skill to set up and maintain auth. Your app has specific auth flow needs that managed providers don't cover well.

### 3. BaaS auth — Supabase Auth, Firebase Auth

You use auth that's part of a Backend-as-a-Service. Supabase Auth is PostgreSQL-backed and integrates with Supabase database. Firebase Auth integrates with Firebase (Firestore, Storage, etc.).

**Supabase Auth** — best when using Supabase for database:
- **What it is:** Auth integrated with Supabase — email/password, magic links, social login, phone auth (via Twilio), MFA (TOTP), user management via REST API/Realtime, integrates with Supabase database (user metadata in postgres), JWT sessions, row-level security (RLS) integration.
- **Why choose Supabase Auth:** If you're using Supabase for your database, auth is built-in and integrates naturally. User data and auth are in the same ecosystem. RLS ties auth to data access (rows are secured per user). Good DX, generous free tier (50k MAUs).
- **Tradeoffs:** Tied to Supabase (if you leave Supabase, you lose managed auth). Less control than building your own. Not as feature-rich as Clerk/Auth0 for advanced auth features.

**Firebase Auth** — best for mobile-first or Firebase ecosystem:
- **What it is:** Auth integrated with Firebase — email/password, magic links, phone auth (SMS), social login, federated identity, anonymous auth, MFA (SMS, TOTP), user management via Admin SDK, integrates with Firebase ecosystem.
- **Why choose Firebase Auth:** If you're using Firebase (Firestore, Storage, etc.), auth is built-in. Excellent mobile SDKs. Good for mobile-first apps.
- **Tradeoffs:** Tied to Firebase. NoSQL (Firestore) tradeoffs. Not as feature-rich as Clerk/Auth0 for web apps.

**When to use BaaS auth:** You're already using Supabase or Firebase for your database and want auth in the same ecosystem. You want a simple managed auth without a separate auth provider.

### 4. Custom auth — Lucia, custom sessions/JWT

You build auth yourself using a library (Lucia) or from scratch (custom sessions/JWT). You control everything: user model, session model, password hashing, session creation/validation, cookies, tokens.

**Lucia** — best for custom session-based auth with full control:
- **What it is:** A lightweight, framework-agnostic session/auth library. You define the user model and session model. Works with any database/ORM. Gives you full control over auth flow, session storage, validation. Supports cookie-based sessions, database-backed sessions.
- **Why choose Lucia:** Custom session-based auth with full control. Lightweight, not tied to a specific framework. You own the auth implementation. Good middle ground between building everything from scratch and using a full auth provider.
- **Tradeoffs:** More work than Clerk/NextAuth. You build the auth flow: sign-up, sign-in, password hashing, session creation/validation, cookies, logout. More code to maintain. Full responsibility for security.

**Custom sessions/JWT** — build everything from scratch:
- **What it is:** You build everything: password hashing (bcrypt/argon2id), session management (httpOnly cookies or JWT), sign-up/sign-in flows, token generation/validation, session storage, expiry, refresh, logout, password reset, email verification, MFA (if you want it).
- **Why choose this:** Absolute control. You own everything. Rarely the right choice unless you have auth expertise and specific needs that no library/provider covers.
- **Tradeoffs:** High risk if you're not experienced with auth security. You're responsible for password hashing, session management, CSRF protection, timing attacks, token security, cookie security, password reset flows, email verification, MFA. High development cost. High maintenance cost. High security risk if implemented incorrectly.

**When to use custom auth:** You need absolute control and have the expertise to implement auth securely. Rarely recommended for teams without auth expertise. Custom auth is more work and more risk than using a provider or library.

---

## Recommendations — what to choose

| Your situation | Recommendation |
|---|---|
| Most apps (SaaS, dashboards, marketplaces, any app that wants login fast) | **Clerk** — fastest setup, pre-built UI, built-in MFA/passkeys/social login, good DX, transparent pricing |
| Want full control + lowest cost + self-hosted, have time/skill to set up and maintain | **NextAuth / Auth.js** — flexible, free, self-hosted, no vendor lock-in, but more setup and no pre-built UI |
| Enterprise app needing SSO, compliance (healthcare, finance), advanced security | **Auth0** — SSO, compliance certifications, advanced security features, but expensive and complex |
| Using Supabase for database | **Supabase Auth** — auth in the same ecosystem, RLS integration, good DX, generous free tier |
| Using Firebase (Firestore, etc.) or mobile-first | **Firebase Auth** — auth in Firebase ecosystem, excellent mobile SDKs |
| Want custom session-based auth with full control, but don't want to build everything from scratch | **Lucia** — lightweight, framework-agnostic, full control over session/auth, works with any database/ORM |
| Have auth expertise and absolutely need custom auth | **Custom sessions/JWT** — full control, but high risk and high effort; rarely recommended |

**Default recommendation:** Start with **Clerk** for most apps. It's the fastest path to working auth with pre-built UI, built-in MFA/passkeys/social login, and good DX. If Clerk doesn't fit (you need full control, lowest cost, self-hosted, no vendor lock-in), use **NextAuth**. If you need enterprise SSO/compliance, use **Auth0**. If you're using Supabase or Firebase, use their built-in auth.

---

## How auth fits into your app — implementation patterns

Regardless of which auth approach you choose, here's how auth fits into a typical web app:

### 1. Install and configure the auth provider/library

**Clerk example:**
```bash
npm install @clerk/nextjs
```
```typescript
// app/providers.js or app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```
```typescript
// middleware.ts — protect routes
import { authMiddleware } from "@clerk/nextjs";
export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"] // routes that don't require auth
});
export const config = { matcher: ["/((?!.*\\\\?.*(?_next)).*)", "/", "/(api|trpc)(.*)"] };
```

**NextAuth example:**
```bash
npm install next-auth
```
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@nextauth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })],
  // session: "database" (via adapter) or "jwt"
});
export { handler as GET, handler as POST };
```

### 2. Protect routes (only logged-in users can access)

**Clerk:** Use `authMiddleware` in `middleware.ts` to redirect unauthenticated users away from protected routes. Or use `<Protect>` component in your app.

**NextAuth:** Use middleware or a wrapper component that checks `useSession()` and redirects if no session.

### 3. Show sign-in/sign-up UI

**Clerk:** Use pre-built components:
```tsx
import { SignIn, SignUp, UserButton, UserProfile } from "@clerk/nextjs";

// In your app
<SignIn /> // pre-built sign-in page/component
<SignUp /> // pre-built sign-up page/component
<UserButton /> // user avatar dropdown (sign out, manage account)
<UserProfile /> // full user management page
```

**NextAuth:** Build your own sign-in/sign-up pages, or use the minimal pre-built pages at `/api/auth/signin` and `/api/auth/signup`. You call `signIn()` from `next-auth/react` to initiate login.

### 4. Know who's logged in (in your components)

**Clerk:**
```tsx
import { useAuth, useUser } from "@clerk/nextjs";

function MyComponent() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  if (!isSignedIn) return <p>Please sign in</p>;
  return <p>Welcome, {user?.firstName}</p>;
}
```

**NextAuth:**
```tsx
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <p>Please sign in</p>;
  return <p>Welcome, {session.user?.name}</p>;
}
```

### 5. Link auth user to your database

Auth providers manage user accounts, but you usually want user data in your own database (profile info, preferences, orders, posts, etc.). Link the auth user to your database:

**With Clerk:** Clerk gives you a `userId`. Store it in your database's `users` table:
```prisma
model User {
  id          String   @id @default(cuid())
  clerkId    String   @unique // Clerk user ID
  email      String
  name       String?
  // ... your user data
  orders      Order[]
}
```
When a user logs in, look up their record by `clerkId`. If they don't have one yet, create it (on first login).

**With NextAuth:** NextAuth stores users in your database (via the adapter). Your `User` model is the NextAuth user. Add your own fields to it, or link to a separate `Profile` model.

### 6. Handle auth events (optional)

**Clerk:** Webhook events for user creation, deletion, updates, etc. Use these to keep your database in sync with Clerk user data.

**NextAuth:** Callbacks (e.g., `onSignIn`, `onSignOut`) in the NextAuth config. Use these to trigger actions on login/logout.

---

## Security basics — what auth providers handle vs. what you handle

Auth providers (Clerk, Auth0) and libraries (NextAuth) handle most of the security plumbing. Here's what's handled for you and what you need to know:

**Handled by auth providers/libraries:**
- **Password hashing:** Stored passwords are hashed (bcrypt, argon2, etc.) — never plain text. You don't handle this with a provider; the provider manages it.
- **Session management:** Sessions are created, stored, validated, expired. httpOnly cookies, secure flags, session rotation — handled by the provider/library.
- **OAuth flows:** The OAuth dance (redirect to Google, get code, exchange for token, create session) is handled by the provider/library.
- **CSRF protection:** Most auth libraries handle CSRF for their forms and endpoints.
- **MFA:** Built-in (Clerk, Auth0) or you implement it (NextAuth — you add MFA via extensions or custom code).

**You handle (regardless of provider/library):**
- **Protecting your routes:** Ensure only authenticated users can access protected pages/routes. Use middleware or component-level checks.
- **Linking auth user to your database:** Store the user's auth ID (Clerk userId, NextAuth user ID) in your database and link your data to it.
- **Authorization:** Once you know who the user is, check what they're allowed to do (roles, permissions, ownership). Auth providers handle authentication; authorization is your responsibility.
- **Data access in your API:** When your backend receives a request, verify the user is authenticated and authorized before returning data. Don't trust client-side auth state alone — verify on the server.
- **Secure your environment variables:** Auth provider secrets (Clerk publishable/key secrets, NextAuth secrets, OAuth client IDs/secrets) go in environment variables, never in code.

---

## Quick decision guide

| Question | Answer | Recommendation |
|---|---|---|
| Want auth up fast with pre-built UI? | Yes | **Clerk** |
| Want full control and lowest cost, self-hosted? | Yes | **NextAuth / Auth.js** |
| Need enterprise SSO / compliance? | Yes | **Auth0** |
| Already using Supabase for database? | Yes | **Supabase Auth** |
| Already using Firebase / mobile-first? | Yes | **Firebase Auth** |
| Want custom session-based auth, full control, don't want to build from scratch? | Yes | **Lucia** |
| Have auth expertise, need absolute custom auth? | Yes | **Custom sessions/JWT** (rare) |
| Building a simple app, don't need auth? | Yes | No auth — public-only app |

---

## What's next

- **Database** — `references/database.md` for choosing and setting up your database (PostgreSQL + Prisma recommended).
- **Payments** — `references/payments.md` for integrating Stripe or PayPal (checkout flows, webhooks, what to store).
- **Backend structure** — `references/backend.md` for how to structure your backend and connect it to the frontend.
- **Deployment** — `references/deployment.md` for deploying your full-stack app (frontend + backend + database + secrets).
