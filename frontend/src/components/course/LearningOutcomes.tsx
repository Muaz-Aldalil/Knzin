'use client';

import React from 'react';
import { useLocale } from 'next-intl';
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
  'solar-installation': [
    {
      title: 'حساب أحمال المنازل وتصميم السلاسل الشمسية',
      description: 'حساب استهلاك الكيلوواط الساعي للأجهزة ومكيفات السبلت ومطابقة الفولتية Voc مع نطاق MPPT.',
      icon: 'zap',
    },
    {
      title: 'برمجة إنفرترات الهايبرد والديركت الذكية',
      description: 'ضبط أوضاع التشغيل SBU، معايرة تيار الشحن، والتحويل السلس مع المولد الأهلي والشبكة الوطنية.',
      icon: 'cpu',
    },
    {
      title: 'تجميع وتوصيل بطاريات الليثيوم LiFePO4 وبرمجة BMS',
      description: 'ربط خلايا 48V، برمجة بروتوكولات الاتصال CAN/RS485، وحماية المنظومة من التفريغ العميق.',
      icon: 'layers',
    },
    {
      title: 'منظومات التأريض الوقائي وقواطع الحماية DC',
      description: 'دق أوتاد التأريض لقياس مقاومة أقل من 5 أوم، وتأمين موانع الصواعق SPD لضمان سلامة المنشأة.',
      icon: 'shield',
    },
  ],
  'hvac-refrigeration': [
    {
      title: 'كشف التسريب بالنيتروجين واختبار الضغط العالي',
      description: 'ضغط شبكة التبريد حتى 450 PSI بعزل الوحدات، وتحديد تسريبات مفاصل الفلير والأكواع بدقة.',
      icon: 'shield',
    },
    {
      title: 'سحب الرطوبة والشحن الدقيق بالميزان الرقمي',
      description: 'تفريغ الهواء بمضخة الفاكيوم حتى 500 ميكرون وشحن غاز R410A/R32 سائلاً بالجرام المحدد.',
      icon: 'sparkles',
    },
    {
      title: 'تشخيص كروت الإنفرتر وموديول القدرة IPM',
      description: 'تتبع مسارات البورد، فحص الدايودات، تشخيص أكواد الأعطال، واختبار محركات الـ DC BLDC.',
      icon: 'cpu',
    },
    {
      title: 'استبدال ضواغط السبلت واللحام بالفضة',
      description: 'فك الضواغط التالفة، غسيل الدورة بمذيب R141b، واللحام تحت تدفق النيتروجين لمنع التفحم.',
      icon: 'wrench',
    },
  ],
  'cctv-smart-security': [
    {
      title: 'تمديد كابلات Cat6 وتوزيع سويتشات PoE',
      description: 'كبس الفيش وفق معيار T568B، حساب الفولتية والمسافات، واختيار العدسات المناسبة للزوايا.',
      icon: 'layers',
    },
    {
      title: 'تهيئة مسجلات NVR وضغط الفيديو H.265+',
      description: 'تخصيص عناوين IP الثابتة، تهيئة هاردات المراقبة، وتوفير أكثر من 60% من مساحة التخزين.',
      icon: 'cpu',
    },
    {
      title: 'ضبط خوارزميات الذكاء الاصطناعي وكشف الحركة',
      description: 'تفعيل AcuSense لعزل الإنذارات الكاذبة، رسم خطوط العبور الوهمية، والتقاط لوحات السيارات.',
      icon: 'sparkles',
    },
    {
      title: 'الربط السحابي P2P والمشاهدة الحية عبر الهاتف',
      description: 'تفعيل الباركود لتطبيقات المراقبة، تأمين كلمات المرور، وإدارة صلاحيات المشاهدين بأمان.',
      icon: 'shield',
    },
  ],
  'barber-styling': [
    {
      title: 'معايرة شفرات الماكينات على الصفر الفائق (Zero Gap)',
      description: 'ضبط الشفرات للحصول على خطوط واضحة ودقيقة بدون جرح جلد الزبون، واستخدام أمشاط التدرج.',
      icon: 'wrench',
    },
    {
      title: 'إتقان تدريج السكين فيد (Low, Mid & High Fade)',
      description: 'تقنيات الـ Flick-out لمحو الخطوط الفاصلة، ودمج الظلال بسلاسة من الجلد حتى الكثافة العلوية.',
      icon: 'sparkles',
    },
    {
      title: 'نحت اللحية بالشفرة الكلاسيكية والمناشف الساخنة',
      description: 'توجيه الموس بزاوية 30 درجة، رسم خطوط الخد والرقبة المتماثلة، والعناية بالبشرة بالبخار.',
      icon: 'palette',
    },
    {
      title: 'التعقيم الطبي الشامل وإدارة أرباح الصالون',
      description: 'بروتوكولات بارباسايد لمنع انتقال العدوى، دراسة جدوى فتح الصالون، وتسويق التحولات على السوشيال ميديا.',
      icon: 'shield',
    },
  ],
  'specialty-coffee-barista': [
    {
      title: 'معايرة طاحونة الإسبريسو ونسبة الاستخلاص 1:2',
      description: 'ضبط ميكرون الطحن، توزيع البن بأداة WDT، والكبس المستوي لاستخلاص 36 جم في 28 ثانية.',
      icon: 'wrench',
    },
    {
      title: 'تبخير الحليب ورسم اللاتيه آرت (Microfoam)',
      description: 'تحويل الحليب لرغوة حريرية بحرارة 60-65 مئوية، وتقنيات صب القلب والتوليب والروزيتا بدقة.',
      icon: 'sparkles',
    },
    {
      title: 'تذوق القهوة والتمييز بين المعالجات والإيحاءات',
      description: 'فهم معايير SCA، والفرق بين القهوة المغسولة والمجففة وتأثير الارتفاع على النكهة.',
      icon: 'palette',
    },
    {
      title: 'إدارة محطة الباريستا وتنظيف وصيانة الماكينة',
      description: 'تنظيم مسار العمل السريع في أوقات الذروة، تنظيف الماكينة بالباك فلاش، وحساب تكلفة وهدر البن.',
      icon: 'shield',
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
  const locale = useLocale();
  const outcomes = customOutcomes || defaultOutcomesBySlug[slug] || defaultOutcomesBySlug['auto-detailing'];

  return (
    <section className={cn('space-y-5 pt-4 pb-2', className)}>
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-content-primary tracking-tight">
          {locale === 'ar' ? 'ماذا ستتعلم في هذا المنهج المهني؟' : 'What You Will Master in this Curriculum'}
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          {locale === 'ar'
            ? 'مهارات عملية وتطبيقية مباشرة لسوق العمل الحر والورش في العراق.'
            : 'Practical, hands-on skills tailored directly for trade workshops and market demand.'}
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
