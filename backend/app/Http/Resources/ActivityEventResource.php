<?php

namespace App\Http\Resources;

use App\Models\Draw;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityEventResource extends JsonResource
{
    /**
     * Transform the resource into an array adhering to contracts/activity-recent.v1.json.
     * Guaranteed strictly non-PII (no emails, user IDs, IPs, or internal UUIDs).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($this->resource instanceof Order) {
            return $this->transformOrder($this->resource);
        }

        if ($this->resource instanceof Draw) {
            return $this->transformDraw($this->resource);
        }

        if (is_array($this->resource)) {
            return $this->transformBulletin($this->resource);
        }

        return (array) $this->resource;
    }

    /**
     * Transform completed order into non-PII enrollment event.
     */
    protected function transformOrder(Order $order): array
    {
        $maskedId = 'evt_ord_' . substr(hash('sha256', (string) $order->id), 0, 12);
        $firstItem = $order->items->first();
        $courseTitleAr = $firstItem?->course?->title_ar ?? 'كورس تدريبي';
        $courseTitleEn = $firstItem?->course?->title_en ?? 'Vocational Course';
        $tickets = (int) ($order->promotional_tickets_granted ?? 1);

        $textAr = $tickets > 1
            ? "انضمام متعلم جديد إلى {$courseTitleAr} — تم منح {$tickets} تذاكر مجانية!"
            : "انضمام متعلم جديد إلى {$courseTitleAr} — تم منح تذكرة مجانية!";

        $textEn = $tickets > 1
            ? "New learner enrolled in {$courseTitleEn} — {$tickets} free promotional tickets granted!"
            : "New learner enrolled in {$courseTitleEn} — 1 free promotional ticket granted!";

        return [
            'id' => $maskedId,
            'type' => 'enrollment',
            'text_ar' => $textAr,
            'text_en' => $textEn,
            'highlight_label_ar' => 'تسجيل جديد',
            'highlight_label_en' => 'New Enrollment',
            'timestamp' => $order->created_at?->toIso8601String() ?? Carbon::now('UTC')->toIso8601String(),
        ];
    }

    /**
     * Transform scheduled/active draw into urgency countdown alert.
     */
    protected function transformDraw(Draw $draw): array
    {
        $maskedId = 'evt_drw_' . substr(hash('sha256', (string) $draw->id), 0, 12);

        return [
            'id' => $maskedId,
            'type' => 'countdown_alert',
            'text_ar' => "سحب {$draw->title_ar} يقترب — لا تفوّت فرصتك!",
            'text_en' => "{$draw->title_en} Draw is approaching — Don't miss out!",
            'highlight_label_ar' => 'تنبيه السحب',
            'highlight_label_en' => 'Draw Urgency',
            'timestamp' => $draw->updated_at?->toIso8601String() ?? Carbon::now('UTC')->toIso8601String(),
        ];
    }

    /**
     * Transform curated educational bulletin into static activity item.
     */
    protected function transformBulletin(array $bulletin): array
    {
        $maskedId = $bulletin['id'] ?? ('evt_blt_' . substr(hash('sha256', $bulletin['key'] ?? 'bulletin_default'), 0, 12));

        return [
            'id' => $maskedId,
            'type' => 'bulletin',
            'text_ar' => (string) ($bulletin['text_ar'] ?? ''),
            'text_en' => (string) ($bulletin['text_en'] ?? ''),
            'highlight_label_ar' => (string) ($bulletin['highlight_label_ar'] ?? 'إعلان تعليمي'),
            'highlight_label_en' => (string) ($bulletin['highlight_label_en'] ?? 'Platform Bulletin'),
            'timestamp' => (string) ($bulletin['timestamp'] ?? Carbon::now('UTC')->toIso8601String()),
        ];
    }
}
