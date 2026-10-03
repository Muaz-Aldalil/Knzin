'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { AdminSession, AdminCapability } from '@/types/admin';
import { hasCapability } from '@/lib/admin/capabilities';

export function useAdminSession() {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('knzin_auth_token') : false;

  const query = useQuery<AdminSession, ApiError>({
    queryKey: ['admin', 'session'],
    queryFn: () => apiClient<AdminSession>('/admin/me'),
    enabled: hasToken,
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const session = query.data ?? null;
  const capabilities = session?.capabilities ?? [];
  const isAuthenticated = hasToken && !query.isError && !!session;
  const isUnauthenticated = !hasToken || (query.error instanceof ApiError && query.error.httpStatus === 401);
  const isForbidden = query.error instanceof ApiError && query.error.httpStatus === 403;

  const can = (required: AdminCapability | AdminCapability[]) => {
    return hasCapability(capabilities, required);
  };

  return {
    session,
    user: session?.user ?? null,
    capabilities,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isAuthenticated,
    isUnauthenticated,
    isForbidden,
    can,
    refetch: query.refetch,
  };
}
