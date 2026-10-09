# Access Control (project-owned reference)

- Order: authenticate, then authorize, on every entry point — no exceptions.
- RBAC: roles map to named permissions; check the permission, not the role
  name string, where the framework allows.
- ABAC: attribute rules stated as data (policy), not scattered conditionals.
- Deny by default; 401 = unauthenticated, 403 = unauthorized — deliberate.
- Review checklist per endpoint: auth required? roles/attributes? IDOR-shaped
  object references? privilege paths (self-promotion, role parameter)?

Source: project-authored for FR-021/024. No global counterpart at this depth.
