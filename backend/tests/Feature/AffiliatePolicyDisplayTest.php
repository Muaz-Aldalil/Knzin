<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PlatformSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliatePolicyDisplayTest extends TestCase
{
    use RefreshDatabase;

    public function test_affiliate_dashboard_reflects_dynamic_commission_rate(): void
    {
        $affiliate = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $token = $affiliate->createToken('affiliate_token')->plainTextToken;

        // 1. Initial default policy check on authoritative affiliate dashboard
        $initialResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/affiliate/dashboard');
        $initialResponse->assertStatus(200);
        $initialResponse->assertJsonPath('data.commission_policy.sales_commission_rate_percent', 25);

        // 2. Set dynamic rate to 3500 bps (35%) via platform settings
        $settingsService = app(PlatformSettingsService::class);
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability('manage_platform_settings', null, 'bootstrap');
        $settingsService->set('affiliate.commission_rate_bps', 3500, $admin);

        // 3. Authoritative affiliate dashboard endpoint immediately reflects dynamic 35%
        $updatedResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/affiliate/dashboard');
        $updatedResponse->assertStatus(200);
        $updatedResponse->assertJsonPath('data.commission_policy.sales_commission_rate_percent', 35);
    }
}
