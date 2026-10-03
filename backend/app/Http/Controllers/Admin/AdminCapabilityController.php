<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\GrantCapabilityRequest;
use App\Http\Requests\Admin\RevokeCapabilityRequest;
use App\Models\User;
use App\Services\Admin\AdminCapabilityService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;

class AdminCapabilityController extends ApiController
{
    public function __construct(
        protected AdminCapabilityService $capabilityService
    ) {
    }

    /**
     * Grant an administrative capability to a target user.
     */
    public function store(GrantCapabilityRequest $request, string $userId): JsonResponse
    {
        $targetUser = User::findOrFail($userId);

        if ($targetUser->id === $request->user()->id) {
            return $this->failResponse(
                'ERR_SELF_GRANT_FORBIDDEN',
                'Administrators cannot grant capabilities to themselves.',
                [],
                403
            );
        }

        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES);

        $this->capabilityService->grant(
            target: $targetUser,
            capability: (string) $request->input('capability'),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse([
            'granted' => true,
            'capability' => $request->input('capability'),
            'user_id' => $targetUser->id,
        ]);
    }

    /**
     * Revoke an administrative capability from a target user.
     */
    public function destroy(RevokeCapabilityRequest $request, string $userId, string $capability): JsonResponse
    {
        $targetUser = User::findOrFail($userId);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES);

        $this->capabilityService->revoke(
            target: $targetUser,
            capability: $capability,
            actor: $request->user(),
            reason: (string) $request->input('reason'),
            auditContext: $auditContext
        );

        return $this->successResponse([
            'revoked' => true,
            'capability' => $capability,
            'user_id' => $targetUser->id,
        ]);
    }
}
