<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\UpdateWinnerMetadataRequest;
use App\Models\Draw;
use App\Services\Admin\DrawLifecycleService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;

class AdminDrawWinnerController extends ApiController
{
    public function __construct(
        protected DrawLifecycleService $drawLifecycle
    ) {
    }

    /**
     * Update post-draw winner display metadata.
     */
    public function update(UpdateWinnerMetadataRequest $request, string $drawId): JsonResponse
    {
        $draw = Draw::findOrFail($drawId);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $winner = $this->drawLifecycle->updateWinnerMetadata(
            draw: $draw,
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($winner);
    }
}
