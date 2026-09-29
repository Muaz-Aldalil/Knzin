import { CourseData } from '@/components/catalog/CourseCard';
import { DetailedCourse } from '@/hooks/useCatalog';
import { DETAILED_COURSES_MOCK, FALLBACK_COURSES } from '@/data/mock-courses';

export { FALLBACK_COURSES, DETAILED_COURSES_MOCK };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Fetch catalog courses on the server with Next.js Data Cache (revalidate every 5 mins).
 * Falls back gracefully to static catalog if backend is unavailable.
 */
export async function getCatalogCoursesServer(): Promise<CourseData[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/catalog/courses`, {
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return FALLBACK_COURSES;
    }

    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }

    return FALLBACK_COURSES;
  } catch {
    // Graceful fallback during offline builds or temporary backend disconnection
    return FALLBACK_COURSES;
  }
}

/**
 * Fetch detailed course by slug on the server with Next.js Data Cache.
 */
export async function getCourseDetailServer(slug: string): Promise<DetailedCourse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/catalog/courses/${slug}`, {
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const detailedFallback = DETAILED_COURSES_MOCK.find((c) => c.slug === slug);
      if (detailedFallback) {
        return detailedFallback;
      }
      return null;
    }

    const json = await res.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }

    const detailedFallback = DETAILED_COURSES_MOCK.find((c) => c.slug === slug);
    return detailedFallback || null;
  } catch {
    const detailedFallback = DETAILED_COURSES_MOCK.find((c) => c.slug === slug);
    return detailedFallback || null;
  }
}
