# Feature Flags

Load when shipping unfinished features, doing gradual rollouts, or needing kill switches.

---

## Three Tiers (choose based on project size)

### Tier 1 — No library (prototype / < 5 flags)

```typescript
// config/features.ts
export const FEATURES = {
  DARK_MODE: true,
  NEW_DASHBOARD: false,
  AI_SUGGESTIONS: import.meta.env.VITE_FEATURE_AI_SUGGESTIONS === 'true',
};
```

Usage: `{ FEATURES.NEW_DASHBOARD && <NewDashboard /> }`

**Skip when:** you need per-user targeting, gradual rollout, or prod/staging differences.

### Tier 2 — Library (most projects)

| Platform | SDK |
|---|---|
| PostHog | `posthog-js` (free tier: 1M events/mo) |
| Flagsmith | `flagsmith-js` (open source) |
| LaunchDarkly | `launchdarkly-react-client-sdk` |

#### PostHog example
```typescript
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
});

// Check flag
if (posthog.isFeatureEnabled('new-dashboard')) {
  render(<NewDashboard />);
}
```

### Tier 3 — Edge / Server-side (multi-region, high scale)

Set flags as cookies at the CDN/edge level (Vercel Edge Config, Cloudflare Workers):

```typescript
// Vercel Edge Middleware
export default function middleware(request: Request) {
  const cookie = request.cookies.get('flags');
  const flags = JSON.parse(cookie?.value || '{}');
  // Add flag header, read in React Server Components
  request.headers.set('x-feature-flags', JSON.stringify(flags));
}
```

---

## Release Process

| Stage | Rollout | Duration |
|---|---|---|
| Internal | 1% of employees + dev/staging | 1-2 days |
| Beta | 10% of users + opt-in | 3-5 days |
| Gradual | 25% → 50% → 75% | 1-2 days per step |
| Full | 100% | Remove flag code after 1 week |

**Kill switch:** if error rate spikes at 10%, toggle flag OFF — no rollback deploy, no git revert.

---

## Naming Convention

```
feature-{name}-{year}  →  feature-new-dashboard-26, feature-ai-caption-26
```

One flag per feature. Remove flags older than 6 months — if a feature is stable, delete the conditional.

---

## Code Pattern

```typescript
// Keep flag logic isolated, never scattered
// BAD:
<div>{flags.newCheckout && <NewCheckout />}</div>
<button onClick={flags.newCheckout ? handleNewPayment : handlePayment}>

// GOOD: Single gateway component
function CheckoutGateway({ flags }: { flags: FeatureFlags }) {
  if (flags.newCheckout) return <NewCheckout />;
  return <LegacyCheckout />;
}
```

**Rule:** A flag should be removable by deleting exactly one file (the gateway component) plus the flag config line. No search-and-destroy across 20 files.

---

## Phase 5 Checklist
- [ ] Flags live in a single config file / service, not scattered inline
- [ ] Inactive flags don't bloat production bundle (tree-shake when possible)
- [ ] Gradual rollout plan documented for each feature flag
- [ ] Kill switch verified (toggle OFF → feature hidden, app doesn't crash)
- [ ] Stale flags scheduled for removal (6-month cleanup)
