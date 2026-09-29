import { setRequestLocale } from 'next-intl/server';
import { getCourseDetailServer, FALLBACK_COURSES } from '@/lib/server-catalog';
import CourseDetailClientView from '@/components/course/CourseDetailClientView';

export function generateStaticParams() {
  return FALLBACK_COURSES.map((course) => ({
    slug: course.slug,
  }));
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const initialCourse = await getCourseDetailServer(slug);

  return <CourseDetailClientView slug={slug} initialCourse={initialCourse} />;
}
