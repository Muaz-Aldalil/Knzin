'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CourseData } from '@/components/catalog/CourseCard';
import { CoursePartData } from '@/components/catalog/CoursePartList';
import { DETAILED_COURSES_MOCK, FALLBACK_COURSES } from '@/data/mock-courses';

export interface DetailedCourse extends CourseData {
  parts: CoursePartData[];
  outcomes?: any[];
  curriculum_summary_ar?: string | null;
  curriculum_summary_en?: string | null;
}

export function useCatalog(initialCourses?: CourseData[]) {
  const coursesQuery = useQuery<CourseData[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const result = await apiClient<CourseData[]>('/catalog/courses');
        if (Array.isArray(result) && result.length > 0) {
          return result;
        }
        return FALLBACK_COURSES;
      } catch (err) {
        console.warn('Catalog API unreachable, using fallback courses', err);
        return FALLBACK_COURSES;
      }
    },
    initialData: initialCourses && initialCourses.length > 0 ? initialCourses : FALLBACK_COURSES,
    staleTime: 5 * 60 * 1000,
  });

  return {
    courses: coursesQuery.data ?? initialCourses ?? FALLBACK_COURSES,
    isLoading: coursesQuery.isLoading && !initialCourses,
    isError: coursesQuery.isError,
    error: coursesQuery.error,
    refetch: coursesQuery.refetch,
  };
}

export function useCourseDetail(slug: string, initialCourse?: DetailedCourse) {
  const fallback = DETAILED_COURSES_MOCK.find((c) => c.slug === slug);
  return useQuery<DetailedCourse>({
    queryKey: ['course', slug],
    queryFn: async () => {
      try {
        const result = await apiClient<DetailedCourse>(`/catalog/courses/${slug}`);
        if (result && result.slug === slug) {
          return result;
        }
        if (fallback) return fallback;
        throw new Error('Course not found');
      } catch (err) {
        if (fallback) return fallback;
        throw err;
      }
    },
    enabled: !!slug,
    initialData: initialCourse ?? fallback,
    staleTime: 5 * 60 * 1000,
  });
}
