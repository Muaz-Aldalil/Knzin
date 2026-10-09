# Error Monitoring & Real User Monitoring (RUM)

Load on any project with external service dependencies.

---

## Platform Setup

| Platform | SDK | Init location |
|---|---|---|
| **Sentry** | `@sentry/react` / `@sentry/vue` / `@sentry/angular` / `@sentry/nextjs` | App entry point (main.tsx, _app.tsx, main.js) |
| **Datadog RUM** | `@datadog/browser-rum` | Browser monitoring init in `<head>` |
| **LogRocket** | `logrocket` | App entry, after auth check |
| **PostHog** | `posthog-js` | App entry point |

### Common init pattern (React)
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // development / staging / production
  tracesSampleRate: 0.2, // 20% of transactions for performance
  replaysSessionSampleRate: 0.1, // 10% session replays
  replaysOnErrorSampleRate: 1.0, // 100% on error
  beforeSend(event) {
    // Strip PII before sending
    if (event.user) delete event.user.email;
    if (event.request?.headers) delete event.request.headers['Authorization'];
    return event;
  },
});
```

### Core Web Vitals RUM (no SDK, minimal)
```html
<script>
  if ('performance' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        navigator.sendBeacon('/analytics', JSON.stringify({
          name: entry.name,
          value: entry.startTime,
          rating: entry.startTime < 2500 ? 'good' : entry.startTime < 4000 ? 'needs-improvement' : 'poor'
        }));
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }
</script>
```

---

## Error Boundary Pattern (React)

```typescript
import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Vue
```typescript
// errorCaptured hook in parent component
app.config.errorHandler = (err, _vm, info) => {
  Sentry.captureException(err, { extra: { info } });
};
```

### Angular
```typescript
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any) {
    Sentry.captureException(error.originalError || error);
  }
}
```

---

## Source Map Upload

### Sentry CLI (after build)
```bash
sentry-cli sourcemaps inject ./dist
sentry-cli sourcemaps upload --org=<org> --project=<project> ./dist
```

**CI integration:** Add after `npm run build` in CI pipeline. Map `dist/` to your deploy URL. Never upload source maps to public CDN.

---

## Alert Thresholds

| Metric | Threshold | Action |
|---|---|---|
| Error rate | > 1% of page loads | Notify on-call |
| Crash-free rate | < 99.5% (sessions without error) | Pager |
| LCP | > 2.5s for > 10% of users | Performance review |
| INP | > 200ms for > 10% of users | Interaction audit |

---

## Phase 5 Checklist
- [ ] Error monitoring SDK initialized with `beforeSend` stripping PII
- [ ] Error Boundaries wrapping route-level components
- [ ] Source maps uploaded to monitoring service (not public)
- [ ] Console.log stripped in production build
- [ ] Sample rates configured (traces: 0.1-0.2, replays: 0.1)
- [ ] Alert threshold for > 1% error rate
