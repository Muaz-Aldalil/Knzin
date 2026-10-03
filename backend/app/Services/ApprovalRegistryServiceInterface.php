<?php

namespace App\Services;

use App\Models\ApprovalRecord;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;

interface ApprovalRegistryServiceInterface
{
    /**
     * Issue an authoritative approval record behind strict domain authorization.
     */
    public function issueApproval(
        string $approvalType,
        string $subjectType,
        string $subjectId,
        string $status,
        string $source,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null,
        ?AdminAuditContext $auditContext = null
    ): ApprovalRecord;

    /**
     * Revoke an active approval record with audit provenance.
     */
    public function revokeApproval(
        string $approvalId,
        string $reason,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null,
        ?AdminAuditContext $auditContext = null
    ): ApprovalRecord;

    /**
     * Atomically supersede an approval record with a new revision.
     */
    public function supersedeApproval(
        string $existingApprovalId,
        string $newStatus,
        string $source,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null,
        ?AdminAuditContext $auditContext = null
    ): ApprovalRecord;
}
