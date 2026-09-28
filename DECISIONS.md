# KNZiN Technical Decisions Log (DECISIONS.md)

## Status Types
* **PROPOSED**: Under consideration
* **APPROVED**: Decision made, ready for implementation
* **IMPLEMENTED**: Live in the codebase
* **DEPRECATED**: Replaced by a newer decision

---

## [DEC-001] Core Tech Stack Selection
**Status:** APPROVED
**Date:** 2026-09-28

### Decision
* **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + `next-intl` (RTL)
* **Backend:** Laravel 11 API (Sanctum)
* **Database:** MySQL 8+ / MariaDB (Owner Requirement)
* **Infrastructure:** Redis (Queues - Mandatory for traffic spikes)

### Why
We need SEO for courses (Next.js SSR) and rapid secure API development (Laravel). The project owner mandates MySQL for cost and team familiarity. 

### Trade-offs & Mitigations
MySQL handles concurrent high-volume writes less efficiently than PostgreSQL and lacks strict `CHECK` constraints. 
**Mitigations:** 
1. We MUST use Laravel Redis Queues for ticket generation to prevent database deadlocks during influencer traffic spikes. 
2. We will handle UUIDs via Laravel's native string casting since MySQL doesn't have a native UUID column type, accepting a slight index performance penalty.
3. Financial integrity (Ledger math) will be strictly enforced in the Laravel Service layer since MySQL constraints are limited.

---

## [DEC-002] Financial Data & Wallet Integrity Model
**Status:** APPROVED
**Date:** 2026-09-28

### Decision
The wallet will **not** be a single mutable `balance` integer on the `users` table. We will use an **Append-Only Ledger** model.
All currencies will be stored in their smallest divisible unit (e.g., Cents for USD, standard for IQD) using `BIGINT`. No floating-point math.

### Why
KNZiN operates promotional sweepstakes and affiliates. We need absolute auditability for chargebacks, refunds, and influencer withdrawals. If an affiliate claims missing commission, a mutable balance provides no history. A ledger guarantees accountability.

### Impact
Backend implements a dual-ledger pattern: an immutable `wallet_transactions` table as the legal source of truth, combined with an atomically updated `wallets.current_balance_cents` protected by DB row-level locking (`SELECT ... FOR UPDATE`) and nightly reconciliation.

---

## [DEC-003] Payment Verification & Source of Truth
**Status:** APPROVED
**Date:** 2026-09-28

### Decision
Payment success, ticket generation, and course entitlement are driven **exclusively by backend server-to-server webhooks** from Zain Cash / Payment Gateways, protected by Idempotency Keys. Frontend success redirects are purely cosmetic.

### Why
Iraqi mobile networks are unreliable. Users will drop connection after USSD PIN entry but before redirecting back to KNZiN. Webhooks guarantee the platform issues tickets securely regardless of the user's browser state.

---

## [DEC-004] Database Schema, Concurrency Model & Provably Fair Draws
**Status:** APPROVED
**Date:** 2026-09-28

### Decision
1. **Schema Definition:** Adopted 16 core tables covering Users & KYC, Wallets & Immutable Ledger, Courses & Parts ($2 / $10), Orders & Webhooks, Promotional Tickets, Draws, and Influencer Profiles & Western Union Payouts.
2. **Ticket Concurrency:** Decouple ticket generation from HTTP checkout. Use Laravel Redis queues (`GenerateTicketsJob`) with atomic Redis sequence reservation (`INCRBY`) and bulk MySQL multi-row inserts to eliminate unique index deadlocks during countdown spikes.
3. **Provably Fair RNG:** Draws use a Commit-Reveal protocol. Server seed SHA-256 hash is published prior to draw opening; raw seed is revealed post-draw alongside public block entropy for client-side deterministic verification in the Next.js Hall of Fame.
4. **Legal Protection:** Orders are legally 100% course purchases. Tickets are registered exclusively as zero-cost promotional marketing grants (`promotional_tickets_granted`).

