---
name: nextjs-fullstack
description: >-
  Enterprise architectural engineering skill for Next.js 15+ and React 19 App Router applications.
  Enforces Server vs Client Component boundaries, Turbopack performance, Server Actions security,
  Suspense streaming, partial prerendering (PPR), and Tailwind CSS v4 styling rules.
compatibility: Next.js 14+, 15+, React 19, TypeScript 5.5+.
---

# Next.js 15+ & React 19 Full-Stack Engineering (SKILL.md)

## 1. Status & Purpose
This skill establishes enterprise engineering standards for modern Next.js 15+ App Router web applications. It governs component boundary design (RSC vs RCC), streaming architecture, secure Server Actions, caching semantics, and bidirectional Tailwind CSS styling.

---

## 2. Core Architectural Invariants

### 2.1 Server Components by Default (RSC vs RCC Boundary)
- Every component is a React Server Component (RSC) by default.
- ONLY add `"use client"` when the component strictly requires:
  1. Browser event listeners (`onClick`, `onChange`, `onKeyDown`).
  2. React state or lifecycle hooks (`useState`, `useEffect`, `useReducer`, `useRef`).
  3. Custom client hooks (`useAdminUsers`, `useCheckout`, `useRouter`, `usePathname`).
  4. Browser-only Web APIs (`localStorage`, `window`, `navigator.clipboard`).
- **Leaf-Node Client Components**: Push `"use client"` down to the smallest possible leaf nodes to maximize server-rendered HTML payload.

### 2.2 Streaming & Suspense Boundaries
- Wrap slow or async data-fetching components in `<Suspense fallback={<Skeleton />}>` to enable immediate TTFB (Time to First Byte):
  ```tsx
  import { Suspense } from "react";
  import { ProductGrid, ProductGridSkeleton } from "@/components/products";

  export default function ShopPage({ searchParams }: PageProps) {
      return (
          <main className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Catalog</h1>
              <Suspense fallback={<ProductGridSkeleton />}>
                  <ProductGrid query={searchParams} />
              </Suspense>
          </main>
      );
  }
  ```

### 2.3 Server Actions & Security Discipline
- In Next.js 15+, Server Actions are public POST endpoints. They MUST adhere to:
  1. **Server-Derived Auth**: Never accept `userId`, `role`, or `tenantId` from arguments. Derive inside the action via `await auth()`.
  2. **Anti-IDOR Scoping**: Query databases with `{ where: { id, userId } }`.
  3. **Schema Validation**: Parse inputs using `schema.safeParse()`.
  4. **Sanitized Error Boundaries**: Never leak internal exception messages or stack traces to client callers.
  ```tsx
  "use server";

  import { auth } from "@/lib/auth";
  import { updateProfileSchema } from "@/lib/schemas/user";

  export async function updateProfileAction(rawInput: unknown) {
      const session = await auth();
      if (!session?.user?.id) {
          return { success: false, error: "Unauthorized" };
      }

      const parsed = updateProfileSchema.safeParse(rawInput);
      if (!parsed.success) {
          return { success: false, errors: parsed.error.flatten() };
      }

      try {
          const updated = await prisma.user.update({
              where: { id: session.user.id },
              data: parsed.data
          });
          return { success: true, data: updated };
      } catch (err) {
          console.error("Profile update error:", err);
          return { success: false, error: "An unexpected error occurred." };
      }
  }
  ```

### 2.4 Tailwind CSS v4 & Bidirectional RTL Integrity
- In Tailwind v4, `@theme` in CSS replaces `tailwind.config.js`.
- Always use CSS Logical Properties:
  - `ms-*` / `me-*` instead of `ml-*` / `mr-*`
  - `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
  - `text-start` / `text-end` instead of `text-left` / `text-right`
  - `inset-inline-start-*` instead of `left-*`
- Ensures automatic layout mirroring between Arabic (`dir="rtl"`) and English (`dir="ltr"`).

### 2.5 Caching & Revalidation (Next.js 15 Fetch Semantics)
- In Next.js 15, `fetch()` requests default to `no-store` (uncached).
- Explicitly declare cache strategies when static caching or ISR is desired:
  ```ts
  // Tagged on-demand revalidation
  const res = await fetch("https://api.example.com/products", {
      next: { tags: ["products"], revalidate: 3600 }
  });
  ```
- Use `revalidateTag("products")` or `revalidatePath("/shop")` inside Server Actions after state mutations.
