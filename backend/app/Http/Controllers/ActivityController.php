<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityEventResource;
use App\Models\Draw;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ActivityController extends ApiController
{
    /**
     * Public unauthenticated endpoint providing sanitized, non-PII recent course enrollments,
     * upcoming draw countdown urgency alarms, and platform educational bulletins.
     * Adheres to contracts/activity-recent.v1.json.
     */
    public function recent(Request $request): JsonResponse
    {
        $cacheTtl = app()->environment('testing') ? 0 : 120;

        $cachedPayload = Cache::remember('knzin_activity_feed', $cacheTtl, function () {
            $now = Carbon::now('UTC');

            // Fetch recent completed orders (limit 10)
            $orders = Order::with(['items.course'])
                ->where('status', 'completed')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            // Fetch scheduled/active upcoming draws (limit 3)
            $draws = Draw::published()
                ->whereIn('status', ['upcoming', 'active'])
                ->where('ends_at', '>', $now)
                ->orderBy('ends_at', 'asc')
                ->limit(3)
                ->get();

            $hasLiveOrders = $orders->isNotEmpty();
            $events = collect();

            // Include upcoming draw urgency alarms first
            foreach ($draws as $draw) {
                $events->push($draw);
            }

            if ($hasLiveOrders) {
                foreach ($orders as $order) {
                    $events->push($order);
                }
            } else {
                // Quiet-period fallback: inject curated educational bulletins
                $bulletins = $this->getCuratedBulletins($now);
                foreach ($bulletins as $bulletin) {
                    $events->push($bulletin);
                }
            }

            return [
                'events' => ActivityEventResource::collection($events)->resolve(),
                'meta' => [
                    'total' => $events->count(),
                    'has_live_orders' => $hasLiveOrders,
                    'polled_at' => $now->toIso8601String(),
                ],
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $cachedPayload,
        ], 200, [
            'Cache-Control' => 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
        ]);
    }

    /**
     * Curated platform educational and legal transparency bulletins.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function getCuratedBulletins(Carbon $now): array
    {
        return [
            [
                'key' => 'bulletin_vocational_hours',
                'id' => 'evt_blt_' . substr(hash('sha256', 'bulletin_vocational_hours'), 0, 12),
                'type' => 'bulletin',
                'text_ar' => 'أكثر من 1,200 ساعة تدريبية مهنية مكتملة هذا الأسبوع في كَنزين!',
                'text_en' => 'Over 1,200 vocational training hours completed this week on KNZiN!',
                'highlight_label_ar' => 'إعلان تعليمي',
                'highlight_label_en' => 'Platform Bulletin',
                'timestamp' => $now->copy()->startOfDay()->toIso8601String(),
            ],
            [
                'key' => 'bulletin_pricing_tickets',
                'id' => 'evt_blt_' . substr(hash('sha256', 'bulletin_pricing_tickets'), 0, 12),
                'type' => 'bulletin',
                'text_ar' => 'كل جزء مهني بقيمة 2$ أو باقة 10$ تمنحك تذاكر سحب مجانية ترويجية رسمية.',
                'text_en' => 'Every vocational course part ($2 or $10 bundle) grants official free promotional raffle tickets.',
                'highlight_label_ar' => 'شفافية',
                'highlight_label_en' => 'Transparency',
                'timestamp' => $now->copy()->startOfDay()->toIso8601String(),
            ],
            [
                'key' => 'bulletin_provable_fairness',
                'id' => 'evt_blt_' . substr(hash('sha256', 'bulletin_provable_fairness'), 0, 12),
                'type' => 'bulletin',
                'text_ar' => 'سحوبات نقدية وجوائز كبرى تُبث مباشرة على يوتيوب بنزاهة رقمية معلنة.',
                'text_en' => 'Cash draws and grand prizes broadcast live on YouTube with provable fairness.',
                'highlight_label_ar' => 'نزاهة معلنة',
                'highlight_label_en' => 'Fairness',
                'timestamp' => $now->copy()->startOfDay()->toIso8601String(),
            ],
        ];
    }
}
