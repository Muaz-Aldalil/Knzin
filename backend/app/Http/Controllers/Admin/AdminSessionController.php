<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSessionController extends Controller
{
    /**
     * Return authenticated admin profile and active capabilities.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeCapabilities = [];
        foreach (AdminCapabilities::ALL as $capability) {
            if ($user && $user->hasCapability($capability)) {
                $activeCapabilities[] = $capability;
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'display_name' => $user->display_name ?? explode('@', (string) $user->email)[0],
                    'status' => $user->status,
                ],
                'capabilities' => $activeCapabilities,
                'server_time_utc' => now()->toIso8601String(),
            ],
        ]);
    }
}
