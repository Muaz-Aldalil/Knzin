/**
 * Feature 009: Notifications TypeScript Types
 * Generated from specs/009-notifications/contracts/notifications.openapi.yml
 */

export type NotificationCategory =
  | 'transactional'
  | 'course_announcements'
  | 'prize_draw_promotions'
  | 'admin_broadcasts'
  | 'admin_sales'
  | 'admin_ops';

export type NotificationScope = 'all' | 'learner' | 'admin';

export type NotificationActionType = 'navigate' | 'refresh_course';

export interface NotificationMetadata {
  course_slug?: string;
  content_version?: number;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  action_type: NotificationActionType;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata?: NotificationMetadata | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  course_announcements: boolean;
  prize_draw_promotions: boolean;
  admin_broadcasts: boolean;
  is_unsubscribed_from_all?: boolean;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  meta: PaginationMeta;
}

export interface UnreadCountResponse {
  unread_count?: number;
  learner_unread_count?: number;
  admin_unread_count?: number;
  data?: {
    unread_count: number;
    learner_unread_count?: number;
    admin_unread_count?: number;
  };
}

export interface NotificationActionResponse {
  status: 'success' | 'fail';
  message: string;
  data?: NotificationItem;
}

export interface NotificationPreferencesResponse {
  status: 'success';
  data: NotificationPreferences;
}
