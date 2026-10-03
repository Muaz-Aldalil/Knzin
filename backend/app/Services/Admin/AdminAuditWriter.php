<?php

namespace App\Services\Admin;

use App\Models\AdminActivityLog;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdminAuditWriter
{
    public function __construct(
        private readonly AuditRedactor $redactor = new AuditRedactor()
    ) {
    }

    /**
     * Records an immutable admin activity log entry synchronously.
     * Enforces active transaction for domain state mutations.
     */
    public function record(
        AdminAuditContext $context,
        string $action,
        ?string $targetType = null,
        ?string $targetId = null,
        ?array $beforeState = null,
        ?array $afterState = null,
        string $outcome = 'success',
        ?string $reasonCode = null,
        bool $requireTransaction = true,
        ?string $justification = null
    ): AdminActivityLog {
        if ($requireTransaction && DB::transactionLevel() === 0) {
            throw new RuntimeException("Audit write refused: {$action} must execute inside an active database transaction.");
        }

        $redactedBefore = $beforeState !== null ? $this->redactor->redact($beforeState) : null;
        $redactedAfter = $afterState !== null ? $this->redactor->redact($afterState) : null;

        return AdminActivityLog::create([
            'request_id' => $context->requestId,
            'actor_user_id' => $context->actorUserId,
            'capability_used' => $context->capabilityUsed,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'outcome' => $outcome,
            'reason_code' => $reasonCode,
            'administrative_justification' => $justification ?? $context->justification,
            'before_state' => $redactedBefore,
            'after_state' => $redactedAfter,
            'ip_hash' => $context->ipHash,
            'created_at' => now(),
        ]);
    }
}
