<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCapabilityManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_grant_revoke_anti_self_and_last_admin_lockout(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google', 'email_verified_at' => now()]);
        $admin->grantCapability(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $targetUser = User::factory()->create(['status' => 'active', 'auth_provider' => 'google', 'email_verified_at' => now()]);

        // 1. Grant capability to target user -> 200
        $grantResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/users/{$targetUser->id}/capabilities", [
            'capability' => AdminCapabilities::SETTLE_AFFILIATE_PAYOUT,
        ]);
        $grantResponse->assertStatus(200);
        $this->assertTrue($targetUser->fresh()->hasCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT));

        // 2. Anti-self-grant attempt -> 403 ERR_SELF_GRANT_FORBIDDEN
        $selfGrantResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/users/{$admin->id}/capabilities", [
            'capability' => AdminCapabilities::SETTLE_AFFILIATE_PAYOUT,
        ]);
        $selfGrantResponse->assertStatus(403);
        $selfGrantResponse->assertJsonPath('code', 'ERR_SELF_GRANT_FORBIDDEN');

        // 3. Grant to unverified target -> 422
        $unverifiedTarget = User::factory()->create(['status' => 'active', 'auth_provider' => 'guest', 'email_verified_at' => null]);
        $unverifiedGrant = $this->withHeaders($headers)->postJson("/api/v1/admin/users/{$unverifiedTarget->id}/capabilities", [
            'capability' => AdminCapabilities::ISSUE_KYC_APPROVAL,
        ]);
        $unverifiedGrant->assertStatus(422);

        // 4. Revoke capability from target user -> 200
        $revokeResponse = $this->withHeaders($headers)->deleteJson("/api/v1/admin/users/{$targetUser->id}/capabilities/" . AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, [
            'reason' => 'Quarterly access rotation',
        ]);
        $revokeResponse->assertStatus(200);
        $this->assertFalse($targetUser->fresh()->hasCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT));

        // 5. Last admin lockout protection: Attempting to revoke manage_admin_capabilities from sole holder -> 409 ERR_LAST_ADMIN_LOCKOUT
        $lockoutResponse = $this->withHeaders($headers)->deleteJson("/api/v1/admin/users/{$admin->id}/capabilities/" . AdminCapabilities::MANAGE_ADMIN_CAPABILITIES, [
            'reason' => 'Attempting self-revocation as sole holder',
        ]);
        $lockoutResponse->assertStatus(409);
        $lockoutResponse->assertJsonPath('code', 'ERR_LAST_ADMIN_LOCKOUT');
    }

    public function test_cli_commands_parity(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google', 'email_verified_at' => now()]);
        $admin->grantCapability(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES, null, 'bootstrap');

        $target = User::factory()->create(['status' => 'active', 'auth_provider' => 'google', 'email_verified_at' => now()]);

        // CLI Grant
        $this->artisan('knzin:grant-admin-capability', [
            'user' => $target->email,
            'capability' => AdminCapabilities::MANAGE_PLATFORM_SETTINGS,
            '--authorized-by' => $admin->email,
        ])->assertSuccessful();

        $this->assertTrue($target->fresh()->hasCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS));

        // CLI Revoke
        $this->artisan('knzin:revoke-admin-capability', [
            'user' => $target->email,
            'capability' => AdminCapabilities::MANAGE_PLATFORM_SETTINGS,
            '--authorized-by' => $admin->email,
            '--reason' => 'CLI test rotation',
        ])->assertSuccessful();

        $this->assertFalse($target->fresh()->hasCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS));
    }
}
