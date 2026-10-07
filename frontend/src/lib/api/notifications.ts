import { apiClient } from '../api-client';
import {
  NotificationsResponse,
  UnreadCountResponse,
  NotificationActionResponse,
  NotificationPreferencesResponse,
  NotificationPreferences,
  NotificationScope,
} from '@/types/notification';

/**
 * Fetch paginated in-app notifications.
 */
export async function fetchNotifications(
  page = 1,
  perPage = 15,
  filter: 'all' | 'unread' = 'all',
  scope: NotificationScope = 'all'
): Promise<NotificationsResponse> {
  const scopeQuery = scope !== 'all' ? `&scope=${scope}` : '';
  return apiClient<NotificationsResponse>(
    `/notifications?page=${page}&per_page=${perPage}&filter=${filter}${scopeQuery}`,
    { method: 'GET' }
  );
}

/**
 * Fetch real-time count of unread notifications for badge calculation.
 */
export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  return apiClient<UnreadCountResponse>('/notifications/unread-count', {
    method: 'GET',
  });
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(
  id: string
): Promise<NotificationActionResponse> {
  return apiClient<NotificationActionResponse>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all user notifications as read in a single action (optionally scoped).
 */
export async function markAllNotificationsAsRead(
  scope: NotificationScope = 'all'
): Promise<{
  status: string;
  message: string;
}> {
  const scopeQuery = scope !== 'all' ? `?scope=${scope}` : '';
  return apiClient<{ status: string; message: string }>(
    `/notifications/mark-all-read${scopeQuery}`,
    { method: 'POST' }
  );
}

/**
 * Fetch user notification preferences for marketing categories.
 */
export async function fetchNotificationPreferences(): Promise<NotificationPreferencesResponse> {
  return apiClient<NotificationPreferencesResponse>('/notifications/preferences', {
    method: 'GET',
  });
}

/**
 * Update user notification preferences.
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferencesResponse> {
  return apiClient<NotificationPreferencesResponse>('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}
