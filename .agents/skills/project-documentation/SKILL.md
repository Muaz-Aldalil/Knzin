---
name: project-documentation
description: >
  Generates, audits, and updates comprehensive codebase documentation (README.md,
  docs/ARCHITECTURE.md, docs/API.md) using deterministic local analysis.
  Activate when asked to "document project", "generate README", "create docs",
  "document codebase", "explain architecture", "document API", or "repo onboarding".
  Do NOT activate for explaining single functions or one-off code snippets.
---

# Enterprise Project Documentation Engine

## Core Philosophy
1. **Strict Read-Only Source Protection**: Under NO circumstances should any codebase source files, configurations, build artifacts, or tests be modified, deleted, or reformatted during documentation. The agent is strictly constrained to read-only inspection and writing output documentation.
2. **Source-Grounded Truth**: Analyze actual code, schemas, and configurations. Never extrapolate hypothetical flags, unreferenced env vars, or nonexistent endpoints.
3. **Deterministic Layout**: Every documented project must meet a standardized quality contract regardless of tech stack.
4. **Secret Hygiene**: Zero tolerance for credentials in documentation. Real `.env` values are sanitized into dummy placeholders.
5. **Preserve Custom Content**: Never overwrite custom author notes, project context, or unique badges during updates.

---

## Phase 1: Repository Topology & Reconnaissance

Before generating any documentation, execute the following reconnaissance steps using native workspace tools:

1. **Topology Check (Monorepo vs. Standalone)**:
   - Check root for monorepo managers: `pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, root `Cargo.toml [workspace]`, `nx.json`.
   - If monorepo: Document root orchestration first, then generate modular docs for each package/app under `apps/` or `packages/`.

2. **Tech Stack & Manifest Inspection**:
   - Node/TS/JS: `package.json` (check `dependencies`, `devDependencies`, `scripts`, `engines`).
   - Python: `pyproject.toml`, `requirements.txt`, `Pipfile`, `setup.py`.
   - Rust: `Cargo.toml`.
   - Go: `go.mod`.
   - Mobile: `pubspec.yaml` (Flutter), `Podfile` / `build.gradle` (iOS/Android).
   - Infrastructure: `Dockerfile`, `docker-compose.yml`, GitHub Actions (`.github/workflows/`), Terraform (`*.tf`).

3. **Configuration & Data Layer Scan**:
   - Environment templates: Search for `.env.example`, `.env.template`, or sample configs.
   - Schemas / ORMs: Scan `prisma/schema.prisma`, `drizzle/`, `migrations/`, `models.py`, `entities/`, or SQL DDL.
   - Entry points: Identify `src/index.*`, `src/main.*`, `app/page.*`, `cmd/main.go`, or server entry files.

4. **Existing Documentation Audit**:
   - Read any existing `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, or `docs/`.
   - Extract manually authored sections (logos, business mission, custom credentials requirements) to preserve.

---

## Phase 2: Documentation Deliverables

Produce up to three tiers of documentation depending on the request and project scale:

### Tier 1: `README.md` (Root Developer & User Entry Point)
Must contain the following standardized sections:
1. **Project Title & One-Line Value Proposition**: Concise summary of what the system does.
2. **Architecture Highlights / Tech Stack**: Bulleted or badged summary of technologies used.
3. **Prerequisites**: Required runtimes (e.g., Node >= 20.x, Python >= 3.11, Docker, PostgreSQL).
4. **Quickstart / Local Development**:
   - Clone & install steps.
   - Environment setup: Explicit list of required variables (sourced from `.env.example`).
   - Run commands (dev mode, production build, tests).
5. **Repository Structure**: Curated file tree explaining the primary directory roles (exclude noise like `node_modules`, `.git`, build output).
6. **Key Scripts & Commands**: Table of available `npm run / make / cargo` commands with descriptions.
7. **License & Contributing**: Standard boilerplate or project-specific guidelines.

### Tier 2: `docs/ARCHITECTURE.md` (System Design & Runtime Flow)
Create or update when asked for architecture, system design, or on medium-to-large projects:
1. **System Context**: High-level explanation of frontend, backend, database, and third-party integrations.
2. **Mermaid System Diagram**:
   - Use clean, standard Mermaid flowchart syntax (`graph TD` or `flowchart LR`).
   - **Rule**: ALWAYS quote node labels containing parentheses, slashes, or hyphens: `id["Service Name (Port 3000)"]`.
3. **Primary Data Flows**: Sequence diagram or step-by-step trace of the core user flow (e.g., Auth flow, Checkout flow, Data pipeline).
4. **Module Boundaries & State Management**: How data moves between layers (e.g., Client -> API Route -> Controller -> Service -> Database).

### Tier 3: `docs/API.md` (Interface & Schema Reference)
Required if the project exposes HTTP/REST, GraphQL, gRPC, or public library exports:
1. **Base URL & Authentication**: How requests are authenticated (Bearer token, API key, cookies).
2. **Endpoints Table**: Grouped by resource domain.
   - Format: `METHOD /path` | Summary | Auth Required (Yes/No).
3. **Request/Response Payloads**: Minimal JSON or schema examples pulled from actual route handlers or validation schemas (Zod, Pydantic, etc.).
4. **Common Error Responses**: Standard 400, 401, 404, 500 error formats.

---

## Phase 3: Critical Constraints & Quality Guardrails

1. **Strict Read-Only Enforcement (Zero Source Modification)**:
   - **No Code / Config Alterations**: NEVER modify, reformat, delete, or rename any source code files, configurations, tests, or manifests (`.ts`, `.py`, `.go`, `.rs`, `package.json`, etc.).
   - **Strict Write-Boundary**: Write operations are strictly quarantined to documentation files (`README.md`, files inside `docs/`, or explicitly requested markdown doc files).
   - **Forbidden Commands**: NEVER run destructive or mutating shell commands (e.g., `npm install`, `pip install`, `rm`, `del`, `git checkout`, `git reset`, `prettier --write`, `black`). Shell commands, if run, must be read-only inspection (e.g., `--version`, `git status`).
   - **Document Bugs, Do Not "Fix" Them**: If bugs, dead code, broken imports, or missing packages are uncovered while analyzing code, NEVER attempt to fix the source. Flag them under a `> [!NOTE]` or `## Known Notes / Audit Observations` section in the documentation.

2. **Zero Hallucination Policy**:
   - Never write an installation command unless verified against `package.json` scripts or manifest tools.
   - If an edge case or fallback behavior is deduced from code but has no explicit tests, tag it:
     `> [!NOTE]`
     `> Behavior inferred from source implementation; formal test coverage is pending.`

3. **Secret Scrubbing Protocol**:
   - Never output real tokens, private keys, database passwords, or internal production hostnames.
   - Replace sensitive values with standard placeholders: `your_api_key_here`, `postgres://user:password@localhost:5432/dbname`.

4. **Mermaid Syntax Validation**:
   - Do NOT use unsupported HTML tags inside node text.
   - Always verify that all subgraphs have corresponding `end` statements.
   - Quote every node description containing special characters: `client["Web Client (Next.js)"] --> api["API Gateway"]`.

5. **Preservation of User Manual Content**:
   - If a `README.md` already exists, perform a surgical merge:
     - Keep custom hero images, project descriptions, sponsor links, and contributor lists.
     - Update installation commands, file trees, environment variable tables, and tech stack details.
