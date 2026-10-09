# Async APIs (project-owned reference)

- WebSockets: full-duplex sessions; authenticate at handshake; heartbeat +
  reconnect policy; backpressure strategy stated.
- SSE: server→client streams over HTTP; reconnect via Last-Event-ID;
  prefer over WebSockets for one-way feeds.
- Webhooks: sign every payload (HMAC), document retry/backoff expectations,
  idempotency keys on receivers, log deliveries.
- Streaming: chunked responses for large/continuous payloads; client
  cancellation honored; never buffer unbounded data in memory.

Source: project-authored for FR-004/006. No global counterpart — new coverage.
