<?php

namespace Tests\Feature\Admin;

use App\Models\Draw;
use App\Models\User;
use App\Services\ApprovalRegistryService;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApprovalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_per_type_authorization_and_cross_type_revocation_isolation(): void
    {
        // Admin with ONLY issue_kyc_approval
        $kycAdmin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $kycAdmin->grantCapability(AdminCapabilities::ISSUE_KYC_APPROVAL, null, 'bootstrap');
        $kycToken = $kycAdmin->createToken('admin_token')->plainTextToken;
        $kycHeaders = ['Authorization' => "Bearer {$kycToken}"];

        // Admin with ONLY issue_draw_audit_approval
        $drawAuditAdmin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $drawAuditAdmin->grantCapability(AdminCapabilities::ISSUE_DRAW_AUDIT_APPROVAL, null, 'bootstrap');
        $drawToken = $drawAuditAdmin->createToken('admin_token')->plainTextToken;
        $drawHeaders = ['Authorization' => "Bearer {$drawToken}"];

        $targetUser = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $targetDraw = Draw::factory()->create(['is_published' => true]);

        // 1. KYC admin issues KYC approval -> 200
        $kycResponse = $this->withHeaders($kycHeaders)->postJson('/api/v1/admin/approvals/kyc', [
            'subject_user_id' => $targetUser->id,
            'status' => 'approved',
        ]);
        $kycResponse->assertStatus(200);
        $kycApprovalId = $kycResponse->json('data.approval_id');

        // 2. KYC admin attempts to issue Draw Integrity approval -> 403
        $forbiddenDrawIssue = $this->withHeaders($kycHeaders)->postJson('/api/v1/admin/approvals/draw-integrity', [
            'draw_id' => $targetDraw->id,
            'status' => 'approved',
        ]);
        $forbiddenDrawIssue->assertStatus(403);

        // 3. Draw audit admin issues Draw Integrity approval -> 200
        auth()->forgetGuards();
        $drawResponse = $this->withHeaders($drawHeaders)->postJson('/api/v1/admin/approvals/draw-integrity', [
            'draw_id' => $targetDraw->id,
            'status' => 'approved',
        ]);
        $drawResponse->assertStatus(200);
        $drawApprovalId = $drawResponse->json('data.approval_id');

        // 4. Draw audit admin attempts to issue KYC approval -> 403
        $forbiddenKycIssue = $this->withHeaders($drawHeaders)->postJson('/api/v1/admin/approvals/kyc', [
            'subject_user_id' => $targetUser->id,
            'status' => 'approved',
        ]);
        $forbiddenKycIssue->assertStatus(403);

        // 5. Cross-type revoke: Draw audit admin attempts to revoke KYC approval -> 403 ERR_FORBIDDEN
        $crossTypeRevoke = $this->withHeaders($drawHeaders)->postJson("/api/v1/admin/approvals/{$kycApprovalId}/revoke", [
            'reason' => 'Draw auditor attempting to revoke KYC',
        ]);
        $crossTypeRevoke->assertStatus(403);
        $crossTypeRevoke->assertJsonPath('code', 'ERR_FORBIDDEN');

        // 6. Authorized revoke: KYC admin revokes KYC approval -> 200
        auth()->forgetGuards();
        $validRevoke = $this->withHeaders($kycHeaders)->postJson("/api/v1/admin/approvals/{$kycApprovalId}/revoke", [
            'reason' => 'KYC officer revoking suspicious ID',
        ]);
        $validRevoke->assertStatus(200);
        $validRevoke->assertJsonPath('data.status', 'revoked');
    }
}
