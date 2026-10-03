<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\StorePrizeRequest;
use App\Http\Requests\Admin\UpdatePrizeRequest;
use App\Models\Draw;
use App\Models\Prize;
use App\Services\Admin\PrizeService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPrizeController extends ApiController
{
    public function __construct(
        protected PrizeService $prizeService
    ) {
    }

    /**
     * Create a prize for a draw.
     */
    public function store(StorePrizeRequest $request, string $drawId): JsonResponse
    {
        $draw = Draw::findOrFail($drawId);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $prize = $this->prizeService->createPrize(
            draw: $draw,
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($prize, 201);
    }

    /**
     * Update an existing prize.
     */
    public function update(UpdatePrizeRequest $request, string $id): JsonResponse
    {
        $prize = Prize::findOrFail($id);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $updated = $this->prizeService->updatePrize(
            prize: $prize,
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($updated);
    }

    /**
     * Delete an existing prize, protected against canonical winner deletion.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $prize = Prize::findOrFail($id);
        $auditContext = (new \App\Http\Requests\Admin\StorePrizeRequest())->auditContext(
            AdminCapabilities::MANAGE_PLATFORM_SETTINGS
        );

        $this->prizeService->deletePrize(
            prize: $prize,
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(['deleted' => true]);
    }
}
