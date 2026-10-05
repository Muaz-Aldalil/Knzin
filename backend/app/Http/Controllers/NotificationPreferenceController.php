<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationPreferenceController extends ApiController
{
    /**
     * Get authenticated user marketing notification preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $pref = NotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'id' => (string) Str::uuid(),
                'course_announcements' => true,
                'prize_draw_promotions' => true,
                'admin_broadcasts' => true,
                'unsubscribed_at' => null,
            ]
        );

        return $this->successResponse([
            'course_announcements' => (bool) $pref->course_announcements,
            'prize_draw_promotions' => (bool) $pref->prize_draw_promotions,
            'admin_broadcasts' => (bool) $pref->admin_broadcasts,
            'is_unsubscribed_from_all' => $pref->unsubscribed_at !== null,
        ]);
    }

    /**
     * Update authenticated user marketing notification preferences.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'course_announcements' => 'sometimes|boolean',
            'prize_draw_promotions' => 'sometimes|boolean',
            'admin_broadcasts' => 'sometimes|boolean',
        ]);

        $pref = NotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'id' => (string) Str::uuid(),
                'course_announcements' => true,
                'prize_draw_promotions' => true,
                'admin_broadcasts' => true,
                'unsubscribed_at' => null,
            ]
        );

        $pref->fill($validated);

        // If user re-enabled any category, clear global unsubscribed_at
        if (
            ($validated['course_announcements'] ?? false) ||
            ($validated['prize_draw_promotions'] ?? false) ||
            ($validated['admin_broadcasts'] ?? false)
        ) {
            $pref->unsubscribed_at = null;
        }

        $pref->save();

        return $this->successResponse([
            'course_announcements' => (bool) $pref->course_announcements,
            'prize_draw_promotions' => (bool) $pref->prize_draw_promotions,
            'admin_broadcasts' => (bool) $pref->admin_broadcasts,
            'is_unsubscribed_from_all' => $pref->unsubscribed_at !== null,
        ]);
    }

    /**
     * Handle one-click signed email unsubscribe.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        if (!$request->hasValidSignature()) {
            return $this->failResponse(
                'ERR_INVALID_SIGNATURE',
                'Invalid or expired signature.',
                [],
                403
            );
        }

        $userId = $request->query('user');
        $user = User::find($userId);

        if (!$user) {
            return $this->failResponse('ERR_USER_NOT_FOUND', 'User not found.', [], 404);
        }

        $category = $request->query('category', 'all');

        $pref = NotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'id' => (string) Str::uuid(),
                'course_announcements' => true,
                'prize_draw_promotions' => true,
                'admin_broadcasts' => true,
                'unsubscribed_at' => null,
            ]
        );

        if ($category === 'all') {
            $pref->update([
                'course_announcements' => false,
                'prize_draw_promotions' => false,
                'admin_broadcasts' => false,
                'unsubscribed_at' => now(),
            ]);
        } elseif (in_array($category, ['course_announcements', 'prize_draw_promotions', 'admin_broadcasts'], true)) {
            $pref->update([
                $category => false,
            ]);
        }

        return $this->successResponse([
            'message' => 'Successfully unsubscribed from marketing communications.',
        ]);
    }
}
