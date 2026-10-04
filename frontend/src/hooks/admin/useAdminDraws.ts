'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { DrawRecord, PrizeRecord } from '@/types/admin';

export interface CreateDrawPayload {
  tier: 'hourly' | 'daily' | 'monthly';
  execution_type: 'automated_electronic' | 'live_broadcast';
  title_ar: string;
  title_en: string;
  starts_at: string;
  ends_at: string;
  scheduled_at?: string;
}

export interface UpdateDrawPayload {
  title_ar?: string;
  title_en?: string;
  starts_at?: string;
  ends_at?: string;
  scheduled_at?: string;
  status?: string;
}

export interface CreatePrizePayload {
  title_ar: string;
  title_en: string;
  category: 'cash' | 'merchandise';
  retail_value_usd_cents: number;
  display_iqd_label?: string;
  rank_order: number;
  image_url?: string;
}

export interface SetWinnerPayload {
  winner_masked_name?: string;
  winner_governorate?: string;
  prize_delivered?: boolean;
  stream_recording_url?: string;
}

export function useAdminDraws(status?: string, published?: boolean | string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery<{ items: DrawRecord[]; next_cursor: string | null }, ApiError>({
    queryKey: ['admin', 'draws', status, published],
    queryFn: () => {
      const params = new URLSearchParams({ per_page: '25' });
      if (status && status !== 'all') {
        params.append('status', status);
      }
      if (published !== undefined && published !== 'all') {
        params.append('published', String(published));
      }
      return apiClient<{ items: DrawRecord[]; next_cursor: string | null }>(
        `/admin/draws?${params.toString()}`
      );
    },
    enabled,
    staleTime: 15 * 1000,
  });

  const createMutation = useMutation<DrawRecord, ApiError, CreateDrawPayload>({
    mutationFn: (payload) =>
      apiClient<DrawRecord>('/admin/draws', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'draws'] });
    },
  });

  return {
    draws: query.data?.items ?? [],
    nextCursor: query.data?.next_cursor ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createDraw: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useAdminDrawDetail(id: string | number) {
  const queryClient = useQueryClient();

  const query = useQuery<DrawRecord, ApiError>({
    queryKey: ['admin', 'draw', String(id)],
    queryFn: () => apiClient<DrawRecord>(`/admin/draws/${id}`),
    enabled: !!id,
    staleTime: 10 * 1000,
  });

  const updateMutation = useMutation<DrawRecord, ApiError, UpdateDrawPayload>({
    mutationFn: (payload) =>
      apiClient<DrawRecord>(`/admin/draws/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'draw', String(id)], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'draws'] });
    },
  });

  const publishMutation = useMutation<DrawRecord, ApiError, void>({
    mutationFn: () =>
      apiClient<DrawRecord>(`/admin/draws/${id}/publish`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'draw', String(id)], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'draws'] });
      queryClient.invalidateQueries({ queryKey: ['draws'] });
    },
  });

  const completeMutation = useMutation<DrawRecord, ApiError, void>({
    mutationFn: () =>
      apiClient<DrawRecord>(`/admin/draws/${id}/complete`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'draw', String(id)], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'draws'] });
      queryClient.invalidateQueries({ queryKey: ['draws'] });
    },
  });

  const addPrizeMutation = useMutation<PrizeRecord, ApiError, CreatePrizePayload>({
    mutationFn: (payload) =>
      apiClient<PrizeRecord>(`/admin/draws/${id}/prizes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      query.refetch();
    },
  });

  const updatePrizeMutation = useMutation<PrizeRecord, ApiError, { prizeId: number | string; payload: Partial<CreatePrizePayload> }>({
    mutationFn: ({ prizeId, payload }) =>
      apiClient<PrizeRecord>(`/admin/prizes/${prizeId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      query.refetch();
    },
  });

  const deletePrizeMutation = useMutation<void, ApiError, number | string>({
    mutationFn: (prizeId) =>
      apiClient<void>(`/admin/prizes/${prizeId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      query.refetch();
    },
  });

  const updateWinnerMutation = useMutation<any, ApiError, Partial<SetWinnerPayload>>({
    mutationFn: (payload) =>
      apiClient<any>(`/admin/draws/${id}/winner`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      query.refetch();
    },
  });

  return {
    draw: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateDraw: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    publishDraw: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    completeDraw: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    addPrize: addPrizeMutation.mutateAsync,
    isAddingPrize: addPrizeMutation.isPending,
    updatePrize: updatePrizeMutation.mutateAsync,
    deletePrize: deletePrizeMutation.mutateAsync,
    setWinner: updateWinnerMutation.mutateAsync,
    isSettingWinner: updateWinnerMutation.isPending,
  };
}
