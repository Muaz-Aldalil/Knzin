<?php

namespace App\Services;

use DateTimeInterface;

class ApprovalProvenance
{
    public function __construct(
        public readonly ?string $approvalId,
        public readonly string $approvalType,
        public readonly ?string $subjectId,
        public readonly string $status,
        public readonly ?DateTimeInterface $approvedAt,
        public readonly ?string $approvedBy,
        public readonly string $source,
        public readonly int $version = 1,
        public readonly ?DateTimeInterface $revokedAt = null,
        public readonly ?string $revokedBy = null,
        public readonly ?string $revocationReason = null,
        public readonly ?DateTimeInterface $supersededAt = null
    ) {}

    /**
     * Determine if this approval provenance represents a valid, fresh approved state.
     * Must be approved, timestamped, not revoked, and not superseded.
     */
    public function isFresh(): bool
    {
        return $this->status === 'approved'
            && !empty($this->approvalId)
            && $this->approvedAt !== null
            && $this->revokedAt === null
            && $this->supersededAt === null;
    }

    /**
     * Backward-compatible alias for isFresh().
     */
    public function isApproved(): bool
    {
        return $this->isFresh();
    }
}
