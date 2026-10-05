import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Tajawal } from 'next/font/google';
import { routing } from '@/i18n/routing';
import QueryProvider from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import NavigationProgressBar from '@/components/layout/NavigationProgressBar';
import { SiteFrame } from '@/components/layout/SiteFrame';

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('knzin_theme');
                  var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${tajawal.className} min-h-screen bg-app-bg text-content-primary antialiased flex flex-col font-sans transition-colors duration-200 overflow-x-clip`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <NavigationProgressBar />
              <SiteFrame>
                {children}
              </SiteFrame>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
