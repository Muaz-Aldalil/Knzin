'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CourseData } from '@/components/catalog/CourseCard';
import { CoursePartData } from '@/components/catalog/CoursePartList';

export interface DetailedCourse extends CourseData {
  parts: CoursePartData[];
}

export function useCatalog(initialCourses?: CourseData[]) {
  const coursesQuery = useQuery<CourseData[]>({
    queryKey: ['courses'],
    queryFn: () => apiClient<CourseData[]>('/catalog/courses'),
    initialData: initialCourses,
    staleTime: 5 * 60 * 1000,
  });

  return {
    courses: coursesQuery.data ?? initialCourses ?? [],
    isLoading: coursesQuery.isLoading && !initialCourses,
    isError: coursesQuery.isError,
    error: coursesQuery.error,
    refetch: coursesQuery.refetch,
  };
}

export function useCourseDetail(slug: string, initialCourse?: DetailedCourse) {
  return useQuery<DetailedCourse>({
    queryKey: ['course', slug],
    queryFn: () => apiClient<DetailedCourse>(`/catalog/courses/${slug}`),
    enabled: !!slug,
    initialData: initialCourse,
    staleTime: 5 * 60 * 1000,
  });
}
