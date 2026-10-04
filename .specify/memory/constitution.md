# KNZiN Technical Project Constitution

> **Operating Rules Note**: This document defines domain, architectural, and database invariants for the KNZiN application. For agent behavioral rules, authority boundaries, and engineering operating standards, see the root [`AGENTS.md`](file:///d:/Work%20Projects/Knzin%20Project/AGENTS.md) and [`.agents/rules/agent-constitution.md`](file:///d:/Work%20Projects/Knzin%20Project/.agents/rules/agent-constitution.md).

---

## Core Principles

### I. Evidence-First & Brownfield Engineering
KNZiN is an existing brownfield application. All engineering analysis, planning, and code changes MUST be strictly evidence-driven:
- **Taxonomy of Claims**: The agent MUST explicitly classify all statements and findings into: *Intended behavior*, *Existing implementation*, *Verified behavior*, *Proposed behavior*, *Hypothesis*, *Unknown / requires verification*, *Unresolved decision*, or *Confirmed defect*.
- **Codebase as Empirical Evidence**: Claims regarding existing behavior MUST be backed by verifiable repository evidence (source code, routes, tests, migrations, configuration, git history). The mere existence of a route, component, class, API endpoint, migration, database table, test, or comment does not prove that an end-to-end feature works.
- **Unknowns Must Be Explicit**: When evidence is insufficient, the agent MUST explicitly state `Unknown / requires verification` rather than filling gaps with assumptions. Hypotheses MUST remain labeled as hypotheses until verified.
- **Inspect Before Changing**: Before designing or modifying any subsystem, the agent MUST inspect existing consumers, shared dependencies, models, services, and related tests. Focused, surgical modifications MUST always be preferred over rewrites.
- **Preserve Sound Architecture**: Working, tested patterns in the repository MUST be preserved unless an approved specification explicitly mandates architectural replacement.

### II. Full-Stack Ownership & Whole-System Responsibility
The project owner is primarily a frontend developer. The coding agent is responsible for understanding and executing across the **entire technical system**:
- **Whole-System Scope**: The agent owns all engineering layers: Frontend UI, Backend API, Database models/migrations, API contracts, Authentication/Authorization (Sanctum/OAuth), Background jobs, Queues (Redis), Scheduled processes, Notifications, Financial logic, Testing, and Runtime/infrastructure configuration.
- **Cross-Layer Investigation**: The agent MUST NOT stop at the frontend simply because the owner specializes in frontend development. A request that appears frontend-only MUST be investigated across backend, database, and integrations whenever those layers participate in the behavior:
  $$\text{Frontend} \rightarrow \text{API} \rightarrow \text{Backend Service} \rightarrow \text{Database} \rightarrow \text{External Service} \rightarrow \text{Response} \rightarrow \text{Client State}$$
- **Owner Independence**: The owner must NOT be expected to understand backend, database, infrastructure, payment, or low-level implementation details to request or approve normal feature work. The agent MUST NOT ask the owner to provide backend/database implementation instructions when they can be determined through repository analysis and engineering principles.
- **Stack Lock**:
  - *Frontend*: Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + `next-intl` (RTL/LTR) + Lucide React.
  - *Backend API*: Laravel 11 REST API protected by Laravel Sanctum (handling guest checkout tokens and authenticated sessions).
  - *Persistence*: MySQL 8+ / MariaDB with `utf8mb4_unicode_ci` collation and InnoDB engine for ACID guarantees.
  - *Queues & Cache*: Redis 7+ for queue processing (ticket generation, notifications, rate limiting).

### III. Mandatory Project Context & Reconciled Truth
When the project owner provides a separate **Mandatory Project Context** prompt, the agent MUST treat it as authoritative high-level context:
- **Reconciliation Hierarchy**: The agent MUST reconcile:
  $$\text{Mandatory Project Context} + \text{Active Repository} + \text{Requirements} + \text{Approved Decisions} + \text{Tests}$$
- **Codebase Takes Precedence for Current State**: The project context accelerates understanding, but is not a substitute for repository verification. When the context and the codebase disagree regarding current implementation, the active repository reflects what the code actually does today, while the context highlights intended or historical direction. The discrepancy MUST be documented.
- **Context Continuity Without Noise**: The project context MUST NOT be copied wholesale into every feature specification. Only the focused context package relevant to the affected subsystem (routes, models, APIs, constraints) should follow the feature.

### IV. No-Guessing, Reconciled Truth & Owner Interaction Policy
Efficiency requires respecting the project owner's attention while maintaining total technical accuracy:
- **Discover Before Asking**: The agent MUST NOT ask the owner questions that can reasonably be determined by inspecting the codebase, configuration, schema, API routes, git history, or documentation.
- **When to Ask the Owner**: Inquiries to the owner MUST be strictly reserved for matters requiring genuine human ownership:
  1. Product decisions and business rules.
  2. Financial policies, pricing, and reward rates.
  3. Legal and regulatory classifications.
  4. User-facing preferences that cannot be safely inferred.
  5. Irreconcilable contradictory requirements between authoritative documents.
- **Engineering Decisions Belong to Engineering**: Technical implementation choices belong to the agent when they can be derived safely from established project patterns, requirements, and this constitution.
- **Open Decisions Stay Open**: When project requirements contain unresolved conflicts, they MUST remain designated as open decisions. The agent MUST NOT silently resolve a product, legal, or financial conflict through code choices.

### V. Arabic-First RTL/LTR, Responsive & Accessibility Correctness
Localization, bidirectional rendering, and accessibility are core architectural concerns, not cosmetic patches:
- **Primary Direction**: Arabic (`dir="rtl"`) is the primary layout direction; English (`dir="ltr"`) is fully supported via `next-intl` with instant layout mirroring.
- **Logical CSS Properties**: Layouts MUST use CSS logical properties (`start`/`end`, `ms`/`me`, `ps`/`pe`) rather than physical coordinates (`left`/`right`). Arbitrary pixel hacks or duplicate Arabic/English component trees are strictly prohibited.
- **Bidirectional Semantic Isolation**: Mixed text (Arabic titles with English trade names, prices in USD/IQD, order numbers, emails, URLs) MUST be wrapped in `<bdi>` or assigned semantic `dir` attributes to prevent digit and punctuation inversion.
- **Responsive Invariant**: All screens, navigation HUDs, checkout bottom sheets, and course players MUST be functional across Desktop (&ge;1280px), Tablet (768px–1024px), and Mobile (375px–430px). A feature is incomplete if it fails on mobile touch viewports.
- **Accessibility Standards**: Layout changes MUST preserve semantic HTML hierarchy, touch target sizing (&ge;44&times;44px), keyboard interaction, focus rings, and accessible naming.

### VI. Strict Legal Decoupling & Promotional Gift Model
KNZiN operates commercially as a vocational micro-learning e-commerce platform, NOT as a direct lottery or gambling service:
- **Commercial Classification**: Every order, invoice, and payment receipt MUST reflect a 100% purchase of vocational educational content.
- **Standardized Pricing & Ticket Ratio**:
  - Individual Course Part: **$2.00 USD** &rarr; Grants **1 Free Promotional Sweepstakes Ticket**.
  - Full Course Bundle (Complete Course): **$10.00 USD** &rarr; Grants **15 Free Promotional Sweepstakes Tickets** (covers all active published parts of the course regardless of part count; bulk educational incentive).
  - Exchange Rate: Frozen at checkout in Iraqi Dinars (IQD, e.g., 1.3100 frozen rate) and persisted per transaction.
- **Zero-Value Line Item**: Sweepstakes tickets MUST be recorded in the database as zero-value promotional grants (`promotional_tickets_granted`), never as standalone purchased line items.
- **Canonical Legal Shield**: Checkout MUST enforce the affirmative, non-pre-checked consent checkbox verbatim in both frontend UI and backend validator before processing payment:
  > *"أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل"*

### VII. Server-Authoritative Financial Integrity & Dual-Ledger Accounting
The browser and client application are untrusted. All monetary and balance states MUST be server-authoritative:
- **Untrusted Client**: The browser MUST NOT be the source of truth for payment confirmation, wallet balances, entitlements, promotional tickets, draw eligibility, winner selection, affiliate balances, or payouts. Client state represents display and optimistic UX only.
- **Zero Floating-Point Arithmetic**: Floating-point types (`float`, `double`) are strictly banned for monetary amounts. All currencies MUST be calculated and stored as `BIGINT` integers in minor currency units (cents for USD, whole dinars for IQD).
- **Append-Only Dual-Ledger**: Financial balances are never updated via arbitrary in-place mutations. The `wallets` table maintains a cached materialized balance updated strictly within an atomic database transaction with pessimistic row-locking (`SELECT ... FOR UPDATE`), accompanied by an immutable record in `wallet_transactions`.
- **Currency & Drift Elimination**: Every transaction and order MUST freeze and store `currency`, `exchange_rate`, `subtotal_cents`, and `paid_amount_gateway` at checkout initiation.

### VIII. Payment & Database Integrity
Payment confirmation and database persistence must be bulletproof against dropped connections and concurrency:
- **Server-to-Server Webhook Authority**: Order fulfillment, entitlement grants, and promotional ticket creation MUST be triggered exclusively by validated backend webhook callbacks from payment gateways (ZainCash, AsiaHawala, Qi Card). Client-side redirect URLs or browser callbacks are purely cosmetic navigation cues.
- **Idempotency Guarantee**: Every webhook listener MUST enforce atomic `idempotency_key` verification before mutating any database record, preventing double-crediting or duplicate ticket issuance on network retries.
- **Asynchronous Ticket Generation**: Under high-volume draw countdowns, ticket creation MUST NOT block HTTP request-response cycles. Purchases MUST dispatch a queued `GenerateTicketsJob` to Redis, utilizing atomic sequence allocations to prevent database deadlocks.
- **Database Schema Integrity**: Database changes MUST be treated as part of feature engineering. Schema modifications require reversible Laravel migrations with explicit foreign keys, `utf8mb4_unicode_ci` collation, and indexes matching high-frequency query paths. Destructive migrations require explicit technical justification.
- **Ticket Lifecycles**:
  - Hourly & Daily Draw Tickets: MUST expire immediately upon draw resolution.
  - Monthly / Grand Prize Tickets: MUST remain active for all eligible draws throughout the designated calendar period.

### IX. Provably Fair Draws & Cryptographic Transparency
To guarantee user trust, eliminate internal tampering, and provide mathematical auditability:
- **Commit-Reveal Cryptographic Protocol**:
  1. *Pre-Commitment*: Before a draw opens for ticket accumulation, the system generates a high-entropy secret `server_seed` and publishes `server_seed_hash = SHA256(server_seed)` publicly on the platform.
  2. *External Verifiable Entropy*: At draw close, an external public entropy source (`client_seed`, e.g., a predetermined Bitcoin block hash or public beacon) is captured.
  3. *Deterministic Calculation*: The winning ticket index is calculated deterministically via `HMAC_SHA256(server_seed, client_seed) % total_tickets`.
  4. *Public Verification*: Upon completion, the raw `server_seed` is published to the Hall of Fame (*لوحة الفائزين*), enabling any participant to independently compute and verify the draw.

### X. Server-Enforced Authorization, KYC Gates & Payout Integrity
Security, content protection, and anti-fraud boundaries MUST be enforced on the Laravel backend:
- **Content Protection**: Video streams, syllabi downloads, and downloadable materials MUST never use public static bucket URLs. All media access requires authenticated, signed, short-lived URLs (15-minute maximum expiry).
- **KYC Gate on High-Value Claims**: Any prize claim exceeding **$100.00 USD** MUST be held in `pending` status until the claimant completes identity verification matching their registered purchase profile.
- **Affiliate Co-Share Ledger**: Influencer referral attribution grants a 40% grand-prize co-share credited to `wallets.pending_balance_cents`.
- **Payout Settlement & Zeroing**: Administrative manual payouts (e.g. Western Union) require the administrator to record the Money Transfer Control Number (MTCN) and upload the physical receipt before balance zeroing.

### XI. Spec Kit SDD Lifecycle: Traceability, Analyze & Mandatory Convergence
All substantial feature implementations MUST execute strictly through the Specification-Driven Development (SDD) lifecycle:
```text
Requirement → Specification (spec.md) → Clarification → Plan (plan.md) → Tasks (tasks.md) → Analyze Gate → Implementation → Convergence Gate → Verification
```
- **Traceability**: Every user requirement MUST trace to a specification element in `spec.md`, an architectural choice in `plan.md`, and an executable task in `tasks.md`.
- **Pre-Implementation Analyze Gate**: For every non-trivial feature, `/speckit-analyze` MUST be run as a read-only consistency check before code generation. Any detected gap, orphan task, contradiction, or constitution violation MUST be resolved in the artifacts before implementation begins.
- **Mandatory Convergence**: After implementation, `/speckit-converge` MUST be executed to compare the actual codebase against the specification, plan, tasks, and acceptance criteria. Unfinished work MUST be appended to `tasks.md` and completed before declaring the feature done. A checked task list alone does not prove completion.
- **Noise Control**: Minor visual refinements, local styling adjustments, and copy corrections MUST be batched into the active feature rather than creating redundant standalone Spec Kit features.

### XII. Simplicity, Maintainability & Controlled Scope
Code quality MUST emphasize long-term maintainability over premature optimization:
- **No Speculative Architecture**: Do not introduce generic abstraction layers, unused utilities, duplicate logic, duplicate RTL/LTR trees, or premature micro-frameworks.
- **Scope Discipline**: Implementation MUST adhere strictly to approved artifacts. The agent MUST NOT silently expand feature scope. Discovered unrelated bugs or debt MUST be classified separately (blocking vs. non-blocking debt) and logged rather than absorbed into the active task.
- **Understandable Code**: Additional complexity must have a demonstrated reason. Code MUST remain understandable to human engineers.

---

## Security, Compliance & Unresolved Invariants

### Active Legal & Regulatory Invariants
1. **Iraqi Commercial Law & Sweepstakes Regulations**: The platform's promotional structure relies on Iraqi commercial trade gift exemptions. Formal regulatory licensing remains an active project risk that MUST be reviewed by local counsel prior to live prize draws.
2. **Payment Gateway Underwriting & Merchant Categorization**: Regional aggregators (ZainCash, AsiaHawala, Qi Card) enforce strict anti-gambling policies. The platform MUST continuously maintain the separation of digital course delivery to safeguard merchant underwriting.
3. **AML/CTF Payout Compliance**: Remittances and cash transfer payouts across provincial or international borders require strict Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) compliance with verified identity records.

---

## Development & Quality Assurance Gates

1. **Pre-Implementation Analyze Gate**: `spec.md`, `plan.md`, and `tasks.md` MUST pass cross-artifact consistency analysis with zero unresolved contradictions before any source code is modified.
2. **Cross-Layer Verification Gate**: When a feature crosses frontend, API, backend, or database layers, integration tests or manual trace verifications MUST confirm end-to-end functionality across the full dependency chain.
3. **Database Migration Gate**: Every schema modification MUST include a reversible Laravel migration with explicit foreign keys, `utf8mb4_unicode_ci` collation, and index optimization for query paths.
4. **Financial Invariant Test Gate**: All financial calculations, wallet updates, and commission allocations MUST have automated tests asserting zero floating-point drift and 100% idempotent webhook behavior.
5. **Localization & RTL Mirroring Gate**: Every new or updated UI component MUST be verified in both Arabic (`rtl`) and English (`ltr`) viewports with zero horizontal overflow, proper semantic `<bdi>` wrapping, and touch target compliance.
6. **Post-Implementation Convergence Gate**: Features MUST pass `/speckit-converge` verification against acceptance criteria before the task is closed.

---

## Full-Stack SDD Workflow Execution Contract

The KNZiN development process MUST follow this fundamental principle:
```text
Understand the whole system.
Verify before claiming.
Discover before asking.
Specify before planning.
Analyze before implementing.
Handle every required layer.
Converge before declaring complete.
```

- If a frontend requirement requires backend or database work, the agent handles that work.
- If a backend requirement requires frontend changes, the agent handles those changes.
- If a feature requires database, API, infrastructure, testing, or external integration work, the agent owns the complete engineering path.
- The project owner provides product intent and genuine human decisions; the coding agent provides the technical investigation, implementation, integration, and verification.

---

## Governance

- **Supremacy**: This Constitution represents the technical engineering domain policy for the KNZiN repository. It operates under the overarching behavioral rules defined in [`AGENTS.md`](file:///d:/Work%20Projects/Knzin%20Project/AGENTS.md).
- **Version**: 3.3.0 | **Ratified**: 2026-09-28 | **Reconciled**: 2026-10-03 (Owner Decision 4: Complete course bundle scope)
