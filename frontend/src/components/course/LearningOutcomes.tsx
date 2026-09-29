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
    <section className={cn('space-y-5 pt-4 pb-2', className)}>
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-content-primary tracking-tight">
          ماذا ستتعلم في هذا المنهج المهني؟
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          مهارات عملية وتطبيقية مباشرة لسوق العمل الحر والورش في العراق.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-1">
        {outcomes.map((item, index) => {
          const Icon = item.icon ? iconComponents[item.icon] : Sparkles;
          return (
            <div key={index} className="flex items-start gap-3.5">
              <div className="size-7 rounded-lg bg-surface-secondary text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-content-primary leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
