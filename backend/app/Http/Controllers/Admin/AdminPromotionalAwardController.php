<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\StoreAwardRequest;
use App\Services\Admin\PromotionalAwardService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;

class AdminPromotionalAwardController extends ApiController
{
    public function __construct(
        protected PromotionalAwardService $awardService
    ) {
    }

    /**
     * Grant a promotional award to an eligible user.
     */
    public function store(StoreAwardRequest $request): JsonResponse
    {
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $award = $this->awardService->grant(
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($award, 201);
    }
}
