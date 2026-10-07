/**
 * Ticket Ledger & Page Unauthenticated Invariants
 * Verifies that when a guest or unauthenticated user accesses tickets,
 * the UI presents an engaging Sign In / Explore Courses prompt instead of a generic error.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');

describe('Ticket Ledger Unauthenticated State Invariants', () => {
  it('useLearnerTickets exports isUnauthenticated and isolates 401 from isError', () => {
    const hookPath = path.resolve(srcDir, 'hooks/useLearnerTickets.ts');
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.ok(content.includes('isUnauthenticated'), 'useLearnerTickets must export isUnauthenticated');
    assert.ok(
      content.includes('isError: query.isError && !isUnauthenticated'),
      'isError must exclude unauthenticated 401 responses'
    );
  });

  it('TicketLedgerDrawer renders dedicated unauthenticated state with login link', () => {
    const drawerPath = path.resolve(srcDir, 'components/layout/TicketLedgerDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf8');

    assert.ok(
      content.includes('isUnauthenticated'),
      'TicketLedgerDrawer must check isUnauthenticated'
    );
    assert.ok(
      content.includes('/auth/login?redirect=/tickets'),
      'TicketLedgerDrawer must provide sign in link redirecting back to tickets'
    );
    assert.ok(
      content.includes('سجّل دخولك للاطلاع على تذاكر السحب'),
      'TicketLedgerDrawer must render localized Arabic login title'
    );
  });

  it('TicketsPageView guards unauthenticated access with login and course links', () => {
    const pagePath = path.resolve(srcDir, 'components/tickets/TicketsPageView.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(
      content.includes('!hasToken || isUnauthenticated'),
      'TicketsPageView must guard using both token presence and isUnauthenticated'
    );
    assert.ok(
      content.includes('/auth/login?redirect=/tickets'),
      'TicketsPageView must provide login redirect'
    );
  });
});
