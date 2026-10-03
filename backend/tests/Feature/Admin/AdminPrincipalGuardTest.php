<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\AdminCapabilities;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminPrincipalGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $response = $this->getJson('/api/v1/admin/me');
        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_UNAUTHORIZED',
        ]);
    }

    public function test_user_without_any_capability_is_rejected_with_403(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_FORBIDDEN',
        ]);
    }

    public function test_unverified_account_is_rejected_with_403(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'guest',
            'email_verified_at' => null,
        ]);
        $user->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');

        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_FORBIDDEN',
        ]);
    }

    public function test_deactivated_account_is_rejected_with_403(): void
    {
        $user = User::factory()->create([
            'status' => 'deactivated',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $user->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');

        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(403);
    }

    public function test_merged_account_is_rejected_with_403(): void
    {
        $parent = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $user = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
            'merged_into_user_id' => $parent->id,
        ]);
        $user->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');

        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(403);
    }

    public function test_guest_token_is_rejected_with_403(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $user->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');

        $token = $user->createToken('guest_session_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(403);
    }

    public function test_expired_token_is_rejected_with_401(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $user->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');

        $tokenInstance = $user->createToken('admin_token');
        $token = $tokenInstance->plainTextToken;

        // Directly update DB to bypass Eloquent $fillable guard on created_at
        DB::table('personal_access_tokens')
            ->where('id', $tokenInstance->accessToken->id)
            ->update([
                'created_at' => Carbon::now()->subMinutes(500),
            ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_ADMIN_SESSION_EXPIRED',
        ]);
    }

    public function test_legitimate_admin_succeeds_on_me_endpoint(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $user->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $user->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');

        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
                'capabilities' => [
                    AdminCapabilities::MANAGE_PLATFORM_SETTINGS,
                    AdminCapabilities::SETTLE_AFFILIATE_PAYOUT,
                ],
            ],
        ]);
        $response->assertJsonStructure([
            'data' => [
                'server_time_utc',
            ],
        ]);
    }
}
