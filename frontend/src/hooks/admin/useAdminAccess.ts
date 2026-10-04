'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminCapabilities } from '@/lib/admin/access';
import { AdminCapability } from '@/types/admin';

/**
 * Lightweight, presentation-only admin check for the public navbar.
 *
 * Asks the backend (`/admin/me`) once per token; the token is part of the cache key so a
 * different account never reuses another account's result. This only decides which menu
 * to render; every admin route and API still enforces authorization server-side.
 */
export function useAdminAccess(token: string | null) {
  const query = useQuery<AdminCapability[] | null>({
    queryKey: ['admin', 'access', token],
    queryFn: fetchAdminCapabilities,
    enabled: !!token,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const capabilities = query.data ?? [];

  return {
    isAdmin: !!token && capabilities.length > 0,
    capabilities,
    isResolving: !!token && query.isLoading,
  };
}
