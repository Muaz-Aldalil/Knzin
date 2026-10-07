import { CourseData } from '@/components/catalog/CourseCard';
import { DetailedCourse } from '@/hooks/useCatalog';
import { DETAILED_COURSES_MOCK, FALLBACK_COURSES } from '@/data/mock-courses';

export { FALLBACK_COURSES, DETAILED_COURSES_MOCK };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
const isProduction = process.env.NODE_ENV === 'production';
const isCIOrNetlify = Boolean(process.env.NETLIFY || process.env.CI);

/**
 * Fetch catalog courses on the server with Next.js Data Cache (revalidate every 5 mins).
 * Falls back gracefully during local development, but guards against silent mock publishing in production.
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
      if (isProduction && isCIOrNetlify) {
        throw new Error(`[Build Guard] Failed to fetch production catalog from ${API_BASE_URL}/catalog/courses: HTTP ${res.status}`);
      }
      return FALLBACK_COURSES;
    }

    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }

    if (isProduction && isCIOrNetlify) {
      throw new Error(`[Build Guard] Catalog API returned empty data. Refusing to publish mock data in production.`);
    }

    return FALLBACK_COURSES;
  } catch (error) {
    if (isProduction && isCIOrNetlify) {
      console.error('[server-catalog] Production build catalog fetch error:', error);
      throw error;
    }
    // Graceful fallback during offline local development
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
      if (isProduction && isCIOrNetlify) {
        throw new Error(`[Build Guard] Failed to fetch course detail for slug "${slug}" from ${API_BASE_URL}: HTTP ${res.status}`);
      }
      const detailedFallback = DETAILED_COURSES_MOCK.find((c) => c.slug === slug);
      return detailedFallback || null;
    }

    const json = await res.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }

    const detailedFallback = DETAILED_COURSES_MOCK.find((c) => c.slug === slug);
    return detailedFallback || null;
  } catch (error) {
    if (isProduction && isCIOrNetlify) {
      console.error(`[server-catalog] Production build course detail error for slug "${slug}":`, error);
      throw error;
    }
    const detailedFallback = DETAILED_COURSES_MOCK.find((c) => c.slug === slug);
    return detailedFallback || null;
  }
}
