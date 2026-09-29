import { CourseData } from '@/components/catalog/CourseCard';
import { DetailedCourse } from '@/hooks/useCatalog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const FALLBACK_COURSES: CourseData[] = [
  {
    id: 'course-freelance-design',
    slug: 'freelance-design',
    title_ar: 'تصميم الجرافيك والعمل الحر',
    title_en: 'Graphic Design & Freelancing',
    description_ar: 'احترف أدوات التصميم العالمية وابنِ معرض أعمال يجذب العملاء في منصات العمل الحر العراقية والإقليمية.',
    description_en: 'Master international design tools and build a compelling portfolio that attracts clients on freelance platforms.',
    cover_image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1200',
    bundle_price_cents: 1000,
    bundle_promotional_tickets: 15,
    display_price_label: '13,000 IQD',
    parts_count: 6,
  },
  {
    id: 'course-phone-repair',
    slug: 'phone-repair',
    title_ar: 'صيانة الهواتف الذكية وبرمجتها',
    title_en: 'Smartphone Hardware & Software Repair',
    description_ar: 'دورة عملية شاملة في تشخيص أعطال الباور، تبديل الشاشات، وإصلاح اللوحات الإلكترونية مع معايير السلامة المهنية.',
    description_en: 'Comprehensive hands-on training in hardware diagnostics, screen replacement, and board repair.',
    cover_image_url: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80532e?auto=format&fit=crop&q=80&w=1200',
    bundle_price_cents: 1000,
    bundle_promotional_tickets: 15,
    display_price_label: '13,000 IQD',
    parts_count: 6,
  },
  {
    id: 'course-auto-detailing',
    slug: 'auto-detailing',
    title_ar: 'العناية بالسيارات والنانو سيراميك',
    title_en: 'Professional Auto Detailing & Ceramic Coating',
    description_ar: 'تعلم أسرار تصحيح الطلاء، إزالة الخدوش، وتطبيق طبقات الحماية النانوية الحديثة بأعلى معايير الورش الاحترافية.',
    description_en: 'Learn paint correction secrets, scratch removal, and professional nano-ceramic application.',
    cover_image_url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=1200',
    bundle_price_cents: 1000,
    bundle_promotional_tickets: 15,
    display_price_label: '13,000 IQD',
    parts_count: 6,
  },
];

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
    if (json.status === 'success' && Array.isArray(json.data)) {
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
      const fallback = FALLBACK_COURSES.find((c) => c.slug === slug);
      if (fallback) {
        return { ...fallback, parts: [] };
      }
      return null;
    }

    const json = await res.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }

    const fallback = FALLBACK_COURSES.find((c) => c.slug === slug);
    return fallback ? { ...fallback, parts: [] } : null;
  } catch {
    const fallback = FALLBACK_COURSES.find((c) => c.slug === slug);
    return fallback ? { ...fallback, parts: [] } : null;
  }
}
