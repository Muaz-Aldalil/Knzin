import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Tajawal } from 'next/font/google';
import { routing } from '@/i18n/routing';
import QueryProvider from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import HeaderHUD from '@/components/layout/HeaderHUD';
import { ActivityTicker } from '@/components/layout/ActivityTicker';
import { FloatingWhatsAppButton } from '@/components/layout/FloatingWhatsAppButton';
import NavigationProgressBar from '@/components/layout/NavigationProgressBar';
import Footer from '@/components/layout/Footer';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'كَنزين | منصة الدورات المهنية والجوائز الترويجية',
  description: 'تعلم مهناً عملية واكتسب مهارات حقيقية في السوق العراقي واحصل على تذاكر سحب ترويجية مجانية مع كل دورة.',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className={tajawal.variable} suppressHydrationWarning>
      <body className={`${tajawal.className} min-h-screen bg-app-bg text-content-primary antialiased flex flex-col font-sans transition-colors duration-200`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <NavigationProgressBar />
              <HeaderHUD />
              <ActivityTicker />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
                {children}
              </main>
              <Footer />
              <FloatingWhatsAppButton />
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
