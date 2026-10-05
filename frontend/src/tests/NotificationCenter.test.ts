/**
 * In-App Notification Center Invariants & Component Tests (Feature 009 - US2)
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('NotificationCenter Invariants (Feature 009 - US2, FR-013, FR-014, FR-027, FR-029)', () => {
  it('HeaderHUD mounts NotificationBell and NotificationDrawer without full page reload', () => {
    const hudPath = path.resolve(__dirname, '../components/layout/HeaderHUD.tsx');
    const hudContent = fs.readFileSync(hudPath, 'utf8');

    assert.ok(
      hudContent.includes('NotificationBell'),
      'HeaderHUD must import and mount NotificationBell'
    );
    assert.ok(
      hudContent.includes('NotificationDrawer'),
      'HeaderHUD must import and render NotificationDrawer'
    );
    assert.ok(
      hudContent.includes('setIsNotificationDrawerOpen(true)'),
      'HeaderHUD must toggle NotificationDrawer via state'
    );
  });

  it('NotificationBell renders unread badge with semantic isolation', () => {
    const bellPath = path.resolve(__dirname, '../components/notifications/NotificationBell.tsx');
    const content = fs.readFileSync(bellPath, 'utf8');

    assert.ok(
      content.includes('<bdi>{badgeText}</bdi>'),
      'NotificationBell must wrap badge text in semantic <bdi> to prevent RTL inversion'
    );
    assert.ok(
      content.includes("unreadCount > 99 ? '99+' : unreadCount.toString()"),
      'NotificationBell must cap display count at 99+'
    );
  });

  it('NotificationItem wraps titles and bodies in <bdi> and provides in-memory refresh action', () => {
    const itemPath = path.resolve(__dirname, '../components/notifications/NotificationItem.tsx');
    const content = fs.readFileSync(itemPath, 'utf8');

    assert.ok(
      content.includes('<bdi>{title}</bdi>'),
      'NotificationItem must wrap title in <bdi>'
    );
    assert.ok(
      content.includes('<bdi>{body}</bdi>'),
      'NotificationItem must wrap body in <bdi>'
    );
    assert.ok(
      content.includes("action_type === 'refresh_course'"),
      'NotificationItem must handle refresh_course action'
    );
    assert.ok(
      content.includes('queryClient.invalidateQueries'),
      'NotificationItem must invalidate TanStack query caches without full browser reload'
    );
  });

  it('NotificationBell positions unread badge bi-directionally based on locale direction', () => {
    const bellPath = path.resolve(__dirname, '../components/notifications/NotificationBell.tsx');
    const content = fs.readFileSync(bellPath, 'utf8');

    assert.ok(
      content.includes("isRtl ? '-left-1' : '-right-1'"),
      'NotificationBell must place badge at left-1 for RTL and right-1 for LTR'
    );
  });

  it('NotificationPreferencesModal adapts layout and toggle switches for RTL vs LTR', () => {
    const modalPath = path.resolve(__dirname, '../components/notifications/NotificationPreferencesModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.ok(
      content.includes("dir={isRtl ? 'rtl' : 'ltr'}"),
      'NotificationPreferencesModal must explicitly set dir attribute'
    );
    assert.ok(
      content.includes("isRtl ? '-translate-x-4' : 'translate-x-4'"),
      'Toggle switch translation must be bi-directionally mirrored for RTL vs LTR'
    );
  });

  it('useNotifications safely extracts unread_count without TypeError on undefined or raw responses', () => {
    const hookPath = path.resolve(__dirname, '../hooks/useNotifications.ts');
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.ok(
      !content.includes('unreadCountQuery.data?.data.unread_count'),
      'Must NOT unsafely chain data.unread_count without null-coalescing or fallback'
    );
    assert.ok(
      content.includes('rawUnread?.unread_count') && content.includes('unreadCount,'),
      'Must safely inspect unread_count across both raw and nested envelope structures'
    );
  });

  it('NotificationDrawer renders via createPortal to document.body and locks body scroll', () => {
    const drawerPath = path.resolve(__dirname, '../components/notifications/NotificationDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf8');

    assert.ok(
      content.includes("import { createPortal } from 'react-dom';"),
      'NotificationDrawer must import createPortal to escape header containing block'
    );
    assert.ok(
      content.includes('createPortal(') && content.includes('document.body'),
      'NotificationDrawer must mount to document.body to avoid backdrop-filter and scroll clipping'
    );
    assert.ok(
      content.includes("document.body.style.overflow = 'hidden'"),
      'NotificationDrawer must lock body overflow while open'
    );
  });
});

