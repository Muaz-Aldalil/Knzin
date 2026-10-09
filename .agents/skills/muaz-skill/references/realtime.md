# Real-Time Communication (WebSocket / SSE)

Load when the app needs live updates — chat, notifications, dashboards, collaborative editing.

---

## Decision Table

| Need | Best transport | Fallback |
|---|---|---|
| Bi-directional (chat, collab) | WebSocket | Socket.io polling |
| Server → Client only (notifications, feed) | SSE (EventSource) | Polyfill |
| One-way, infrequent (polling acceptable) | Short-polling (every 30s) | — |
| Real-time form validation | Debounced HTTP | — |

**Rule:** If you need reconnection, fallback transports, or room-based messaging, use Socket.io. Raw WebSocket for simple, single-user, reliable-connection scenarios only.

---

## Socket.io Client

### Setup
```bash
npm install socket.io-client
```

### Service layer (never in components)
```typescript
// services/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connect(token: string) {
  if (socket?.connected) return;

  socket = io(import.meta.env.VITE_WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => console.log('WS connected'));
  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // server kicked us — don't reconnect
      socket?.close();
    }
  });
  socket.on('connect_error', (err) => {
    // token expired? try refresh
    if (err.message === 'Invalid token') {
      refreshToken().then(connect);
    }
  });
}

export function disconnect() {
  socket?.close();
  socket = null;
}

export function getSocket() {
  if (!socket) throw new Error('Socket not connected. Call connect() first.');
  return socket;
}
```

### React hook
```typescript
import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

function useSocketEvent<T>(event: string, initial: T) {
  const [data, setData] = useState<T>(initial);

  useEffect(() => {
    const socket = getSocket();
    socket.on(event, setData);
    return () => { socket.off(event, setData); };
  }, [event]);

  return data;
}
```

---

## Raw WebSocket (for simple cases)

```typescript
class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private retries = 0;
  private maxRetries = 10;

  constructor(url: string) { this.url = url; }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => { this.retries = 0; };
    this.ws.onclose = () => this.reconnect();
    this.ws.onerror = () => this.ws?.close();
  }

  private reconnect() {
    if (this.retries >= this.maxRetries) return;
    const delay = Math.min(1000 * Math.pow(2, this.retries), 10000);
    setTimeout(() => { this.retries++; this.connect(); }, delay);
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
```

---

## Server-Sent Events (SSE)

```typescript
const source = new EventSource('/api/stream');

source.onopen = () => console.log('SSE connected');
source.onmessage = (e) => {
  const data = JSON.parse(e.data);
  // update state
};
source.onerror = () => {
  // reconnection is automatic — EventSource retries by default
};

// Named events:
source.addEventListener('notification', (e) => {
  showToast(JSON.parse(e.data));
});
```

**Rule:** SSE reconnects automatically. No library needed. Use for leaderboard, notifications, feed updates. Not suitable for sending data from client to server.

---

## Connection Status UI

```typescript
function ConnectionStatus() {
  const socket = getSocket();
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'failed'>('connected');

  useEffect(() => {
    socket.on('disconnect', () => setStatus('reconnecting'));
    socket.on('connect_error', () => setStatus('reconnecting'));
    socket.on('connect', () => setStatus('connected'));
    socket.io.on('reconnect_failed', () => setStatus('failed'));
  }, []);

  if (status === 'connected') return null;

  return (
    <div role="status" className="connection-banner">
      {status === 'reconnecting' ? 'Reconnecting...' : 'Connection lost. Refresh page.'}
    </div>
  );
}
```

---

## Phase 5 Checklist
- [ ] Reconnection strategy implemented (exponential backoff, max retries)
- [ ] Auth token sent in handshake, refresh on reconnect after expiry
- [ ] Connection status UI shown during reconnect
- [ ] Socket/SSE connection lives in service layer, not in components
- [ ] Memory cleanup on unmount (socket.off / source.close)
- [ ] Fallback transport configured (polling for WebSocket, polyfill for SSE)
