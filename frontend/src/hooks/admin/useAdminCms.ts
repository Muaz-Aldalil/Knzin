'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { CmsSectionName, CmsSectionEnvelope, PublicLandingCmsData, SiteWideCmsData } from '@/types/cms';

export function useAdminCmsSection<T = any>(section: CmsSectionName, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery<CmsSectionEnvelope<T>, ApiError>({
    queryKey: ['admin', 'cms', section],
    queryFn: () => apiClient<CmsSectionEnvelope<T>>(`/admin/cms/landing/${section}`),
    enabled,
    staleTime: 10 * 1000,
  });

  const mutation = useMutation<CmsSectionEnvelope<T>, ApiError, Partial<T>>({
    mutationFn: (payload) =>
      apiClient<CmsSectionEnvelope<T>>(`/admin/cms/landing/${section}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'cms', section], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'landing', 'cms'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'site-wide', 'cms'] });
    },
  });

  return {
    sectionData: query.data ?? null,
    content: (query.data?.content ?? null) as T | null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateContent: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    isSuccess: mutation.isSuccess,
    refetch: query.refetch,
  };
}

export function useSiteWideCms() {
  const [displayedData, setDisplayedData] = useState<SiteWideCmsData | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  const query = useQuery<SiteWideCmsData, ApiError>({
    queryKey: ['public', 'site-wide', 'cms'],
    queryFn: () => apiClient<SiteWideCmsData>('/content/site-wide'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data && !displayedData) {
      setDisplayedData(query.data);
    } else if (query.data && displayedData) {
      const currentJson = JSON.stringify(displayedData.sections);
      const newJson = JSON.stringify(query.data.sections);
      if (currentJson !== newJson) {
        setHasUpdate(true);
      }
    }
  }, [query.data, displayedData]);

  const applyUpdate = () => {
    if (query.data) {
      setDisplayedData(query.data);
      setHasUpdate(false);
    }
  };

  const dismissUpdate = () => {
    setHasUpdate(false);
  };

  return {
    ...query,
    data: displayedData || query.data,
    hasUpdate,
    applyUpdate,
    dismissUpdate,
  };
}

/**
 * Backward-compatible wrapper for existing components
 */
export function usePublicLandingCms() {
  const siteWide = useSiteWideCms();
  return {
    ...siteWide,
    data: siteWide.data as unknown as PublicLandingCmsData,
  };
}
