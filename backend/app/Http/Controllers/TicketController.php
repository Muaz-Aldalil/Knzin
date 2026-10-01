<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateTicketsJob;
use App\Models\Draw;
use App\Models\Order;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends ApiController
{
    /**
     * Get the authenticated learner's promotional tickets and dynamic draw eligibility.
     * Adheres to contracts/tickets.contract.md.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->failResponse('ERR_UNAUTHORIZED', 'Unauthenticated', [], 401);
        }

        // 1. Check for pending ticket orders and trigger immediate async re-dispatch
        $pendingOrders = Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->where('tickets_status', 'pending')
            ->get();

        foreach ($pendingOrders as $order) {
            GenerateTicketsJob::dispatch($order->id);
        }

        $serverTimeUtc = Carbon::now('UTC');

        // 2. Fetch active and locked promotional draws across tiers
        $draws = Draw::whereIn('tier', ['hourly', 'daily', 'monthly'])
            ->where('status', '!=', 'completed')
            ->where('starts_at', '<=', $serverTimeUtc)
            ->get();

        $activeDraws = [];
        foreach (['hourly', 'daily', 'monthly'] as $tier) {
            $draw = $draws->firstWhere('tier', $tier);
            if ($draw) {
                $activeDraws[$tier] = [
                    'id' => $draw->id,
                    'title_ar' => $draw->title_ar,
                    'title_en' => $draw->title_en,
                    'ends_at' => $draw->ends_at?->toISOString(),
                    'status' => $draw->computeEffectiveStatus(),
                ];
            }
        }

        // 3. Fetch user's tickets ordered by issued_at DESC
        $tickets = Ticket::where('user_id', $user->id)
            ->with('order')
            ->orderByDesc('issued_at')
            ->get();

        $hourlyDraw = $draws->firstWhere('tier', 'hourly');
        $dailyDraw = $draws->firstWhere('tier', 'daily');
        $monthlyDraw = $draws->firstWhere('tier', 'monthly');

        $ticketsData = [];
        foreach ($tickets as $ticket) {
            $issuedAt = Carbon::parse($ticket->issued_at)->setTimezone('UTC');

            // Evaluate Hourly eligibility: half-open interval starts_at <= issued_at < ends_at
            if ($hourlyDraw) {
                $inHourly = $issuedAt->gte($hourlyDraw->starts_at) && $issuedAt->lt($hourlyDraw->ends_at);
                $hourlyEffective = $hourlyDraw->computeEffectiveStatus();
                $hourlyStatus = ($hourlyEffective === 'locked') ? 'locked' : ($inHourly ? 'active' : 'concluded');
                $hourlyEligibility = [
                    'is_eligible' => $inHourly,
                    'status' => $hourlyStatus,
                ];
            } else {
                $hourlyEligibility = [
                    'is_eligible' => false,
                    'status' => 'concluded',
                ];
            }

            // Evaluate Daily eligibility: half-open interval starts_at <= issued_at < ends_at
            if ($dailyDraw) {
                $inDaily = $issuedAt->gte($dailyDraw->starts_at) && $issuedAt->lt($dailyDraw->ends_at);
                $dailyEffective = $dailyDraw->computeEffectiveStatus();
                $dailyStatus = ($dailyEffective === 'locked') ? 'locked' : ($inDaily ? 'active' : 'concluded');
                $dailyEligibility = [
                    'is_eligible' => $inDaily,
                    'status' => $dailyStatus,
                ];
            } else {
                $dailyEligibility = [
                    'is_eligible' => false,
                    'status' => 'concluded',
                ];
            }

            // Evaluate Monthly Grand eligibility: designated calendar month interval
            if ($monthlyDraw) {
                $inMonthly = $issuedAt->gte($monthlyDraw->starts_at) && $issuedAt->lt($monthlyDraw->ends_at);
                $monthlyEffective = $monthlyDraw->computeEffectiveStatus();
                $monthlyStatus = ($monthlyEffective === 'locked') ? 'locked' : ($inMonthly ? 'active' : 'concluded');
                $monthlyEligibility = [
                    'is_eligible' => $inMonthly,
                    'status' => $monthlyStatus,
                ];
            } else {
                $monthlyEligibility = [
                    'is_eligible' => false,
                    'status' => 'concluded',
                ];
            }

            $ticketsData[] = [
                'id' => $ticket->id,
                'serial_number' => $ticket->serial_number,
                'issued_at' => $issuedAt->toISOString(),
                'originating_order_number' => $ticket->order?->order_number ?? '',
                'eligibility' => [
                    'hourly' => $hourlyEligibility,
                    'daily' => $dailyEligibility,
                    'monthly' => $monthlyEligibility,
                ],
            ];
        }

        return $this->successResponse([
            'total_tickets' => $tickets->count(),
            'server_time_utc' => $serverTimeUtc->toISOString(),
            'active_draws' => empty($activeDraws) ? (object) [] : $activeDraws,
            'tickets' => $ticketsData,
        ]);
    }
}
