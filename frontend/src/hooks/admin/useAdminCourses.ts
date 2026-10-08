'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { AdminCourse, AdminCoursePart, OutcomeItem } from '@/types/admin';

export interface AdminCourseListResponse {
  items: AdminCourse[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  kpis: {
    total_courses: number;
    active_courses: number;
    total_parts: number;
  };
}

export interface CreateCoursePayload {
  title_ar: string;
  title_en: string;
  slug?: string;
  description_ar: string;
  description_en: string;
  cover_image_url?: string;
  bundle_price_cents: number;
  bundle_promotional_tickets?: number;
  display_price_label?: string;
  is_active?: boolean;
  curriculum_summary_ar?: string;
  curriculum_summary_en?: string;
  outcomes?: OutcomeItem[];
}

export interface UpdateCoursePayload {
  title_ar?: string;
  title_en?: string;
  slug?: string;
  description_ar?: string;
  description_en?: string;
  cover_image_url?: string;
  bundle_price_cents?: number;
  bundle_promotional_tickets?: number;
  display_price_label?: string;
  is_active?: boolean;
  curriculum_summary_ar?: string;
  curriculum_summary_en?: string;
  outcomes?: OutcomeItem[];
}

export interface CreateCoursePartPayload {
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  part_number?: number;
  duration_minutes?: number;
  video_url?: string;
  video_storage_path?: string;
  pdf_url?: string;
  pdf_storage_path?: string;
  pdf_title_ar?: string;
  pdf_title_en?: string;
  is_free?: boolean;
  is_active?: boolean;
}

export interface UpdateCoursePartPayload {
  title_ar?: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  part_number?: number;
  duration_minutes?: number;
  video_url?: string;
  video_storage_path?: string;
  pdf_url?: string;
  pdf_storage_path?: string;
  pdf_title_ar?: string;
  pdf_title_en?: string;
  is_free?: boolean;
  is_active?: boolean;
}

export function useAdminCourses(
  search?: string,
  isActive?: boolean | string,
  page: number = 1,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  const query = useQuery<AdminCourseListResponse, ApiError>({
    queryKey: ['admin', 'courses', search, isActive, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (search && search.trim() !== '') {
        params.append('search', search.trim());
      }
      if (isActive !== undefined && isActive !== 'all' && isActive !== '') {
        params.append('is_active', String(isActive));
      }
      return apiClient<AdminCourseListResponse>(`/admin/courses?${params.toString()}`);
    },
    enabled,
    staleTime: 15 * 1000,
  });

  const createMutation = useMutation<AdminCourse, ApiError, CreateCoursePayload>({
    mutationFn: (payload) =>
      apiClient<AdminCourse>('/admin/courses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return {
    courses: query.data?.items ?? [],
    pagination: query.data?.pagination,
    kpis: query.data?.kpis,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createCourse: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useAdminCourseDetail(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery<AdminCourse, ApiError>({
    queryKey: ['admin', 'course', id],
    queryFn: () => apiClient<AdminCourse>(`/admin/courses/${id}`),
    enabled: !!id,
    staleTime: 10 * 1000,
  });

  const updateMutation = useMutation<AdminCourse, ApiError, UpdateCoursePayload>({
    mutationFn: (payload) =>
      apiClient<AdminCourse>(`/admin/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'course', id], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['course', data.slug] });
    },
  });

  const toggleStatusMutation = useMutation<AdminCourse, ApiError, void>({
    mutationFn: () =>
      apiClient<AdminCourse>(`/admin/courses/${id}/toggle-status`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'course', id], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const deleteMutation = useMutation<{ action_taken: string; message: string }, ApiError, void>({
    mutationFn: () =>
      apiClient<{ action_taken: string; message: string }>(`/admin/courses/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const createPartMutation = useMutation<AdminCoursePart, ApiError, CreateCoursePartPayload>({
    mutationFn: (payload) =>
      apiClient<AdminCoursePart>(`/admin/courses/${id}/parts`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const updatePartMutation = useMutation<
    AdminCoursePart,
    ApiError,
    { partId: string; data: UpdateCoursePartPayload }
  >({
    mutationFn: ({ partId, data }) =>
      apiClient<AdminCoursePart>(`/admin/courses/${id}/parts/${partId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const deletePartMutation = useMutation<
    { action_taken: string; message: string },
    ApiError,
    string | { partId: string; force?: boolean }
  >({
    mutationFn: (args) => {
      const partId = typeof args === 'string' ? args : args.partId;
      const force = typeof args === 'string' ? false : !!args.force;
      return apiClient<{ action_taken: string; message: string }>(
        `/admin/courses/${id}/parts/${partId}${force ? '?force=1' : ''}`,
        {
          method: 'DELETE',
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const restorePartMutation = useMutation<AdminCoursePart, ApiError, string>({
    mutationFn: (partId) =>
      apiClient<AdminCoursePart>(`/admin/courses/${id}/parts/${partId}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const reorderPartsMutation = useMutation<AdminCoursePart[], ApiError, string[]>({
    mutationFn: (partIds) =>
      apiClient<AdminCoursePart[]>(`/admin/courses/${id}/parts/reorder`, {
        method: 'POST',
        body: JSON.stringify({ part_ids: partIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  return {
    course: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateCourse: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleStatus: toggleStatusMutation.mutateAsync,
    isTogglingStatus: toggleStatusMutation.isPending,
    deleteCourse: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    createPart: createPartMutation.mutateAsync,
    isCreatingPart: createPartMutation.isPending,
    updatePart: updatePartMutation.mutateAsync,
    isUpdatingPart: updatePartMutation.isPending,
    deletePart: deletePartMutation.mutateAsync,
    isDeletingPart: deletePartMutation.isPending,
    restorePart: restorePartMutation.mutateAsync,
    isRestoringPart: restorePartMutation.isPending,
    reorderParts: reorderPartsMutation.mutateAsync,
    isReorderingParts: reorderPartsMutation.isPending,
  };
}
