<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;
use App\Services\PlatformSettingsService;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminAuditAtomicityTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_owned_transaction_rolls_back_entity_and_audit_on_failure(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');

        $initialAuditCount = AdminActivityLog::count();

        $service = app(PlatformSettingsService::class);
        $context = new AdminAuditContext($admin->id, AdminCapabilities::MANAGE_PLATFORM_SETTINGS, 'req-atom-1', null, null);

        // Attempt invalid settings update that throws ValidationException
        try {
            $service->setMany(
                settings: ['affiliate.commission_rate_bps' => 20000], // Invalid > 10000
                actor: $admin,
                auditContext: $context
            );
            $this->fail('Expected ValidationException was not thrown.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Expected
        }

        // Entity was not updated and no audit was persisted
        $this->assertEquals(2500, config('knzin.affiliate.commission_rate_bps'));
        $this->assertEquals($initialAuditCount, AdminActivityLog::count());
    }
}
