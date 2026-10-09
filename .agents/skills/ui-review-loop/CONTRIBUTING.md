# Contributing

## Ground rules

- **Zero runtime dependencies is a hard rule.** The runner, review server, and recorder import only `node:*` builtins and each other. Do not add a dependency; do not add a `dependencies` field to `package.json`.
- **Run the suite before opening a PR.** `npm test` runs `test/self-test.mjs`, the 416-check suite, and it must end `416 passed, 0 failed`.
- **New checks must be mutation-provable.** A check that cannot fail is not a check. Prove each new check the way `test/mutate.mjs` does: break the behaviour it guards, run the suite, and show the named check fails. Add an entry to `test/mutate.mjs` when the behaviour is one the harness can anchor.
- **One concern per PR.** Small, reviewable changes beat sweeping ones.

## Layout

- `scripts/round.mjs` — the round runner (start / run / stop / abort / pending / resolve / calibrate)
- `scripts/server.mjs` — the per-project review server
- `assets/recorder.js` — the in-page recorder injected into rounds
- `assets/ui/` — the review site front end
- `references/`, `templates/` — package-format docs and coverage-audit templates
- `test/self-test.mjs` — the check suite; `test/mutate.mjs` — the mutation harness
