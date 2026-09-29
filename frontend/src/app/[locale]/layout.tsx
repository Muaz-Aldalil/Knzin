import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import QueryProvider from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import HeaderHUD from '@/components/layout/HeaderHUD';
import '../globals.css';

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

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Anti-flash theme initialization */}
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
      <body className="min-h-screen bg-app-bg text-content-primary antialiased flex flex-col font-sans transition-colors duration-200">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <HeaderHUD />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
              <footer className="w-full bg-slate-100 dark:bg-[#050b14] border-t border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 py-6 text-center text-xs transition-colors">
                <div className="max-w-7xl mx-auto px-4">
                  <p>© 2026 كَنزين (KNZiN). جميع الحقوق محفوظة. منصة تعليمية مهنية مرخصة في العراق.</p>
                  <p className="mt-1 text-slate-500">
                    تذاكر السحب المرفقة مع الدورات هي هدايا ترويجية مجانية غير قابلة للاستبدال أو الاسترداد المالي.
                  </p>
                </div>
              </footer>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
