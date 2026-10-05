'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Trophy,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';

export function RaffleArenaCmsContent() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const isAr = locale === 'ar';
  const { data: cmsData } = useSiteWideCms();
  const content = cmsData?.sections?.raffle_arena;

  if (content && content.is_visible === false) {
    return null;
  }

  // Hero Data
  const heroBadge =
    (isAr ? content?.hero_badge_ar : content?.hero_badge_en) ||
    (isRtl ? 'نظام السحوبات القانوني المرخص' : 'Licensed Promotional Draws');
  const heroTitle =
    (isAr ? content?.hero_title_ar : content?.hero_title_en) ||
    (isRtl ? 'الجوائز الترويجية المجانية لكَنزين' : 'KNZiN Free Promotional Raffles');
  const heroDescription =
    (isAr ? content?.hero_description_ar : content?.hero_description_en) ||
    (isRtl
      ? 'في كَنزين، كل تذكرة سحب هي هدية ترويجية مجانية تماماً تُمنح مع شراء المسارات والدورات المهنية. لا نبيع الحظ ولا نفرض رسوم مقامرة، بل نكافئ المتعلمين الطموحين بجوائز حقيقية.'
      : 'At KNZiN, every raffle ticket is a completely free promotional gift awarded with vocational course purchases. We do not sell lottery or gambling tickets; we reward ambitious learners with real prizes.');

  // Next Draw Teaser
  const nextDrawTitle =
    (isAr ? content?.next_draw_title_ar : content?.next_draw_title_en) ||
    (isRtl ? 'السحب القادم المجدول' : 'Next Scheduled Draw');
  const nextDrawDate =
    (isAr ? content?.next_draw_date_text_ar : content?.next_draw_date_text_en) ||
    (isRtl ? 'نهاية الشهر الحالي' : 'End of Current Month');
  const nextDrawNote =
    (isAr ? content?.next_draw_note_ar : content?.next_draw_note_en) ||
    (isRtl ? 'تحت إشراف وتوثيق علني' : 'Under Public Verification');

  // Single Part
  const singleTitle =
    (isAr ? content?.single_part_title_ar : content?.single_part_title_en) ||
    (isRtl ? 'شراء جزء فردي من الدورة' : 'Single Part Purchase');
  const singleDesc =
    (isAr ? content?.single_part_desc_ar : content?.single_part_desc_en) ||
    (isRtl ? 'تعلم جزءاً متخصصاً واحصل على تذكرة مجانية' : 'Master one targeted skill part with a free promotional gift');
  const singlePerks =
    (isAr ? content?.single_part_perks_ar : content?.single_part_perks_en) || [
      isRtl ? 'تذكرة ترويجية واحدة (1) مجانية فورا' : '1 Free Promotional Ticket instantly',
      isRtl ? 'وصول دائم للفيديو ومواد التدريب' : 'Permanent access to video & practical material',
      isRtl ? 'رقم تسلسلي موثق ومخزن في قاعدة البيانات' : 'Verified ticket hash stored in database',
    ];

  // Bundle
  const bundleTitle =
    (isAr ? content?.bundle_title_ar : content?.bundle_title_en) ||
    (isRtl ? 'شراء الدورة الكاملة (6 أجزاء)' : 'Full 6-Part Course Bundle');
  const bundleDesc =
    (isAr ? content?.bundle_desc_ar : content?.bundle_desc_en) ||
    (isRtl ? 'وفر 2$ أو 3,000 د.ع واحصل على باقة 15 تذكرة مجاناً' : 'Save $2 or 3,000 IQD and receive 15 free promotional tickets');
  const bundleBadge =
    (isAr ? content?.bundle_badge_ar : content?.bundle_badge_en) ||
    (isRtl ? '15 تذكرة سحب مجانية ترويجية (مكافأة 9 تذاكر إضافية)' : '15 Free Promotional Tickets (9 Bonus Tickets)');
  const bundlePerks =
    (isAr ? content?.bundle_perks_ar : content?.bundle_perks_en) || [
      isRtl ? 'تغطية شاملة لكل أدوات وورش المهنة' : 'Full vocational workshop and safety mastery',
      isRtl ? 'شهادة إتمام رقمية معتمدة من كَنزين' : 'Digital Certificate of Completion',
    ];

  // FAQs
  const faqItems =
    content?.faq_items && content.faq_items.length > 0
      ? content.faq_items
      : [
          {
            id: 'faq_1',
            question_ar: 'هل يمكنني شراء تذاكر سحب بدون شراء دورة تدريبية؟',
            question_en: 'Can I purchase raffle tickets without enrolling in a course?',
            answer_ar: 'كلا نهائياً. كَنزين هي منصة تدريب مهني معتمدة. لا نبيع التذاكر بشكل منفصل على الإطلاق، والتذاكر هي هدايا ترويجية تسويقية مجانية فقط للمشتركين في المحتوى التعليمي.',
            answer_en: 'Absolutely not. KNZiN is a vocational learning platform. Tickets cannot be purchased standalone. They are strictly promotional gifts given to students who purchase educational courses.',
          },
          {
            id: 'faq_2',
            question_ar: 'كيف يتم اختيار الفائزين والتأكد من نزاهة السحب؟',
            question_en: 'How are winners selected transparently?',
            answer_ar: 'يتم توليد أرقام التذاكر وتشفيرها داخل قاعدة البيانات، ويتم إجراء السحب علنياً وبحضور مراقبين أو عبر بث مباشر معلن موعده مسبقاً.',
            answer_en: 'Ticket hashes are recorded cryptographically in our database. Draws are conducted publicly with pre-announced schedules and verifiable draw mechanisms.',
          },
          {
            id: 'faq_3',
            question_ar: 'أين يمكنني رؤية تذاكري المكتسبة بعد الشراء؟',
            question_en: 'Where can I see my accumulated tickets?',
            answer_ar: 'تظهر تذاكرك في الشريط العلوي فور تسجيل الدخول وإتمام الطلب، كما تظهر في صفحة ملخص الطلب وحساب المتدرب الشخصي.',
            answer_en: 'Your tickets appear directly in the top HUD navbar after login and order completion, as well as on your Order Summary and Profile screens.',
          },
        ];

  return (
    <div className="space-y-12">
      {/* Hero Transparency Section */}
      <div className="rounded-2xl bg-surface-primary border border-border-subtle p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-content-secondary gap-1.5 font-medium text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{heroBadge}</span>
              </Badge>
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                {isRtl ? 'شفافية 100%' : '100% Transparency'}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary leading-tight">
              {heroTitle}
            </h1>

            <p className="text-sm text-content-secondary leading-relaxed">
              {heroDescription}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-surface-secondary border border-border-subtle min-w-[190px] text-center space-y-1.5">
            <div className="size-10 rounded-lg bg-surface-primary flex items-center justify-center text-accent">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-xs text-content-muted">
              {nextDrawTitle}
            </div>
            <div className="text-base font-bold text-content-primary">
              {nextDrawDate}
            </div>
            <div className="text-[11px] text-content-muted">
              {nextDrawNote}
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
                <span>{singleTitle}</span>
              </CardTitle>
              <span className="text-xs font-semibold text-content-muted">
                {isRtl ? '2.00$ / 2,000 د.ع' : '$2.00 / 2,000 IQD'}
              </span>
            </div>
            <CardDescription className="text-xs">
              {singleDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs sm:text-sm text-content-secondary">
            {singlePerks.map((perk, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
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
                <span>{bundleTitle}</span>
              </CardTitle>
              <span className="text-xs font-semibold text-primary">
                {isRtl ? '10.00$ / 13,000 د.ع' : '$10.00 / 13,000 IQD'}
              </span>
            </div>
            <CardDescription className="text-xs">
              {bundleDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs sm:text-sm text-content-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold text-accent">
                {bundleBadge}
              </span>
            </div>
            {bundlePerks.map((perk, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
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

      {/* Dynamic Transparency FAQ */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-secondary dark:text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <span>{isRtl ? 'الأسئلة الشائعة حول السحوبات الترويجية' : 'Promotional Raffle FAQ'}</span>
        </h2>

        <Accordion type="single" collapsible className="w-full bg-surface-primary rounded-2xl border border-border-subtle p-2">
          {faqItems.map((item, idx) => (
            <AccordionItem key={item.id || idx} value={`q${idx}`}>
              <AccordionTrigger className="text-sm font-bold px-4 hover:no-underline">
                {isAr ? item.question_ar : item.question_en}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-content-secondary px-4 leading-relaxed">
                {isAr ? item.answer_ar : item.answer_en}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
