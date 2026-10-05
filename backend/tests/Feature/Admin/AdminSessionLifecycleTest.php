<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\AdminCapabilities;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminSessionLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function createActiveAdmin(): array
    {
        $admin = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);

        DB::table('admin_capabilities')->insert([
            'user_id' => $admin->id,
            'capability' => AdminCapabilities::MANAGE_PLATFORM_SETTINGS,
            'status' => 'active',
            'granted_by_user_id' => $admin->id,
            'provisioning_source' => 'bootstrap',
            'granted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $plainTextToken = $admin->createToken('admin_token')->plainTextToken;

        return [$admin, $plainTextToken];
    }

    public function test_get_me_returns_authoritative_session_telemetry(): void
    {
        [$admin, $token] = $this->createActiveAdmin();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'user' => ['id', 'email', 'display_name', 'status'],
                'capabilities',
                'session' => [
                    'created_at',
                    'expires_at',
                    'remaining_seconds',
                    'max_age_minutes',
                ],
                'server_time_utc',
            ],
        ]);

        $remainingSeconds = $response->json('data.session.remaining_seconds');
        $this->assertGreaterThan(28000, $remainingSeconds);
        $this->assertLessThanOrEqual(28800, $remainingSeconds);
    }

    public function test_session_extend_resets_token_lifetime_successfully(): void
    {
        [$admin, $token] = $this->createActiveAdmin();

        // Artificially age the token by 300 minutes (5 hours)
        $tokenId = explode('|', $token)[0];
        DB::table('personal_access_tokens')
            ->where('id', $tokenId)
            ->update(['created_at' => Carbon::now()->subMinutes(300)]);

        // Check remaining time before extension
        $preCheck = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/me');
        $preCheck->assertStatus(200);
        $remainingBefore = $preCheck->json('data.session.remaining_seconds');
        $this->assertLessThan(11000, $remainingBefore);

        // Extend the session
        $extendResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/session/extend');

        $extendResponse->assertStatus(200);
        $extendResponse->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'session' => [
                    'created_at',
                    'expires_at',
                    'remaining_seconds',
                    'max_age_minutes',
                ],
                'server_time_utc',
            ],
        ]);

        $remainingAfter = $extendResponse->json('data.session.remaining_seconds');
        $this->assertGreaterThan(28000, $remainingAfter);
    }

    public function test_expired_session_cannot_be_extended(): void
    {
        [$admin, $token] = $this->createActiveAdmin();

        // Age token beyond 480 minutes (e.g. 500 minutes)
        $tokenId = explode('|', $token)[0];
        DB::table('personal_access_tokens')
            ->where('id', $tokenId)
            ->update(['created_at' => Carbon::now()->subMinutes(500)]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/session/extend');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_ADMIN_SESSION_EXPIRED',
        ]);
    }

    public function test_unauthenticated_request_to_extend_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/admin/session/extend');
        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'fail',
            'code' => 'ERR_UNAUTHORIZED',
        ]);
    }
}
