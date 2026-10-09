---
name: backend-ops
description: >
  Backend operations procedures for the Backend Agent: background jobs,
  queues, workers, object storage, deployment concerns, observability
  (structured logging, metrics, tracing, health), deployment verification.
  Loaded on demand per detected stack.
---

# Backend Operations Skill (project-owned)

**Ownership**: this project. Complements global `devops-deploy` (which owns
CI/CD/Docker/platform templates). No orphan-ref overlap.

**Boundary — owns**: job/queue/worker patterns, object storage and upload
practice (incl. signed URLs), observability practice (structured logging,
request IDs, metrics, tracing, health/readiness/liveness, error tracking,
audit logging), deployment verification practice.
**Boundary — does NOT own**: CI pipelines, Dockerfiles, platform guides
(`devops-deploy` territory — compose, don't duplicate).

## 1. Background work

Long/slow/fallible work leaves the request path: queues with durable
backing, workers with retry + backoff + dead-letter handling, scheduled jobs
with idempotency and overlap guards. Every job states its failure mode and
its observability (what log/metric/trace proves it ran).

## 2. Object storage and uploads

Store blobs in object storage, never in the database or app filesystem.
Uploads: validate type/size server-side, scan where risk demands, serve via
signed short-lived URLs. Public buckets are findings until proven intentional.

## 3. Observability

Structured logs with request IDs, timestamps, levels — no secrets or PII in
logs. Metrics for the four signals that matter to the task (traffic, errors,
latency, saturation of the changed path). Tracing across service boundaries
where they exist. Health/readiness/liveness endpoints where the platform
consumes them — never invented where nothing reads them. Error tracking and
audit logging for auth/data/money paths.

## 4. Deployment verification practice

After any deployment-adjacent change: health check responds, smoke path
exercised end to end, error rate observed (not assumed), rollback path
stated. Unverified deployment steps are reported not-verified with reason.

## References

- `references/jobs-queues.md`, `references/storage.md`,
  `references/observability.md`, `references/deploy-verify.md`
  (project-authored).
- Global `devops-deploy` — composed for CI/Docker/platform, never duplicated.
