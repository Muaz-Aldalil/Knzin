<?php

namespace App\Services\Admin;

readonly class AdminAuditContext
{
    public function __construct(
        public ?string $actorUserId,
        public ?string $capabilityUsed,
        public string $requestId,
        public ?string $ipHash = null,
        public ?string $justification = null,
    ) {
    }
}
