import { redirect } from '@/i18n/routing';

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  redirect({ href: '/dashboard', locale });
}
