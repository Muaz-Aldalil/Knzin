# Deployment Verification (project-owned reference)

- Post-change: health endpoint responds; smoke path exercised end to end;
  error rate observed for a stated window; rollback path stated before traffic.
- Anything unverifiable in this environment is reported not-verified with
  reason — never assumed from a successful build alone.

Source: project-authored for FR-017/024/029. Complements global
`devops-deploy` (pipeline mechanics) without duplicating it.
