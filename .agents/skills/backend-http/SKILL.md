---
name: backend-http
description: >
  Backend HTTP/API procedures for the Backend Agent: REST/GraphQL conventions,
  gRPC, WebSockets, SSE, webhooks, streaming, boundary validation, versioning,
  contract testing practices. Loaded on demand per detected stack.
---

# Backend HTTP Skill (project-owned)

**Ownership**: this project. Complements (never duplicates) global
`backend-api`. Orphan-consumption: `muaz-skill/references/backend.md`
(background only — provenance in `verification/shared-dependencies.json`).

**Boundary — owns**: server-side API procedures below.
**Boundary — does NOT own**: framework/product specifics beyond procedural
patterns (see `references/`); design/UX; deployment.

## 1. Boundary validation (FR-021)

Validate every external input at the trust boundary before business logic:
types, shapes, ranges, lengths, formats. Reject with structured errors, never
stack traces. Validation failures are client errors (4xx family), never 500.

## 2. Versioning practice (conditional, never universal)

Version an API only when it has more than one consumer generation or an
explicit compatibility promise. When versioning: prefix (`/v1/`), additive
changes preferred, breaking changes get a migration note + sunset statement.
Single-consumer internal APIs MUST NOT carry version ceremony.

## 3. Contract testing practice (backend contract tests)

For every externally observable endpoint: record request/response shapes from
implementation, assert status codes for happy path + one validation failure +
one auth failure, and re-run against the running service where available.
Contract, implementation, tests, and docs MUST agree; drift is a defect.

## 4. Protocol selection (evidence-driven, FR-006)

REST by default for CRUD; GraphQL where clients need shaped queries;
gRPC for service-to-service efficiency; WebSockets/SSE for server-push;
webhooks for outbound events (with signature verification + retry policy);
streaming for large/continuous payloads. Selection MUST cite the requirement
driving it. Never impose a protocol for fashion.

## 5. Error and status discipline

Structured errors `{code, message, details[]}`; correct status families
(2xx success, 4xx client fault, 5xx server fault); auth failures distinct
(401 unauthenticated vs 403 unauthorized); no sensitive internals in errors.

## References

- `references/rest-conventions.md` — REST status/versioning/error practice (project-authored).
- `references/async-apis.md` — WebSocket/SSE/webhook/streaming practice (project-authored).
- Global `backend-api` — composed for basics, never duplicated here.
