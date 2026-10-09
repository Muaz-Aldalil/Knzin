# Jobs and Queues (project-owned reference)

- Durable backing; retry with backoff + attempt caps; dead-letter queue with
  alerting — a queue without DLQ handling is incomplete.
- Idempotency keys on handlers; overlap guards on scheduled jobs.
- Every job declares: trigger, payload contract, failure mode, and the
  log/metric/trace proving execution.

Source: project-authored for FR-017/021. No global counterpart.
