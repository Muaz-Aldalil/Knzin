<?php

namespace App\Services;

use App\Models\ApprovalRecord;
use App\Models\Draw;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApprovalRegistryService implements ApprovalRegistryServiceInterface
{
    /**
     * Allowed approval types.
     */
    public const ALLOWED_TYPES = ['kyc', 'draw_integrity'];

    /**
     * Allowed statuses for issuance.
     */
    public const ISSUANCE_STATUSES = ['approved', 'rejected', 'pending'];

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
        ?string $systemSecret = null
    ): ApprovalRecord {
        // 1. Invariant: Valid approval type
        if (!in_array($approvalType, self::ALLOWED_TYPES, true)) {
            throw new \InvalidArgumentException("Invalid approval type [{$approvalType}].");
        }

        // 2. Invariant: Valid status
        if (!in_array($status, self::ISSUANCE_STATUSES, true)) {
            throw new \InvalidArgumentException("Invalid issuance status [{$status}].");
        }

        // 3. Invariant: Subject type & existence verification
        if ($approvalType === 'kyc') {
            if ($subjectType !== 'user') {
                throw new \InvalidArgumentException("KYC approval subject_type must be 'user'.");
            }
            if (!User::where('id', $subjectId)->exists()) {
                throw new \InvalidArgumentException("Target user [{$subjectId}] does not exist for KYC approval.");
            }
        } elseif ($approvalType === 'draw_integrity') {
            if ($subjectType !== 'draw') {
                throw new \InvalidArgumentException("Draw integrity approval subject_type must be 'draw'.");
            }
            if (!Draw::where('id', $subjectId)->exists()) {
                throw new \InvalidArgumentException("Target draw [{$subjectId}] does not exist for draw integrity approval.");
            }
        }

        // 4. Invariant: Issuer authorization check
        $this->verifyIssuerAuthorization($approvalType, $authorizer, $systemPrincipal, $systemSecret);

        $approvedBy = $authorizer?->id ?? $systemPrincipal;

        // 5. Invariant: Atomic versioning and supersession within transaction under trusted permitWrite barrier
        return DB::transaction(function () use (
            $approvalType,
            $subjectType,
            $subjectId,
            $status,
            $source,
            $approvedBy
        ) {
            $latest = ApprovalRecord::where('approval_type', $approvalType)
                ->where('subject_type', $subjectType)
                ->where('subject_id', $subjectId)
                ->lockForUpdate()
                ->orderByDesc('version')
                ->first();

            $newApprovalId = strtoupper($approvalType) . '-APP-' . (string) Str::uuid();

            return ApprovalRecord::permitWrite(function () use (
                $latest,
                $newApprovalId,
                $approvalType,
                $subjectType,
                $subjectId,
                $status,
                $source,
                $approvedBy
            ) {
                if ($latest !== null) {
                    // If an existing approval was active and fresh, atomically supersede it
                    if ($latest->isFresh()) {
                        $latest->update([
                            'status' => 'superseded',
                            'superseded_at' => now(),
                            'superseded_by_approval_id' => $newApprovalId,
                        ]);
                    }
                    $version = $latest->version + 1;
                } else {
                    $version = 1;
                }

                return ApprovalRecord::create([
                    'approval_id' => $newApprovalId,
                    'approval_type' => $approvalType,
                    'subject_type' => $subjectType,
                    'subject_id' => $subjectId,
                    'status' => $status,
                    'approved_at' => ($status === 'approved') ? now() : null,
                    'approved_by' => $approvedBy,
                    'source' => $source,
                    'version' => $version,
                ]);
            });
        });
    }

    /**
     * Revoke an active approval record with audit provenance.
     */
    public function revokeApproval(
        string $approvalId,
        string $reason,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null
    ): ApprovalRecord {
        return DB::transaction(function () use ($approvalId, $reason, $authorizer, $systemPrincipal, $systemSecret) {
            $record = ApprovalRecord::where('approval_id', $approvalId)
                ->lockForUpdate()
                ->first();

            if ($record === null) {
                throw new \InvalidArgumentException("Approval record [{$approvalId}] not found.");
            }

            // Invariant: Issuer authorization
            $this->verifyIssuerAuthorization($record->approval_type, $authorizer, $systemPrincipal, $systemSecret);

            // Invariant: Cannot revoke already superseded record
            if ($record->status === 'superseded') {
                throw new \DomainException("Cannot revoke superseded approval record [{$approvalId}].");
            }

            // Idempotent: already revoked
            if ($record->status === 'revoked') {
                return $record;
            }

            $revokedBy = $authorizer?->id ?? $systemPrincipal;

            ApprovalRecord::permitWrite(function () use ($record, $revokedBy, $reason) {
                $record->update([
                    'status' => 'revoked',
                    'revoked_at' => now(),
                    'revoked_by' => $revokedBy,
                    'revocation_reason' => $reason,
                ]);
            });

            return $record->fresh();
        });
    }

    /**
     * Atomically supersede an approval record with a new revision.
     */
    public function supersedeApproval(
        string $existingApprovalId,
        string $newStatus,
        string $source,
        ?User $authorizer = null,
        ?string $systemPrincipal = null,
        ?string $systemSecret = null
    ): ApprovalRecord {
        return DB::transaction(function () use (
            $existingApprovalId,
            $newStatus,
            $source,
            $authorizer,
            $systemPrincipal,
            $systemSecret
        ) {
            $existing = ApprovalRecord::where('approval_id', $existingApprovalId)
                ->lockForUpdate()
                ->first();

            if ($existing === null) {
                throw new \InvalidArgumentException("Approval record [{$existingApprovalId}] not found.");
            }

            // Invariant: Issuer authorization
            $this->verifyIssuerAuthorization($existing->approval_type, $authorizer, $systemPrincipal, $systemSecret);

            // Invariant: Cannot supersede a revoked approval
            if ($existing->status === 'revoked') {
                throw new \DomainException("Cannot supersede a revoked approval record [{$existingApprovalId}].");
            }

            $newApprovalId = strtoupper($existing->approval_type) . '-APP-' . (string) Str::uuid();
            $approvedBy = $authorizer?->id ?? $systemPrincipal;

            return ApprovalRecord::permitWrite(function () use (
                $existing,
                $newApprovalId,
                $newStatus,
                $approvedBy,
                $source
            ) {
                // Atomically mark old record as superseded
                $existing->update([
                    'status' => 'superseded',
                    'superseded_at' => now(),
                    'superseded_by_approval_id' => $newApprovalId,
                ]);

                return ApprovalRecord::create([
                    'approval_id' => $newApprovalId,
                    'approval_type' => $existing->approval_type,
                    'subject_type' => $existing->subject_type,
                    'subject_id' => $existing->subject_id,
                    'status' => $newStatus,
                    'approved_at' => ($newStatus === 'approved') ? now() : null,
                    'approved_by' => $approvedBy,
                    'source' => $source,
                    'version' => $existing->version + 1,
                ]);
            });
        });
    }

    /**
     * Verify caller authorization to issue/revoke this approval type.
     */
    protected function verifyIssuerAuthorization(
        string $approvalType,
        ?User $authorizer,
        ?string $systemPrincipal,
        ?string $systemSecret
    ): void {
        if ($approvalType === 'kyc') {
            $isAuthorizedUser = $authorizer !== null && $authorizer->hasCapability('issue_kyc_approval');
            $expectedSecret = (string) config('knzin.subsystems.compliance_kyc_secret');
            $isTrustedSystem = $systemPrincipal === 'compliance_kyc_subsystem'
                && !empty($systemSecret)
                && !empty($expectedSecret)
                && hash_equals($expectedSecret, (string) $systemSecret);

            if (!$isAuthorizedUser && !$isTrustedSystem) {
                throw new AuthorizationException("Unauthorized actor cannot issue or modify KYC approvals.");
            }
        } elseif ($approvalType === 'draw_integrity') {
            $isAuthorizedUser = $authorizer !== null && $authorizer->hasCapability('issue_draw_audit_approval');
            $expectedSecret = (string) config('knzin.subsystems.draw_audit_secret');
            $isTrustedSystem = $systemPrincipal === 'draw_audit_engine'
                && !empty($systemSecret)
                && !empty($expectedSecret)
                && hash_equals($expectedSecret, (string) $systemSecret);

            if (!$isAuthorizedUser && !$isTrustedSystem) {
                throw new AuthorizationException("Unauthorized actor cannot issue or modify Draw Integrity approvals.");
            }
        }
    }

}
