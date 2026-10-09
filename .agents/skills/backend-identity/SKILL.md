---
name: backend-identity
description: >
  Backend identity procedures for the Backend Agent: sessions, JWT, OAuth2,
  OIDC, API keys, RBAC/ABAC, MFA/SSO, session stores, token lifecycle,
  server-side enforcement. Loaded on demand per detected stack.
---

# Backend Identity Skill (project-owned)

**Ownership**: this project. Complements global `backend-api` auth patterns.
Orphan-consumption: `muaz-skill/references/auth.md` (background only —
provenance in `verification/shared-dependencies.json`).

**Boundary — owns**: server-side identity procedures listed above, session
store and token-lifecycle practice, authorization enforcement patterns.
**Boundary — does NOT own**: vendor/product selection (requirements-driven
per FR-006, never imposed); client-side auth UI.

## 1. Mechanism selection (evidence-driven)

Sessions (server-side, stateful) for traditional web apps; JWT (stateless,
short-lived access + refresh rotation) for APIs and distributed callers;
OAuth2/OIDC for delegated login and SSO; API keys only for
service-to-service with rotation and least scope — never as user auth.
MFA/SSO where risk (FR-022 factors) demands it. Selection MUST cite the
requirement; never impose a mechanism for fashion.

## 2. Token and session lifecycle

Issue least-privilege tokens with short lifetimes; rotate refresh tokens and
detect reuse as compromise signal; store sessions server-side (Redis/store)
or sign stateless tokens with strong keys from secret management — never
hardcoded, never in client-readable places. Logout and revocation paths are
mandatory companions to issuance; untestable revocation is a finding.

## 3. Authorization enforcement

Authenticate first (who), then authorize (what): RBAC for role-shaped
access, ABAC where attributes drive decisions. Enforce server-side on every
entry point; client-side checks are UX only, never security. Deny by default;
every 401-vs-403 distinction deliberate (unauthenticated vs unauthorized).
Broken access control (missing checks, IDOR-shaped flaws, privilege paths)
is reported as a finding with impact, never silently fixed past.

## 4. Secrets and sensitive data

Secrets live in environment/secret management, never code, logs, errors, or
URLs. JWT payloads carry no PII. Auth failures return uniform shapes that do
not disclose which half (user vs credential) failed.

## References

- `references/session-token.md` — session stores, token lifecycle, rotation (project-authored).
- `references/access-control.md` — RBAC/ABAC patterns, enforcement checklist (project-authored).
- Global `backend-api` — composed for auth-pattern basics, never duplicated.
