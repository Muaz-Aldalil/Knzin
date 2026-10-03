<?php

namespace App\Http\Controllers;

use App\Http\Resources\DrawResource;
use App\Http\Resources\DrawWinnerResource;
use App\Models\Draw;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DrawController extends ApiController
{
    /**
     * Get all active and rolling-window promotional draws with authoritative server UTC time.
     * Adheres to contracts/draws-active.json.
     */
    public function active(Request $request): JsonResponse
    {
        $serverTimeUtc = Carbon::now('UTC');

        $draws = Draw::with('prize')
            ->published()
            ->rollingWindow()
            ->orderBy('ends_at', 'asc')
            ->get();

        return $this->successResponse([
            'server_time_utc' => $serverTimeUtc->toIso8601String(),
            'draws' => DrawResource::collection($draws),
        ]);
    }

    /**
     * Get concluded draws history with public verified winner records.
     * Adheres to contracts/draws-concluded.json.
     */
    public function concluded(Request $request): JsonResponse
    {
        $draws = Draw::with(['prize', 'winner'])
            ->published()
            ->concluded()
            ->whereHas('winner')
            ->orderBy('ends_at', 'desc')
            ->limit(20)
            ->get();

        return $this->successResponse([
            'draws' => DrawWinnerResource::collection($draws),
        ]);
    }
}
