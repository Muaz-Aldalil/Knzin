/**
 * Learner Dashboard & Checkout Freshness Invariants
 * Verifies that learner dashboard cache is automatically refreshed upon landing,
 * and that checkout payment completion immediately invalidates learner query caches
 * so that newly purchased courses appear instantly without requiring a browser refresh.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');

describe('Learner Dashboard Freshness Invariants', () => {
  it('useLearnerDashboard enforces staleTime: 0 and refetchOnMount: always', () => {
    const hookPath = path.resolve(srcDir, 'hooks/useLearnerDashboard.ts');
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.ok(content.includes('staleTime: 0'), 'useLearnerDashboard must have staleTime: 0');
    assert.ok(
      content.includes("refetchOnMount: 'always'"),
      "useLearnerDashboard must have refetchOnMount: 'always'"
    );
  });

  it('LearnerDashboardView calls refetch on mount', () => {
    const viewPath = path.resolve(srcDir, 'components/dashboard/LearnerDashboardView.tsx');
    const content = fs.readFileSync(viewPath, 'utf8');

    assert.ok(
      content.includes('refetch();'),
      'LearnerDashboardView must trigger refetch on mount'
    );
  });

  it('PaymentStatusMonitor invalidates learner queries upon completion and navigation', () => {
    const monitorPath = path.resolve(srcDir, 'components/checkout/PaymentStatusMonitor.tsx');
    const content = fs.readFileSync(monitorPath, 'utf8');

    assert.ok(
      content.includes("queryClient.invalidateQueries({ queryKey: ['learner'] })"),
      'PaymentStatusMonitor must invalidate learner query key'
    );
    assert.ok(
      content.includes("queryClient.invalidateQueries({ queryKey: ['tickets'] })"),
      'PaymentStatusMonitor must invalidate tickets query key'
    );
  });

  it('usePaymentSimulator invalidates learner queries on success and reconcile', () => {
    const simPath = path.resolve(srcDir, 'hooks/usePaymentSimulator.ts');
    const content = fs.readFileSync(simPath, 'utf8');

    assert.ok(
      content.includes("queryClient.invalidateQueries({ queryKey: ['learner'] })"),
      'usePaymentSimulator must invalidate learner query key'
    );
  });
});
