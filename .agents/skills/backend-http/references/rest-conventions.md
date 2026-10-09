# REST Conventions (project-owned reference)

- Status families: 2xx success (200 ok, 201 created, 204 empty), 4xx client
  fault (400 validation, 401 unauthenticated, 403 unauthorized, 404 missing,
  409 conflict, 422 semantic errors), 5xx server fault.
- Error shape: `{error: {code, message, details[]}}`; never stack traces.
- Versioning: `/v1/` prefix only with multi-generation consumers or an
  explicit compatibility promise; additive preferred; breaking changes carry
  migration + sunset notes.
- Pagination: page/limit or cursor-based, stated per endpoint; unbounded list
  responses are defects.

Source: project-authored for FR-004/005/021. Complements global `backend-api`.
