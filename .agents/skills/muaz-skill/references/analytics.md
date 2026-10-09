# Analytics — Event Tracking, GDPR & Privacy

Load on any public-facing site or app with user engagement tracking.

---

## Platform Decision

| Platform | Cookie-less | Self-host | Free tier | Best for |
|---|---|---|---|---|
| **Plausible** | Yes | Yes | 30 day trial | Privacy-first, simple dashboards |
| **Umami** | Yes | Yes | Unlimited (self-host) | Lightweight, full control |
| **PostHog** | Configurable | Yes | 1M events/mo | Product analytics + feature flags |
| **GA4** | No | No | Unlimited | Enterprise, ad integration |

---

## Event Taxonomy

```
Event names: snake_case, past tense
- page_view         (auto on route change)
- cta_click         (button or link)
- form_submit       (any form completion)
- signup_complete   (registration funnel)
- search_performed  (search query)
- error_occurred    (caught exceptions)
- feature_used      (specific feature engagement)

Properties per event:
- page: current URL path
- referrer: document.referrer
- user_tier: free / pro / enterprise
- event_id: unique per event (for dedup)
```

**Rule:** Never send PII (email, name, phone) as event properties. Anonymize or strip.

---

## Auto-Tracking

### Page views (React Router)
```typescript
import { useLocation } from 'react-router-dom';

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    analytics.page({ path: location.pathname });
  }, [location]);
  return null;
}
```

### Outbound links
```typescript
document.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest('a');
  if (link?.hostname !== window.location.hostname) {
    analytics.track('outbound_click', { url: link?.href });
  }
});
```

---

## Custom Events

```typescript
// Plausible
plausible('Signup', { props: { method: 'google' } });

// PostHog
posthog.capture('purchase_completed', {
  revenue: 29.99,
  currency: 'USD',
  product_id: 'prod_123',
});

// GA4
gtag('event', 'purchase', {
  value: 29.99,
  currency: 'USD',
  transaction_id: 'txn_123',
});
```

---

## GDPR Consent Flow

```typescript
// Store consent
function acceptAnalytics() {
  localStorage.setItem('consent', 'granted');
  enableAnalytics(); // init Plausible/PostHog
}

// Check on every page load
const consent = localStorage.getItem('consent');
if (consent === 'granted') {
  enableAnalytics();
} else if (!consent) {
  showCookieBanner(); // first visit
}
```

**Consent banner requirements:**
- "Accept all" + "Reject all" + "Customize" buttons
- Reject = no analytics scripts load at all
- Respect `navigator.doNotTrack`
- Store consent for 6 months, re-ask after
- Allow changing preference later (footer link)

---

## Cookie-less Analytics (Plausible / Umami)

```html
<script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>
```

No cookie banner needed. No GDPR consent required for analytics-only tracking. IP is anonymized by default. Use for landing pages, marketing sites, documentation.

---

## Phase 5 Checklist
- [ ] Analytics platform chosen and SDK initialized
- [ ] Auto page views tracked on every route change
- [ ] Custom events for key user actions (CTA, signup, purchase)
- [ ] GDPR consent banner with accept/reject
- [ ] No PII in event properties verified
- [ ] Cookie-less analytics used where possible (Plausible/Umami)
