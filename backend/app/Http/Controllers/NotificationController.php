<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends ApiController
{
    /**
     * Get paginated notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->failResponse('ERR_UNAUTHORIZED', 'Unauthenticated.', [], 401);
        }

        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));
        $filter = $request->query('filter', 'all');

        $query = $user->notifications()->latest();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        $paginator = $query->paginate($perPage);

        $locale = $request->header('X-Locale')
            ?: ($request->getPreferredLanguage(['ar', 'en']) ?: 'ar');

        $items = collect($paginator->items())->map(function (DatabaseNotification $n) use ($locale) {
            return $this->formatNotification($n, $locale);
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Get unread notifications count for the authenticated user.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->failResponse('ERR_UNAUTHORIZED', 'Unauthenticated.', [], 401);
        }

        $count = $user->unreadNotifications()->count();

        return response()->json([
            'data' => [
                'unread_count' => $count,
            ],
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->failResponse('ERR_UNAUTHORIZED', 'Unauthenticated.', [], 401);
        }

        /** @var DatabaseNotification|null $notification */
        $notification = $user->notifications()->where('id', $id)->first();

        if (!$notification) {
            return response()->json([
                'status' => 'fail',
                'message' => 'Notification not found.',
            ], 404);
        }

        if (is_null($notification->read_at)) {
            $notification->markAsRead();
        }

        $locale = $request->header('X-Locale')
            ?: ($request->getPreferredLanguage(['ar', 'en']) ?: 'ar');

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read.',
            'data' => $this->formatNotification($notification->fresh(), $locale),
        ]);
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->failResponse('ERR_UNAUTHORIZED', 'Unauthenticated.', [], 401);
        }

        $user->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * Format a DatabaseNotification into the OpenAPI contract schema.
     *
     * @return array<string, mixed>
     */
    private function formatNotification(DatabaseNotification $n, string $locale): array
    {
        $data = $n->data ?? [];

        $title = $data["title_{$locale}"]
            ?? $data['title_ar']
            ?? $data['title_en']
            ?? '';

        $body = $data["body_{$locale}"]
            ?? $data['body_ar']
            ?? $data['body_en']
            ?? '';

        return [
            'id' => (string) $n->id,
            'category' => $data['category'] ?? 'transactional',
            'title' => $title,
            'body' => $body,
            'action_type' => $data['action_type'] ?? 'navigate',
            'action_url' => $data['action_url'] ?? null,
            'entity_type' => $data['entity_type'] ?? null,
            'entity_id' => $data['entity_id'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'is_read' => !is_null($n->read_at),
            'read_at' => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at->toIso8601String(),
        ];
    }
}
