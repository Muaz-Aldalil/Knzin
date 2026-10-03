<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\StoreDrawRequest;
use App\Http\Requests\Admin\UpdateDrawRequest;
use App\Http\Resources\Admin\AdminDrawResource;
use App\Models\Draw;
use App\Services\Admin\DrawLifecycleService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDrawController extends ApiController
{
    public function __construct(
        protected DrawLifecycleService $drawLifecycle
    ) {
    }

    /**
     * List all draws including private drafts with cursor pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 25)));
        $cursor = $request->query('cursor');
        $published = $request->query('published');
        $status = $request->query('status');

        $query = Draw::with(['prizes', 'winner'])->orderBy('id', 'desc');

        if ($published !== null) {
            $query->where('is_published', filter_var($published, FILTER_VALIDATE_BOOLEAN));
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($cursor) {
            $query->where('id', '<', $cursor);
        }

        $draws = $query->limit($perPage + 1)->get();

        $hasNextPage = $draws->count() > $perPage;
        if ($hasNextPage) {
            $draws = $draws->slice(0, $perPage);
        }

        $nextCursor = $hasNextPage ? (string) $draws->last()?->id : null;

        return $this->successResponse([
            'items' => AdminDrawResource::collection($draws),
            'next_cursor' => $nextCursor,
        ]);
    }

    /**
     * Create a new draw in private draft state.
     */
    public function store(StoreDrawRequest $request): JsonResponse
    {
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $draw = $this->drawLifecycle->createDraft(
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new AdminDrawResource($draw->load(['prizes', 'winner'])), 201);
    }

    /**
     * Get single draw details with prizes, winner, and seed commitment.
     */
    public function show(string $id): JsonResponse
    {
        $draw = Draw::with(['prizes', 'winner'])->findOrFail($id);

        return $this->successResponse(new AdminDrawResource($draw));
    }

    /**
     * Operational update of draw obeying D1-D9 boundaries.
     */
    public function update(UpdateDrawRequest $request, string $id): JsonResponse
    {
        $draw = Draw::findOrFail($id);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $updated = $this->drawLifecycle->update(
            draw: $draw,
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new AdminDrawResource($updated->load(['prizes', 'winner'])));
    }

    /**
     * Atomically publish draw with cryptographic seed commitment.
     */
    public function publish(Request $request, string $id): JsonResponse
    {
        $draw = Draw::findOrFail($id);
        $auditContext = (new \App\Http\Requests\Admin\StoreDrawRequest())->auditContext(
            AdminCapabilities::MANAGE_PLATFORM_SETTINGS
        );

        $published = $this->drawLifecycle->publish(
            draw: $draw,
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new AdminDrawResource($published->load(['prizes', 'winner'])));
    }

    /**
     * Complete draw and reveal cryptographic seed for existing canonical winner.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $draw = Draw::findOrFail($id);
        $auditContext = (new \App\Http\Requests\Admin\StoreDrawRequest())->auditContext(
            AdminCapabilities::MANAGE_PLATFORM_SETTINGS
        );

        $completed = $this->drawLifecycle->complete(
            draw: $draw,
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new AdminDrawResource($completed->load(['prizes', 'winner'])));
    }
}
