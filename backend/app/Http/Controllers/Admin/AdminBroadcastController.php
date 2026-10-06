<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Models\AdminBroadcast;
use App\Models\User;
use App\Notifications\AdminBroadcastNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminBroadcastController extends ApiController
{
    /**
     * Dispatch an administrative announcement broadcast.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title_ar' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'body_ar' => 'required|string',
            'body_en' => 'required|string',
            'channels' => 'required|array|min:1',
            'channels.*' => 'required|string|in:in_app,email',
        ]);

        $admin = $request->user();

        $broadcast = DB::transaction(function () use ($validated, $admin) {
            $record = AdminBroadcast::create([
                'id' => (string) Str::uuid(),
                'admin_user_id' => $admin->id,
                'title_ar' => $validated['title_ar'],
                'title_en' => $validated['title_en'],
                'body_ar' => $validated['body_ar'],
                'body_en' => $validated['body_en'],
                'channels' => $validated['channels'],
                'sent_count' => 0,
            ]);

            return $record;
        });

        $sentCount = 0;

        // Query active users in flat memory chunks who haven't opted out of admin broadcasts
        User::query()
            ->where('status', 'active')
            ->with('notificationPreferences')
            ->chunkById(250, function ($recipients) use ($broadcast, &$sentCount) {
                foreach ($recipients as $recipient) {
                    $prefs = $recipient->notificationPreferences;
                    if ($prefs && ($prefs->unsubscribed_at !== null || $prefs->admin_broadcasts === false)) {
                        continue;
                    }

                    $recipient->notify(new AdminBroadcastNotification($broadcast, $recipient));
                    $sentCount++;
                }
            });

        $broadcast->update(['sent_count' => $sentCount]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'broadcast_id' => (string) $broadcast->id,
                'sent_count' => $sentCount,
            ],
        ], 201);
    }
}
