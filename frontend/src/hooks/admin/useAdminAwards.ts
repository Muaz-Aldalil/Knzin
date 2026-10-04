'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface GrantAwardPayload {
  recipient_user_id: string | number;
  draw_id?: string | number;
  award_title: string;
  award_details?: string;
  valuation_usd_cents?: number;
  reason: string;
}

export function useAdminAwards() {
  const queryClient = useQueryClient();

  const grantMutation = useMutation<any, ApiError, GrantAwardPayload>({
    mutationFn: (payload) =>
      apiClient<any>('/admin/awards', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });

  return {
    grantAward: grantMutation.mutateAsync,
    isGranting: grantMutation.isPending,
    error: grantMutation.error,
  };
}
