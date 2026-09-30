import React from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import {
  Trophy,
  Ticket,
  ShieldCheck,
  Scale,
  Info,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';
import { CANONICAL_LEGAL_SHIELD } from '@/components/checkout/LegalShieldCheckbox';
import { DrawsArena } from '@/components/draws/DrawsArena';
import { WinnerKycCard } from '@/components/compliance/WinnerKycCard';

export default async function RafflePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isRtl = locale === 'ar';

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      {/* 3-Tier Promotional Draws Arena with Live Countdowns & Hall of Fame (Feature 003) */}
      <DrawsArena />

      <Separator className="my-8" />

      {/* Hero Transparency Section */}
      <div className="rounded-2xl bg-surface-primary border border-border-subtle p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-content-secondary gap-1.5 font-medium text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isRtl ? 'نظام السحوبات القانوني المرخص' : 'Licensed Promotional Draws'}</span>
              </Badge>
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                {isRtl ? 'شفافية 100%' : '100% Transparency'}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary leading-tight">
              {isRtl ? 'الجوائز الترويجية المجانية لكَنزين' : 'KNZiN Free Promotional Raffles'}
            </h1>

            <p className="text-sm text-content-secondary leading-relaxed">
              {isRtl
                ? 'في كَنزين، كل تذكرة سحب هي هدية ترويجية مجانية تماماً تُمنح مع شراء المسارات والدورات المهنية. لا نبيع الحظ ولا نفرض رسوم مقامرة، بل نكافئ المتعلمين الطموحين بجوائز حقيقية.'
                : 'At KNZiN, every raffle ticket is a completely free promotional gift awarded with vocational course purchases. We do not sell lottery or gambling tickets; we reward ambitious learners with real prizes.'}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-surface-secondary border border-border-subtle min-w-[190px] text-center space-y-1.5">
            <div className="size-10 rounded-lg bg-surface-primary flex items-center justify-center text-accent">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-xs text-content-muted">
              {isRtl ? 'السحب القادم المجدول' : 'Next Scheduled Draw'}
            </div>
            <div className="text-base font-bold text-content-primary">
              {isRtl ? 'نهاية الشهر الحالي' : 'End of Current Month'}
            </div>
            <div className="text-[11px] text-content-muted">
              {isRtl ? 'تحت إشراف وتوثيق علني' : 'Under Public Verification'}
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Invariants & Ticket Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border-subtle bg-surface-primary rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent" />
                <span>{isRtl ? 'شراء جزء فردي من الدورة' : 'Single Part Purchase'}</span>
              </CardTitle>
              <span className="text-xs font-semibold text-content-muted">
                {isRtl ? '2.00$ / 2,000 د.ع' : '$2.00 / 2,000 IQD'}
              </span>
            </div>
            <CardDescription className="text-xs">
              {isRtl ? 'تعلم جزءاً متخصصاً واحصل على تذكرة مجانية' : 'Master one targeted skill part with a free promotional gift'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs sm:text-sm text-content-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isRtl ? 'تذكرة ترويجية واحدة (1) مجانية فورا' : '1 Free Promotional Ticket instantly'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isRtl ? 'وصول دائم للفيديو ومواد التدريب' : 'Permanent access to video & practical material'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isRtl ? 'رقم تسلسلي موثق ومخزن في قاعدة البيانات' : 'Verified ticket hash stored in database'}</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link
              href="/"
              className="w-full text-center py-2 px-4 rounded-lg bg-surface-secondary hover:bg-surface-elevated text-xs font-medium text-content-primary border border-border-subtle transition-colors"
            >
              {isRtl ? 'استعراض الأجزاء المتاحة' : 'Browse Individual Parts'}
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-border-subtle bg-surface-primary rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-content-primary">
                <Ticket className="w-4 h-4 text-accent" />
                <span>{isRtl ? 'شراء الدورة الكاملة (6 أجزاء)' : 'Full 6-Part Course Bundle'}</span>
              </CardTitle>
              <span className="text-xs font-semibold text-primary">
                {isRtl ? '10.00$ / 13,000 د.ع' : '$10.00 / 13,000 IQD'}
              </span>
            </div>
            <CardDescription className="text-xs">
              {isRtl ? 'وفر 2$ أو 3,000 د.ع واحصل على باقة 15 تذكرة مجاناً' : 'Save $2 or 3,000 IQD and receive 15 free promotional tickets'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs sm:text-sm text-content-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold text-accent">
                {isRtl ? '15 تذكرة سحب مجانية ترويجية (مكافأة 9 تذاكر إضافية)' : '15 Free Promotional Tickets (9 Bonus Tickets)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isRtl ? 'تغطية شاملة لكل أدوات وورش المهنة' : 'Full vocational workshop and safety mastery'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isRtl ? 'شهادة إتمام رقمية معتمدة من كَنزين' : 'Digital Certificate of Completion'}</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link
              href="/"
              className="w-full text-center py-2 px-4 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors"
            >
              {isRtl ? 'احصل على الباقة الكاملة' : 'Enroll in Full Course'}
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Canonical Legal Shield Section */}
      <div className="p-6 rounded-2xl bg-surface-secondary border border-border-subtle space-y-4">
        <div className="flex items-center gap-2.5 text-secondary dark:text-white font-extrabold text-sm sm:text-base">
          <Scale className="w-5 h-5 text-primary" />
          <span>{isRtl ? 'الإقرار والدرع القانوني الإلزامي (العراق)' : 'Mandatory Legal Shield & Compliance'}</span>
        </div>

        <p className="text-xs sm:text-sm text-content-secondary leading-relaxed bg-surface-primary p-4 rounded-xl border border-border-subtle font-medium">
          « {CANONICAL_LEGAL_SHIELD} »
        </p>

        <div className="flex items-center gap-2 text-[11px] text-content-muted">
          <FileCheck2 className="w-4 h-4 text-emerald-500" />
          <span>
            {isRtl
              ? 'متوافق مع تعليمات وزارة التجارة العراقية وقوانين حماية المستهلك رقم (1) لسنة 2010.'
              : 'Complies with Iraqi Ministry of Trade regulations & Consumer Protection Law No. 1 (2010).'}
          </span>
        </div>
      </div>

      {/* Winner KYC Legal Compliance & National ID Claim Requirement (US6) */}
      <WinnerKycCard variant="standalone" />

      {/* Transparency FAQ */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-secondary dark:text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <span>{isRtl ? 'الأسئلة الشائعة حول السحوبات الترويجية' : 'Promotional Raffle FAQ'}</span>
        </h2>

        <Accordion type="single" collapsible className="w-full bg-surface-primary rounded-2xl border border-border-subtle p-2">
          <AccordionItem value="q1">
            <AccordionTrigger className="text-sm font-bold px-4 hover:no-underline">
              {isRtl ? 'هل يمكنني شراء تذاكر سحب بدون شراء دورة تدريبية؟' : 'Can I purchase raffle tickets without enrolling in a course?'}
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-content-secondary px-4 leading-relaxed">
              {isRtl
                ? 'كلا نهائياً. كَنزين هي منصة تدريب مهني معتمدة. لا نبيع التذاكر بشكل منفصل على الإطلاق، والتذاكر هي هدايا ترويجية تسويقية مجانية فقط للمشتركين في المحتوى التعليمي.'
                : 'Absolutely not. KNZiN is a vocational learning platform. Tickets cannot be purchased standalone. They are strictly promotional gifts given to students who purchase educational courses.'}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q2">
            <AccordionTrigger className="text-sm font-bold px-4 hover:no-underline">
              {isRtl ? 'كيف يتم اختيار الفائزين والتأكد من نزاهة السحب؟' : 'How are winners selected transparently?'}
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-content-secondary px-4 leading-relaxed">
              {isRtl
                ? 'يتم توليد أرقام التذاكر وتشفيرها داخل قاعدة البيانات، ويتم إجراء السحب علنياً وبحضور مراقبين أو عبر بث مباشر معلن موعده مسبقاً.'
                : 'Ticket hashes are recorded cryptographically in our database. Draws are conducted publicly with pre-announced schedules and verifiable draw mechanisms.'}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q3">
            <AccordionTrigger className="text-sm font-bold px-4 hover:no-underline">
              {isRtl ? 'أين يمكنني رؤية تذاكري المكتسبة بعد الشراء؟' : 'Where can I see my accumulated tickets?'}
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-content-secondary px-4 leading-relaxed">
              {isRtl
                ? 'تظهر تذاكرك في الشريط العلوي فور تسجيل الدخول وإتمام الطلب، كما تظهر في صفحة ملخص الطلب وحساب المتدرب الشخصي.'
                : 'Your tickets appear directly in the top HUD navbar after login and order completion, as well as on your Order Summary and Profile screens.'}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
