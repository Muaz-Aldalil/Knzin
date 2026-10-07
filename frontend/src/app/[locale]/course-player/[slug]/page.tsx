import { redirect } from '@/i18n/routing';

interface CoursePlayerRedirectProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CoursePlayerRedirectPage({ params }: CoursePlayerRedirectProps) {
  const { locale, slug } = await params;
  redirect({ href: `/lessons/${slug}` as any, locale });
}
