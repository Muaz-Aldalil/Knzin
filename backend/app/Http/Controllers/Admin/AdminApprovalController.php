<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\IssueDrawIntegrityApprovalRequest;
use App\Http\Requests\Admin\IssueKycApprovalRequest;
use App\Http\Requests\Admin\RevokeApprovalRequest;
use App\Models\ApprovalRecord;
use App\Services\ApprovalRegistryService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminApprovalController extends ApiController
{
    public function __construct(
        protected ApprovalRegistryService $approvalRegistry
    ) {
    }

    /**
     * List approval records filtered by type and subject.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $type = $request->query('type');
        $subjectId = $request->query('subject_id');

        $canKyc = $user->hasCapability(AdminCapabilities::ISSUE_KYC_APPROVAL);
        $canDrawAudit = $user->hasCapability(AdminCapabilities::ISSUE_DRAW_AUDIT_APPROVAL);

        if ($type === 'kyc' && !$canKyc) {
            return $this->failResponse('ERR_FORBIDDEN', 'Unauthorized for KYC approvals.', [], 403);
        }

        if ($type === 'draw_integrity' && !$canDrawAudit) {
            return $this->failResponse('ERR_FORBIDDEN', 'Unauthorized for Draw Integrity approvals.', [], 403);
        }

        if (!$canKyc && !$canDrawAudit) {
            return $this->failResponse('ERR_FORBIDDEN', 'Unauthorized for approvals.', [], 403);
        }

        $query = ApprovalRecord::query()->orderBy('id', 'desc');

        if ($type) {
            $query->where('approval_type', $type);
        } else {
            $allowedTypes = [];
            if ($canKyc) {
                $allowedTypes[] = 'kyc';
            }
            if ($canDrawAudit) {
                $allowedTypes[] = 'draw_integrity';
            }
            $query->whereIn('approval_type', $allowedTypes);
        }

        if ($subjectId) {
            $query->where('subject_id', $subjectId);
        }

        $records = $query->limit(50)->get();

        return $this->successResponse([
            'items' => $records,
        ]);
    }

    /**
     * Issue a KYC approval or rejection for a user.
     */
    public function issueKyc(IssueKycApprovalRequest $request): JsonResponse
    {
        $auditContext = $request->auditContext(AdminCapabilities::ISSUE_KYC_APPROVAL);

        $record = $this->approvalRegistry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $request->input('subject_user_id'),
            status: (string) $request->input('status'),
            source: 'admin_panel',
            authorizer: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($record);
    }

    /**
     * Issue a Draw Integrity audit approval or rejection for a draw.
     */
    public function issueDrawIntegrity(IssueDrawIntegrityApprovalRequest $request): JsonResponse
    {
        $auditContext = $request->auditContext(AdminCapabilities::ISSUE_DRAW_AUDIT_APPROVAL);

        $record = $this->approvalRegistry->issueApproval(
            approvalType: 'draw_integrity',
            subjectType: 'draw',
            subjectId: (string) $request->input('draw_id'),
            status: (string) $request->input('status'),
            source: 'admin_panel',
            authorizer: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($record);
    }

    /**
     * Explicit per-type approval revocation checking caller capability.
     */
    public function revoke(RevokeApprovalRequest $request, string $approvalId): JsonResponse
    {
        $record = ApprovalRecord::where('approval_id', $approvalId)->firstOrFail();

        $user = $request->user();
        $requiredCapability = match ($record->approval_type) {
            'kyc' => AdminCapabilities::ISSUE_KYC_APPROVAL,
            'draw_integrity' => AdminCapabilities::ISSUE_DRAW_AUDIT_APPROVAL,
            default => null,
        };

        if (!$requiredCapability || !$user->hasCapability($requiredCapability)) {
            return $this->failResponse(
                'ERR_FORBIDDEN',
                "Unauthorized to revoke approval of type '{$record->approval_type}'.",
                [],
                403
            );
        }

        $auditContext = $request->auditContext($requiredCapability);

        $revoked = $this->approvalRegistry->revokeApproval(
            approvalId: $approvalId,
            reason: (string) $request->input('reason'),
            authorizer: $user,
            auditContext: $auditContext
        );

        return $this->successResponse($revoked);
    }
}
