/**
 * FAQ, Onboarding & Compliance Types
 * Feature 004: Front-of-House Trust, Engagement & Social Proof Suite
 */

export interface HowItWorksStep {
  step_number: 1 | 2 | 3;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  icon_name: string; // 'BookOpen' | 'Ticket' | 'Trophy'
  badge_text_ar: string;
  badge_text_en: string;
}

export interface FaqItem {
  id: string; // e.g. 'faq-model-1'
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
}

export type FaqCategoryId = 'model' | 'downloads' | 'draws' | 'referral' | 'kyc';

export interface FaqCategory {
  id: FaqCategoryId | string;
  title_ar: string;
  title_en: string;
  icon_name: string;
  items: FaqItem[];
}

export interface WinnerKycDisclaimer {
  canonical_ar: string;
  canonical_en: string;
  law_citation_ar: string;
  law_citation_en: string;
  claim_threshold_cents: number; // 10000 ($100.00)
}
