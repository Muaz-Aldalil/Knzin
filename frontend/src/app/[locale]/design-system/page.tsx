'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { SearchInput } from '@/components/ui/search-input';
import LegalShieldCheckbox from '@/components/checkout/LegalShieldCheckbox';
import PersonalizationBadge from '@/components/quiz/PersonalizationBadge';
import {
  Sparkles,
  Ticket,
  Trophy,
  ShieldCheck,
  Video,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Layers,
  Wrench,
  Download,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function DesignSystemPage() {
  const locale = useLocale();
  const [legalChecked, setLegalChecked] = useState(true);
  const [progressVal, setProgressVal] = useState(65);

  return (
    <div className="space-y-16 pb-24 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-8 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-bold border border-primary/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>نظام تصميم كَنزين الموحد (Knzin Design System v2.0)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-secondary dark:text-white tracking-tight">
          لوحة مواصفات ومكونات الهوية البصرية والتجربة الرقمية
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          مرجع شامل لجميع الرموز التصميمية (Design Tokens)، الحالات التفاعلية، ومكونات واجهة المستخدم المعتمدة لمنصة التعليم المهني العراقي والجوائز الترويجية.
        </p>
      </div>

      {/* 01 Colors */}
      <section className="space-y-6">
        <div className="border-s-4 border-primary ps-3">
          <h2 className="text-xl font-black text-secondary dark:text-white">
            01 — الألوان الأساسية والهوية البصرية (Brand Color Tokens)
          </h2>
          <p className="text-xs text-slate-500">نظام لوني رباعي صارم يمنع التشتت البصري ويحقق معايير النفاذية WCAG 2.2 AA.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Primary */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="h-20 rounded-xl bg-primary flex items-center justify-center text-white font-mono font-bold text-sm shadow-inner">
              #1877F2
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Primary (الأزرق الريادي)</div>
              <div className="text-xs text-slate-500">الإجراءات الأساسية، أزرار الشراء، وحلقات التركيز</div>
              <div className="text-[11px] font-mono text-primary font-bold mt-1">--color-primary</div>
            </div>
          </div>

          {/* Secondary */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="h-20 rounded-xl bg-secondary flex items-center justify-center text-white font-mono font-bold text-sm shadow-inner">
              #0B1E3A
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Secondary (الكحلي الليلي)</div>
              <div className="text-xs text-slate-500">شريط الملاحة HUD، التذييل، والعناوين البارزة</div>
              <div className="text-[11px] font-mono text-secondary font-bold mt-1">--color-secondary</div>
            </div>
          </div>

          {/* Accent */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="h-20 rounded-xl bg-accent flex items-center justify-center text-slate-950 font-mono font-black text-sm shadow-inner">
              #F5B301
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Accent (الذهب الترويجي)</div>
              <div className="text-xs text-slate-500">تذاكر السحب، جوائز المسابقات، شارات الاحتفال</div>
              <div className="text-[11px] font-mono text-amber-600 dark:text-accent font-bold mt-1">--color-accent</div>
            </div>
          </div>

          {/* Success */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="h-20 rounded-xl bg-success flex items-center justify-center text-white font-mono font-bold text-sm shadow-inner">
              #10B981
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Success (الأخضر القانوني)</div>
              <div className="text-xs text-slate-500">الدرع القانوني المعتمد، اكتمال الطلب والدروس</div>
              <div className="text-[11px] font-mono text-success font-bold mt-1">--color-success</div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 Typography Scale */}
      <section className="space-y-6">
        <div className="border-s-4 border-secondary ps-3">
          <h2 className="text-xl font-black text-secondary dark:text-white">
            02 — سلم الخطوط والنصوص (Typography Scale)
          </h2>
          <p className="text-xs text-slate-500">خط Tajawal العربي المهني + أوزان قياسية تعزز قابلية القراءة.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-400">Display 1 (36px / Black)</span>
            <span className="text-2xl sm:text-3xl font-black text-secondary dark:text-white">
              التعليم المهني المصغر الأول في العراق
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-400">Heading 1 (24px / Extrabold)</span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              العناية المتقدمة بالسيارات وحماية النانو سيراميك
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-400">Heading 2 (18px / Bold)</span>
            <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              أساسيات الغسيل الكيميائي وإزالة الشوائب الميكرونية
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
            <span className="text-xs font-mono text-slate-400">Body (14px / Regular)</span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              تذاكر السحب المرفقة مع كل دورة هي هدايا ترويجية مجانية خاضعة للشروط والضوابط القانونية العراقية.
            </span>
          </div>
        </div>
      </section>

      {/* 03 Interactive Buttons */}
      <section className="space-y-6">
        <div className="border-s-4 border-accent ps-3">
          <h2 className="text-xl font-black text-secondary dark:text-white">
            03 — الأزرار التفاعلية (Button Primitives & States)
          </h2>
          <p className="text-xs text-slate-500">حجم لمس أدنى 44px مع حالات التحويم والتعطيل والتحميل.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          {/* Variants Row */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">الأنماط الرئيسية (Variants)</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" leftIcon={<Sparkles className="w-4 h-4" />}>
                زر أساسي (Primary)
              </Button>
              <Button variant="secondary">زر ثانوي (Secondary)</Button>
              <Button variant="accent" leftIcon={<Ticket className="w-4 h-4" />}>
                زر ترويجي (Accent)
              </Button>
              <Button variant="outline">زر محاط (Outline)</Button>
              <Button variant="text">زر نصي (Text)</Button>
            </div>
          </div>

          {/* Sizes Row */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">الأحجام المتكيفة (Sizes)</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">حجم صغير (sm)</Button>
              <Button size="md">حجم قياسي 44px (md)</Button>
              <Button size="lg">حجم بارز (lg)</Button>
              <Button size="xl" leftIcon={<Trophy className="w-5 h-5 text-amber-950" />} variant="accent">
                حجم البطل (xl)
              </Button>
            </div>
          </div>

          {/* States */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">الحالات (States)</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button isLoading>جاري التنفيذ</Button>
              <Button disabled>زر معطل (Disabled)</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 04 Badges & Status Indicators */}
      <section className="space-y-6">
        <div className="border-s-4 border-success ps-3">
          <h2 className="text-xl font-black text-secondary dark:text-white">
            04 — الشارات ومؤشرات الإنجاز (Badges & Status Indicators)
          </h2>
          <p className="text-xs text-slate-500">تمثيل بصري فوري لنوع المحتوى وحالة التقدم التدريبي.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">شارات المحتوى (Badges)</div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="video">فيديو تدريبي 45 دقيقة</Badge>
              <Badge variant="lesson">جزء منهجي متقدم</Badge>
              <Badge variant="popular">الأكثر طلباً في العراق</Badge>
              <Badge variant="ticket">15 تذكرة سحب مجانية</Badge>
              <Badge variant="success">معتمد ومطابق</Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">مؤشرات التقدم (Status Indicators)</div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusIndicator status="now-playing" />
              <StatusIndicator status="completed" />
              <StatusIndicator status="in-progress" />
              <StatusIndicator status="locked" />
            </div>
          </div>
        </div>
      </section>

      {/* 05 Progress Bars */}
      <section className="space-y-6">
        <div className="border-s-4 border-primary ps-3">
          <h2 className="text-xl font-black text-secondary dark:text-white">
            05 — أشرطة التقدم الدراسي (Progress Bars)
          </h2>
          <p className="text-xs text-slate-500">متوافقة كلياً مع ARIA progressbar لدعم قارئات الشاشة.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-4 max-w-xl">
            <ProgressBar value={progressVal} label="تقدم المسار التدريبي الشامل" showPercentage size="md" />
            <ProgressBar value={100} label="الجزء 1: الفحص الميكروني (مكتمل)" showPercentage size="sm" />
            <ProgressBar value={25} label="الجزء 2: المعالجة بمرحلتين" showPercentage size="lg" />

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setProgressVal(Math.max(0, progressVal - 15))}
                className="px-3 py-1 text-xs rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                -15%
              </button>
              <button
                onClick={() => setProgressVal(Math.min(100, progressVal + 15))}
                className="px-3 py-1 text-xs rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                +15%
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 06 Search Input Field */}
      <section className="space-y-6">
        <div className="border-s-4 border-secondary ps-3">
          <h2 className="text-xl font-black text-secondary dark:text-white">
            06 — حقول البحث والاستعلام الذكي (Search Inputs)
          </h2>
          <p className="text-xs text-slate-500">حقل بحث مزود بزر اختصار لوحة المفاتيح ⌘K ومتوافق مع العربية والإنجليزية.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">حقل البحث القياسي (Medium - 44px)</label>
            <SearchInput size="md" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">حقل البحث في قسم البطل (Hero - 60px)</label>
            <SearchInput size="lg" placeholder="ابحث في فصول الفيديو وتفريغات الدروس المهنية..." />
          </div>
        </div>
      </section>

      {/* 07 Legal & Anti-Piracy Shields */}
      <section className="space-y-6">
        <div className="border-s-4 border-success ps-3">
          <h2 className="text-xl font-black text-secondary dark:text-white">
            07 — الدروع القانونية ومكافحة القرصنة (Legal & Anti-Piracy Shields)
          </h2>
          <p className="text-xs text-slate-500">النصوص المعتمدة قانونياً للامتثال العراقي وحماية الملكية الفكرية.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">مربع الموافقة الصريحة الإلزامي (Mandatory Legal Shield)</div>
            <LegalShieldCheckbox
              checked={legalChecked}
              onChange={setLegalChecked}
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase">ختم التخصيص الشخصي (Personalization Stamp)</div>
            <PersonalizationBadge email="ahmed.repair.engineer@knzin.iq" />
          </div>
        </div>
      </section>
    </div>
  );
}
