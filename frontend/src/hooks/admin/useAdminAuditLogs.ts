'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface AuditLogItem {
  id: number;
  actor_id: number;
  actor: {
    id: number;
    email: string;
    display_name: string | null;
  } | null;
  action: string;
  capability_used: string;
  target_type: string;
  target_id: string;
  outcome: 'success' | 'failure';
  reason?: string | null;
  metadata?: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface AuditLogFilters {
  actor?: string;
  action?: string;
  target_type?: string;
  outcome?: string;
  cursor?: string | null;
}

export function useAdminAuditLogs(filters: AuditLogFilters = {}, enabled: boolean = true) {
  const query = useQuery<{ items: AuditLogItem[]; next_cursor: string | null }, ApiError>({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => {
      const params = new URLSearchParams({ per_page: '25' });
      if (filters.actor) params.append('actor', filters.actor);
      if (filters.action) params.append('action', filters.action);
      if (filters.target_type) params.append('target_type', filters.target_type);
      if (filters.outcome) params.append('outcome', filters.outcome);
      if (filters.cursor) params.append('cursor', filters.cursor);

      return apiClient<{ items: AuditLogItem[]; next_cursor: string | null }>(
        `/admin/audit-logs?${params.toString()}`
      );
    },
    enabled,
    staleTime: 15 * 1000,
  });

  return {
    logs: query.data?.items ?? [],
    nextCursor: query.data?.next_cursor ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
