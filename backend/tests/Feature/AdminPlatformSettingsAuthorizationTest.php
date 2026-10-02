<?php

namespace Tests\Feature;

use App\Models\AdminCapability;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\PlatformSettingsService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AdminPlatformSettingsAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected PlatformSettingsService $settingsService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->settingsService = app(PlatformSettingsService::class);
        config(['knzin.admin.bootstrap_token' => 'test-secure-bootstrap-token-xyz']);
    }

    public function test_first_admin_bootstrap_with_valid_credential_succeeds(): void
    {
        $candidate = User::factory()->create(['email' => 'founder@knzin.com']);
        $this->assertFalse($candidate->hasCapability('manage_platform_settings'));

        $exitCode = $this->artisan("knzin:bootstrap-admin {$candidate->email} --token=test-secure-bootstrap-token-xyz")
            ->expectsOutputToContain('Initial Administrator bootstrapped successfully')
            ->run();

        $this->assertEquals(0, $exitCode);
        $this->assertTrue($candidate->fresh()->hasCapability('manage_platform_settings'));

        $capability = AdminCapability::where('user_id', $candidate->id)->first();
        $this->assertNotNull($capability);
        $this->assertEquals('bootstrap', $capability->provisioning_source);
        $this->assertEquals('active', $capability->status);
        $this->assertNull($capability->revoked_at);
    }

    public function test_bootstrap_with_invalid_credential_fails(): void
    {
        $candidate = User::factory()->create();

        $exitCode = $this->artisan("knzin:bootstrap-admin {$candidate->email} --token=wrong-secret-token")
            ->expectsOutputToContain('AUTHORIZATION FAILED: Invalid or missing bootstrap credential token')
            ->run();

        $this->assertEquals(1, $exitCode);
        $this->assertFalse($candidate->fresh()->hasCapability('manage_platform_settings'));
    }

    public function test_bootstrap_path_is_blocked_once_an_active_admin_exists(): void
    {
        $firstAdmin = User::factory()->create(['email' => 'admin1@knzin.com']);
        $firstAdmin->grantCapability('manage_platform_settings', null, 'bootstrap');

        $secondCandidate = User::factory()->create(['email' => 'imposter@knzin.com']);

        $exitCode = $this->artisan("knzin:bootstrap-admin {$secondCandidate->email} --token=test-secure-bootstrap-token-xyz")
            ->expectsOutputToContain('CRITICAL: Bootstrap rejected. An active Administrator already exists')
            ->run();

        $this->assertEquals(1, $exitCode);
        $this->assertFalse($secondCandidate->fresh()->hasCapability('manage_platform_settings'));
    }

    public function test_delegated_admin_provisioning_requires_active_admin_authorizer(): void
    {
        $admin = User::factory()->create(['email' => 'root@knzin.com']);
        $admin->grantCapability('manage_admin_capabilities', null, 'bootstrap');

        $newUser = User::factory()->create(['email' => 'finance-officer@knzin.com']);

        // Delegated provisioning by active admin
        $exitCode = $this->artisan("knzin:grant-admin-capability {$newUser->email} manage_platform_settings --authorized-by={$admin->email}")
            ->expectsOutputToContain('Successfully granted capability')
            ->run();

        $this->assertEquals(0, $exitCode);
        $this->assertTrue($newUser->fresh()->hasCapability('manage_platform_settings'));

        $record = AdminCapability::where('user_id', $newUser->id)->first();
        $this->assertEquals('delegated_admin', $record->provisioning_source);
        $this->assertEquals($admin->id, $record->granted_by_user_id);
    }

    public function test_multiple_admins_can_exist_and_exercise_independent_authority(): void
    {
        $admin1 = User::factory()->create();
        $admin2 = User::factory()->create();

        $admin1->grantCapability('manage_platform_settings', null, 'bootstrap');
        $admin2->grantCapability('manage_platform_settings', $admin1, 'delegated_admin');

        $this->assertTrue($admin1->hasCapability('manage_platform_settings'));
        $this->assertTrue($admin2->hasCapability('manage_platform_settings'));

        // Admin 1 sets threshold to $60
        $this->settingsService->set('affiliate.payout_min_cents', 6000, $admin1);
        $this->assertEquals(6000, $this->settingsService->get('affiliate.payout_min_cents'));

        // Admin 2 updates threshold to $70
        $this->settingsService->set('affiliate.payout_min_cents', 7000, $admin2);
        $this->assertEquals(7000, $this->settingsService->get('affiliate.payout_min_cents'));
        $this->assertEquals($admin2->id, PlatformSetting::where('key', 'affiliate.payout_min_cents')->first()->updated_by_user_id);
    }

    public function test_revoked_admin_loses_capability_immediately(): void
    {
        $admin1 = User::factory()->create();
        $admin2 = User::factory()->create();

        $admin1->grantCapability('manage_admin_capabilities', null, 'bootstrap');
        $admin1->grantCapability('manage_platform_settings', null, 'bootstrap');
        $admin2->grantCapability('manage_platform_settings', $admin1, 'delegated_admin');

        $this->assertTrue($admin2->hasCapability('manage_platform_settings'));

        // Admin 1 revokes Admin 2
        $exitCode = $this->artisan("knzin:revoke-admin-capability {$admin2->email} manage_platform_settings --authorized-by={$admin1->email} --reason=Contract_ended")
            ->expectsOutputToContain('Successfully revoked capability')
            ->run();

        $this->assertEquals(0, $exitCode);
        $this->assertFalse($admin2->fresh()->hasCapability('manage_platform_settings'));

        // Admin 1 still remains active
        $this->assertTrue($admin1->fresh()->hasCapability('manage_platform_settings'));

        // Revoked admin attempting to mutate setting is rejected
        $this->expectException(AuthorizationException::class);
        $this->settingsService->set('affiliate.payout_min_cents', 9000, $admin2);
    }

    public function test_admin_with_only_manage_platform_settings_cannot_grant_or_revoke_capabilities(): void
    {
        $settingsAdmin = User::factory()->create(['email' => 'settings@knzin.com']);
        $settingsAdmin->grantCapability('manage_platform_settings', null, 'bootstrap');

        $target = User::factory()->create(['email' => 'target@knzin.com']);

        // Attempting to grant without manage_admin_capabilities
        $exitCode = $this->artisan("knzin:grant-admin-capability {$target->email} manage_platform_settings --authorized-by={$settingsAdmin->email}")
            ->expectsOutputToContain("lacks required capability 'manage_admin_capabilities'")
            ->run();
        $this->assertEquals(1, $exitCode);
        $this->assertFalse($target->fresh()->hasCapability('manage_platform_settings'));

        // Attempting to revoke without manage_admin_capabilities
        $target->grantCapability('manage_platform_settings');
        $exitCode2 = $this->artisan("knzin:revoke-admin-capability {$target->email} manage_platform_settings --authorized-by={$settingsAdmin->email}")
            ->expectsOutputToContain("lacks required capability 'manage_admin_capabilities'")
            ->run();
        $this->assertEquals(1, $exitCode2);
        $this->assertTrue($target->fresh()->hasCapability('manage_platform_settings'));
    }

    public function test_admin_cannot_self_grant_capabilities(): void
    {
        $admin = User::factory()->create(['email' => 'admin@knzin.com']);
        $admin->grantCapability('manage_admin_capabilities', null, 'bootstrap');

        $exitCode = $this->artisan("knzin:grant-admin-capability {$admin->email} adjudicate_affiliate_coprize --authorized-by={$admin->email}")
            ->expectsOutputToContain('Self-grant is forbidden')
            ->run();

        $this->assertEquals(1, $exitCode);
        $this->assertFalse($admin->fresh()->hasCapability('adjudicate_affiliate_coprize'));
    }

    public function test_privilege_separation_settings_admin_cannot_adjudicate_coprize(): void
    {
        $settingsAdmin = User::factory()->create();
        $settingsAdmin->grantCapability('manage_platform_settings', null, 'bootstrap');

        $coPrizeService = app(\App\Services\AffiliateCoPrizeService::class);

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage("lacks required capability 'adjudicate_affiliate_coprize'");
        $coPrizeService->adjudicateCoPrizeRevocation('KNZ-TICKET-FAKE', 'Fraud suspected', $settingsAdmin);
    }

    public function test_privilege_separation_coprize_adjudicator_cannot_mutate_platform_settings(): void
    {
        $adjudicator = User::factory()->create();
        $adjudicator->grantCapability('adjudicate_affiliate_coprize', null, 'bootstrap');

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage("lacks required persistent capability 'manage_platform_settings'");
        $this->settingsService->set('affiliate.payout_min_cents', 9999, $adjudicator);
    }

    public function test_concurrent_bootstrap_race_fails_deterministically(): void
    {
        $candidate1 = User::factory()->create(['email' => 'candidate1@knzin.com']);
        $candidate2 = User::factory()->create(['email' => 'candidate2@knzin.com']);

        // First bootstrap succeeds
        $exitCode1 = $this->artisan("knzin:bootstrap-admin {$candidate1->email} --token=test-secure-bootstrap-token-xyz")
            ->run();
        $this->assertEquals(0, $exitCode1);

        // Concurrent/second bootstrap with candidate2 deterministically fails
        $exitCode2 = $this->artisan("knzin:bootstrap-admin {$candidate2->email} --token=test-secure-bootstrap-token-xyz")
            ->expectsOutputToContain('CRITICAL: Bootstrap rejected')
            ->run();
        $this->assertEquals(1, $exitCode2);
        $this->assertFalse($candidate2->fresh()->hasCapability('manage_platform_settings'));
    }

    public function test_unauthenticated_actor_cannot_mutate_platform_setting(): void
    {
        Auth::logout();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthenticated actor cannot mutate platform settings.');

        $this->settingsService->set('affiliate.payout_min_cents', 7500);
    }

    public function test_ordinary_authenticated_user_without_capability_cannot_mutate_platform_setting(): void
    {
        $ordinaryUser = User::factory()->create();
        Auth::login($ordinaryUser);

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage("lacks required persistent capability 'manage_platform_settings'");

        $this->settingsService->set('affiliate.payout_min_cents', 7500, $ordinaryUser);
    }

    public function test_cli_command_without_authorized_user_fails(): void
    {
        // Zero active admin provisioned
        $exitCode = $this->artisan('knzin:set-setting affiliate.payout_min_cents 6000')
            ->expectsOutputToContain('CRITICAL: Operation requires an authorized Admin user')
            ->run();

        $this->assertEquals(1, $exitCode);
    }

    public function test_cli_command_with_authorized_user_succeeds(): void
    {
        $admin = User::factory()->create(['email' => 'ops-admin@knzin.com']);
        $admin->grantCapability('manage_platform_settings');

        $exitCode = $this->artisan("knzin:set-setting affiliate.payout_min_cents 6500 --user={$admin->email}")
            ->expectsOutputToContain('Platform setting updated successfully under authorized Admin context')
            ->expectsOutputToContain("Authorized By: {$admin->id}")
            ->run();

        $this->assertEquals(0, $exitCode);
        $this->assertEquals(6500, $this->settingsService->get('affiliate.payout_min_cents'));
    }

    public function test_ordinary_user_cannot_invoke_bootstrap_via_api_as_bootstrap_credential_is_strictly_out_of_band(): void
    {
        $ordinaryUser = User::factory()->create();
        
        // Assert no API route accepts bootstrap credential
        $response = $this->actingAs($ordinaryUser)->postJson('/api/admin/bootstrap', [
            'token' => 'test-secure-bootstrap-token-xyz',
            'user_id' => $ordinaryUser->id,
        ]);

        $response->assertStatus(404);
        $this->assertFalse($ordinaryUser->fresh()->hasCapability('manage_platform_settings'));
    }

    public function test_bootstrap_requires_existing_legitimate_user(): void
    {
        $exitCode = $this->artisan("knzin:bootstrap-admin nonexistent@knzin.com --token=test-secure-bootstrap-token-xyz")
            ->expectsOutputToContain('Target user not found for identifier: nonexistent@knzin.com')
            ->run();

        $this->assertEquals(1, $exitCode);
    }
}
