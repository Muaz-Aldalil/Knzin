/**
 * NotificationItem Refresh Action Invariants & Component Logic Tests (Feature 009 - US7, FR-028, FR-029)
 * Validates in-memory TanStack query cache invalidation without browser reload.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('NotificationItem Refresh Action Invariants (Feature 009 - US7)', () => {
  const itemPath = path.resolve(__dirname, '../components/notifications/NotificationItem.tsx');
  const itemContent = fs.readFileSync(itemPath, 'utf8');

  it('renders interactive Refresh button for refresh_course action type with spinning icon', () => {
    assert.ok(
      itemContent.includes("action_type === 'refresh_course'"),
      'Must check action_type for refresh_course'
    );
    assert.ok(
      itemContent.includes('<RefreshCw'),
      'Must render Lucide RefreshCw icon'
    );
    assert.ok(
      itemContent.includes("isRefreshing ? 'animate-spin' : ''"),
      'Must animate spin when refresh is in flight'
    );
    assert.ok(
      itemContent.includes('disabled={isRefreshing}'),
      'Must disable button while refresh is in flight'
    );
  });

  it('performs optimistic mark-as-read when refreshing unread notification', () => {
    assert.ok(
      itemContent.includes('if (!is_read) {') &&
      itemContent.includes('onMarkAsRead(id);'),
      'Must optimistically mark notification as read upon clicking refresh'
    );
  });

  it('invalidates relevant TanStack Query caches without full-page reload', () => {
    assert.ok(
      itemContent.includes("queryClient.invalidateQueries({ queryKey: ['courses'] })"),
      'Must invalidate general courses query'
    );
    assert.ok(
      itemContent.includes("queryClient.invalidateQueries({ queryKey: ['catalog'] })"),
      'Must invalidate catalog query'
    );
    assert.ok(
      itemContent.includes("queryClient.invalidateQueries({ queryKey: ['learner', 'courses'] })"),
      'Must invalidate learner courses query'
    );
    assert.ok(
      itemContent.includes("queryClient.invalidateQueries({ queryKey: ['course', courseSlug] })"),
      'Must invalidate course-specific query using slug'
    );
  });

  it('prevents click propagation to avoid unintentional drawer dismissal or navigation', () => {
    assert.ok(
      itemContent.includes('e.stopPropagation()'),
      'Must stop propagation on refresh button click'
    );
  });
});
