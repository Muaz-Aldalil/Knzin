'use client';

import React from 'react';
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
} from 'lucide-react';

const CMS_HUB_SECTIONS = [
  {
    id: 'hero',
    path: '/admin/landing/hero',
    titleAr: 'البانر الرئيسي (Hero Section)',
    titleEn: 'Hero Section',
    descAr: 'تعديل العنوان الرئيسي، الشعار، نصوص وأزرار الدعوة للإجراء، والعداد التنازلي.',
    descEn: 'Configure main headline, badge, call-to-action buttons, links, and draw countdown.',
    icon: Sparkles,
  },
  {
    id: 'skill_capital',
    path: '/admin/landing/skill-capital',
    titleAr: 'المهارة هي رأس المال الحقيقي',
    titleEn: 'Skill & Capital Narrative',
    descAr: 'تعديل مقولة المؤسس، الاقتباس الملهم، واسم ومسمى الكاتب في واجهة المنصة.',
    descEn: 'Update founder quote, narrative, and author presentation on the public landing page.',
    icon: BookOpen,
  },
  {
    id: 'courses_display',
    path: '/admin/landing/courses-display',
    titleAr: 'عرض المناهج والدورات التدريبية',
    titleEn: 'Courses Display & Curricula',
    descAr: 'التحكم في عنوان وشارات قسم الدورات والبانر الترويجي للباقات الكاملة.',
    descEn: 'Control course grid titles, bundle discount badges, and highlighted curricula presentation.',
    icon: BookOpen,
  },
  {
    id: 'promotional_banner',
    path: '/admin/landing/promotional-banner',
    titleAr: 'البانر الترويجي للجائزة الكبرى',
    titleEn: 'Promotional Banner',
    descAr: 'تعديل عنوان الجائزة الكبرى (السيارة)، الشارات، وروابط التوجيه المباشر.',
    descEn: 'Update grand draw prize banner headline, visual cues, and action URLs.',
    icon: Gift,
  },
  {
    id: 'promotional_referral',
    path: '/admin/landing/promotional-referral',
    titleAr: 'برنامج الإحالة والشراكة الترويجي',
    titleEn: 'Promotional Referral Section',
    descAr: 'عرض نسب العمولة (25%) ومشاركة الجائزة (40%) ونصوص التسجيل في برنامج الشركاء.',
    descEn: 'Configure referral rates presentation, co-prize share badges, and invitation copy.',
    icon: Users,
  },
  {
    id: 'free_referral',
    path: '/admin/landing/free-referral',
    titleAr: 'بطاقة التذكرة الترويجية المجانية',
    titleEn: 'Free Referral Reward Card',
    descAr: 'تعديل رسالة الحصول على تذكرة مجانية عند دعوة 3 أصدقاء ونصوص المكافأة.',
    descEn: 'Update copy for the free promotional ticket reward on sharing with 3 friends.',
    icon: Gift,
  },
  {
    id: 'legal_compliance',
    path: '/admin/landing/legal-compliance',
    titleAr: 'النصوص القانونية والامتثال العراقي',
    titleEn: 'Legal & Iraqi Compliance Statements',
    descAr: 'إدارة إشعارات قانون حماية المستهلك العراقي رقم (1) لسنة 2010 وشروط التحقق من الهوية.',
    descEn: 'Manage Consumer Protection Law citations, digital product disclosures, and KYC notices.',
    icon: ShieldCheck,
  },
  {
    id: 'referral_faq',
    path: '/admin/landing/referral-faq',
    titleAr: 'الأسئلة الشائعة حول المنصة والجوائز',
    titleEn: 'Promotional Referral FAQ',
    descAr: 'إضافة، تعديل، وحذف بنود الأسئلة الشائعة وتنسيق إجاباتها باللغتين العربية والإنجليزية.',
    descEn: 'Add, update, or remove accordion FAQ items and manage bilingual Q&A pairs.',
    icon: ScrollText,
  },
  {
    id: 'ticket_ladder',
    path: '/admin/landing/ticket-ladder',
    titleAr: 'سلم التذاكر الترويجية',
    titleEn: 'Promotional Ticket Ladder',
    descAr: 'تعديل جدول توزيع التذاكر المجانية مع أجزاء الدورات والباقات الكاملة.',
    descEn: 'Manage display rates for free sweepstakes tickets earned per course or bundle.',
    icon: BadgeDollarSign,
  },
];

export default function AdminLandingCmsHubPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6 max-w-6xl mx-auto pb-12" data-testid="admin-landing-cms-hub">
        <div className="border-b border-border-subtle pb-5">
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
            <Globe className="w-7 h-7 text-brand-gold" />
            <span>{isAr ? 'إدارة محتوى الصفحة الرئيسية (Landing CMS)' : 'Landing Page CMS Management'}</span>
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            {isAr
              ? 'التحكم المركزي في جميع الأقسام الترويجية، النصوص، والبانرات المعروضة لزوار المنصة مع ضمان فصل المحتوى عن القواعد المحاسبية والمالية.'
              : 'Centralized management of public promotional sections, copy, and banners with strict content-to-ledger boundary separation.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CMS_HUB_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const title = isAr ? sec.titleAr : sec.titleEn;
            const desc = isAr ? sec.descAr : sec.descEn;

            return (
              <Link
                key={sec.id}
                href={`/${locale}${sec.path}`}
                className="group p-5 rounded-2xl bg-surface border border-border-subtle hover:border-brand-gold/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-content-primary text-base group-hover:text-brand-gold transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-content-secondary leading-relaxed">{desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs font-semibold text-brand-gold">
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
