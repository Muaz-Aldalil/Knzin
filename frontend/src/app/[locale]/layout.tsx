import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import QueryProvider from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import HeaderHUD from '@/components/layout/HeaderHUD';

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
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = '${locale}'; document.documentElement.dir = '${locale === 'ar' ? 'rtl' : 'ltr'}';`,
        }}
      />
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
    </>
  );
}
