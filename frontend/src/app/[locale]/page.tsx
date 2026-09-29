import { setRequestLocale } from 'next-intl/server';
import { getCatalogCoursesServer } from '@/lib/server-catalog';
import CatalogClientView from '@/components/catalog/CatalogClientView';

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const courses = await getCatalogCoursesServer();

  return <CatalogClientView initialCourses={courses} />;
}
