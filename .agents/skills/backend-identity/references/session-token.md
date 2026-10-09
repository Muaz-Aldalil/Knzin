# Session Stores, Token Lifecycle, Rotation (project-owned reference)

- Server-side sessions: store in Redis/store with TTL; cookie carries
  opaque ID only (httpOnly, Secure, SameSite set per threat model).
- JWT access tokens: minutes-scale lifetime, minimal claims, no PII.
- Refresh rotation: single-use refresh tokens; reuse signals compromise —
  revoke the family and report.
- Revocation must be testable: exercise revoke-then-use in verification.

Source: project-authored for FR-021/022. Complements global `backend-api`.
