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
  NotificationScope,
} from '@/types/notification';

export function useNotifications(
  page = 1,
  perPage = 15,
  filter: 'all' | 'unread' = 'all',
  scope: NotificationScope = 'all'
) {
  const queryClient = useQueryClient();
  const hasToken =
    typeof window !== 'undefined'
      ? !!localStorage.getItem('knzin_auth_token')
      : false;

  // 1. Scoped Inbox query
  const inboxQuery = useQuery<NotificationsResponse>({
    queryKey: ['notifications', scope, page, perPage, filter],
    queryFn: () => fetchNotifications(page, perPage, filter, scope),
    enabled: hasToken,
    staleTime: 15000,
  });

  // 2. Unread count query (for header HUD bell badge & dual-persona tabs)
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
        scope,
        page,
        perPage,
        filter,
      ]);

      // Optimistically decrement unread count (total + scoped)
      if (prevUnread) {
        const currentTotal =
          typeof prevUnread.unread_count === 'number'
            ? prevUnread.unread_count
            : prevUnread.data?.unread_count ?? 0;
        const currentLearner =
          typeof prevUnread.learner_unread_count === 'number'
            ? prevUnread.learner_unread_count
            : prevUnread.data?.learner_unread_count ?? currentTotal;
        const currentAdmin =
          typeof prevUnread.admin_unread_count === 'number'
            ? prevUnread.admin_unread_count
            : prevUnread.data?.admin_unread_count ?? 0;

        // Check if target notification is admin category
        const items: NotificationItem[] = Array.isArray(prevInbox)
          ? prevInbox
          : (prevInbox as any)?.data ?? [];
        const item = items.find((i) => i.id === id);
        const isAdminCategory = item
          ? ['admin_sales', 'admin_ops'].includes(item.category)
          : scope === 'admin';

        const newTotal = Math.max(0, currentTotal - 1);
        const newLearner = !isAdminCategory
          ? Math.max(0, currentLearner - 1)
          : currentLearner;
        const newAdmin = isAdminCategory
          ? Math.max(0, currentAdmin - 1)
          : currentAdmin;

        queryClient.setQueryData<UnreadCountResponse>(
          ['notifications', 'unread-count'],
          {
            unread_count: newTotal,
            learner_unread_count: newLearner,
            admin_unread_count: newAdmin,
            data: {
              unread_count: newTotal,
              learner_unread_count: newLearner,
              admin_unread_count: newAdmin,
            },
          }
        );
      }

      // Optimistically mark item as read in current page cache
      if (prevInbox) {
        if (Array.isArray(prevInbox)) {
          queryClient.setQueryData(
            ['notifications', scope, page, perPage, filter],
            prevInbox.map((item: NotificationItem) =>
              item.id === id
                ? { ...item, is_read: true, read_at: new Date().toISOString() }
                : item
            )
          );
        } else if (Array.isArray((prevInbox as any).data)) {
          queryClient.setQueryData<NotificationsResponse>(
            ['notifications', scope, page, perPage, filter],
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
          ['notifications', scope, page, perPage, filter],
          context.prevInbox
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 4. Mark all as read mutation with optimistic update (scoped support)
  const markAllAsReadMutation = useMutation({
    mutationFn: (targetScope?: NotificationScope) =>
      markAllNotificationsAsRead(targetScope ?? scope),
    onMutate: async (targetScope?: NotificationScope) => {
      const activeScope = targetScope ?? scope;
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const prevUnread = queryClient.getQueryData<UnreadCountResponse>([
        'notifications',
        'unread-count',
      ]);
      const prevInbox = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        scope,
        page,
        perPage,
        filter,
      ]);

      if (prevUnread) {
        const currentTotal =
          typeof prevUnread.unread_count === 'number'
            ? prevUnread.unread_count
            : prevUnread.data?.unread_count ?? 0;
        const currentLearner =
          typeof prevUnread.learner_unread_count === 'number'
            ? prevUnread.learner_unread_count
            : prevUnread.data?.learner_unread_count ?? currentTotal;
        const currentAdmin =
          typeof prevUnread.admin_unread_count === 'number'
            ? prevUnread.admin_unread_count
            : prevUnread.data?.admin_unread_count ?? 0;

        let newTotal = currentTotal;
        let newLearner = currentLearner;
        let newAdmin = currentAdmin;

        if (activeScope === 'all') {
          newTotal = 0;
          newLearner = 0;
          newAdmin = 0;
        } else if (activeScope === 'admin') {
          newAdmin = 0;
          newTotal = Math.max(0, currentTotal - currentAdmin);
        } else if (activeScope === 'learner') {
          newLearner = 0;
          newTotal = Math.max(0, currentTotal - currentLearner);
        }

        queryClient.setQueryData<UnreadCountResponse>(
          ['notifications', 'unread-count'],
          {
            unread_count: newTotal,
            learner_unread_count: newLearner,
            admin_unread_count: newAdmin,
            data: {
              unread_count: newTotal,
              learner_unread_count: newLearner,
              admin_unread_count: newAdmin,
            },
          }
        );
      }

      // Optimistically mark all items as read in current scope cache
      if (prevInbox) {
        if (Array.isArray(prevInbox)) {
          queryClient.setQueryData(
            ['notifications', scope, page, perPage, filter],
            prevInbox.map((item: NotificationItem) => ({
              ...item,
              is_read: true,
              read_at: item.read_at || new Date().toISOString(),
            }))
          );
        } else if (Array.isArray((prevInbox as any).data)) {
          queryClient.setQueryData<NotificationsResponse>(
            ['notifications', scope, page, perPage, filter],
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
          ['notifications', scope, page, perPage, filter],
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

  const learnerUnreadCount: number =
    typeof rawUnread?.learner_unread_count === 'number'
      ? rawUnread.learner_unread_count
      : typeof rawUnread?.data?.learner_unread_count === 'number'
        ? rawUnread.data.learner_unread_count
        : unreadCount;

  const adminUnreadCount: number =
    typeof rawUnread?.admin_unread_count === 'number'
      ? rawUnread.admin_unread_count
      : typeof rawUnread?.data?.admin_unread_count === 'number'
        ? rawUnread.data.admin_unread_count
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
    learnerUnreadCount,
    adminUnreadCount,
    isLoadingUnreadCount: unreadCountQuery.isLoading,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refetch: inboxQuery.refetch,
    refetchUnreadCount: unreadCountQuery.refetch,
  };
}
