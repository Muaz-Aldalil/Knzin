<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLandingCmsTest extends TestCase
{
    use RefreshDatabase;

    protected function createAdmin(bool $withCapability = true): array
    {
        $admin = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);

        if ($withCapability) {
            $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        }

        $token = $admin->createToken('admin_token')->plainTextToken;

        return [$admin, ['Authorization' => "Bearer {$token}"]];
    }

    public function test_public_landing_content_endpoint_is_accessible_to_guests(): void
    {
        $response = $this->getJson('/api/v1/content/landing');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'sections' => [
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
                ],
            ],
        ]);

        $this->assertEquals('Master In-Demand Trades... And Win Your Dream Car', $response->json('data.sections.hero.heading_en'));
    }

    public function test_admin_landing_cms_requires_manage_platform_settings_capability(): void
    {
        // Unauthenticated
        $this->getJson('/api/v1/admin/cms/landing')->assertStatus(401);

        // Authenticated without capability
        [$user, $headers] = $this->createAdmin(withCapability: false);
        $this->withHeaders($headers)->getJson('/api/v1/admin/cms/landing')->assertStatus(403);
    }

    public function test_admin_can_read_all_and_single_sections(): void
    {
        [$admin, $headers] = $this->createAdmin();

        $allResponse = $this->withHeaders($headers)->getJson('/api/v1/admin/cms/landing');
        $allResponse->assertStatus(200);
        $this->assertCount(11, $allResponse->json('data.sections'));

        $singleResponse = $this->withHeaders($headers)->getJson('/api/v1/admin/cms/landing/skill_capital');
        $singleResponse->assertStatus(200);
        $this->assertEquals('Skill Is The Ultimate Capital', $singleResponse->json('data.content.title_en'));
    }

    public function test_admin_can_update_cms_section_with_audit_trail_and_sanitization(): void
    {
        [$admin, $headers] = $this->createAdmin();

        $payload = [
            'heading_en' => 'Updated English Heading <script>alert("xss")</script>',
            'heading_ar' => 'عنوان عربي محدث',
            'badge_en' => 'Special Verified Badge',
        ];

        $response = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/hero', $payload);

        $response->assertStatus(200);
        // Script tag must be stripped
        $this->assertEquals('Updated English Heading alert("xss")', $response->json('data.content.heading_en'));
        $this->assertEquals('عنوان عربي محدث', $response->json('data.content.heading_ar'));
        $this->assertEquals('Special Verified Badge', $response->json('data.content.badge_en'));

        // Verify audit log
        $this->assertDatabaseHas('admin_activity_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'cms.landing_updated',
            'target_type' => 'cms_section',
            'target_id' => 'landing.hero',
            'outcome' => 'success',
        ]);

        // Verify public consumer immediately reflects update
        $publicResponse = $this->getJson('/api/v1/content/landing');
        $publicResponse->assertStatus(200);
        $this->assertEquals('Updated English Heading alert("xss")', $publicResponse->json('data.sections.hero.heading_en'));
        $this->assertEquals('عنوان عربي محدث', $publicResponse->json('data.sections.hero.heading_ar'));
    }

    public function test_unknown_section_returns_validation_error(): void
    {
        [$admin, $headers] = $this->createAdmin();

        $response = $this->withHeaders($headers)->getJson('/api/v1/admin/cms/landing/invalid_section');
        $response->assertStatus(422);
    }

    public function test_admin_can_toggle_section_visibility_and_update_repeatable_faq_items(): void
    {
        [$admin, $headers] = $this->createAdmin();

        // 1. Toggle visibility off
        $hideResponse = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/promotional_banner', [
            'is_visible' => false,
        ]);
        $hideResponse->assertStatus(200);
        $this->assertFalse($hideResponse->json('data.content.is_visible'));

        $publicResponse = $this->getJson('/api/v1/content/landing');
        $this->assertFalse($publicResponse->json('data.sections.promotional_banner.is_visible'));

        // 2. Manage repeatable FAQ items (add, edit, reorder)
        $newFaqItems = [
            [
                'id' => 'faq-custom-1',
                'question_ar' => 'سؤال مخصص جديد',
                'question_en' => 'New custom question',
                'answer_ar' => 'جواب مخصص مفصل',
                'answer_en' => 'Detailed custom answer',
            ],
            [
                'id' => 'faq-custom-2',
                'question_ar' => 'سؤال إضافي ثان',
                'question_en' => 'Second additional question',
                'answer_ar' => 'جواب ثان معتمد',
                'answer_en' => 'Second verified answer',
            ],
        ];

        $faqResponse = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/referral_faq', [
            'is_visible' => true,
            'title_ar' => 'الأسئلة الشائعة المحدثة',
            'title_en' => 'Updated FAQ Header',
            'items' => $newFaqItems,
        ]);

        $faqResponse->assertStatus(200);
        $this->assertEquals('Updated FAQ Header', $faqResponse->json('data.content.title_en'));
        $this->assertCount(2, $faqResponse->json('data.content.items'));
        $this->assertEquals('faq-custom-1', $faqResponse->json('data.content.items.0.id'));
        $this->assertEquals('faq-custom-2', $faqResponse->json('data.content.items.1.id'));

        // Re-read public endpoint
        $publicFaq = $this->getJson('/api/v1/content/landing');
        $this->assertCount(2, $publicFaq->json('data.sections.referral_faq.items'));
        $this->assertEquals('New custom question', $publicFaq->json('data.sections.referral_faq.items.0.question_en'));
    }
}
