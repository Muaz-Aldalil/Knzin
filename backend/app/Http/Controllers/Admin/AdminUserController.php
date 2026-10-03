<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\ListUsersRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminUserController extends ApiController
{
    /**
     * Search global user directory for administrative operations.
     */
    public function index(ListUsersRequest $request): JsonResponse
    {
        $perPage = min(25, max(1, (int) $request->query('per_page', 15)));
        $page = max(1, (int) $request->query('page', 1));
        $search = $request->query('search');

        $query = User::with(['adminCapabilities'])->withCount('orders')->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "{$search}%")
                  ->orWhere('id', $search)
                  ->orWhere('learner_code', $search);
            });
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return $this->successResponse([
            'items' => AdminUserResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
