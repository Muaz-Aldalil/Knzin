<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\Course;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ReferralAttribution;
use App\Models\User;
use App\Services\AffiliateAttributionService;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingsAndCommissionSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_update_snapshots_forward_only_and_rejects_frozen_maturation(): void
    {
        $admin = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // 1. Attempting to modify maturation_hours must be rejected with 422
        $rejectedResponse = $this->withHeaders($headers)->patchJson('/api/v1/admin/settings', [
            'maturation_hours' => 48,
        ]);
        $rejectedResponse->assertStatus(422);
        $rejectedResponse->assertJsonValidationErrors(['maturation_hours']);

        // 2. Pre-existing order and attribution under default 2500 bps
        $referrer = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $buyer1 = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $course = Course::factory()->create();

        $order1 = Order::factory()->create([
            'user_id' => $buyer1->id,
            'order_number' => 'KNZ-ORD-TEST-001',
            'total_amount_cents' => 10000,
            'status' => 'completed',
        ]);

        $service = app(AffiliateAttributionService::class);
        $attribution1 = $service->recordAttribution($order1, $referrer->learner_code);
        $this->assertNotNull($attribution1);
        $this->assertEquals(2500, $attribution1->commission_rate_bps);

        // 3. Update commission rate to 3000 bps (30%)
        $updateResponse = $this->withHeaders($headers)->patchJson('/api/v1/admin/settings', [
            'commission_rate_bps' => 3000,
            'justification' => 'Autumn promotional commission boost',
        ]);
        $updateResponse->assertStatus(200);
        $updateResponse->assertJsonPath('data.commission_rate_bps', 3000);
        $updateResponse->assertJsonPath('data.commission_rate_percent', 30);

        // 4. Verify audit log was recorded in transaction
        $audit = AdminActivityLog::where('action', 'settings.updated')->first();
        $this->assertNotNull($audit);
        $this->assertEquals($admin->id, $audit->actor_user_id);
        $this->assertEquals(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, $audit->capability_used);

        // 5. Subsequent order snapshots 3000 bps forward-only
        $buyer2 = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $order2 = Order::factory()->create([
            'user_id' => $buyer2->id,
            'order_number' => 'KNZ-ORD-TEST-002',
            'total_amount_cents' => 10000,
            'status' => 'completed',
        ]);

        $attribution2 = $service->recordAttribution($order2, $referrer->learner_code);
        $this->assertNotNull($attribution2);
        $this->assertEquals(3000, $attribution2->commission_rate_bps);

        // 6. Pre-existing attribution 1 remains untouched at 2500 bps
        $this->assertEquals(2500, $attribution1->fresh()->commission_rate_bps);
    }
}
