# Implementation Plan: KNZiN UI Prototype

**Branch**: `001-knzin-ui` | **Date**: 2026-09-28 | **Spec**: specs/001-knzin-ui/spec.md
**Input**: spec.md UI-only HTML + Tailwind

## Summary
Single index.html mobile-first single page, Tailwind Play CDN, vanilla JS. Covers home revenue engine, draws, wallet, referral, influencer, admin mock.

## Technical Context
**Language/Version**: HTML5, Tailwind CDN 3.x, vanilla JS ES6
**Primary Dependencies**: Tailwind Play CDN, Google Fonts Tajawal
**Storage**: N/A (inline JS const data)
**Testing**: Manual visual check 375px/1280px
**Target Platform**: Modern browsers, file:// works
**Project Type**: static web single-page
**Performance Goals**: <500KB initial, no build
**Constraints**: No backend, file:// safe, RTL
**Scale/Scope**: 1 page, ~8 sections, 4 modals

## Constitution Check
Pass: UI-only, single file, dummy data, sticky HUD/nav, custom colors. No violations.

## Project Structure
### Documentation (this feature)
```text
specs/001-knzin-ui/
├── spec.md
├── plan.md
└── tasks.md
```
### Source Code (repository root)
```text
index.html
js/app.js
assets/ (optional, reuse Project info/)
```
**Structure Decision**: Single index.html + js/app.js to match whiteboard Mobile-First Single Page, zero tooling.

## Complexity Tracking
None.
