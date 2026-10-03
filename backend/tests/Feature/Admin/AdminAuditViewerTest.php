<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuditViewerTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_log_viewer_filtering_and_capability_access(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // Seed audit logs
        AdminActivityLog::create([
            'request_id' => 'req-1',
            'actor_user_id' => $admin->id,
            'capability_used' => AdminCapabilities::MANAGE_PLATFORM_SETTINGS,
            'action' => 'settings.updated',
            'target_type' => 'platform_settings',
            'outcome' => 'success',
            'created_at' => now()->subDays(2),
        ]);

        AdminActivityLog::create([
            'request_id' => 'req-2',
            'actor_user_id' => $admin->id,
            'capability_used' => AdminCapabilities::SETTLE_AFFILIATE_PAYOUT,
            'action' => 'payout.settled',
            'target_type' => 'payout',
            'target_id' => 'KNZ-PAY-1',
            'outcome' => 'success',
            'created_at' => now()->subDay(),
        ]);

        // 1. Authorized admin can view audit logs
        $response = $this->withHeaders($headers)->getJson('/api/v1/admin/audit-logs');
        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data.items');

        // 2. Filter by action
        $filteredResponse = $this->withHeaders($headers)->getJson('/api/v1/admin/audit-logs?action=payout.settled');
        $filteredResponse->assertStatus(200);
        $filteredResponse->assertJsonCount(1, 'data.items');
        $filteredResponse->assertJsonPath('data.items.0.action', 'payout.settled');
    }

    public function test_audit_log_viewer_rejects_admin_without_manage_admin_capabilities(): void
    {
        $otherAdmin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $otherAdmin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $otherToken = $otherAdmin->createToken('other_token')->plainTextToken;

        $forbiddenResponse = $this->withHeader('Authorization', "Bearer {$otherToken}")
            ->getJson('/api/v1/admin/audit-logs');
        $forbiddenResponse->assertStatus(403);
    }
}
