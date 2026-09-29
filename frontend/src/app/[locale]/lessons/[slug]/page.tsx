import { setRequestLocale } from 'next-intl/server';
import { getCourseDetailServer } from '@/lib/server-catalog';
import LessonPlayerClientView from '@/components/lesson/LessonPlayerClientView';

export function generateStaticParams() {
  return [
    { slug: 'freelance-design' },
    { slug: 'phone-repair' },
    { slug: 'auto-detailing' },
  ];
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const initialCourse = await getCourseDetailServer(slug);

  return <LessonPlayerClientView slug={slug} initialCourse={initialCourse} />;
}
