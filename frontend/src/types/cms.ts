/**
 * Site-Wide and Landing Page CMS Types
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

// Site-Wide Application Subsystem Types
export interface TickerAnnouncementItem {
  id: string;
  type: string;
  highlight_label_ar: string;
  highlight_label_en: string;
  text_ar: string;
  text_en: string;
}

export interface HowItWorksStepItem {
  step: number;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  badge_ar: string;
  badge_en: string;
}

export interface SiteShellSectionContent {
  ticker_enabled: boolean;
  ticker_speed: string;
  ticker_announcements: TickerAnnouncementItem[];
  whatsapp_enabled: boolean;
  whatsapp_url: string;
  whatsapp_button_label_ar: string;
  whatsapp_button_label_en: string;
  whatsapp_greeting_ar: string;
  whatsapp_greeting_en: string;
  how_it_works_title_ar: string;
  how_it_works_title_en: string;
  how_it_works_subtitle_ar: string;
  how_it_works_subtitle_en: string;
  how_it_works_steps: HowItWorksStepItem[];
  footer_copyright_ar: string;
  footer_copyright_en: string;
  footer_disclaimer_ar: string;
  footer_disclaimer_en: string;
  header_announcement_badge_ar?: string;
  header_announcement_badge_en?: string;
  header_cta_label_ar?: string;
  header_cta_label_en?: string;
  header_cta_url?: string;
}

export interface RaffleArenaSectionContent {
  hero_badge_ar: string;
  hero_badge_en: string;
  hero_title_ar: string;
  hero_title_en: string;
  hero_description_ar: string;
  hero_description_en: string;
  next_draw_title_ar: string;
  next_draw_title_en: string;
  next_draw_date_text_ar: string;
  next_draw_date_text_en: string;
  next_draw_note_ar: string;
  next_draw_note_en: string;
  single_part_title_ar: string;
  single_part_title_en: string;
  single_part_desc_ar: string;
  single_part_desc_en: string;
  single_part_perks_ar: string[];
  single_part_perks_en: string[];
  bundle_title_ar: string;
  bundle_title_en: string;
  bundle_desc_ar: string;
  bundle_desc_en: string;
  bundle_perks_ar: string[];
  bundle_perks_en: string[];
  bundle_badge_ar: string;
  bundle_badge_en: string;
  faq_items: FaqItem[];
  is_visible: boolean;
}

export interface CourseDetailSectionContent {
  guarantee_badge_ar: string;
  guarantee_badge_en: string;
  guarantee_headline_ar: string;
  guarantee_headline_en: string;
  guarantee_description_ar: string;
  guarantee_description_en: string;
  bundle_promo_badge_ar: string;
  bundle_promo_badge_en: string;
  bundle_promo_title_ar: string;
  bundle_promo_title_en: string;
  bundle_promo_desc_ar: string;
  bundle_promo_desc_en: string;
  learning_outcomes_header_ar: string;
  learning_outcomes_header_en: string;
  is_visible: boolean;
}

export interface LessonPlayerSectionContent {
  paywall_headline_ar: string;
  paywall_headline_en: string;
  paywall_subheadline_ar: string;
  paywall_subheadline_en: string;
  paywall_perks_ar: string[];
  paywall_perks_en: string[];
  paywall_cta_label_ar: string;
  paywall_cta_label_en: string;
  completion_banner_title_ar: string;
  completion_banner_title_en: string;
  completion_banner_desc_ar: string;
  completion_banner_desc_en: string;
  is_visible: boolean;
}

export interface AffiliatePortalSectionContent {
  onboarding_title_ar: string;
  onboarding_title_en: string;
  onboarding_desc_ar: string;
  onboarding_desc_en: string;
  onboarding_points_ar: string[];
  onboarding_points_en: string[];
  banner_title_ar: string;
  banner_title_en: string;
  banner_subtitle_ar: string;
  banner_subtitle_en: string;
  policy_notice_title_ar: string;
  policy_notice_title_en: string;
  policy_notice_text_ar: string;
  policy_notice_text_en: string;
  coprize_rules_title_ar: string;
  coprize_rules_title_en: string;
  coprize_rules_desc_ar: string;
  coprize_rules_desc_en: string;
  is_visible: boolean;
}

export interface LearnerDashboardSectionContent {
  welcome_title_ar: string;
  welcome_title_en: string;
  welcome_subtitle_ar: string;
  welcome_subtitle_en: string;
  empty_headline_ar: string;
  empty_headline_en: string;
  empty_desc_ar: string;
  empty_desc_en: string;
  empty_cta_label_ar: string;
  empty_cta_label_en: string;
  unauthenticated_title_ar: string;
  unauthenticated_title_en: string;
  unauthenticated_desc_ar: string;
  unauthenticated_desc_en: string;
  is_visible: boolean;
}

export interface CheckoutCartSectionContent {
  trust_badge_ar: string;
  trust_badge_en: string;
  trust_headline_ar: string;
  trust_headline_en: string;
  trust_description_ar: string;
  trust_description_en: string;
  ticket_gift_notice_ar: string;
  ticket_gift_notice_en: string;
  order_celebration_title_ar: string;
  order_celebration_title_en: string;
  order_celebration_desc_ar: string;
  order_celebration_desc_en: string;
  order_ticket_reassurance_ar: string;
  order_ticket_reassurance_en: string;
  is_visible: boolean;
}

export interface SearchPageSectionContent {
  hero_headline_ar: string;
  hero_headline_en: string;
  hero_subtitle_ar: string;
  hero_subtitle_en: string;
  search_placeholder_ar: string;
  search_placeholder_en: string;
  suggested_queries_ar: string[];
  suggested_queries_en: string[];
  search_tips_title_ar: string;
  search_tips_title_en: string;
  search_tips_items_ar: string[];
  search_tips_items_en: string[];
  empty_title_ar: string;
  empty_title_en: string;
  empty_desc_ar: string;
  empty_desc_en: string;
  is_visible: boolean;
}

export interface SystemNoticesSectionContent {
  not_found_title_ar: string;
  not_found_title_en: string;
  not_found_desc_ar: string;
  not_found_desc_en: string;
  not_found_home_btn_ar: string;
  not_found_home_btn_en: string;
  not_found_search_btn_ar: string;
  not_found_search_btn_en: string;
  error_title_ar: string;
  error_title_en: string;
  error_desc_ar: string;
  error_desc_en: string;
  error_retry_btn_ar: string;
  error_retry_btn_en: string;
  error_home_btn_ar: string;
  error_home_btn_en: string;
  is_visible: boolean;
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
  | 'draw_content'
  | 'site_shell'
  | 'raffle_arena'
  | 'course_detail'
  | 'lesson_player'
  | 'affiliate_portal'
  | 'learner_dashboard'
  | 'checkout_cart'
  | 'search_page'
  | 'system_notices';

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
    site_shell?: SiteShellSectionContent;
    raffle_arena?: RaffleArenaSectionContent;
    course_detail?: CourseDetailSectionContent;
    lesson_player?: LessonPlayerSectionContent;
    affiliate_portal?: AffiliatePortalSectionContent;
    learner_dashboard?: LearnerDashboardSectionContent;
    checkout_cart?: CheckoutCartSectionContent;
    search_page?: SearchPageSectionContent;
    system_notices?: SystemNoticesSectionContent;
  };
}

export interface SiteWideCmsData {
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
    site_shell: SiteShellSectionContent;
    raffle_arena: RaffleArenaSectionContent;
    course_detail: CourseDetailSectionContent;
    lesson_player: LessonPlayerSectionContent;
    affiliate_portal: AffiliatePortalSectionContent;
    learner_dashboard: LearnerDashboardSectionContent;
    checkout_cart: CheckoutCartSectionContent;
    search_page: SearchPageSectionContent;
    system_notices: SystemNoticesSectionContent;
  };
}
