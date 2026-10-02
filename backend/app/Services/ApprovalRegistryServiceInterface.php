<?php

namespace App\Services;

use App\Models\ApprovalRecord;
use App\Models\User;

interface ApprovalRegistryServiceInterface
{
    /**
     * Issue an authoritative approval record behind strict domain authorization.
     *
     * @param string $approvalType 'kyc' or 'draw_integrity'
     * @param string $subjectType 'user' or 'draw'
     * @param string $subjectId UUID or ID of the subject entity
     * @param string $status 'approved' or 'rejected'
     * @param string $source Subsystem source identifier
     * @param User|null $authorizer Authorized user context
     * @param string|null $systemPrincipal Trusted system principal origin
     * @param string|null $systemSecret Shared secret credential validating subsystem principal
     * @return ApprovalRecord
     * @throws \Illuminate\Auth\Access\AuthorizationException
     * @throws \InvalidArgumentException
     */
    public function issueApproval(
        string $approvalType,
        string $subjectType,
        string $subjectId,
        string $status,
        string $source,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null
    ): ApprovalRecord;

    /**
     * Revoke an active approval record with audit provenance.
     *
     * @param string $approvalId
     * @param string $reason
     * @param User|null $authorizer
     * @param string|null $systemPrincipal
     * @param string|null $systemSecret Shared secret credential validating subsystem principal
     * @return ApprovalRecord
     * @throws \Illuminate\Auth\Access\AuthorizationException
     * @throws \DomainException
     */
    public function revokeApproval(
        string $approvalId,
        string $reason,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null
    ): ApprovalRecord;

    /**
     * Atomically supersede an approval record with a new revision.
     *
     * @param string $existingApprovalId
     * @param string $newStatus
     * @param string $source
     * @param User|null $authorizer
     * @param string|null $systemPrincipal
     * @param string|null $systemSecret Shared secret credential validating subsystem principal
     * @return ApprovalRecord
     * @throws \Illuminate\Auth\Access\AuthorizationException
     * @throws \DomainException
     */
    public function supersedeApproval(
        string $existingApprovalId,
        string $newStatus,
        string $source,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null
    ): ApprovalRecord;
}
