# API Patterns — Pagination, Optimistic Updates, Retry & Race Conditions

Load when your app communicates with a backend beyond simple GET requests.

---

## Pagination

### Offset vs Cursor

| Aspect | Offset (`?page=2&limit=20`) | Cursor (`?after=id_abc&limit=20`) |
|---|---|---|
| Stable under insert | No — new items shift pages | Yes — cursor points to a fixed item |
| Skip/jump to page | Trivial | Requires mapping table |
| Infinite scroll | Awkward (need page count) | Natural (next cursor in response) |
| Database perf | Slow on large offset | Fast (index seek) |

**Rule:** Use cursor for infinite scroll and real-time feeds. Use offset for admin tables with "Jump to page 50".

### Cursor response shape
```typescript
{
  data: Item[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### Infinite scroll hook
```typescript
function useInfiniteScroll<T>(fetchFn: (cursor: string | null) => Promise<...>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const res = await fetchFn(cursor);
    setItems((prev) => [...prev, ...res.data]);
    setCursor(res.nextCursor);
    setLoading(false);
  }

  return { items, loadMore, loading, hasMore: cursor !== null };
}
```

---

## Optimistic Updates

```typescript
async function updateTodo(id: string, data: Partial<Todo>) {
  // 1. Update cache immediately
  queryClient.setQueryData(['todos'], (old: Todo[]) =>
    old.map((t) => (t.id === id ? { ...t, ...data } : t))
  );

  try {
    // 2. Send to server
    await api.updateTodo(id, data);
  } catch {
    // 3. Rollback on error
    queryClient.invalidateQueries(['todos']);
    showToast('Update failed, reverting...');
  }
}
```

**Rules:**
- Always rollback on error, never leave stale data
- Use idempotency keys for mutation retry (`Idempotency-Key` header)
- Disable the mutated field during pending (show spinner or dim)

---

## Request Deduplication

```typescript
const pendingRequests = new Map<string, Promise<any>>();

async function dedupedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) return pendingRequests.get(key)!;

  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

// Usage: multiple components mount at once, all call dedupedFetch('users', fetchUsers)
// Only one network request fires. All share the result.
```

---

## Retry with Backoff

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 3, baseDelay: 1000 }
): Promise<T> {
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === options.maxRetries) throw err;
      // Don't retry 4xx errors
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err;
      // Exponential backoff + jitter
      const delay = Math.min(options.baseDelay * Math.pow(2, attempt), 10000);
      const jitter = Math.random() * delay;
      await new Promise((r) => setTimeout(r, delay + jitter));
    }
  }
  throw new Error('Unreachable');
}
```

**Rules:**
- Retry only on 5xx and network errors — never on 4xx
- Exponential backoff capped at 10s
- Add jitter to avoid thundering herd
- Max retries: 3 for normal ops, 5 for critical (auth refresh)

---

## Race Condition Handling

```typescript
function useSafeQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    fetcher().then((result) => {
      if (id === requestId.current) setData(result);
      // Stale responses are silently dropped
    });
  }, [key]);

  return data;
}
```

### AbortController pattern
```typescript
function useAbortableQuery(key: string, url: string) {
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => controller.abort(); // cancel on unmount
  }, [url]);
}
```

---

## Modern Framework Data Patterns (RSC / Server Actions / Streaming)

Load when using Next.js App Router, Nuxt, Astro, or SvelteKit. These replace or complement client-side fetch for data-heavy apps.

### React Server Components (RSC)

- **Fetch where the data lives**: do the initial data read in a Server Component (no client round-trip, no waterfall for the first paint). Pass plain serializable props to Client Components.
- **"use client" is a boundary, not the default**: only mark components interactive (state, effects, event handlers) as client. Everything else stays on the server.
- **Never** fetch secrets or call privileged APIs from a Client Component — it ships to the browser.

```tsx
// app/dashboard/page.tsx  (Server Component — runs on the server)
import { getDashboardData } from '@/services/dashboard';

export default async function DashboardPage() {
  const data = await getDashboardData();   // direct DB/service call, no HTTP hop
  return <DashboardGrid initial={data} />; // plain serializable props only
}
```

### Server Actions (mutations)

- Mutations live server-side; the client calls a typed action. No manual fetch, no JSON ceremony for simple cases.
- **Security rule:** Server Actions are endpoints — validate input server-side, enforce ownership/authorization on every action, and use a CSRF-safe transport (framework default) — never trust the client.
- Use `useOptimistic` for instant UI feedback with automatic rollback.

```tsx
'use server';
import { z } from 'zod';

const schema = z.object({ title: z.string().min(1).max(200) });

export async function renameTodo(id: string, formData: FormData) {
  const parsed = schema.safeParse({ title: formData.get('title') });
  if (!parsed.success) return { error: 'Title is required' };
  await db.todo.update({ id, title: parsed.data.title }); // server-side authz check here
  return { ok: true };
}
```

```tsx
// Client component using the action with optimistic UI
const [optimisticTitle, addOptimistic] = useOptimistic(todo.title);
<form action={async (fd) => { addOptimistic(fd.get('title')); await renameTodo(todo.id, fd); }}>
```

### Streaming & Partial Rendering

- **Next.js**: wrap slow sections in `<Suspense>` boundaries to stream skeletons while data loads — instant TTFB, progressive paint, no blocking waterfall.
- **Nuxt**: split layout into islands (`<template #id>` / lazy components) so only interactive parts hydrate.
- **Astro**: every component is an island by default — pass `client:load` / `client:visible` for interactive islands, keep the rest as static HTML (zero JS).
- **SvelteKit**: use `load` streaming + `await promise()` for progressive hydration.
- **Rule:** one Suspense boundary per logical data region, not one giant boundary around the page.

### Framework-native fetch helpers

| Stack | Primitive | When |
|---|---|---|
| Next.js | `fetch` in Server Components + `revalidatePath`/`revalidateTag` | Stale-while-revalidate caching for public data |
| TanStack Query | `queryClient.prefetchInfiniteQuery` | Cursor feeds rendered server-side |
| Nuxt | `useAsyncData` + `useFetch` | SSR-safe data fetching with dedup |
| SvelteKit | `+page.server.ts` `load` | Server data with built-in caching |
| Astro | `Astro.props` + Content Collections | Content-centric pages, zero client JS |

**Rule:** choose the framework-native primitive first; drop to a client query library only for client-heavy interactive data (filters, optimistic mutation-heavy UIs).

---

## Phase 5 Checklist
- [ ] Pagination strategy chosen (cursor for feeds, offset for tables)
- [ ] Optimistic updates implemented with rollback on error
- [ ] Request deduplication for overlapping same-endpoint calls
- [ ] Retry with exponential backoff + jitter configured (5xx only)
- [ ] Race condition protection (abort stale requests / request ID check)
- [ ] Loading, empty, error states handled per data fetch
- [ ] RSC/SSR chosen over client fetch where data can render server-side
- [ ] Server Actions (if used): input validated + ownership enforced server-side, never trusted client
- [ ] Slow sections wrapped in Suspense/island boundaries for streaming
