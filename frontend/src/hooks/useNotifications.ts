'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/api/notifications';
import {
  NotificationsResponse,
  UnreadCountResponse,
  NotificationItem,
} from '@/types/notification';

export function useNotifications(page = 1, perPage = 15, filter: 'all' | 'unread' = 'all') {
  const queryClient = useQueryClient();
  const hasToken =
    typeof window !== 'undefined'
      ? !!localStorage.getItem('knzin_auth_token')
      : false;

  // 1. Inbox query
  const inboxQuery = useQuery<NotificationsResponse>({
    queryKey: ['notifications', page, perPage, filter],
    queryFn: () => fetchNotifications(page, perPage, filter),
    enabled: hasToken,
    staleTime: 15000,
  });

  // 2. Unread count query (for header HUD badge)
  const unreadCountQuery = useQuery<UnreadCountResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => fetchUnreadCount(),
    enabled: hasToken,
    staleTime: 30000,
    refetchInterval: 60000, // Poll every 60s in background
  });

  // 3. Mark single notification as read mutation with optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const prevUnread = queryClient.getQueryData<UnreadCountResponse>([
        'notifications',
        'unread-count',
      ]);
      const prevInbox = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        page,
        perPage,
        filter,
      ]);

      // Optimistically decrement unread count
      if (prevUnread) {
        const currentCount =
          typeof prevUnread.unread_count === 'number'
            ? prevUnread.unread_count
            : prevUnread.data?.unread_count ?? 0;
        const newCount = Math.max(0, currentCount - 1);

        queryClient.setQueryData<UnreadCountResponse>(
          ['notifications', 'unread-count'],
          {
            unread_count: newCount,
            data: { unread_count: newCount },
          }
        );
      }

      // Optimistically mark item as read in current page cache
      if (prevInbox) {
        if (Array.isArray(prevInbox)) {
          queryClient.setQueryData(
            ['notifications', page, perPage, filter],
            prevInbox.map((item: NotificationItem) =>
              item.id === id
                ? { ...item, is_read: true, read_at: new Date().toISOString() }
                : item
            )
          );
        } else if (Array.isArray((prevInbox as any).data)) {
          queryClient.setQueryData<NotificationsResponse>(
            ['notifications', page, perPage, filter],
            {
              ...prevInbox,
              data: (prevInbox as any).data.map((item: NotificationItem) =>
                item.id === id
                  ? { ...item, is_read: true, read_at: new Date().toISOString() }
                  : item
              ),
            }
          );
        }
      }

      return { prevUnread, prevInbox };
    },
    onError: (_err, _id, context) => {
      if (context?.prevUnread) {
        queryClient.setQueryData(
          ['notifications', 'unread-count'],
          context.prevUnread
        );
      }
      if (context?.prevInbox) {
        queryClient.setQueryData(
          ['notifications', page, perPage, filter],
          context.prevInbox
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 4. Mark all as read mutation with optimistic update
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const prevUnread = queryClient.getQueryData<UnreadCountResponse>([
        'notifications',
        'unread-count',
      ]);
      const prevInbox = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        page,
        perPage,
        filter,
      ]);

      // Optimistically set unread count to 0
      queryClient.setQueryData<UnreadCountResponse>(
        ['notifications', 'unread-count'],
        {
          unread_count: 0,
          data: { unread_count: 0 },
        }
      );

      // Optimistically mark all items as read
      if (prevInbox) {
        if (Array.isArray(prevInbox)) {
          queryClient.setQueryData(
            ['notifications', page, perPage, filter],
            prevInbox.map((item: NotificationItem) => ({
              ...item,
              is_read: true,
              read_at: item.read_at || new Date().toISOString(),
            }))
          );
        } else if (Array.isArray((prevInbox as any).data)) {
          queryClient.setQueryData<NotificationsResponse>(
            ['notifications', page, perPage, filter],
            {
              ...prevInbox,
              data: (prevInbox as any).data.map((item: NotificationItem) => ({
                ...item,
                is_read: true,
                read_at: item.read_at || new Date().toISOString(),
              })),
            }
          );
        }
      }

      return { prevUnread, prevInbox };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevUnread) {
        queryClient.setQueryData(
          ['notifications', 'unread-count'],
          context.prevUnread
        );
      }
      if (context?.prevInbox) {
        queryClient.setQueryData(
          ['notifications', page, perPage, filter],
          context.prevInbox
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const rawUnread = unreadCountQuery.data as any;
  const unreadCount: number =
    typeof rawUnread?.unread_count === 'number'
      ? rawUnread.unread_count
      : typeof rawUnread?.data?.unread_count === 'number'
        ? rawUnread.data.unread_count
        : typeof rawUnread === 'number'
          ? rawUnread
          : 0;

  const rawInbox = inboxQuery.data as any;
  const notificationsList: NotificationItem[] = Array.isArray(rawInbox)
    ? rawInbox
    : Array.isArray(rawInbox?.data)
      ? rawInbox.data
      : [];

  const metaData = Array.isArray(rawInbox)
    ? undefined
    : rawInbox?.meta;

  return {
    notifications: notificationsList,
    meta: metaData,
    isLoading: inboxQuery.isLoading,
    isError: inboxQuery.isError,
    unreadCount,
    isLoadingUnreadCount: unreadCountQuery.isLoading,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refetch: inboxQuery.refetch,
    refetchUnreadCount: unreadCountQuery.refetch,
  };
}
