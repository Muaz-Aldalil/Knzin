<?php

namespace Tests\Feature;

use App\Exceptions\ImmutableLedgerException;
use App\Exceptions\UnauthorizedApprovalWriteException;
use App\Models\AffiliateLedgerEntry;
use App\Models\ApprovalRecord;
use App\Models\Draw;
use App\Models\User;
use App\Services\ApprovalRegistryService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalSecurityEnforcementTest extends TestCase
{
    use RefreshDatabase;

    protected ApprovalRegistryService $registry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
        $this->seed(\Database\Seeders\PromotionalDrawSeeder::class);
        $this->registry = app(ApprovalRegistryService::class);
    }

    public function test_direct_model_create_outside_registry_is_strictly_forbidden(): void
    {
        $targetUser = User::factory()->create();

        $this->expectException(UnauthorizedApprovalWriteException::class);
        $this->expectExceptionMessage('Direct creation of ApprovalRecord outside the trusted ApprovalRegistryService boundary is strictly forbidden.');

        ApprovalRecord::create([
            'approval_id' => 'FORGED-KYC-001',
            'approval_type' => 'kyc',
            'subject_type' => 'user',
            'subject_id' => (string) $targetUser->id,
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => 'forged_actor',
            'source' => 'untrusted_input',
            'version' => 1,
        ]);
    }

    public function test_direct_model_update_outside_registry_is_strictly_forbidden(): void
    {
        $targetUser = User::factory()->create();

        // Validly issue approval through trusted registry
        $record = $this->registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'compliance_kyc_subsystem',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
        );

        $this->expectException(UnauthorizedApprovalWriteException::class);
        $this->expectExceptionMessage('Direct update of ApprovalRecord outside the trusted ApprovalRegistryService boundary is strictly forbidden.');

        $record->status = 'rejected';
        $record->save();
    }

    public function test_direct_model_delete_is_strictly_forbidden(): void
    {
        $targetUser = User::factory()->create();

        $record = $this->registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'compliance_kyc_subsystem',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
        );

        $this->expectException(UnauthorizedApprovalWriteException::class);
        $this->expectExceptionMessage('Direct deletion of ApprovalRecord is strictly forbidden.');

        $record->delete();
    }

    public function test_subsystem_identity_spoofing_without_secret_fails(): void
    {
        $targetUser = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify KYC approvals.');

        // Untrusted caller supplies principal string without providing the secret
        $this->registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'spoofed_request',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: null
        );
    }

    public function test_subsystem_identity_spoofing_with_invalid_secret_fails(): void
    {
        $targetUser = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify KYC approvals.');

        // Untrusted caller supplies wrong secret token
        $this->registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'spoofed_request',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: 'invalid-unauthorized-secret-token'
        );
    }

    public function test_draw_audit_subsystem_spoofing_without_secret_fails(): void
    {
        $draw = Draw::firstOrFail();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify Draw Integrity approvals.');

        $this->registry->issueApproval(
            approvalType: 'draw_integrity',
            subjectType: 'draw',
            subjectId: (string) $draw->id,
            status: 'approved',
            source: 'spoofed_request',
            systemPrincipal: 'draw_audit_engine',
            systemSecret: null
        );
    }

    public function test_draw_audit_subsystem_spoofing_with_invalid_secret_fails(): void
    {
        $draw = Draw::firstOrFail();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify Draw Integrity approvals.');

        $this->registry->issueApproval(
            approvalType: 'draw_integrity',
            subjectType: 'draw',
            subjectId: (string) $draw->id,
            status: 'approved',
            source: 'spoofed_request',
            systemPrincipal: 'draw_audit_engine',
            systemSecret: 'attacker-provided-fake-token'
        );
    }

    public function test_admin_capability_manager_cannot_issue_kyc_approval(): void
    {
        $admin = User::factory()->create();
        $admin->grantCapability('manage_admin_capabilities');

        $targetUser = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify KYC approvals.');

        $this->registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'admin_panel',
            authorizer: $admin
        );
    }

    public function test_admin_capability_manager_cannot_issue_draw_audit_approval(): void
    {
        $admin = User::factory()->create();
        $admin->grantCapability('manage_admin_capabilities');

        $draw = Draw::firstOrFail();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify Draw Integrity approvals.');

        $this->registry->issueApproval(
            approvalType: 'draw_integrity',
            subjectType: 'draw',
            subjectId: (string) $draw->id,
            status: 'approved',
            source: 'admin_panel',
            authorizer: $admin
        );
    }

    public function test_kyc_issuer_cannot_issue_draw_audit_approval(): void
    {
        $kycAdmin = User::factory()->create();
        $kycAdmin->grantCapability('issue_kyc_approval');

        $draw = Draw::firstOrFail();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify Draw Integrity approvals.');

        $this->registry->issueApproval(
            approvalType: 'draw_integrity',
            subjectType: 'draw',
            subjectId: (string) $draw->id,
            status: 'approved',
            source: 'admin_panel',
            authorizer: $kycAdmin
        );
    }

    public function test_draw_audit_issuer_cannot_issue_kyc_approval(): void
    {
        $auditAdmin = User::factory()->create();
        $auditAdmin->grantCapability('issue_draw_audit_approval');

        $targetUser = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify KYC approvals.');

        $this->registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'admin_panel',
            authorizer: $auditAdmin
        );
    }

    public function test_ledger_immutability_rejects_modifying_amount_cents(): void
    {
        $user = User::factory()->create();
        $entry = AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'currency' => 'USD',
            'status' => 'pending',
            'funding_source' => 'order_sales_revenue',
            'idempotency_key' => 'test_immut_amount',
        ]);

        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Field [amount_cents] cannot be modified');

        $entry->amount_cents = 500;
        $entry->save();
    }

    public function test_ledger_immutability_rejects_modifying_user_id(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $entry = AffiliateLedgerEntry::create([
            'user_id' => $user1->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'currency' => 'USD',
            'status' => 'pending',
            'funding_source' => 'order_sales_revenue',
            'idempotency_key' => 'test_immut_user',
        ]);

        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Field [user_id] cannot be modified');

        $entry->user_id = $user2->id;
        $entry->save();
    }

    public function test_ledger_immutability_rejects_modifying_idempotency_key(): void
    {
        $user = User::factory()->create();
        $entry = AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'currency' => 'USD',
            'status' => 'pending',
            'funding_source' => 'order_sales_revenue',
            'idempotency_key' => 'test_immut_key_orig',
        ]);

        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Field [idempotency_key] cannot be modified');

        $entry->idempotency_key = 'test_immut_key_tampered';
        $entry->save();
    }

    public function test_ledger_immutability_rejects_deleting_entry(): void
    {
        $user = User::factory()->create();
        $entry = AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'currency' => 'USD',
            'status' => 'pending',
            'funding_source' => 'order_sales_revenue',
            'idempotency_key' => 'test_immut_del',
        ]);

        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Affiliate ledger is strictly append-only. Cannot delete entry ID');

        $entry->delete();
    }

    public function test_ledger_permits_valid_lifecycle_status_and_maturation_transitions(): void
    {
        $user = User::factory()->create();
        $entry = AffiliateLedgerEntry::create([
            'user_id' => $user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'currency' => 'USD',
            'status' => 'pending',
            'funding_source' => 'order_sales_revenue',
            'idempotency_key' => 'test_lifecycle_valid',
            'matures_at' => now()->addHours(24),
        ]);

        // Legitimate maturation transition
        $entry->status = 'available';
        $entry->matures_at = now();
        $entry->save();

        $this->assertEquals('available', $entry->fresh()->status);
    }

    public function test_gate_privilege_isolation_admin_capability_manager_cannot_pass_kyc_or_draw_gates(): void
    {
        $admin = User::factory()->create();
        $admin->grantCapability('manage_admin_capabilities');

        $this->assertFalse(\Illuminate\Support\Facades\Gate::forUser($admin)->allows('issue_kyc_approval'));
        $this->assertFalse(\Illuminate\Support\Facades\Gate::forUser($admin)->allows('issue_draw_audit_approval'));
    }
}
