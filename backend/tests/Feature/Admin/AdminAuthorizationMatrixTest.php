<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_single_capability_admin_is_isolated_to_permitted_endpoints(): void
    {
        // Admin holding ONLY manage_platform_settings
        $admin = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;

        $headers = ['Authorization' => "Bearer {$token}"];

        // Accessible:
        $this->withHeaders($headers)->getJson('/api/v1/admin/me')->assertStatus(200);
        $this->withHeaders($headers)->getJson('/api/v1/admin/settings')->assertStatus(200);
        $this->withHeaders($headers)->getJson('/api/v1/admin/draws')->assertStatus(200);
        $this->withHeaders($headers)->getJson('/api/v1/admin/affiliates')->assertStatus(200);

        // Forbidden (403):
        $this->withHeaders($headers)->postJson('/api/v1/admin/payouts/KNZ-PAY-1/settle')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/v1/admin/coprizes/KNZ-26-0001-0001/release')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/v1/admin/approvals/kyc')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/v1/admin/approvals/draw-integrity')->assertStatus(403);
        $this->withHeaders($headers)->getJson('/api/v1/admin/users')->assertStatus(403);
        $this->withHeaders($headers)->getJson('/api/v1/admin/audit-logs')->assertStatus(403);
    }

    public function test_no_wildcard_gate_bypass_exists(): void
    {
        $admin = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        // Grant a capability that is NOT settle_affiliate_payout
        $admin->grantCapability(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;

        $headers = ['Authorization' => "Bearer {$token}"];

        // Settle route must return 403 despite having manage_admin_capabilities
        $response = $this->withHeaders($headers)->postJson('/api/v1/admin/payouts/KNZ-PAY-1/settle');
        $response->assertStatus(403);
    }
}
