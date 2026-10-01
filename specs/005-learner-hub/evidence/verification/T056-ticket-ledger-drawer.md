# Evidence: Ticket Ledger Drawer Trigger, Serial Format, and Bilingual Directionality

Task:
T056

Purpose:
Prove that the `TicketLedgerDrawer` opens without page navigation via the HUD ticket badge or custom event, serial numbers conform strictly to canonical Crockford Base32 syntax excluding ambiguous characters, layout adheres to Arabic RTL (`side="right"`) and English LTR (`side="left"`), and all three promotional draw tiers are represented with live countdown metadata.

Environment:
local / test (Node.js test runner with `tsx`)

Action:
Executed automated frontend invariants test suite:
`npm test` (running `src/tests/TicketLedgerDrawer.test.ts`)

Expected:
All 4 invariant assertions pass proving seamless sheet trigger, regex adherence, and bidirectional slide-in positioning.

Observed:
```text
▶ TicketLedgerDrawer Invariants (Feature 005 - FR-010, SC-004, SC-005)
  ✔ HeaderHUD triggers drawer opening without page navigation via state and custom event
  ✔ canonical Crockford Base32 regex strictly validates serial numbers without ambiguous characters (SC-003)
  ✔ drawer adapts slide-over positioning according to Arabic RTL vs English LTR (SC-005)
  ✔ drawer presents all three promotional tiers with real-time countdown metadata
✔ TicketLedgerDrawer Invariants (Feature 005 - FR-010, SC-004, SC-005)
```

Result:
PASS

Repository Evidence:
- [frontend/src/tests/TicketLedgerDrawer.test.ts](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/tests/TicketLedgerDrawer.test.ts)
- [frontend/src/components/layout/TicketLedgerDrawer.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/TicketLedgerDrawer.tsx)
- [frontend/src/components/layout/HeaderHUD.tsx](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/components/layout/HeaderHUD.tsx)
- [frontend/src/hooks/useLearnerTickets.ts](file:///d:/Work%20Projects/Knzin%20Project/frontend/src/hooks/useLearnerTickets.ts)

Notes:
Adheres strictly to `/muaz-skill` requirements for Arabic RTL first-class design, responsive sheet drawer behavior, and Crockford Base32 readability.
