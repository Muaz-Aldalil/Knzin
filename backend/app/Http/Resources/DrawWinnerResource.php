<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DrawWinnerResource extends JsonResource
{
    /**
     * Transform the resource into an array adhering to contracts/draws-concluded.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = $request->header('X-Locale', $request->get('locale', app()->getLocale()));
        $isEn = str_starts_with($locale, 'en');

        $prize = $this->prize;
        $winner = $this->winner;

        return [
            'id' => (string) $this->id,
            'tier' => (string) $this->tier,
            'title' => $isEn ? $this->title_en : $this->title_ar,
            'concluded_at' => ($this->ends_at ?? $winner?->drawn_at)?->toIso8601String(),
            'broadcast_replay_url' => $this->broadcast_url ?? $winner?->stream_recording_url,
            'prize' => $prize ? [
                'title' => $isEn ? $prize->title_en : $prize->title_ar,
                'valuation_usd' => (float) $prize->valuation_usd,
                'display_iqd_label' => (string) $prize->display_iqd_label,
                'image_url' => (string) $prize->image_url,
            ] : null,
            'winner' => $winner ? [
                'winning_ticket_serial' => (string) $winner->winning_ticket_serial,
                'masked_name' => (string) $winner->winner_masked_name,
                'governorate' => (string) $winner->winner_governorate,
                'prize_delivered' => (bool) $winner->prize_delivered,
            ] : null,
        ];
    }
}
