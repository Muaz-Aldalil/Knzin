import { redirect } from '@/i18n/routing';

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersIndexPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  redirect({ href: '/dashboard', locale });
}
