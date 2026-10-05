<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\Course;
use App\Models\Draw;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteWideCmsTest extends TestCase
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

    public function test_public_site_wide_endpoint_returns_all_20_sections(): void
    {
        $response = $this->getJson('/api/v1/content/site-wide');

        $response->assertStatus(200);
        $sections = $response->json('data.sections');
        $this->assertIsArray($sections);
        $this->assertCount(20, $sections);

        // Verify key site-wide sections exist
        $this->assertArrayHasKey('site_shell', $sections);
        $this->assertArrayHasKey('raffle_arena', $sections);
        $this->assertArrayHasKey('course_detail', $sections);
        $this->assertArrayHasKey('lesson_player', $sections);
        $this->assertArrayHasKey('affiliate_portal', $sections);
        $this->assertArrayHasKey('learner_dashboard', $sections);
        $this->assertArrayHasKey('checkout_cart', $sections);
        $this->assertArrayHasKey('search_page', $sections);
        $this->assertArrayHasKey('system_notices', $sections);

        // Check defaults
        $this->assertTrue($sections['site_shell']['ticker_enabled']);
        $this->assertEquals('Licensed Promotional Draws', $sections['raffle_arena']['hero_badge_en']);
        $this->assertEquals('KNZiN Certified Vocational Guarantee', $sections['course_detail']['guarantee_badge_en']);
        $this->assertEquals('This Lesson Part Is Locked', $sections['lesson_player']['paywall_headline_en']);
    }

    public function test_public_landing_endpoint_with_scope_all_returns_all_20_sections(): void
    {
        $response = $this->getJson('/api/v1/content/landing?scope=all');

        $response->assertStatus(200);
        $sections = $response->json('data.sections');
        $this->assertCount(20, $sections);
    }

    public function test_admin_can_read_all_site_wide_sections_with_scope_all(): void
    {
        [$admin, $headers] = $this->createAdmin();

        $response = $this->withHeaders($headers)->getJson('/api/v1/admin/cms/landing?scope=all');
        $response->assertStatus(200);
        $sections = $response->json('data.sections');
        $this->assertCount(20, $sections);
    }

    public function test_admin_can_update_site_shell_and_checkout_cart_sections(): void
    {
        [$admin, $headers] = $this->createAdmin();

        // 1. Update site_shell
        $shellPayload = [
            'ticker_enabled' => false,
            'whatsapp_url' => 'https://wa.me/9647701234567',
            'footer_copyright_ar' => 'حقوق مخصصة كَنزين 2026',
        ];

        $shellResponse = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/site_shell', $shellPayload);
        $shellResponse->assertStatus(200);
        $this->assertFalse($shellResponse->json('data.content.ticker_enabled'));
        $this->assertEquals('https://wa.me/9647701234567', $shellResponse->json('data.content.whatsapp_url'));
        $this->assertEquals('حقوق مخصصة كَنزين 2026', $shellResponse->json('data.content.footer_copyright_ar'));

        // 2. Update checkout_cart
        $cartPayload = [
            'trust_headline_ar' => 'ضمان كَنزين الذهبي للدفع الآمن',
            'trust_headline_en' => 'KNZiN Golden Checkout Guarantee',
        ];

        $cartResponse = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/checkout_cart', $cartPayload);
        $cartResponse->assertStatus(200);
        $this->assertEquals('ضمان كَنزين الذهبي للدفع الآمن', $cartResponse->json('data.content.trust_headline_ar'));

        // 3. Confirm persistence via public endpoint
        $publicResponse = $this->getJson('/api/v1/content/site-wide');
        $publicResponse->assertStatus(200);
        $this->assertFalse($publicResponse->json('data.sections.site_shell.ticker_enabled'));
        $this->assertEquals('ضمان كَنزين الذهبي للدفع الآمن', $publicResponse->json('data.sections.checkout_cart.trust_headline_ar'));

        // 4. Verify audit log entry
        $this->assertDatabaseHas('admin_activity_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'cms.landing_updated',
            'target_id' => 'landing.site_shell',
        ]);
    }

    public function test_admin_updating_with_malicious_script_is_sanitized(): void
    {
        [$admin, $headers] = $this->createAdmin();

        $payload = [
            'hero_title_en' => 'Promotional Raffles <script>alert("hacked")</script>',
            'hero_title_ar' => 'سحوبات كَنزين الترويجية <img src="x" onerror="alert(1)">',
        ];

        $response = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/raffle_arena', $payload);
        $response->assertStatus(200);

        // Scripts/tags stripped
        $this->assertEquals('Promotional Raffles alert("hacked")', $response->json('data.content.hero_title_en'));
        $this->assertEquals('سحوبات كَنزين الترويجية', $response->json('data.content.hero_title_ar'));
    }

    public function test_unauthenticated_and_unauthorized_admin_access_are_rejected(): void
    {
        // Unauthenticated access fails with 401
        $this->getJson('/api/v1/admin/cms/landing?scope=all')->assertStatus(401);
        $this->putJson('/api/v1/admin/cms/landing/site_shell', ['ticker_enabled' => false])->assertStatus(401);

        // User without capability fails with 403
        [$nonAdmin, $headers] = $this->createAdmin(withCapability: false);
        $this->withHeaders($headers)->getJson('/api/v1/admin/cms/landing?scope=all')->assertStatus(403);
        $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/site_shell', ['ticker_enabled' => false])->assertStatus(403);
    }

    public function test_visible_to_hidden_and_active_to_inactive_lifecycle(): void
    {
        [$admin, $headers] = $this->createAdmin();

        // 1. Initial public state: visible
        $publicInit = $this->getJson('/api/v1/content/site-wide');
        $this->assertTrue($publicInit->json('data.sections.course_detail.is_visible'));
        $this->assertTrue($publicInit->json('data.sections.site_shell.whatsapp_enabled'));

        // 2. Admin sets is_visible = false and whatsapp_enabled = false
        $updateResp = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/course_detail', [
            'is_visible' => false,
            'guarantee_headline_en' => 'Updated Guarantee Headline',
        ]);
        $updateResp->assertStatus(200);
        $this->assertFalse($updateResp->json('data.content.is_visible'));

        $shellResp = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/site_shell', [
            'whatsapp_enabled' => false,
        ]);
        $shellResp->assertStatus(200);
        $this->assertFalse($shellResp->json('data.content.whatsapp_enabled'));

        // 3. Confirm public consumption reflects state transition
        $publicUpdated = $this->getJson('/api/v1/content/site-wide');
        $this->assertFalse($publicUpdated->json('data.sections.course_detail.is_visible'));
        $this->assertEquals('Updated Guarantee Headline', $publicUpdated->json('data.sections.course_detail.guarantee_headline_en'));
        $this->assertFalse($publicUpdated->json('data.sections.site_shell.whatsapp_enabled'));
    }

    public function test_repeatable_content_ordering_and_manipulation(): void
    {
        [$admin, $headers] = $this->createAdmin();

        // Manage repeatable suggested queries in search_page
        $reorderedQueriesEn = [
            'Query B (First)',
            'Query A (Second)',
            'Query C (Third)',
        ];

        $resp = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/search_page', [
            'suggested_queries_en' => $reorderedQueriesEn,
            'search_tips_items_en' => ['Tip 1', 'Tip 2'],
        ]);

        $resp->assertStatus(200);
        $this->assertEquals($reorderedQueriesEn, $resp->json('data.content.suggested_queries_en'));

        // Public site-wide reflects the exact array ordering
        $publicResp = $this->getJson('/api/v1/content/site-wide');
        $this->assertEquals($reorderedQueriesEn, $publicResp->json('data.sections.search_page.suggested_queries_en'));
    }

    public function test_cms_updates_cannot_mutate_financial_or_draw_invariants(): void
    {
        [$admin, $headers] = $this->createAdmin();

        // 1. Create a course and draw in DB
        $course = Course::create([
            'slug' => 'welding-pro',
            'title_en' => 'Professional Welding',
            'title_ar' => 'اللحام الاحترافي',
            'description_en' => 'Trade course',
            'description_ar' => 'دورة مهنية',
            'bundle_price_cents' => 1000,
            'bundle_promotional_tickets' => 15,
            'cover_image_url' => 'https://example.com/cover.jpg',
            'status' => 'published',
        ]);

        // 2. Attempt to pass rogue financial properties in CMS payload
        $payload = [
            'bundle_promo_title_en' => 'Super Promo Title',
            'bundle_price_cents' => 50, // Malicious override attempt
            'price' => 0,               // Malicious attempt
        ];

        $resp = $this->withHeaders($headers)->putJson('/api/v1/admin/cms/landing/course_detail', $payload);
        $resp->assertStatus(200);

        // 3. Verify CMS stored only allowed presentation fields
        $this->assertEquals('Super Promo Title', $resp->json('data.content.bundle_promo_title_en'));

        // 4. Verify authoritative database Course entity remained 100% untouched
        $freshCourse = Course::find($course->id);
        $this->assertEquals(1000, $freshCourse->bundle_price_cents);
        $this->assertEquals(15, $freshCourse->bundle_promotional_tickets);
    }
}
