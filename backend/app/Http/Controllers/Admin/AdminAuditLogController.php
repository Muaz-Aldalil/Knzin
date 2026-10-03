<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\ListAuditLogsRequest;
use App\Http\Resources\Admin\AdminAuditLogResource;
use App\Models\AdminActivityLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AdminAuditLogController extends ApiController
{
    /**
     * List immutable admin activity audit logs with keyset pagination and redaction.
     */
    public function index(ListAuditLogsRequest $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 25)));
        $cursor = $request->query('cursor');

        $query = AdminActivityLog::with('actor')->orderBy('id', 'desc');

        if ($request->filled('actor')) {
            $actor = $request->query('actor');
            $query->whereHas('actor', function ($q) use ($actor) {
                $q->where('email', 'like', "{$actor}%")
                  ->orWhere('id', $actor);
            });
        }

        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->filled('target_type')) {
            $query->where('target_type', $request->query('target_type'));
        }

        if ($request->filled('target_id')) {
            $query->where('target_id', $request->query('target_id'));
        }

        if ($request->filled('outcome')) {
            $query->where('outcome', $request->query('outcome'));
        }

        $from = $request->filled('from')
            ? Carbon::parse($request->query('from'))
            : Carbon::now()->subDays(30);
        $query->where('created_at', '>=', $from);

        if ($request->filled('to')) {
            $query->where('created_at', '<=', Carbon::parse($request->query('to')));
        }

        if ($cursor) {
            $query->where('id', '<', (int) $cursor);
        }

        $logs = $query->limit($perPage + 1)->get();

        $hasNextPage = $logs->count() > $perPage;
        if ($hasNextPage) {
            $logs = $logs->slice(0, $perPage);
        }

        $nextCursor = $hasNextPage ? (string) $logs->last()?->id : null;

        return $this->successResponse([
            'items' => AdminAuditLogResource::collection($logs),
            'next_cursor' => $nextCursor,
        ]);
    }
}
