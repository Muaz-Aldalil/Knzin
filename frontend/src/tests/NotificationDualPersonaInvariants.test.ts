/**
 * Dual-Persona Notification Center Invariants & Component Tests (Feature 010 - US2, US3, US4)
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Notification Dual-Persona Invariants (Feature 010 - US2, US3, US4)', () => {
  it('useNotifications accepts scope and maintains isolated cache keys and breakdown counts', () => {
    const hookPath = path.resolve(__dirname, '../hooks/useNotifications.ts');
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.ok(
      content.includes("scope: NotificationScope = 'all'"),
      'useNotifications must accept scope parameter defaulting to all'
    );
    assert.ok(
      content.includes("['notifications', scope, page, perPage, filter]"),
      'useNotifications queryKey must isolate cache by scope'
    );
    assert.ok(
      content.includes('learnerUnreadCount') && content.includes('adminUnreadCount'),
      'useNotifications must export scoped learnerUnreadCount and adminUnreadCount'
    );
    assert.ok(
      content.includes('markAllNotificationsAsRead(targetScope ?? scope)'),
      'markAllAsRead mutation must pass target scope to API client'
    );
  });

  it('NotificationDrawer renders dual-persona segmented tabs strictly when effectiveIsAdmin is true', () => {
    const drawerPath = path.resolve(__dirname, '../components/notifications/NotificationDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf8');

    assert.ok(
      content.includes('{effectiveIsAdmin && ('),
      'NotificationDrawer must guard dual-persona tabs with effectiveIsAdmin'
    );
    assert.ok(
      content.includes("setActiveScope('learner')") && content.includes("setActiveScope('admin')"),
      'NotificationDrawer must provide toggle buttons for learner and admin scopes'
    );
    assert.ok(
      content.includes('نشاطي كمتعلم') && content.includes('My Activity'),
      'NotificationDrawer must include localized labels for learner activity tab'
    );
    assert.ok(
      content.includes('الإدارة والمبيعات') && content.includes('Admin & Sales'),
      'NotificationDrawer must include localized labels for admin sales tab'
    );
    assert.ok(
      content.includes('<bdi>{learnerUnreadCount}</bdi>'),
      'NotificationDrawer must wrap learner unread count badge in semantic <bdi>'
    );
    assert.ok(
      content.includes('<bdi>{adminUnreadCount}</bdi>'),
      'NotificationDrawer must wrap admin unread count badge in semantic <bdi>'
    );
    assert.ok(
      content.includes('markAllAsRead(currentScope)'),
      'NotificationDrawer mark-all-read must pass current active scope'
    );
  });

  it('NotificationsPage renders dual-persona tabs for administrators with scoped unread counters', () => {
    const pagePath = path.resolve(__dirname, '../app/[locale]/notifications/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(
      content.includes('{isAdmin && ('),
      'NotificationsPage must conditionally render dual-persona tabs for admins'
    );
    assert.ok(
      content.includes("setActiveScope('learner')") && content.includes("setActiveScope('admin')"),
      'NotificationsPage must switch active scope between learner and admin'
    );
    assert.ok(
      content.includes('<bdi>{learnerUnreadCount}</bdi>'),
      'NotificationsPage must wrap learner unread count in <bdi>'
    );
    assert.ok(
      content.includes('<bdi>{adminUnreadCount}</bdi>'),
      'NotificationsPage must wrap admin unread count in <bdi>'
    );
    assert.ok(
      content.includes('markAllAsRead(currentScope)'),
      'NotificationsPage mark-all-read must be scoped to active tab'
    );
  });

  it('NotificationItem supports admin_sales and admin_ops with commercial badge and navigation', () => {
    const itemPath = path.resolve(__dirname, '../components/notifications/NotificationItem.tsx');
    const content = fs.readFileSync(itemPath, 'utf8');

    assert.ok(
      content.includes("case 'admin_sales':"),
      'NotificationItem must handle admin_sales category'
    );
    assert.ok(
      content.includes('TrendingUp'),
      'NotificationItem must use TrendingUp icon for commercial sales notifications'
    );
    assert.ok(
      content.includes('text-emerald-600'),
      'NotificationItem must use emerald badge styling for admin_sales'
    );
    assert.ok(
      content.includes("case 'admin_ops':"),
      'NotificationItem must handle admin_ops category'
    );
    assert.ok(
      content.includes('<bdi>{title}</bdi>') && content.includes('<bdi>{body}</bdi>'),
      'NotificationItem must preserve semantic <bdi> wrappers on title and body'
    );
  });

  it('HeaderHUD passes isAdmin to NotificationDrawer and feeds NotificationBell with total unreadCount', () => {
    const hudPath = path.resolve(__dirname, '../components/layout/HeaderHUD.tsx');
    const content = fs.readFileSync(hudPath, 'utf8');

    assert.ok(
      content.includes('<NotificationDrawer') && content.includes('isAdmin={isAdmin}'),
      'HeaderHUD must pass isAdmin prop to NotificationDrawer'
    );
    assert.ok(
      content.includes('<NotificationBell') && content.includes('unreadCount={unreadCount}'),
      'HeaderHUD NotificationBell must receive total unreadCount'
    );
  });

  it('types and api client support NotificationScope and scoped unread envelope', () => {
    const typesPath = path.resolve(__dirname, '../types/notification.ts');
    const typesContent = fs.readFileSync(typesPath, 'utf8');

    assert.ok(
      typesContent.includes("export type NotificationScope = 'all' | 'learner' | 'admin';"),
      'types/notification.ts must define NotificationScope'
    );
    assert.ok(
      typesContent.includes('learner_unread_count?: number;') &&
        typesContent.includes('admin_unread_count?: number;'),
      'types/notification.ts must define scoped breakdown in UnreadCountResponse'
    );

    const apiPath = path.resolve(__dirname, '../lib/api/notifications.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf8');

    assert.ok(
      apiContent.includes("scope: NotificationScope = 'all'"),
      'api/notifications.ts fetchNotifications must accept scope parameter'
    );
    assert.ok(
      apiContent.includes('markAllNotificationsAsRead(') &&
        apiContent.includes("scope: NotificationScope = 'all'"),
      'api/notifications.ts markAllNotificationsAsRead must accept scope parameter'
    );
  });
});
