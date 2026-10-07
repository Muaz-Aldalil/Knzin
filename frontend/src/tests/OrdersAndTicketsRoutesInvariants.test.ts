/**
 * Orders and Tickets Permalinks & Route Invariants Test
 * Verifies that /orders/[id], /orders/[id]/payment, and /tickets exist and conform to architecture contracts.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Orders and Tickets Route Invariants', () => {
  it('Order detail page exists at src/app/[locale]/orders/[id]/page.tsx and supports UUID/orderNumber', () => {
    const orderPagePath = path.resolve(__dirname, '../app/[locale]/orders/[id]/page.tsx');
    assert.ok(fs.existsSync(orderPagePath), 'orders/[id]/page.tsx must exist');

    const content = fs.readFileSync(orderPagePath, 'utf8');
    assert.ok(
      content.includes('orderIdentifier = (params?.id || params?.orderNumber)'),
      'Must extract order identifier supporting both UUID and order number'
    );
    assert.ok(
      content.includes('<OrderSummaryCard'),
      'Must render OrderSummaryCard for rich visual invoice representation'
    );
  });

  it('Order payment recovery subroute exists at src/app/[locale]/orders/[id]/payment/page.tsx', () => {
    const paymentPagePath = path.resolve(__dirname, '../app/[locale]/orders/[id]/payment/page.tsx');
    assert.ok(fs.existsSync(paymentPagePath), 'orders/[id]/payment/page.tsx must exist');
  });

  it('Dedicated tickets ledger page exists at src/app/[locale]/tickets/page.tsx and mounts TicketsPageView', () => {
    const ticketsPagePath = path.resolve(__dirname, '../app/[locale]/tickets/page.tsx');
    assert.ok(fs.existsSync(ticketsPagePath), 'tickets/page.tsx must exist');

    const viewPath = path.resolve(__dirname, '../components/tickets/TicketsPageView.tsx');
    assert.ok(fs.existsSync(viewPath), 'TicketsPageView.tsx must exist');

    const viewContent = fs.readFileSync(viewPath, 'utf8');
    assert.ok(
      viewContent.includes('useLearnerTickets'),
      'TicketsPageView must query authoritative learner tickets hook'
    );
    assert.ok(
      viewContent.includes('formatCountdown'),
      'TicketsPageView must compute real-time draw countdowns'
    );
  });

  it('Backend OrderService allows lookup by order UUID as well as order_number', () => {
    const servicePath = path.resolve(__dirname, '../../../backend/app/Services/OrderService.php');
    const content = fs.readFileSync(servicePath, 'utf8');

    assert.ok(
      content.includes("->where('order_number', $orderNumber)") &&
      content.includes("->orWhere('id', $orderNumber)"),
      'OrderService getOrderByNumber must query both order_number and id (UUID)'
    );
  });

  it('Notification action URLs have corresponding frontend routes to prevent 404', () => {
    const learnPath = path.resolve(__dirname, '../app/[locale]/courses/[slug]/learn/page.tsx');
    assert.ok(fs.existsSync(learnPath), 'courses/[slug]/learn/page.tsx must exist');

    const drawsPath = path.resolve(__dirname, '../app/[locale]/draws/page.tsx');
    assert.ok(fs.existsSync(drawsPath), 'draws/page.tsx must exist');

    const drawsLivePath = path.resolve(__dirname, '../app/[locale]/draws/[id]/live/page.tsx');
    assert.ok(fs.existsSync(drawsLivePath), 'draws/[id]/live/page.tsx must exist');

    const notifsPath = path.resolve(__dirname, '../app/[locale]/notifications/page.tsx');
    assert.ok(fs.existsSync(notifsPath), 'notifications/page.tsx must exist');
  });
});

