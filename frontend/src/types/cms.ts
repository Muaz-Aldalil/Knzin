/**
 * Landing Page CMS Types
 */

export interface HeroSectionContent {
  badge_ar: string;
  badge_en: string;
  heading_ar: string;
  heading_en: string;
  subheading_ar: string;
  subheading_en: string;
  primary_cta_label_ar: string;
  primary_cta_label_en: string;
  primary_cta_url: string;
  secondary_cta_label_ar: string;
  secondary_cta_label_en: string;
  secondary_cta_url: string;
  price_display_override_ar: string;
  price_display_override_en: string;
  timer_active: boolean;
  timer_title_ar: string;
  timer_title_en: string;
  hero_image_url: string;
}

export interface SkillCapitalSectionContent {
  title_ar: string;
  title_en: string;
  quote_ar: string;
  quote_en: string;
  author_name_ar: string;
  author_name_en: string;
  author_title_ar: string;
  author_title_en: string;
  is_visible: boolean;
}

export interface CoursesDisplaySectionContent {
  section_title_ar: string;
  section_title_en: string;
  section_subtitle_ar: string;
  section_subtitle_en: string;
  featured_course_id: string | null;
  show_bundle_discount_badge: boolean;
  bundle_badge_text_ar: string;
  bundle_badge_text_en: string;
  is_visible: boolean;
}

export interface PromotionalBannerSectionContent {
  is_visible: boolean;
  headline_ar: string;
  headline_en: string;
  subheadline_ar: string;
  subheadline_en: string;
  banner_image_url: string;
  cta_label_ar: string;
  cta_label_en: string;
  cta_url: string;
}

export interface PromotionalReferralSectionContent {
  is_visible: boolean;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  commission_badge_ar: string;
  commission_badge_en: string;
  coprize_badge_ar: string;
  coprize_badge_en: string;
  cta_label_ar: string;
  cta_label_en: string;
  cta_url: string;
}

export interface FreeReferralCardSectionContent {
  is_visible: boolean;
  card_title_ar: string;
  card_title_en: string;
  card_text_ar: string;
  card_text_en: string;
  badge_text_ar: string;
  badge_text_en: string;
}

export interface LegalComplianceSectionContent {
  is_visible?: boolean;
  legal_statement_ar: string;
  legal_statement_en: string;
  consumer_protection_law_ar: string;
  consumer_protection_law_en: string;
  kyc_notice_ar: string;
  kyc_notice_en: string;
}

export interface FaqItem {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
}

export interface ReferralFaqSectionContent {
  is_visible: boolean;
  title_ar: string;
  title_en: string;
  items: FaqItem[];
}

export interface TicketLadderSectionContent {
  is_visible: boolean;
  title_ar: string;
  title_en: string;
  part_rate_text_ar: string;
  part_rate_text_en: string;
  bundle_rate_text_ar: string;
  bundle_rate_text_en: string;
  disclaimer_ar: string;
  disclaimer_en: string;
}

export interface AffiliateReferralSectionContent {
  hero_title_ar: string;
  hero_title_en: string;
  hero_subtitle_ar: string;
  hero_subtitle_en: string;
  how_it_works_ar: string;
  how_it_works_en: string;
}

export interface DrawContentSectionContent {
  is_visible?: boolean;
  hall_of_fame_title_ar: string;
  hall_of_fame_title_en: string;
  hall_of_fame_subtitle_ar: string;
  hall_of_fame_subtitle_en: string;
  podcast_title_ar: string;
  podcast_title_en: string;
  podcast_description_ar: string;
  podcast_description_en: string;
  live_stream_url: string;
  latest_podcast_url: string;
}

export type CmsSectionName =
  | 'hero'
  | 'skill_capital'
  | 'courses_display'
  | 'promotional_banner'
  | 'promotional_referral'
  | 'free_referral_card'
  | 'legal_compliance'
  | 'referral_faq'
  | 'ticket_ladder'
  | 'affiliate_referral'
  | 'draw_content';

export interface CmsSectionEnvelope<T = unknown> {
  section: string;
  content: T;
  updated_at: string | null;
  updated_by_user_id: string | null;
}

export interface PublicLandingCmsData {
  sections: {
    hero: HeroSectionContent;
    skill_capital: SkillCapitalSectionContent;
    courses_display: CoursesDisplaySectionContent;
    promotional_banner: PromotionalBannerSectionContent;
    promotional_referral: PromotionalReferralSectionContent;
    free_referral_card: FreeReferralCardSectionContent;
    legal_compliance: LegalComplianceSectionContent;
    referral_faq: ReferralFaqSectionContent;
    ticket_ladder: TicketLadderSectionContent;
    affiliate_referral: AffiliateReferralSectionContent;
    draw_content: DrawContentSectionContent;
  };
}
