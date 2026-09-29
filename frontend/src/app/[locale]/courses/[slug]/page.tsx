import { setRequestLocale } from 'next-intl/server';
import { getCourseDetailServer } from '@/lib/server-catalog';
import CourseDetailClientView from '@/components/course/CourseDetailClientView';

export function generateStaticParams() {
  return [
    { slug: 'freelance-design' },
    { slug: 'phone-repair' },
    { slug: 'auto-detailing' },
  ];
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
