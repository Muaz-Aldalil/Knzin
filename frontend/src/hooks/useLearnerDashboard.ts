'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface DashboardSummary {
  enrolled_courses_count: number;
  completed_courses_count: number;
  total_tickets_count: number;
}

export interface ActiveLearningItem {
  course_slug: string;
  course_title_ar: string;
  course_title_en: string;
  cover_image_url: string;
  part_number: number;
  part_title_ar: string;
  part_title_en: string;
  watch_seconds: number;
  percent_complete: number;
  is_completed: boolean;
  last_watched_at: string;
}

export interface EnrolledCourseItem {
  course_id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  cover_image_url: string;
  entitlement_type: 'bundle' | 'part';
  owned_parts_count: number;
  total_active_parts: number;
  completed_parts_count: number;
  owned_scope_progress_percentage: number;
  overall_progress_percentage: number;
  is_course_completed: boolean;
  last_accessed_at: string;
}

export interface LearnerDashboardData {
  summary: DashboardSummary;
  active_learning: ActiveLearningItem | null;
  enrolled_courses: EnrolledCourseItem[];
}

export function useLearnerDashboard() {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('knzin_auth_token') : false;

  const query = useQuery<LearnerDashboardData, ApiError>({
    queryKey: ['learner', 'dashboard'],
    queryFn: () => apiClient<LearnerDashboardData>('/user/dashboard'),
    enabled: hasToken,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const isUnauthenticated = !hasToken || (query.error instanceof ApiError && query.error.httpStatus === 401);

  return {
    dashboard: query.data ?? null,
    summary: query.data?.summary ?? {
      enrolled_courses_count: 0,
      completed_courses_count: 0,
      total_tickets_count: 0,
    },
    activeLearning: query.data?.active_learning ?? null,
    enrolledCourses: query.data?.enrolled_courses ?? [],
    isEmpty: query.isSuccess && (!query.data?.enrolled_courses || query.data.enrolled_courses.length === 0),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isUnauthenticated,
    refetch: query.refetch,
  };
}
