'use client';

import React from 'react';
import { Wrench, ShieldCheck, Sparkles, Layers, Cpu, Palette, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OutcomeItem {
  title: string;
  description: string;
  icon?: 'wrench' | 'shield' | 'sparkles' | 'layers' | 'cpu' | 'palette' | 'zap';
}

interface LearningOutcomesProps {
  slug: string;
  titleAr?: string;
  outcomes?: OutcomeItem[];
  className?: string;
}

const defaultOutcomesBySlug: Record<string, OutcomeItem[]> = {
  'auto-detailing': [
    {
      title: 'إتقان الغسيل الكيميائي وإزالة الشوائب',
      description: 'معادلة الحموضة، استخدام رغوة الثلج، وإزالة برادة الحديد وقضيب الطين (Clay Bar) لحماية الطلاء الأصلي.',
      icon: 'sparkles',
    },
    {
      title: 'القياس الرقمي الدقيق لسمك الطلاء',
      description: 'استخدام أجهزة الميكرون لتشخيص طبقة الكليير كوت وتحديد حدود الصقل الآمنة دون إتلاف صبغ المصنع.',
      icon: 'layers',
    },
    {
      title: 'معالجة الخدوش والتلميع الاحترافي',
      description: 'العمل بأجهزة الروتاري والديوال أكشن، واختيار الوسائد والمعاجين المناسبة لحرارة الصيف العراقية.',
      icon: 'wrench',
    },
    {
      title: 'تطبيق وتصليد طبقات النانو سيراميك',
      description: 'تطبيق السيراميك الأصلي 9H بتقنية التثبيت بالأشعة تحت الحمراء وتقديم شهادات ضمان معتمدة لزبائنك.',
      icon: 'shield',
    },
  ],
  'phone-repair': [
    {
      title: 'تشخيص أعطال البورد وحقن الفولتية',
      description: 'تحديد الشورت الصريح والنسبي واستخدام الكاميرا الحرارية لرصد المكونات التالفة بدقة ميكرونية.',
      icon: 'cpu',
    },
    {
      title: 'قراءة المخططات الهندسية (ZXW / Dongle)',
      description: 'تتبع خطوط التغذية I2C و VDD_MAIN ومسارات الشحن والإشارة عبر برامج المخططات العالمية.',
      icon: 'layers',
    },
    {
      title: 'اللحام الدقيق بالميكروسكوب والحرارة الهوائية',
      description: 'رفع واستبدال آيسيات الشحن (Tristar/Hydra) ومعالجات الباور والذاكرة بدون تسخين زائد على البورد.',
      icon: 'wrench',
    },
    {
      title: 'سحب وتوصيل المسارات المقطوعة (Jumpers)',
      description: 'إصلاح التراكّات المتآكلة برأس كاوية فائق الدقة 0.01mm واستخدام قناع العزل بالأشعة فوق البنفسجية.',
      icon: 'zap',
    },
  ],
  'freelance-design': [
    {
      title: 'بناء الهويات البصرية للشركات والمطاعم العراقية',
      description: 'تصميم الشعار، منظومة الألوان والخطوط، وتجهيز ملفات المطبوعات التجارية المعتمدة محلياً.',
      icon: 'palette',
    },
    {
      title: 'تصميم واجهات وتجارب المستخدم الاحترافية (Figma)',
      description: 'هندسة تجارب المتاجر والتطبيقات وحزم التصميم (Design Systems) القابلة للتسليم للمبرمجين.',
      icon: 'layers',
    },
    {
      title: 'صياغة العقود وتحديد أسعار المشاريع في العراق',
      description: 'نموذج عقد العمل الحر العراقي، تسعير الهويات، وطرق استلام الدفعات المالية بأمان (زين كاش، كي كارد).',
      icon: 'shield',
    },
    {
      title: 'استقطاب العملاء وإدارة معرض الأعمال (Portfolio)',
      description: 'استراتيجيات الترويج المحلي وإقناع أصحاب المشاريع بالقيمة التجارية للتصميم بدلاً من التنافس على السعر.',
      icon: 'sparkles',
    },
  ],
};

const iconComponents = {
  wrench: Wrench,
  shield: ShieldCheck,
  sparkles: Sparkles,
  layers: Layers,
  cpu: Cpu,
  palette: Palette,
  zap: Zap,
};

export function LearningOutcomes({
  slug,
  outcomes: customOutcomes,
  className,
}: LearningOutcomesProps) {
  const outcomes = customOutcomes || defaultOutcomesBySlug[slug] || defaultOutcomesBySlug['auto-detailing'];

  return (
    <div
      className={cn(
        'p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-secondary dark:text-white">
            ماذا ستتعلم في هذا المنهج المهني؟
          </h2>
          <p className="text-xs text-slate-500">مهارات عملية وتطبيقية مباشرة لسوق العمل الحر والورش في العراق.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {outcomes.map((item, index) => {
          const Icon = item.icon ? iconComponents[item.icon] : Sparkles;
          return (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3.5 hover:border-primary/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
