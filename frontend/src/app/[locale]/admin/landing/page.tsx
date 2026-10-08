'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  Globe,
  Sparkles,
  BookOpen,
  Gift,
  Users,
  ShieldCheck,
  ScrollText,
  BadgeDollarSign,
  ArrowRight,
  ArrowLeft,
  Trophy,
  PlayCircle,
  LayoutDashboard,
  ShoppingCart,
  Search,
  AlertTriangle,
  Sliders,
  Layers,
} from 'lucide-react';

interface CmsHubSection {
  id: string;
  path: string;
  targetRoute?: string;
  targetLabel?: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'global' | 'landing' | 'gaming' | 'learning' | 'commerce' | 'affiliate' | 'system';
}

const ALL_CMS_SECTIONS: CmsHubSection[] = [
  // 1. Global Shell
  {
    id: 'site_shell',
    path: '/admin/landing/site-shell',
    targetRoute: '/',
    targetLabel: 'Global / All Pages',
    titleAr: 'الهيكل العام للمنصة (Global Shell)',
    titleEn: 'Global Site Shell & Navigation',
    descAr: 'التحكم في شريط الإعلانات العاجلة (Ticker)، زر وتفاصيل واتساب، نافذة كيف يعمل، وتذييل الصفحات.',
    descEn: 'Configure ticker announcements, WhatsApp concierge, how-it-works modal, and footer copy.',
    icon: Globe,
    category: 'global',
  },
  // 2. Landing Page Surfaces
  {
    id: 'hero',
    path: '/admin/landing/hero',
    targetRoute: '/#hero',
    targetLabel: 'Landing (Hero)',
    titleAr: 'البانر الرئيسي (Hero Section)',
    titleEn: 'Hero Section',
    descAr: 'تعديل العنوان الرئيسي، الشعار، نصوص وأزرار الدعوة للإجراء، والعداد التنازلي.',
    descEn: 'Configure main headline, badge, call-to-action buttons, links, and draw countdown.',
    icon: Sparkles,
    category: 'landing',
  },
  {
    id: 'skill_capital',
    path: '/admin/landing/skill-capital',
    targetRoute: '/#skills',
    targetLabel: 'Landing (Narrative)',
    titleAr: 'المهارة هي رأس المال الحقيقي',
    titleEn: 'Skill & Capital Narrative',
    descAr: 'تعديل مقولة المؤسس، الاقتباس الملهم، واسم ومسمى الكاتب في واجهة المنصة.',
    descEn: 'Update founder quote, narrative, and author presentation on the public landing page.',
    icon: BookOpen,
    category: 'landing',
  },
  {
    id: 'courses_display',
    path: '/admin/landing/courses-display',
    targetRoute: '/#catalog',
    targetLabel: 'Landing (Courses)',
    titleAr: 'عرض المناهج والدورات التدريبية',
    titleEn: 'Courses Display & Curricula',
    descAr: 'التحكم في عنوان وشارات قسم الدورات والبانر الترويجي للباقات الكاملة.',
    descEn: 'Control course grid titles, bundle discount badges, and highlighted curricula presentation.',
    icon: BookOpen,
    category: 'landing',
  },
  {
    id: 'promotional_banner',
    path: '/admin/landing/promotional-banner',
    targetRoute: '/#promotional-banner',
    targetLabel: 'Landing (Banner)',
    titleAr: 'البانر الترويجي للجائزة الكبرى',
    titleEn: 'Promotional Banner',
    descAr: 'تعديل عنوان الجائزة الكبرى (السيارة)، الشارات، وروابط التوجيه المباشر.',
    descEn: 'Update grand draw prize banner headline, visual cues, and action URLs.',
    icon: Gift,
    category: 'landing',
  },
  {
    id: 'promotional_referral',
    path: '/admin/landing/promotional-referral',
    targetRoute: '/#referral',
    targetLabel: 'Landing (Referral)',
    titleAr: 'برنامج الإحالة والشراكة الترويجي',
    titleEn: 'Promotional Referral Section',
    descAr: 'عرض نسب العمولة (25%) ومشاركة الجائزة (40%) ونصوص التسجيل في برنامج الشركاء.',
    descEn: 'Configure referral rates presentation, co-prize share badges, and invitation copy.',
    icon: Users,
    category: 'landing',
  },
  {
    id: 'free_referral',
    path: '/admin/landing/free-referral',
    targetRoute: '/#referral-card',
    targetLabel: 'Landing (Free Card)',
    titleAr: 'بطاقة التذكرة الترويجية المجانية',
    titleEn: 'Free Referral Reward Card',
    descAr: 'تعديل رسالة الحصول على تذكرة مجانية عند دعوة 3 أصدقاء ونصوص المكافأة.',
    descEn: 'Update copy for the free promotional ticket reward on sharing with 3 friends.',
    icon: Gift,
    category: 'landing',
  },
  {
    id: 'legal_compliance',
    path: '/admin/landing/legal-compliance',
    targetRoute: '/#legal',
    targetLabel: 'Landing (Legal)',
    titleAr: 'النصوص القانونية والامتثال العراقي',
    titleEn: 'Legal & Iraqi Compliance Statements',
    descAr: 'إدارة إشعارات قانون حماية المستهلك العراقي رقم (1) لسنة 2010 وشروط التحقق من الهوية.',
    descEn: 'Manage Consumer Protection Law citations, digital product disclosures, and KYC notices.',
    icon: ShieldCheck,
    category: 'landing',
  },
  {
    id: 'referral_faq',
    path: '/admin/landing/referral-faq',
    targetRoute: '/#faq',
    targetLabel: 'Landing (FAQ)',
    titleAr: 'الأسئلة الشائعة حول المنصة والجوائز',
    titleEn: 'Promotional Referral FAQ',
    descAr: 'إضافة، تعديل، وحذف بنود الأسئلة الشائعة وتنسيق إجاباتها باللغتين العربية والإنجليزية.',
    descEn: 'Add, update, or remove accordion FAQ items and manage bilingual Q&A pairs.',
    icon: ScrollText,
    category: 'landing',
  },
  {
    id: 'ticket_ladder',
    path: '/admin/landing/ticket-ladder',
    targetRoute: '/#ladder',
    targetLabel: 'Landing (Ladder)',
    titleAr: 'سلم التذاكر الترويجية',
    titleEn: 'Promotional Ticket Ladder',
    descAr: 'تعديل جدول توزيع التذاكر المجانية مع أجزاء الدورات والباقات الكاملة.',
    descEn: 'Manage display rates for free sweepstakes tickets earned per course or bundle.',
    icon: BadgeDollarSign,
    category: 'landing',
  },
  // 3. Gaming & Draws
  {
    id: 'raffle_arena',
    path: '/admin/landing/raffle-arena',
    targetRoute: '/raffle',
    targetLabel: '/raffle',
    titleAr: 'صالة السحوبات والجوائز (Raffle Arena)',
    titleEn: 'Raffle & Draws Arena Presentation',
    descAr: 'التحكم في واجهة السحوبات الكبرى، مميزات التذاكر الفردية والباقات، وأسئلة السحب الشائعة.',
    descEn: 'Manage grand draw hero, single/bundle participation perks copy, and draw FAQs.',
    icon: Trophy,
    category: 'gaming',
  },
  // 4. Learning & Courses
  {
    id: 'course_detail',
    path: '/admin/landing/course-detail',
    targetRoute: '/courses/craft-auto-body-repair-pro',
    targetLabel: '/courses/[slug]',
    titleAr: 'صفحة تفاصيل الدورة (Course Detail)',
    titleEn: 'Course Detail Presentation',
    descAr: 'تعديل شارات الضمان الذهبي، ترويج الباقات الكاملة، وعناوين مخرجات التعلم المكتسبة.',
    descEn: 'Configure guarantee badges, full bundle promotion banners, and learning outcomes copy.',
    icon: BookOpen,
    category: 'learning',
  },
  {
    id: 'lesson_player',
    path: '/admin/landing/lesson-player',
    targetRoute: '/courses/craft-auto-body-repair-pro/learn',
    targetLabel: '/courses/[slug]/learn',
    titleAr: 'مشغل الدروس والحجب (Lesson Player)',
    titleEn: 'Lesson Player & Paywall Presentation',
    descAr: 'التحكم في شاشة حجب الدروس المدفوعة (Paywall)، نصوص الترقية، وبانر إتمام الدورة.',
    descEn: 'Manage paywall teaser lock screen, purchase motivation copy, and completion celebration.',
    icon: PlayCircle,
    category: 'learning',
  },
  {
    id: 'learner_dashboard',
    path: '/admin/landing/learner-dashboard',
    targetRoute: '/dashboard',
    targetLabel: '/dashboard',
    titleAr: 'لوحة المتدرب (Learner Dashboard)',
    titleEn: 'Learner Dashboard Presentation',
    descAr: 'التحكم في رسالة الترحيب والتحفيز، وحالة الحساب الفارغ للمتدرب الذي لم يشترك بعد.',
    descEn: 'Configure welcome greeting, motivational quotes, and empty enrolled courses states.',
    icon: LayoutDashboard,
    category: 'learning',
  },
  // 5. Commerce & Checkout
  {
    id: 'checkout_cart',
    path: '/admin/landing/checkout-cart',
    targetRoute: '/#catalog',
    targetLabel: 'Cart & /order-summary',
    titleAr: 'السلة والدفع (Checkout & Cart)',
    titleEn: 'Checkout & Cart Presentation',
    descAr: 'التحكم في شارة الأمان والضمان، رسالة إهداء التذاكر المجانية، ورسائل تأكيد نجاح الطلب.',
    descEn: 'Configure security badges, free ticket gift reassurance notices, and post-order celebration copy.',
    icon: ShoppingCart,
    category: 'commerce',
  },
  // 6. Affiliate Portal
  {
    id: 'affiliate_portal',
    path: '/admin/landing/affiliate-portal',
    targetRoute: '/affiliate',
    targetLabel: '/affiliate',
    titleAr: 'بوابة الشركاء والمسوقين (Affiliate Portal)',
    titleEn: 'Affiliate Portal Presentation',
    descAr: 'التحكم في نصوص الترحيب بالمسوقين، إشعار حظر الترويج المضلل، وقواعد الجائزة المشتركة (Co-Prize).',
    descEn: 'Manage marketer onboarding guidance, compliance policy disclosures, and co-prize 40% rules.',
    icon: Users,
    category: 'affiliate',
  },
  // 7. Search & Discovery
  {
    id: 'search_page',
    path: '/admin/landing/search-page',
    targetRoute: '/search',
    targetLabel: '/search',
    titleAr: 'صفحة البحث الذكي (Search Hub)',
    titleEn: 'Smart Search Hub Presentation',
    descAr: 'التحكم في عنوان البحث التوجيهي، وسوم الكلمات المقترحة، نصائح البحث، وحالة البحث دون نتائج.',
    descEn: 'Configure search hub header, suggested query chips, search guidelines, and zero-results empty states.',
    icon: Search,
    category: 'landing',
  },
  // 8. System Notices & Error Pages
  {
    id: 'system_notices',
    path: '/admin/landing/system-notices',
    targetRoute: '/404-preview',
    targetLabel: '404 & 500 Pages',
    titleAr: 'إشعارات النظام وأخطاء التوجيه (System Notices)',
    titleEn: 'System Notices & Error Presentation',
    descAr: 'التحكم في رسائل وأزرار صفحات الخطأ 404 (الصفحة غير موجودة) وحدود معالجة الأخطاء غير المتوقعة 500.',
    descEn: 'Configure copy, recovery buttons, and guidance for 404 Not Found and application error boundaries.',
    icon: AlertTriangle,
    category: 'system',
  },
];

const CATEGORIES = [
  { id: 'all', labelAr: 'جميع الأقسام (All)', labelEn: 'All Surfaces' },
  { id: 'global', labelAr: 'الهيكل العام (Global)', labelEn: 'Global Shell' },
  { id: 'landing', labelAr: 'الصفحة الرئيسية والبحث (Landing & Search)', labelEn: 'Landing & Search' },
  { id: 'gaming', labelAr: 'السحوبات والجوائز (Draws)', labelEn: 'Raffle & Draws' },
  { id: 'learning', labelAr: 'التعليم والمتدرب (Learning)', labelEn: 'Learning & Dashboard' },
  { id: 'commerce', labelAr: 'السلة والدفع (Commerce)', labelEn: 'Cart & Checkout' },
  { id: 'affiliate', labelAr: 'برنامج الشركاء (Affiliate)', labelEn: 'Affiliate Program' },
  { id: 'system', labelAr: 'إشعارات النظام (System)', labelEn: 'System & Errors' },
] as const;

export default function AdminLandingCmsHubPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredSections =
    selectedCategory === 'all'
      ? ALL_CMS_SECTIONS
      : ALL_CMS_SECTIONS.filter((sec) => sec.category === selectedCategory);

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6 max-w-6xl mx-auto pb-12" data-testid="admin-landing-cms-hub">
        <div className="border-b border-border-subtle pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
                <Globe className="w-7 h-7 text-primary" />
                <span>
                  {isAr
                    ? 'إدارة محتوى المنصة الشامل (Site-Wide CMS Hub)'
                    : 'Site-Wide CMS & Application Control Hub'}
                </span>
              </h1>
              <p className="text-sm text-content-secondary mt-1">
                {isAr
                  ? 'التحكم المركزي في جميع الأقسام، النصوص، الشارات، ورسائل التطبيق من الهيكل العام والصفحة الرئيسية حتى السلة وبوابة الشركاء.'
                  : 'Centralized presentation control across all application surfaces, from global shell and landing page to checkout and affiliate portal.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary text-xs font-semibold self-start sm:self-auto">
              <Sliders className="w-4 h-4" />
              <span>
                {ALL_CMS_SECTIONS.length} {isAr ? 'أقسام مُدارة' : 'Managed Surfaces'}
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-black shadow'
                    : 'bg-surface border border-border-subtle text-content-secondary hover:text-content-primary hover:border-primary/30'
                }`}
              >
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const title = isAr ? sec.titleAr : sec.titleEn;
            const desc = isAr ? sec.descAr : sec.descEn;

            return (
              <Link
                key={sec.id}
                href={`/${locale}${sec.path}`}
                className="group p-5 rounded-2xl bg-surface border border-border-subtle hover:border-primary/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    {sec.targetRoute && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-surface-secondary border border-border-subtle text-content-secondary group-hover:border-primary/30 transition-colors">
                        {sec.targetLabel || sec.targetRoute}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-content-primary text-base group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-content-secondary leading-relaxed">{desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>{isAr ? 'تعديل القسم' : 'Edit Section'}</span>
                  <Arrow className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminGuard>
  );
}
