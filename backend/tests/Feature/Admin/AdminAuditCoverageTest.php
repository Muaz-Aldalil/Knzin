<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuditCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_mutations_generate_audit_logs(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // Settings mutation generates settings.updated audit
        $this->withHeaders($headers)->patchJson('/api/v1/admin/settings', [
            'commission_rate_bps' => 2800,
        ])->assertStatus(200);

        $this->assertTrue(AdminActivityLog::where('action', 'settings.updated')->exists());
    }
}
