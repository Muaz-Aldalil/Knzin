# PWA & Offline Support

Load when the app needs to work without internet, be installable, or send push notifications.

---

## Service Worker Strategies

| Strategy | When to use | Behavior |
|---|---|---|
| **NetworkFirst** | Content changes often (API data, feeds) | Try network, fall back to cache on failure |
| **StaleWhileRevalidate** | Fast + fresh enough (avatars, list pages) | Serve cache immediately, update cache from network in background |
| **CacheFirst** | Rarely changes (fonts, logos, CSS) | Cache on first fetch, serve from cache forever |
| **NetworkOnly** | Must be fresh (payments, auth) | Never cache, always network |
| **CacheOnly** | Fully offline app | Never network |

### Decision table

| Resource | Strategy |
|---|---|
| HTML shell / app shell | NetworkFirst (cached on first load) |
| CSS / JS bundles | StaleWhileRevalidate |
| Images (static) | CacheFirst |
| API responses | NetworkFirst with timeout (3s → cache) |
| Fonts | CacheFirst |
| User data | NetworkOnly |

---

## Setup per Stack

### Vite + vite-plugin-pwa
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'og.png'],
      manifest: {
        name: 'App Name',
        short_name: 'App',
        description: 'Description',
        theme_color: '#1e40af',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/api\./, handler: 'NetworkFirst' },
          { urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, handler: 'CacheFirst' },
        ],
      },
    }),
  ],
});
```

### Next.js (next-pwa or app router + service worker)
- Use `next/pwa` wrapper or manual SW registration
- App router: place `sw.js` in `public/`, register via `<script>` in root layout
- Cache strategy via Workbox imported in the SW

### Angular service worker
```bash
ng add @angular/pwa
```
- Config in `ngsw-config.json`: define `dataGroups` for API caching, `assetGroups` for static files
- `SwUpdate` service for checking updates

### Generic manual registration
```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

---

## manifest.json

```json
{
  "name": "Full App Name",
  "short_name": "Short",
  "description": "What the app does",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Required:** at minimum 192x192 and 512x512 icons. Use `maskable` for adaptive icons on Android.

---

## Install Prompt

```typescript
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show your custom install button
  document.getElementById('install-btn')?.classList.remove('hidden');
});

// On button click:
async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  // result.outcome === 'accepted' | 'dismissed'
}
```

**Do not:** show the install prompt immediately on first visit. Wait for a signal (user completed an action, visited 2+ pages, spent 30+ seconds).

---

## Offline Fallback

Serve a minimal offline page when network is unavailable and content is not cached:

```javascript
// sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      });
    })
  );
});
```

`/offline.html`: branded message, cached app logo, retry button, no external dependencies.

---

## Push Notifications

```typescript
// Request permission
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  const subscription = await navigator.serviceWorker.ready.then(reg =>
    reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  );
  // Send subscription to your backend
}
```

**VAPID keys:** generate once, keep private key server-side, public key in frontend.

---

## Phase 5 Checklist
- [ ] Service worker registered (Workbox or custom)
- [ ] Cache strategy chosen per resource type
- [ ] manifest.json present with icons + theme_color
- [ ] Install prompt deferred until user signal
- [ ] Offline fallback page served for uncached requests
- [ ] Push notification permission flow (opt-in only)
- [ ] Tested with DevTools -> Application -> Service Workers -> Offline checkbox
