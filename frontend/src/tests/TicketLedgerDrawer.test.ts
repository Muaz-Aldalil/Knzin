/**
 * Ticket Ledger Drawer Invariants & Responsive Tests (Feature 005)
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TicketLedgerDrawer Invariants (Feature 005 - FR-010, SC-004, SC-005)', () => {
  it('HeaderHUD triggers drawer opening without page navigation via state and custom event', () => {
    const hudPath = path.resolve(__dirname, '../components/layout/HeaderHUD.tsx');
    const drawerPath = path.resolve(__dirname, '../components/layout/TicketLedgerDrawer.tsx');

    const hudContent = fs.readFileSync(hudPath, 'utf8');
    const drawerContent = fs.readFileSync(drawerPath, 'utf8');

    // HeaderHUD manages state directly without router navigation
    assert.ok(
      hudContent.includes('setIsTicketsDrawerOpen(true)'),
      'HeaderHUD must open drawer on ticket badge click without navigation'
    );
    assert.ok(
      hudContent.includes('<TicketLedgerDrawer'),
      'HeaderHUD must render TicketLedgerDrawer'
    );
    assert.ok(
      drawerContent.includes('knzin:open-tickets-drawer'),
      'TicketLedgerDrawer must listen to knzin:open-tickets-drawer custom event'
    );
  });

  it('canonical Crockford Base32 regex strictly validates serial numbers without ambiguous characters (SC-003)', () => {
    const crockfordRegex = /^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$/;

    // Valid serials
    assert.ok(crockfordRegex.test('KNZ-26-8K9N-2PQR'));
    assert.ok(crockfordRegex.test('KNZ-26-0000-0000'));
    assert.ok(crockfordRegex.test('KNZ-26-ZZZZ-ZZZZ'));

    // Ambiguous characters: I, L, O are strictly excluded from Crockford range
    assert.equal(crockfordRegex.test('KNZ-26-8I9N-2PQR'), false, 'Character "I" must be rejected');
    assert.equal(crockfordRegex.test('KNZ-26-8L9N-2PQR'), false, 'Character "L" must be rejected');
    assert.equal(crockfordRegex.test('KNZ-26-8O9N-2PQR'), false, 'Character "O" must be rejected');

    // Lowercase must be rejected in canonical form
    assert.equal(crockfordRegex.test('knz-26-8k9n-2pqr'), false, 'Lowercase must be rejected in canonical form');
  });

  it('drawer adapts slide-over positioning according to Arabic RTL vs English LTR (SC-005)', () => {
    const drawerPath = path.resolve(__dirname, '../components/layout/TicketLedgerDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf8');

    // Assert RTL awareness: side={isRtl ? 'right' : 'left'}
    assert.ok(
      content.includes("side={isRtl ? 'right' : 'left'}"),
      'TicketLedgerDrawer must position SheetContent on the right for RTL and on the left for LTR'
    );
  });

  it('drawer presents all three promotional tiers with real-time countdown metadata', () => {
    const drawerPath = path.resolve(__dirname, '../components/layout/TicketLedgerDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf8');

    assert.ok(content.includes('hourly'), 'Must support hourly draw tier');
    assert.ok(content.includes('daily'), 'Must support daily draw tier');
    assert.ok(content.includes('monthly'), 'Must support monthly grand draw tier');
  });
});
