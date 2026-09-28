<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 -> 2.0.0 (MAJOR: Complete transition from UI-Only static prototype to Full-Stack Production Architecture)
Modified Principles:
  - I. UI-Only Prototype -> I. Full-Stack Production Architecture & Stack Lock (Next.js, Laravel 11, MySQL 8+, Redis)
  - II. Mobile-First Single Page -> II. RTL Arabic-First & Dual-Locale Delivery (next-intl, RTL primary, LTR secondary)
  - III. Fidelity to Source -> III. Strict Legal Decoupling & Promotional Gift Model (Educational purchase vs promotional tickets)
  - IV. Simplicity -> IV. Fintech Dual-Ledger & Zero Floating-Point Arithmetic (BIGINT cents, immutable ledger + materialized balance)
  - V. Observability -> V. Webhook Source-of-Truth & Asynchronous Ticket Minting (Redis queues, idempotency, no deadlocks)
Added Principles & Sections:
  - VI. Provably Fair Draws & Cryptographic Transparency (Commit-reveal protocol, SHA-256 pre-commitment, public verification)
  - VII. Server-Enforced Authorization, KYC Gates & Payout Integrity (KYC over $100, 40% affiliate commission, WU receipt zeroing)
  - ## Security, Compliance & Unresolved Legal Risks (Explicitly flags regulatory and payment gateway jurisdiction as active risks)
  - ## Development & Quality Assurance Gates
Removed Sections:
  - UI-only demo constraints (all actions were previously toasts/dummy data)
Follow-up Deferred Items:
  - Final legal opinion on Iraqi sweepstakes classification.
  - Final gateway merchant account approval for Zain Cash / Qi Card.
-->

# KNZiN Constitution

## Core Principles

### I. Full-Stack Production Architecture & Stack Lock
The system MUST be built strictly using the approved full-stack technology tier:
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS + `next-intl` (RTL-first internationalization).
- **Backend API**: Laravel 11 REST API protected by Laravel Sanctum for token authentication (OAuth2, email, and guest tokens).
- **Database**: MySQL 8+ / MariaDB configured strictly with `utf8mb4_unicode_ci` and InnoDB engine.
- **Queues & Caching**: Redis 7+ for queue processing, cache, and rate-limiting.
*Rationale*: Educational catalog and SEO demand server-side rendering (SSR), while secure financial auditing and high-volume ticket minting demand an isolated, transactional backend engine.

### II. RTL Arabic-First & Dual-Locale Delivery
The user interface MUST be built with Arabic as the primary direction (`dir="rtl"`) using the Tajawal typography system:
- English localization (`en`) MUST be supported via `next-intl` with instant layout mirroring (`dir="ltr"`).
- Interface elements (HUD, sticky timers, draw cards, countdown marquee) MUST render flawlessly on mobile screens (375px) up to ultra-wide desktop monitors (1920px+).
- Client-side navigation MUST preserve active drawer states, sticky navigation HUD, and real-time timer synchronizations without layout shift (CLS < 0.1).

### III. Strict Legal Decoupling & Promotional Gift Model
KNZiN is legally an e-commerce platform for digital educational micro-courses, NOT a direct gambling or lottery platform:
- Invoices, orders, and payment gateway receipts MUST represent **100% educational course purchases**.
- Course pricing is strictly:
  - **Single Part**: **$2.00 USD** &rarr; Awards **1 Free Promotional Raffle Ticket**.
  - **Full Course Bundle (6 Parts)**: **$10.00 USD** &rarr; Awards **15 Free Promotional Raffle Tickets** (bulk educational incentive).
- Tickets MUST be registered in the database as zero-value promotional grants (`promotional_tickets_granted`), NEVER as line-item purchased assets.
- Checkout MUST require an affirmative, non-pre-checked legal checkbox with the exact text:
  > *"أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل"*
  *(I agree to the terms and conditions and privacy policy, and acknowledge that I am purchasing digital educational content, and that the attached draw ticket is a free, non-refundable, non-exchangeable promotional gift).*

### IV. Fintech Dual-Ledger & Zero Floating-Point Arithmetic
All monetary calculations and wallet balances MUST adhere to fintech banking standards:
- **No Floating-Point Math**: All currencies MUST be calculated and stored as `BIGINT` integers in their minor currency units (cents for USD, whole fils/dinars for IQD).
- **Dual-Ledger Pattern**: The `wallets` table maintains a cached materialized balance (`current_balance_cents`) updated exclusively inside atomic ACID database transactions with row-level locks (`SELECT ... FOR UPDATE`), accompanied by an immutable, append-only row in `wallet_transactions`.
- **Currency & Exchange Rate Capture**: Display is in USD ($2, $10, $50k), but payment gateway captures in Iraqi Dinars (IQD, e.g., 2,000 IQD per part). Every transaction and order MUST freeze the exact `exchange_rate` and `paid_amount_gateway` at checkout time to eliminate conversion drift.

### V. Webhook Source-of-Truth & Asynchronous Ticket Minting
The frontend browser is untrusted and subject to dropped network connections (frequent on regional 3G/4G networks):
- **Server-to-Server Webhook Authority**: Order fulfillment, wallet crediting, and ticket generation MUST be triggered exclusively by validated backend webhook callbacks from payment gateways (Zain Cash, Qi Card, Visa/Mastercard). Frontend redirect URLs are purely cosmetic user-facing confirmations.
- **Idempotency Guarantee**: Every webhook listener MUST check an atomic `idempotency_key` (or unique gateway transaction ID) before mutating database state to prevent duplicate ticket minting or double crediting.
- **Asynchronous Queue Minting**: Under countdown traffic spikes, ticket creation MUST NOT block HTTP checkout threads. Purchases MUST dispatch a queued `GenerateTicketsJob` to Redis, utilizing atomic sequence reservations (`INCRBY`) and bulk multi-row inserts into MySQL to eliminate InnoDB unique index deadlocks.
- **Ticket Expiry Invariants**:
  - **Hourly and Daily Draw Tickets**: MUST expire immediately upon draw conclusion (`تنتهي فور إعلانه`).
  - **Monthly Draw Tickets**: MUST remain active for all draws throughout the calendar month (`فعالة طوال الشهر`).

### VI. Provably Fair Draws & Cryptographic Transparency
To prevent internal fraud, administrative tampering, or user suspicion in cash draws ($100 to $500,000):
- Draws MUST utilize a **Commit-Reveal Cryptographic Protocol**:
  1. **Pre-Commitment**: Prior to draw opening, the system generates a secret `server_seed` and publishes `server_seed_hash = SHA256(server_seed)` publicly on the platform.
  2. **External Entropy**: At draw closing, a public third-party seed (`client_seed`, such as a specified Bitcoin block hash or verifiable public entropy) is combined with the revealed secret.
  3. **Deterministic Selection**: The winner index is calculated deterministically via `HMAC_SHA256(server_seed, client_seed) % total_tickets`.
  4. **Public Verification**: The unhashed `server_seed` is published to the Hall of Fame (`حائط الشرف`), allowing any user to independently verify the draw mathematically.

### VII. Server-Enforced Authorization, KYC Gates & Payout Integrity
Security and fraud prevention MUST be enforced strictly on the Laravel backend; client-side checks are merely navigational UX:
- **Server-Enforced AuthZ**: All course download URLs, lesson streams, wallet operations, and administrative functions MUST validate permissions on the server using signed, time-limited tokens (15-minute S3/Cloudflare R2 pre-signed URLs).
- **KYC Verification Gate**: Any prize claim exceeding **$100.00 USD** MUST be held in `pending` status until the winner completes KYC verification (`kyc_verifications`) with official government identification matching the registered purchase profile.
- **40% Affiliate Prize Commission**: When a referred user wins a draw, their referring influencer receives an automated 40% commission credited to `wallets.pending_balance_cents`.
- **Mark-as-Paid & Western Union Zeroing**: Admin payout settlements MUST require the administrator to enter the official Western Union Money Transfer Control Number (MTCN) and upload the physical transfer receipt. Payout execution atomically deducts pending balances and writes an immutable audit record.

---

## Security, Compliance & Unresolved Legal Risks

### Active Legal & Regulatory Risks (Unresolved Invariants)
The legal classification of promotional sweepstakes and digital course bundling remains an **active business risk**, NOT a settled fact:
1. **Iraqi Commercial Law & Sweepstakes Regulations**: The platform's promotional structure relies on Iraqi commercial trade gift exemptions. Formal regulatory licensing or restrictions by local ministries remain an open risk that MUST be reviewed by qualified local legal counsel prior to high-stakes prize disbursement.
2. **Payment Gateway Underwriting & Merchant Categorization**: Local Iraqi processors (Zain Cash, AsiaHawala, Qi Card) and international card networks (Visa/Mastercard) maintain strict guidelines regarding lottery-adjacent products. The platform MUST maintain strict separation of educational digital delivery to prevent merchant account suspension.
3. **Cross-Border Payout Compliance**: Western Union and cash transfer remittances across provincial or international borders require strict Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) compliance. All payouts exceeding threshold limits must be archived with verified KYC dossiers.

---

## Development & Quality Assurance Gates

1. **Schema & Migration Gate**: Every database change MUST include an atomic Laravel migration with explicit foreign key constraints, UTF8mb4 character set, and index coverage for high-frequency queries.
2. **Financial Test Gate**: Every wallet transaction, refund, and commission calculation MUST have unit tests proving zero floating-point rounding errors and 100% idempotent webhook handling.
3. **Concurrency Test Gate**: Ticket generation under simulated concurrent load (1,000+ simultaneous purchases) MUST execute via Redis queues without MySQL deadlocks.
4. **Content Security Gate**: Educational PDF and audio assets MUST never be exposed via static public URLs; all asset delivery MUST require authenticated, signed, short-lived URLs.

---

## Governance

- **Supremacy**: This Constitution supersedes all informal architecture notes, prototypes, and specifications. No PR or feature implementation may contradict these principles.
- **Amendments**: Changes to this Constitution require:
  1. Documentation of the business/technical necessity in `DECISIONS.md`.
  2. Formal increment of `CONSTITUTION_VERSION` following Semantic Versioning (MAJOR for principle redefinition, MINOR for principle additions, PATCH for clarifications).
  3. Update to the Sync Impact Report for full auditability.

**Version**: 2.0.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-09-29
