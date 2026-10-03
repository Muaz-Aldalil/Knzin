'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { AdminCapability } from '@/types/admin';

export interface UserItem {
  id: number;
  email: string;
  display_name: string | null;
  learner_code: string;
  status: 'active' | 'suspended';
  created_at: string;
  capabilities: AdminCapability[];
}

export interface UsersResponse {
  items: UserItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export function useAdminUsers(page = 1, search = '') {
  const queryClient = useQueryClient();

  const query = useQuery<UsersResponse, ApiError>({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
      });
      if (search.trim()) {
        params.append('search', search.trim());
      }
      return apiClient<UsersResponse>(`/admin/users?${params.toString()}`);
    },
    staleTime: 15 * 1000,
  });

  const grantMutation = useMutation<any, ApiError, { userId: number; capability: string; justification?: string }>({
    mutationFn: ({ userId, capability, justification }) =>
      apiClient<any>(`/admin/users/${userId}/capabilities`, {
        method: 'POST',
        body: JSON.stringify({ capability, justification }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const revokeMutation = useMutation<any, ApiError, { userId: number; capability: string; reason: string }>({
    mutationFn: ({ userId, capability, reason }) =>
      apiClient<any>(`/admin/users/${userId}/capabilities/${capability}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return {
    users: query.data?.items ?? [],
    meta: query.data?.meta ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    grantCapability: grantMutation.mutateAsync,
    isGranting: grantMutation.isPending,
    revokeCapability: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  };
}
