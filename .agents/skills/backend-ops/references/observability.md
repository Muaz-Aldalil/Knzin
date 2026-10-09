# Observability (project-owned reference)

- Logs: structured, request IDs, timestamps, levels; no secrets/PII.
- Metrics: traffic, errors, latency, saturation of each changed path.
- Tracing across service boundaries where they exist.
- Health/readiness/liveness only where the platform consumes them.
- Error tracking + audit logging mandatory on auth/data/money paths.

Source: project-authored for FR-017/021. Complements global `devops-deploy`
(monitoring setup) without duplicating it.
