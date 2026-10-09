# Migrations (project-owned reference)

- Forward-only, reviewable migration per schema change; states blast radius
  (tables, rows, downtime) and rollback story.
- Verified against BOTH empty and seeded databases where both exist.
- Destructive migrations: backup + restore-verified rollback drill where the
  environment permits; explicit not-verified statement otherwise.
- Never manual production edits. Never success-by-authorship.

Source: project-authored for FR-017/023/024. No global counterpart at this depth.
