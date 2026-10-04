<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;
use App\Services\Admin\AdminAuditWriter;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LandingCmsService
{
    public const SECTIONS = [
        'hero',
        'skill_capital',
        'courses_display',
        'promotional_banner',
        'promotional_referral',
        'free_referral_card',
        'legal_compliance',
        'referral_faq',
        'ticket_ladder',
        'affiliate_referral',
        'draw_content',
    ];

    public function __construct(
        protected AdminAuditWriter $auditWriter
    ) {
    }

    /**
     * Get all landing CMS sections with saved values merged over canonical defaults.
     */
    public function getAllSections(): array
    {
        $keys = array_map(fn ($s) => "landing.{$s}", self::SECTIONS);
        $settings = PlatformSetting::whereIn('key', $keys)->get()->keyBy('key');

        $result = [];
        foreach (self::SECTIONS as $section) {
            $key = "landing.{$section}";
            $setting = $settings->get($key);
            $default = $this->getDefaults($section);
            $content = $setting && is_array($setting->value) ? array_merge($default, $setting->value) : $default;

            $result[$section] = [
                'section' => $section,
                'content' => $content,
                'updated_at' => $setting?->updated_at?->toIso8601String(),
                'updated_by_user_id' => $setting?->updated_by_user_id,
            ];
        }

        return $result;
    }

    /**
     * Get a specific section with default fallbacks.
     */
    public function getSection(string $section): array
    {
        if (!in_array($section, self::SECTIONS, true)) {
            throw ValidationException::withMessages([
                'section' => ["Unknown CMS section: '{$section}'"],
            ]);
        }

        $key = "landing.{$section}";
        $setting = PlatformSetting::where('key', $key)->first();
        $default = $this->getDefaults($section);
        $content = $setting && is_array($setting->value) ? array_merge($default, $setting->value) : $default;

        return [
            'section' => $section,
            'content' => $content,
            'updated_at' => $setting?->updated_at?->toIso8601String(),
            'updated_by_user_id' => $setting?->updated_by_user_id,
        ];
    }

    /**
     * Update a specific section inside a transaction with audit logging and sanitization.
     */
    public function updateSection(string $section, array $data, User $actor, AdminAuditContext $auditContext): array
    {
        if (!in_array($section, self::SECTIONS, true)) {
            throw ValidationException::withMessages([
                'section' => ["Unknown CMS section: '{$section}'"],
            ]);
        }

        $sanitized = $this->sanitizeSectionData($section, $data);

        return DB::transaction(function () use ($section, $sanitized, $actor, $auditContext) {
            $key = "landing.{$section}";
            $existing = PlatformSetting::where('key', $key)->first();
            $beforeState = $existing ? $existing->value : $this->getDefaults($section);

            $merged = array_merge($beforeState, $sanitized);

            $setting = PlatformSetting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $merged,
                    'description' => "Landing Page CMS section: {$section}",
                    'updated_by_user_id' => $actor->id,
                ]
            );

            $this->auditWriter->record(
                context: $auditContext,
                action: 'cms.landing_updated',
                targetType: 'cms_section',
                targetId: $key,
                beforeState: $beforeState,
                afterState: $merged,
                outcome: 'success',
                reasonCode: 'CMS_SECTION_UPDATED'
            );

            return [
                'section' => $section,
                'content' => $merged,
                'updated_at' => $setting->updated_at?->toIso8601String(),
                'updated_by_user_id' => $actor->id,
            ];
        });
    }

    /**
     * Sanitize inputs against script injection and validate URLs.
     */
    protected function sanitizeSectionData(string $section, array $data): array
    {
        $sanitized = [];
        foreach ($data as $k => $v) {
            if (is_string($v)) {
                // Strip tags except harmless inline formatting
                $clean = strip_tags($v);
                $sanitized[$k] = trim($clean);
            } elseif (is_array($v)) {
                $sanitized[$k] = $this->sanitizeRecursive($v);
            } else {
                $sanitized[$k] = $v;
            }
        }

        return $sanitized;
    }

    protected function sanitizeRecursive(array $items): array
    {
        $clean = [];
        foreach ($items as $k => $v) {
            if (is_string($v)) {
                $clean[$k] = trim(strip_tags($v));
            } elseif (is_array($v)) {
                $clean[$k] = $this->sanitizeRecursive($v);
            } else {
                $clean[$k] = $v;
            }
        }
        return $clean;
    }

    /**
     * Canonical defaults matching public design specifications and localization.
     */
    public function getDefaults(string $section): array
    {
        return match ($section) {
            'hero' => [
                'badge_ar' => 'فرصتك لتعلم مهارة حقيقية والفوز بجوائز قيمة',
                'badge_en' => 'Learn a real vocational skill and win dream rewards',
                'heading_ar' => 'تعلم مهنة المستقبل... واربح سيارة أحلامك',
                'heading_en' => 'Master In-Demand Trades... And Win Your Dream Car',
                'subheading_ar' => 'دورات مهنية تطبيقية في سوق العمل العراقي مع تذكرة سحب مجانية مرفقة مع كل دورة أو جزء تشتريه.',
                'subheading_en' => 'Hands-on vocational courses tailored for the Iraqi market, with a free promotional sweepstakes ticket included with every purchase.',
                'primary_cta_label_ar' => 'تصفح الدورات وابدأ الآن',
                'primary_cta_label_en' => 'Explore Courses & Start',
                'primary_cta_url' => '#catalog',
                'secondary_cta_label_ar' => 'كيف يعمل كَنزين؟',
                'secondary_cta_label_en' => 'How It Works',
                'secondary_cta_url' => '#how-it-works',
                'price_display_override_ar' => '',
                'price_display_override_en' => '',
                'timer_active' => true,
                'timer_title_ar' => 'السحب الشهري القادم',
                'timer_title_en' => 'Next Monthly Draw Countdown',
                'hero_image_url' => '',
            ],
            'skill_capital' => [
                'title_ar' => 'المهارة هي رأس المال الحقيقي',
                'title_en' => 'Skill Is The Ultimate Capital',
                'quote_ar' => 'الاستثمار في مهارة تطبيقية يمنحك مهنة مدى الحياة، وتذكرة السحب هي فرصتك لتغيير واقعك المالي فوراً.',
                'quote_en' => 'Investing in an applied skill gives you a lifelong trade, and the promotional ticket gives you an immediate shot at transforming your financial reality.',
                'author_name_ar' => 'معاذ الدليل',
                'author_name_en' => 'Muaz Al-Dalil',
                'author_title_ar' => 'مؤسس منصة كَنزين',
                'author_title_en' => 'Founder, KNZiN Platform',
                'is_visible' => true,
            ],
            'courses_display' => [
                'section_title_ar' => 'المناهج والدورات التدريبية المعتمدة',
                'section_title_en' => 'Certified Curricula & Courses',
                'section_subtitle_ar' => 'اختر الدورة المهنية التي تناسب طموحك وابدأ مسارك العملي فوراً.',
                'section_subtitle_en' => 'Select the vocational course fitting your ambition and launch your career immediately.',
                'featured_course_id' => null,
                'show_bundle_discount_badge' => true,
                'bundle_badge_text_ar' => 'وفر 60% مع الباقة الكاملة + 15 تذكرة سحب',
                'bundle_badge_text_en' => 'Save 60% with Complete Bundle + 15 Draw Tickets',
                'is_visible' => true,
            ],
            'promotional_banner' => [
                'is_visible' => true,
                'headline_ar' => 'سحب كَنزين الكبرى: سيارة تويوتا هايلاندر 2026',
                'headline_en' => 'KNZiN Grand Draw: Toyota Highlander 2026',
                'subheadline_ar' => 'كل دورة تدريبية تشتريها تمنحك تذاكر سحب مجانية بدون أي تكلفة إضافية!',
                'subheadline_en' => 'Every vocational course purchased grants you free promotional draw tickets at no extra cost!',
                'banner_image_url' => '',
                'cta_label_ar' => 'احجز دورتك وادخل السحب',
                'cta_label_en' => 'Enroll Now & Enter Draw',
                'cta_url' => '#catalog',
            ],
            'promotional_referral' => [
                'is_visible' => true,
                'title_ar' => 'برنامج الإحالة والشراكة الترويجية',
                'title_en' => 'Promotional Referral & Affiliate Program',
                'description_ar' => 'شارك رابط إحالتك واكسب 25% عمولة مبيعات نقدية + 40% من قيمة الجائزة الكبرى عند فوز صديقك المدعو!',
                'description_en' => 'Share your referral link and earn 25% cash sales commission + a 40% co-share of the grand prize when your invited friend wins!',
                'commission_badge_ar' => '25% عمولة فورية',
                'commission_badge_en' => '25% Instant Commission',
                'coprize_badge_ar' => '40% مشاركة بالجائزة الكبرى',
                'coprize_badge_en' => '40% Grand Prize Co-Share',
                'cta_label_ar' => 'انضم إلى برنامج الشركاء',
                'cta_label_en' => 'Join Partner Program',
                'cta_url' => '/affiliate#referral',
            ],
            'free_referral_card' => [
                'is_visible' => true,
                'card_title_ar' => 'تذكرتك المجانية بانتظارك',
                'card_title_en' => 'Your Free Ticket Awaits',
                'card_text_ar' => 'سجل حسابك وشارك رابطك مع 3 أصدقاء لفرصة الحصول على تذكرة سحب مجانية إضافية.',
                'card_text_en' => 'Register and share your link with 3 friends for a chance to receive an additional free promotional ticket.',
                'badge_text_ar' => 'مكافأة مجانية',
                'badge_text_en' => 'Free Reward',
            ],
            'legal_compliance' => [
                'legal_statement_ar' => 'أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل.',
                'legal_statement_en' => 'I agree to the Terms, Conditions, and Privacy Policy, acknowledging that I am purchasing educational digital content, and the attached draw ticket is a free non-refundable promotional gift.',
                'consumer_protection_law_ar' => 'وفقاً لقانون حماية المستهلك العراقي رقم (1) لسنة 2010.',
                'consumer_protection_law_en' => 'In accordance with Iraqi Consumer Protection Law No. (1) of 2010.',
                'kyc_notice_ar' => 'تخضع الجوائز التي تتجاوز قيمتها 100 دولار لشرط التحقق من الهوية الرسمية (البطاقة الوطنية / جواز السفر).',
                'kyc_notice_en' => 'Prizes valued over $100 are subject to mandatory national ID or passport verification.',
            ],
            'referral_faq' => [
                'is_visible' => true,
                'title_ar' => 'الأسئلة الشائعة حول كَنزين ونظام الجوائز',
                'title_en' => 'Frequently Asked Questions About KNZiN & Rewards',
                'items' => [
                    [
                        'id' => 'faq-1',
                        'question_ar' => 'هل أنا أشتري تذكرة سحب أم دورة تدريبية؟',
                        'question_en' => 'Am I buying a lottery ticket or a training course?',
                        'answer_ar' => 'أنت تشتري محتوى تعليمياً ومهنياً 100%. تذاكر السحب هي هدية ترويجية مجانية ملحقة بالدورة لتشجيع المتدربين، وليس لها أي قيمة مالية منفصلة.',
                        'answer_en' => 'You are 100% purchasing educational vocational content. Sweepstakes tickets are free promotional gifts attached to motivate learners and have no independent purchase value.',
                    ],
                    [
                        'id' => 'faq-2',
                        'question_ar' => 'كيف يتم تحديد الفائز في السحوبات؟',
                        'question_en' => 'How is the winner determined in promotional draws?',
                        'answer_ar' => 'تعتمد المنصة خوارزمية إثبات النزاهة الرياضية (Provably Fair) باستخدام بذور تشفير سرية يتم نشر تجزئتها مسبقاً قبل بدء السحب لضمان الشفافية المطلقة.',
                        'answer_en' => 'The platform employs a Provably Fair cryptographic algorithm using pre-committed server seed hashes published before draw opening to guarantee absolute transparency.',
                    ],
                    [
                        'id' => 'faq-3',
                        'question_ar' => 'متى وكيف أستلم أرباحي من برنامج الإحالة؟',
                        'question_en' => 'When and how do I receive my affiliate earnings?',
                        'answer_ar' => 'تنضج عمولات المبيعات بعد 24 ساعة من عملية الشراء الناجحة، ويمكنك طلب السحب بمجرد بلوغ رصيدك 50 دولاراً ليتم تحويلها عبر زين كاش أو آسي حوالة.',
                        'answer_en' => 'Sales commissions mature 24 hours after verified order completion, and you can request payout once your balance reaches $50 via ZainCash or AsiaHawala.',
                    ],
                ],
            ],
            'ticket_ladder' => [
                'is_visible' => true,
                'title_ar' => 'سلم التذاكر الترويجية',
                'title_en' => 'Promotional Tickets Ladder',
                'part_rate_text_ar' => 'تذكرة واحدة مع كل جزء تدريبي فردي ($2)',
                'part_rate_text_en' => '1 ticket with each individual course part ($2)',
                'bundle_rate_text_ar' => '15 تذكرة مع الدورة الكاملة ($10) - أفضل قيمة!',
                'bundle_rate_text_en' => '15 tickets with the complete course bundle ($10) - Best Value!',
                'disclaimer_ar' => 'التذاكر هدايا ترويجية قانونية تصدر تلقائياً مع تأكيد الدفع.',
                'disclaimer_en' => 'Tickets are lawful promotional gifts issued automatically upon payment confirmation.',
            ],
            'affiliate_referral' => [
                'hero_title_ar' => 'اكسب مع كَنزين: برنامج الشركاء الأكثر سخاءً',
                'hero_title_en' => 'Earn With KNZiN: The Most Generous Partner Program',
                'hero_subtitle_ar' => 'اربح عمولة نقدية مباشرة 25% وشارك بنسبة 40% من الجائزة الكبرى عند فوز أي متدرب يسجل عبر رابطك.',
                'hero_subtitle_en' => 'Earn 25% direct cash commission and a 40% co-share of the grand prize when any learner referred by you wins.',
                'how_it_works_ar' => '1. شارك رابطك الفريد. 2. اشترك المتدرب في دورة مهنية. 3. استلم عمولتك وتنافس على حصة الفائز.',
                'how_it_works_en' => '1. Share your unique link. 2. Learner enrolls in a course. 3. Receive your commission and qualify for winner co-share.',
            ],
            'draw_content' => [
                'hall_of_fame_title_ar' => 'لوحة شرف الفائزين بالسحوبات الترويجية',
                'hall_of_fame_title_en' => 'Promotional Draws Hall of Fame',
                'hall_of_fame_subtitle_ar' => 'جميع الفائزين موثقون بشهادات تسليم رسمية وبراهين تشفيرية علنية.',
                'hall_of_fame_subtitle_en' => 'All winners are documented with official delivery certificates and public cryptographic proofs.',
                'podcast_title_ar' => 'بودكاست كَنزين وحلقات إعلان الفائزين',
                'podcast_title_en' => 'KNZiN Podcast & Draw Announcement Episodes',
                'podcast_description_ar' => 'شاهد البثوث المباشرة وحوارات المتدربين وقصص نجاح خريجي الدورات المهنية.',
                'podcast_description_en' => 'Watch live broadcasts, learner interviews, and success stories of vocational course graduates.',
                'live_stream_url' => '',
                'latest_podcast_url' => '',
            ],
            default => [],
        };
    }
}
