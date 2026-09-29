<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DrawResource extends JsonResource
{
    /**
     * Transform the resource into an array adhering to contracts/draws-active.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = $request->header('X-Locale', $request->get('locale', app()->getLocale()));
        $isEn = str_starts_with($locale, 'en');

        $effectiveStatus = $this->computeEffectiveStatus();

        // High-trust badge label
        if ($this->execution_type === 'live_broadcast') {
            $badgeLabel = $isEn ? 'Official YouTube Live Broadcast' : 'بث مباشر رسمي على يوتيوب';
        } else {
            $badgeLabel = $isEn ? 'Officially Scheduled & Guaranteed' : 'سحب مضمون ومجدول رسمياً';
        }

        $prize = $this->prize;

        return [
            'id' => (string) $this->id,
            'tier' => (string) $this->tier,
            'execution_type' => (string) $this->execution_type,
            'title' => $isEn ? $this->title_en : $this->title_ar,
            'status' => $effectiveStatus,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'badge_label' => $badgeLabel,
            'broadcast_url' => $this->broadcast_url,
            'total_eligible_tickets' => (int) $this->total_eligible_tickets,
            'prize' => $prize ? [
                'title' => $isEn ? $prize->title_en : $prize->title_ar,
                'description' => $isEn ? $prize->description_en : $prize->description_ar,
                'category' => (string) $prize->category,
                'valuation_usd' => (float) $prize->valuation_usd,
                'display_iqd_label' => (string) $prize->display_iqd_label,
                'image_url' => (string) $prize->image_url,
            ] : null,
        ];
    }
}
