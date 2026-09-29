# Implementation Plan: Arena of Draws & Promotional Countdowns

**Branch**: `003-draws-arena-countdown` | **Date**: 2026-09-29 | **Spec**: [spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/003-draws-arena-countdown/spec.md)

**Input**: Feature specification from `/specs/003-draws-arena-countdown/spec.md`

---

## Summary

Implement the Promotional Draw Arena for KNZiN:
1. **Tiered Promotional Draws**: Showcase Hourly micro-draws ($100), Daily high-value draws ($5,000 / gadgets), and the Monthly Grand Draw ($500,000 / Luxury Car).
2. **Server-Synchronized Countdown Clocks**: Real-time timer countdowns updating every second with client drift compensation against server UTC reference timestamps, preventing local device clock spoofing and mobile tab sleep desync.
3. **Pulsating Lock State at `00:00:00`**: Instant UI transition to *"Locked for Draw / جاري إجراء السحب"* when closing time is reached, freezing ticket allocation and linking directly to the YouTube Live streaming broadcast.
4. **Transparent Ticket Eligibility**: Accordion drawer detailing ticket rules (Hourly/Daily tickets expire immediately; Monthly Grand Draw tickets stay active all month).
5. **Concluded Draws Archive**: Public record of past winners (masked names, governorates, winning ticket numbers e.g. `#KNZ-9942`, and broadcast links).
6. **Strict Legal Boundaries**: Zero direct lottery wagering; all draws are legally complimentary promotional gifts attached to educational micro-course purchases.

---

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.3+, Node.js 20+
- Backend: PHP 8.2+, Laravel 11.x

**Primary Dependencies**:
- Frontend: Next.js 14+ (App Router), Tailwind CSS v4, `next-intl` (RTL/LTR), `@tanstack/react-query`, `lucide-react`.
- Backend: Laravel 11, Eloquent ORM.

**Storage**:
- Database: MySQL 8.0+ / MariaDB (`InnoDB`, `utf8mb4_unicode_ci`).
- Caching: Redis 7.0+ (short TTL caching of active draws payload: 10s).

**Testing**:
- Backend: Pest / PHPUnit for API endpoints and status transition logic.
- Frontend: Vitest + React Testing Library for timer drift correction and zero-layout-shift tests.

**Target Platform**:
- Responsive web: Mobile-first (375px+ viewport) up to high-DPI desktop displays (1920px+).
- High tolerance for latent 3G/4G Iraqi telecom connections.

**Performance Goals**:
- Active draws API p95 response time < 100ms (served from Redis cache).
- Countdown clock synchronization accuracy within ±500ms of server UTC time.
- Cumulative Layout Shift (CLS) = 0.00 during digit tick transitions (using `tabular-nums`).

**Constraints**:
- **Dual-Currency Integrity**: Prize values stored in minor units (`valuation_usd_cents` BIGINT) with secondary approximate IQD marketing labels (`display_iqd_label`).
- **RTL Typography**: Authentic Arabic text shaping with Tajawal font family; countdown numbers preserved LTR with Arabic unit labels.

---

## Constitution Check

*GATE: Verified against [Constitution v3.1.0](file:///d:/Work%20Projects/Knzin%20Project/.specify/memory/constitution.md)*

- [x] **Principle I (Evidence-First)**: Builds directly on verified `002-auth-catalog-checkout` architecture without rewrites.
- [x] **Principle II (Full-Stack Ownership)**: Agent owns database migrations (`draws`, `prizes`, `draw_winners`), Laravel controllers, API resources, and frontend client components.
- [x] **Principle III (Arabic-First RTL/LTR)**: All components bidirectional with `<bdi>` protection and Tajawal font styling.
- [x] **Principle IV (Legal Separation)**: All draws presented strictly as non-gambling educational promotional gifts.
- [x] **Principle V (Fintech Integrity)**: Zero floating-point calculations; USD cents used for accounting.
- [x] **Principle VIII (Database Integrity)**: Reversible database migrations with foreign key constraints and index coverage.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-draws-arena-countdown/
├── spec.md              # Requirements and resolved clarifications
├── plan.md              # This full-stack architectural plan
├── research.md          # Technical research: clock drift & timer sync
├── data-model.md        # Database schema, migrations, and Eloquent relationships
├── quickstart.md        # Developer end-to-end verification guide
└── contracts/           # API request and response JSON schemas
    ├── draws-active.json
    └── draws-concluded.json
```

### Source Code Layout

```text
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── DrawController.php           # Active & Concluded draw endpoints
│   │   └── Resources/
│   │       ├── DrawResource.php             # JSend formatting with server UTC timestamp
│   │       └── DrawWinnerResource.php       # Masked winner serializer
│   └── Models/
│       ├── Draw.php                         # Draw entity with tier/status scopes
│       ├── Prize.php                        # Prize item entity
│       └── DrawWinner.php                   # Verified draw winner entity
├── database/
│   ├── migrations/
│   │   ├── 2026_09_29_000007_create_draws_table.php
│   │   ├── 2026_09_29_000008_create_prizes_table.php
│   │   └── 2026_09_29_000009_create_draw_winners_table.php
│   └── seeders/
│       └── PromotionalDrawSeeder.php        # Hourly, Daily, Monthly seed draws
└── tests/
    └── Feature/
        └── DrawApiTest.php                  # API contract and status tests

frontend/
├── messages/
│   ├── ar.json                              # Arabic translations for draws namespace
│   └── en.json                              # English translations for draws namespace
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       └── raffle/
│   │           └── page.tsx                 # Enhanced Raffle Arena page integrating DrawsArena
│   ├── components/
│   │   ├── catalog/
│   │   │   └── CatalogClientView.tsx        # Homepage view integrating HeroGrandPrizeCountdown
│   │   └── draws/
│   │       ├── DrawsArena.tsx               # Main container with Active/Concluded tabs
│   │       ├── DrawCard.tsx                 # Individual draw card with prize image & badge
│   │       ├── HeroGrandPrizeCountdown.tsx  # Standalone Homepage Hero banner for Grand Draw
│   │       ├── CountdownClock.tsx           # Drift-compensated live timer
│   │       ├── PulsatingLockBadge.tsx       # "00:00:00 Locked for Draw" visual state
│   │       ├── DrawTermsAccordion.tsx       # Collapsible ticket rules and eligibility
│   │       └── ConcludedDrawsList.tsx       # Past winners showcase
│   ├── hooks/
│   │   ├── useDraws.ts                      # React Query hook with server time offset
│   │   └── useCountdown.ts                  # High-precision timer hook
│   └── types/
│       └── draws.ts                         # TypeScript interfaces
```
