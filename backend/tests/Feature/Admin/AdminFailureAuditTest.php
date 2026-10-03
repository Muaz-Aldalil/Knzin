<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFailureAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_failure_audit_middleware_logs_failed_attempts(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // 1. Trigger 403 by accessing unauthorized endpoint
        $this->withHeaders($headers)->getJson('/api/v1/admin/users')->assertStatus(403);

        $deniedLog = AdminActivityLog::where('outcome', 'denied')
            ->where('actor_user_id', $admin->id)
            ->first();
        $this->assertNotNull($deniedLog);

        // 2. Trigger 422 by sending invalid settings input
        $this->withHeaders($headers)->patchJson('/api/v1/admin/settings', [
            'commission_rate_bps' => -100,
        ])->assertStatus(422);

        $validationLog = AdminActivityLog::where('outcome', 'rejected')
            ->where('reason_code', 'HTTP_422')
            ->first();
        $this->assertNotNull($validationLog);
    }
}
