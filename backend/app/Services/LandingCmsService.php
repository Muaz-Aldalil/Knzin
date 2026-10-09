<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;
use App\Services\Admin\AdminAuditWriter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LandingCmsService
{
    public const LANDING_SECTIONS = [
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

    public const SITE_WIDE_SECTIONS = [
        'site_shell',
        'raffle_arena',
        'course_detail',
        'lesson_player',
        'affiliate_portal',
        'learner_dashboard',
        'checkout_cart',
        'search_page',
        'system_notices',
    ];

    public const ALL_SECTIONS = [
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
        'site_shell',
        'raffle_arena',
        'course_detail',
        'lesson_player',
        'affiliate_portal',
        'learner_dashboard',
        'checkout_cart',
        'search_page',
        'system_notices',
    ];

    /**
     * Backward-compatible alias for existing landing tests.
     */
    public const SECTIONS = self::LANDING_SECTIONS;

    public function __construct(
        protected AdminAuditWriter $auditWriter
    ) {
    }

    /**
     * Get all legacy landing CMS sections with saved values merged over canonical defaults.
     * Preserves strict assertion counts for existing landing tests.
     */
    public function getAllSections(): array
    {
        return $this->getSectionsList(self::LANDING_SECTIONS);
    }

    /**
     * Get all 20 site-wide CMS sections covering the entire application.
     */
    public function getAllCmsSections(): array
    {
        return $this->getSectionsList(self::ALL_SECTIONS);
    }

    /**
     * Internal helper to load and merge section lists against platform_settings.
     */
    protected function getSectionsList(array $sectionList): array
    {
        $cacheKey = 'cms_sections_' . md5(implode(',', $sectionList));

        return Cache::remember($cacheKey, 300, function () use ($sectionList) {
            $keys = array_map(fn ($s) => "landing.{$s}", $sectionList);
            $settings = PlatformSetting::whereIn('key', $keys)->get()->keyBy('key');

            $result = [];
            foreach ($sectionList as $section) {
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
        });
    }

    /**
     * Get a specific section with default fallbacks.
     */
    public function getSection(string $section): array
    {
        if (!in_array($section, self::ALL_SECTIONS, true)) {
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
        if (!in_array($section, self::ALL_SECTIONS, true)) {
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
                    'description' => "Site-Wide CMS section: {$section}",
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

            Cache::forget('cms_sections_' . md5(implode(',', self::LANDING_SECTIONS)));
            Cache::forget('cms_sections_' . md5(implode(',', self::ALL_SECTIONS)));

            return [
                'section' => $section,
                'content' => $merged,
                'updated_at' => $setting->updated_at?->toIso8601String(),
                'updated_by_user_id' => $actor->id,
            ];
        });
    }

    /**
     * Sanitize inputs against script injection.
     */
    protected function sanitizeSectionData(string $section, array $data): array
    {
        $sanitized = [];
        foreach ($data as $k => $v) {
            if (is_string($v)) {
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
                'badge_ar' => 'منصة التدريب المهني الأولى في العراق',
                'badge_en' => 'Iraq\'s #1 Vocational Platform',
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
                        'answer_ar' => 'تنضج عمولات المبيعات بعد 24 ساعة من عملية الشراء الناجحة، ويمكنك طلب السحب بمجرد بلوغ رصيدك 50 دولاراً ليتم تحويلها عبر زين كاش أو آسيا حوالة.',
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

            // Site-Wide Subsystem Sections
            'site_shell' => [
                'ticker_enabled' => true,
                'ticker_speed' => 'normal',
                'ticker_announcements' => [
                    [
                        'id' => 'ticker-1',
                        'type' => 'enrollment',
                        'highlight_label_ar' => 'انضمام جديد',
                        'highlight_label_en' => 'New Learner',
                        'text_ar' => 'أحمد من بغداد اشترك في ورشة الديكور ونال تذكرة سحب مجانية',
                        'text_en' => 'Ahmed from Baghdad enrolled in Interior Finishing & received 1 free ticket',
                    ],
                    [
                        'id' => 'ticker-2',
                        'type' => 'countdown_alert',
                        'highlight_label_ar' => 'تنبيه السحب',
                        'highlight_label_en' => 'Draw Alert',
                        'text_ar' => 'سحب كَنزين الكبرى القادم: سيارة تويوتا هايلاندر 2026',
                        'text_en' => 'Upcoming Grand Draw: Toyota Highlander 2026',
                    ],
                    [
                        'id' => 'ticker-3',
                        'type' => 'bulletin',
                        'highlight_label_ar' => 'مهارات مهنية',
                        'highlight_label_en' => 'Trade Skills',
                        'text_ar' => 'تعلم صيانة الهواتف، التبريد والتكييف، والطاقة الشمسية بـ 2$ فقط للجزء',
                        'text_en' => 'Master Phone Repair, HVAC, & Solar PV from just $2 per part',
                    ],
                ],
                'whatsapp_enabled' => true,
                'whatsapp_url' => '',
                'whatsapp_button_label_ar' => 'تواصل مع الدعم الفني عبر واتساب',
                'whatsapp_button_label_en' => 'Contact Support via WhatsApp',
                'whatsapp_greeting_ar' => 'مرحباً، لدي استفسار بخصوص منصة كَنزين والدورات التدريبية المتاحة',
                'whatsapp_greeting_en' => 'Hello, I have an inquiry regarding KNZiN platform and available vocational courses',
                'how_it_works_title_ar' => 'كيف تعمل منصة كَنزين؟',
                'how_it_works_title_en' => 'How Does KNZiN Work?',
                'how_it_works_subtitle_ar' => 'ثلاث خطوات بسيطة لاكتساب مهارة مهنية حقيقية والمنافسة على جوائز كبرى',
                'how_it_works_subtitle_en' => 'Three simple steps to gain real vocational trades and enter promotional draws',
                'how_it_works_steps' => [
                    [
                        'step' => 1,
                        'title_ar' => 'تعلم مهارة مهنية تطبيقية',
                        'title_en' => 'Learn Real Vocational Trades',
                        'desc_ar' => 'اختر مساراً تدريبياً يناسب اهتمامك من كهرباء، تبريد، صيانة موبايل، أو دهان واكتسب خبرة عملية تلبي حاجة السوق العراقي.',
                        'desc_en' => 'Select an applied trade like electrical, HVAC, smartphone repair, or auto body paint and gain job-ready Iraqi market skills.',
                        'badge_ar' => '2$ فقط للجزء أو 10$ للدورة كاملة',
                        'badge_en' => '$2 per part or $10 full bundle',
                    ],
                    [
                        'step' => 2,
                        'title_ar' => 'احصل على تذاكر سحب مجانية',
                        'title_en' => 'Receive Free Promotional Tickets',
                        'desc_ar' => 'كل جزء تشتريه يمنحك تذكرة سحب مجانية ترويجية فوراً. وعند شراء الدورة الكاملة تحصل على 15 تذكرة سحب بدلاً من 6!',
                        'desc_en' => 'Every single part gives you 1 instant free promotional ticket. Enrolling in a full bundle awards 15 tickets instead of 6!',
                        'badge_ar' => 'هدية ترويجية مجانية 100%',
                        'badge_en' => '100% Free Promotional Gift',
                    ],
                    [
                        'step' => 3,
                        'title_ar' => 'نافس على الجوائز الكبرى بشفافية',
                        'title_en' => 'Compete for Verified Grand Prizes',
                        'desc_ar' => 'تجري السحوبات علنياً بنظام رقمي مشفر وموثق بقاعدة البيانات وتحت رقابة صارمة، مع فرصة الفوز بسيارة وأجهزة ثمينة.',
                        'desc_en' => 'Draws are conducted publicly using provably fair seed commitment cryptography, giving you a real shot at cars and luxury prizes.',
                        'badge_ar' => 'شفافية ونزاهة معلنة',
                        'badge_en' => 'Provably Fair & Transparent',
                    ],
                ],
                'footer_copyright_ar' => '© 2026 كَنزين للتدريب المهني والتطوير. جميع الحقوق محفوظة.',
                'footer_copyright_en' => '© 2026 KNZiN Vocational Learning. All rights reserved.',
                'footer_disclaimer_ar' => 'منصة كَنزين مرخصة وفق القوانين العراقية. جميع تذاكر السحب هي هدايا ترويجية مجانية مرافقة لشراء الدورات والبرامج التعليمية ولا تباع بشكل منفصل.',
                'footer_disclaimer_en' => 'KNZiN is licensed under Iraqi regulations. All draw tickets are complimentary promotional gifts awarded with educational course purchases and are never sold separately.',
                'header_announcement_badge_ar' => 'منصة التدريب المهني الأولى في العراق',
                'header_announcement_badge_en' => 'Iraq\'s #1 Vocational Platform',
                'header_cta_label_ar' => 'ابدأ الآن',
                'header_cta_label_en' => 'Get Started',
                'header_cta_url' => '/courses',
            ],

            'raffle_arena' => [
                'hero_badge_ar' => 'نظام السحوبات القانوني المرخص',
                'hero_badge_en' => 'Licensed Promotional Draws',
                'hero_title_ar' => 'الجوائز الترويجية المجانية لكَنزين',
                'hero_title_en' => 'KNZiN Free Promotional Raffles',
                'hero_description_ar' => 'في كَنزين، كل تذكرة سحب هي هدية ترويجية مجانية تماماً تُمنح مع شراء المسارات والدورات المهنية. لا نبيع الحظ ولا نفرض رسوم مقامرة، بل نكافئ المتعلمين الطموحين بجوائز حقيقية.',
                'hero_description_en' => 'At KNZiN, every raffle ticket is a completely free promotional gift awarded with vocational course purchases. We do not sell lottery or gambling tickets; we reward ambitious learners with real prizes.',
                'next_draw_title_ar' => 'السحب القادم المجدول',
                'next_draw_title_en' => 'Next Scheduled Draw',
                'next_draw_date_text_ar' => 'نهاية الشهر الحالي',
                'next_draw_date_text_en' => 'End of Current Month',
                'next_draw_note_ar' => 'تحت إشراف وتوثيق علني',
                'next_draw_note_en' => 'Under Public Verification',
                'single_part_title_ar' => 'شراء جزء فردي من الدورة',
                'single_part_title_en' => 'Single Part Purchase',
                'single_part_desc_ar' => 'تعلم جزءاً متخصصاً واحصل على تذكرة مجانية',
                'single_part_desc_en' => 'Master one targeted skill part with a free promotional gift',
                'single_part_perks_ar' => [
                    'تذكرة ترويجية واحدة (1) مجانية فوراً',
                    'وصول دائم للفيديو ومواد التدريب',
                    'رقم تسلسلي موثق ومخزن في قاعدة البيانات',
                ],
                'single_part_perks_en' => [
                    '1 Free Promotional Ticket instantly',
                    'Permanent access to video & practical material',
                    'Verified ticket hash stored in database',
                ],
                'bundle_title_ar' => 'شراء الدورة الكاملة (6 أجزاء)',
                'bundle_title_en' => 'Full 6-Part Course Bundle',
                'bundle_desc_ar' => 'وفر 2$ أو 3,000 د.ع واحصل على باقة 15 تذكرة مجاناً',
                'bundle_desc_en' => 'Save $2 or 3,000 IQD and receive 15 free promotional tickets',
                'bundle_perks_ar' => [
                    '15 تذكرة سحب مجانية ترويجية (مكافأة 9 تذاكر إضافية)',
                    'تغطية شاملة لكل أدوات وورش المهنة',
                    'شهادة إتمام رقمية معتمدة من كَنزين',
                ],
                'bundle_perks_en' => [
                    '15 Free Promotional Tickets (9 Bonus Tickets)',
                    'Full vocational workshop and safety mastery',
                    'Digital Certificate of Completion',
                ],
                'bundle_badge_ar' => 'الأكثر توفيراً وإقبالاً',
                'bundle_badge_en' => 'Best Value & Most Popular',
                'faq_items' => [
                    [
                        'id' => 'rf-1',
                        'question_ar' => 'هل يمكنني شراء تذاكر سحب بدون شراء دورة تدريبية؟',
                        'question_en' => 'Can I purchase raffle tickets without enrolling in a course?',
                        'answer_ar' => 'كلا نهائياً. كَنزين هي منصة تدريب مهني معتمدة. لا نبيع التذاكر بشكل منفصل على الإطلاق، والتذاكر هي هدايا ترويجية تسويقية مجانية فقط للمشتركين في المحتوى التعليمي.',
                        'answer_en' => 'Absolutely not. KNZiN is a vocational learning platform. Tickets cannot be purchased standalone. They are strictly promotional gifts given to students who purchase educational courses.',
                    ],
                    [
                        'id' => 'rf-2',
                        'question_ar' => 'كيف يتم اختيار الفائزين والتأكد من نزاهة السحب؟',
                        'question_en' => 'How are winners selected transparently?',
                        'answer_ar' => 'يتم توليد أرقام التذاكر وتشفيرها داخل قاعدة البيانات، ويتم إجراء السحب علنياً وبحضور مراقبين أو عبر بث مباشر معلن موعده مسبقاً باستخدام بذور عشوائية مثبتة SHA-256.',
                        'answer_en' => 'Ticket hashes are recorded cryptographically in our database. Draws are conducted publicly with pre-announced schedules and verifiable commit-reveal seed cryptography.',
                    ],
                    [
                        'id' => 'rf-3',
                        'question_ar' => 'أين يمكنني رؤية تذاكري المكتسبة بعد الشراء؟',
                        'question_en' => 'Where can I see my accumulated tickets?',
                        'answer_ar' => 'تظهر تذاكرك في الشريط العلوي فور تسجيل الدخول وإتمام الطلب، كما تظهر في صفحة ملخص الطلب وحساب المتدرب الشخصي.',
                        'answer_en' => 'Your tickets appear directly in the top HUD navbar after login and order completion, as well as on your Order Summary and Profile screens.',
                    ],
                ],
                'is_visible' => true,
            ],

            'course_detail' => [
                'guarantee_badge_ar' => 'ضمان كَنزين المهني المعتمد',
                'guarantee_badge_en' => 'KNZiN Certified Vocational Guarantee',
                'guarantee_headline_ar' => 'تدريب عملي يوصلك لسوق العمل',
                'guarantee_headline_en' => 'Hands-On Training Designed for Immediate Employment',
                'guarantee_description_ar' => 'كل مادة تدريبية تم تصويرها في ورش حقيقية وبأيدي محترفين عراقيين لنقل الخبرة الفعلية بدون تنظير.',
                'guarantee_description_en' => 'Every curriculum is recorded in real workshops by seasoned Iraqi masters to transfer practical fieldwork without academic filler.',
                'bundle_promo_badge_ar' => 'العرض الترويجي الشامل',
                'bundle_promo_badge_en' => 'All-Inclusive Bundle Offer',
                'bundle_promo_title_ar' => 'وفر 60% مع الحقيبة الكاملة + 15 تذكرة سحب',
                'bundle_promo_title_en' => 'Save 60% with the Complete Bundle + 15 Sweepstakes Tickets',
                'bundle_promo_desc_ar' => 'احصل على الأجزاء الستة كاملة بسعر 10$ فقط بدلاً من 12$، واستلم 15 تذكرة سحب ترويجية كهدية فورية.',
                'bundle_promo_desc_en' => 'Acquire all 6 course parts for just $10 instead of $12, and claim 15 promotional raffle tickets instantly.',
                'learning_outcomes_header_ar' => 'ماذا ستتعلم في هذه الدورة المهنية؟',
                'learning_outcomes_header_en' => 'What Practical Skills Will You Master?',
                'is_visible' => true,
            ],

            'lesson_player' => [
                'paywall_headline_ar' => 'هذا الدرس مخصص للمشتركين',
                'paywall_headline_en' => 'This Lesson Part Is Locked',
                'paywall_subheadline_ar' => 'اشترك في هذا الجزء المهني بـ 2$ فقط، أو احصل على الدورة الكاملة بـ 10$ مع 15 تذكرة سحب ترويجية.',
                'paywall_subheadline_en' => 'Unlock this trade part for only $2, or get the entire 6-part course for $10 with 15 free bonus tickets.',
                'paywall_perks_ar' => [
                    'مشاهدة غير محدودة وبجودة عالية مع شهادة إتمام',
                    'تذكرة سحب مجانية فورية للدخول في السحب القادم',
                    'تحميل المخططات الفنية وقوائم الأدوات العملية',
                ],
                'paywall_perks_en' => [
                    'Unlimited HD playback and verified completion certificate',
                    'Instant free sweepstakes ticket for the upcoming draw',
                    'Downloadable practical wiring diagrams & tool guides',
                ],
                'paywall_cta_label_ar' => 'فتح الجزء الآن بـ 2$',
                'paywall_cta_label_en' => 'Unlock Part for $2',
                'completion_banner_title_ar' => 'تهانينا! أتممت هذا الدرس بنجاح',
                'completion_banner_title_en' => 'Congratulations! You Completed This Lesson',
                'completion_banner_desc_ar' => 'واصل تقدمك لإكمال باقي أجزاء المسار المهني والحصول على شهادتك المعتمدة.',
                'completion_banner_desc_en' => 'Continue to the next part to master the complete trade and earn your verified certificate.',
                'is_visible' => true,
            ],

            'affiliate_portal' => [
                'onboarding_title_ar' => 'تسجيل الدخول إلى بوابة الشركاء والمسوّقين',
                'onboarding_title_en' => 'Sign In to Your Affiliate Portal',
                'onboarding_desc_ar' => 'سجّل الدخول للحصول على رابط الإحالة الخاص بك، ومتابعة عمولات المبيعات (25%)، ومكافأة الفوز بالجائزة الكبرى (40%).',
                'onboarding_desc_en' => 'Sign in to access your unique referral link, track 25% sales commissions, and claim 40% co-prize rewards.',
                'onboarding_points_ar' => [
                    'عمولة مباشرة 25% على كل طلب شراء يتم عبر رابطك',
                    'مشاركة بنسبة 40% من الجائزة الكبرى إذا فاز أحد المسجلين عبرك',
                    'لوحة متابعة فورية وسحب أرباح ميسر عبر Western Union وزين كاش',
                ],
                'onboarding_points_en' => [
                    'Direct 25% cash commission on every completed order through your link',
                    '40% co-prize share if any of your referred learners wins a grand draw',
                    'Real-time conversion tracking with instant Western Union and Zain Cash withdrawals',
                ],
                'banner_title_ar' => 'برنامج شركاء كنزيْن الرسمي',
                'banner_title_en' => 'Official KNZiN Partner Program',
                'banner_subtitle_ar' => 'شارك العلم المهني، وساهم في تأهيل الشباب العراقي، واكسب عمولات مستدامة وجوائز قيمة.',
                'banner_subtitle_en' => 'Empower Iraqi youth with applied skills while earning recurring commissions and co-prize shares.',
                'policy_notice_title_ar' => 'سياسة السحب النشطة',
                'policy_notice_title_en' => 'Active Withdrawal Policy',
                'policy_notice_text_ar' => 'الحد الأدنى لطلب السحب هو 50$ (أو ما يعادله بالدينار العراقي). يتم تحويل المبالغ خلال 48 ساعة عمل.',
                'policy_notice_text_en' => 'The minimum payout threshold is $50.00. Payouts are reviewed and settled within 48 business hours.',
                'coprize_rules_title_ar' => 'نظام مشاركة الجائزة الكبرى (40%)',
                'coprize_rules_title_en' => '40% Grand Co-Prize Partner Reward',
                'coprize_rules_desc_ar' => 'عندما يفوز أي متدرب اشترى دورة عبر رابط إحالتك بسيارة أو جائزة كبرى، يمنحك كَنزين تلقائياً 40% من قيمة الجائزة نقداً تقديراً لجهدك في استقطابه!',
                'coprize_rules_desc_en' => 'If any learner referred by your link wins a car or grand prize, KNZiN automatically awards you a 40% co-prize cash bonus to celebrate your contribution!',
                'is_visible' => true,
            ],

            'learner_dashboard' => [
                'welcome_title_ar' => 'مرحباً بك في مساحتك المهنية',
                'welcome_title_en' => 'Welcome to Your Vocational Learning Space',
                'welcome_subtitle_ar' => 'تابع دوراتك، راقب تذاكرك الترويجية، وطور مهاراتك اليومية نحو الاستقلال المالي.',
                'welcome_subtitle_en' => 'Track your courses, view your active raffle tickets, and master vocational trades.',
                'empty_headline_ar' => 'لم تشترك في أي دورة مهنية بعد',
                'empty_headline_en' => 'No Enrolled Courses Yet',
                'empty_desc_ar' => 'ابدأ باكتساب مهارات عملية من سوق العمل بـ 2$ فقط للجزء أو 10$ للحقيبة كاملة واحصل على تذاكر سحب مجانية.',
                'empty_desc_en' => 'Start learning practical trade skills for $2 per part or $10 for a full bundle with free bonus tickets.',
                'empty_cta_label_ar' => 'تصفح دليل الدورات المتاحة',
                'empty_cta_label_en' => 'Explore Available Trade Courses',
                'unauthenticated_title_ar' => 'تسجيل الدخول إلى لوحة التدريب',
                'unauthenticated_title_en' => 'Sign In to Your Learning Hub',
                'unauthenticated_desc_ar' => 'سجّل الدخول للوصول إلى دوراتك المهنية المشتركة، ومتابعة تقدمك العملي، وتذاكر السحب المكتسبة.',
                'unauthenticated_desc_en' => 'Sign in to access your enrolled vocational courses, continue learning, and view your promotional tickets.',
                'is_visible' => true,
            ],

            'checkout_cart' => [
                'trust_badge_ar' => 'شراء آمن ومحمي 100%',
                'trust_badge_en' => '100% Secure & Protected Purchase',
                'trust_headline_ar' => 'دفع إلكتروني فوري ومضمون عبر زين كاش وآسيا حوالة',
                'trust_headline_en' => 'Instant & Guaranteed Mobile Checkout via Zain Cash & AsiaHawala',
                'trust_description_ar' => 'تصلك محتويات الدورة فور تأكيد الدفع مع تذاكر السحب الترويجية المجانية مباشرة في حسابك.',
                'trust_description_en' => 'Course access and your free promotional sweepstakes tickets are credited instantly upon payment confirmation.',
                'ticket_gift_notice_ar' => 'هذه التذاكر هي هدايا تسويقية مجانية بالكامل مرفقة بالدورة التدريبية.',
                'ticket_gift_notice_en' => 'These promotional tickets are completely free gifts awarded with your educational purchase.',
                'order_celebration_title_ar' => 'تم تأكيد طلبك بنجاح! مبروك!',
                'order_celebration_title_en' => 'Order Successfully Confirmed! Congratulations!',
                'order_celebration_desc_ar' => 'تم فتح محتوى الدورة التدريبية وتخصيص تذاكر السحب الترويجية في حسابك بأرقام تسلسلية مشفرة.',
                'order_celebration_desc_en' => 'Your course entitlement is activated and promotional draw tickets are minted with cryptographic serials.',
                'order_ticket_reassurance_ar' => 'يمكنك معاينة تذاكرك وأرقامها المشفرة في أي وقت من خلال الشريط العلوي (HUD).',
                'order_ticket_reassurance_en' => 'You can view your minted tickets and hashes anytime from the top HUD bar.',
                'is_visible' => true,
            ],

            'search_page' => [
                'hero_headline_ar' => 'البحث الذكي في المهارات والورش المهنية',
                'hero_headline_en' => 'Smart Search Across Trade Skills & Workshops',
                'hero_subtitle_ar' => 'ابحث عن أي عطل، تقنية، أو أداة وتوجه فوراً إلى الجزء التدريبي الدقيق الذي يشرحها بالفيديو.',
                'hero_subtitle_en' => 'Search any defect, technique, or tool and jump directly to the exact video part demonstrating it.',
                'search_placeholder_ar' => 'ابحث بالمهنة، التقنية، أو أداة الورشة (مثلاً: إنفرتر، صبغ سيارات، شورت باور)...',
                'search_placeholder_en' => 'Search by trade, tool, or defect (e.g. Inverter, Auto Paint, Power Rail)...',
                'suggested_queries_ar' => [
                    'علاج خدوش الصبغ بالنانو',
                    'حساب أحمال الطاقة الشمسية والإنفرتر',
                    'تشخيص شورت الباور والـ VDD',
                    'شحن غاز التبريد R410A بالميزان',
                    'برمجة كاميرات المراقبة IP عن بعد',
                    'تدريج السكين فيد ونحت اللحية',
                    'معايرة طاحونة الإسبريسو واللاتيه آرت',
                    'تسعير مشاريع الفريلانس بالعراق',
                ],
                'suggested_queries_en' => [
                    'Nano ceramic paint correction',
                    'Solar PV inverter sizing & battery bank',
                    'Phone board short & VDD power rail',
                    'Inverter AC R410A refrigerant charge',
                    'IP CCTV PoE camera remote viewing',
                    'Skin fade haircut & beard sculpting',
                    'Espresso grinder dialing & latte art',
                    'Freelance project pricing & contracts',
                ],
                'search_tips_title_ar' => 'نصائح للبحث الفعال',
                'search_tips_title_en' => 'Tips for Effective Searching',
                'search_tips_items_ar' => [
                    'استخدم أسماء الأعطال الشائعة في السوق العراقي للوصول لأدق الحلول.',
                    'يمكنك البحث بالإنجليزية أو العربية، ومحرك البحث يدعم المصطلحات الفنية.',
                    'اضغط على النتيجة للانتقال المباشر للدقيقة المحددة في الفيديو.',
                ],
                'search_tips_items_en' => [
                    'Use common trade defect names to find the exact video lesson segment.',
                    'Search in English or Arabic; technical jargon is supported in both.',
                    'Click any search result to jump directly to that timestamp in the video.',
                ],
                'empty_title_ar' => 'لم نجد نتائج مطابقة لبحثك',
                'empty_title_en' => 'No Matching Results Found',
                'empty_desc_ar' => 'جرب البحث بكلمات أبسط أو تصفح المناهج حسب المهنة من الصفحة الرئيسية.',
                'empty_desc_en' => 'Try searching with simpler terms or browse trade categories from the home catalog.',
                'is_visible' => true,
            ],

            'system_notices' => [
                'not_found_title_ar' => 'الصفحة غير موجودة (404)',
                'not_found_title_en' => 'Page Not Found (404)',
                'not_found_desc_ar' => 'عذراً، المسار أو المحتوى المهني الذي تبحث عنه غير متاح أو تم تحديثه ضمن مسارات المنصة الجديدة.',
                'not_found_desc_en' => 'Sorry, the page or vocational curriculum you are looking for is unavailable or has been relocated.',
                'not_found_home_btn_ar' => 'الرئيسية والدورات',
                'not_found_home_btn_en' => 'Home & Courses',
                'not_found_search_btn_ar' => 'البحث الذكي',
                'not_found_search_btn_en' => 'Smart Search',
                'error_title_ar' => 'حدث خطأ غير متوقع',
                'error_title_en' => 'Something went wrong',
                'error_desc_ar' => 'نعتذر، واجهت الصفحة مشكلة تقنية غير متوقعة. يرجى إعادة المحاولة أو العودة للصفحة الرئيسية.',
                'error_desc_en' => 'An unexpected runtime error occurred. Please try reloading the view or navigate back home.',
                'error_retry_btn_ar' => 'إعادة المحاولة',
                'error_retry_btn_en' => 'Try Again',
                'error_home_btn_ar' => 'الرئيسية',
                'error_home_btn_en' => 'Go Home',
                'is_visible' => true,
            ],

            default => [],
        };
    }
}
