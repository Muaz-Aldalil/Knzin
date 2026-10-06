<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Sanitizes customer IP, quiz answers, and sensitive user PII from public responses (DEF-02B, DEF-06B).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'total_amount_cents' => (int) $this->total_amount_cents,
            'currency' => $this->currency,
            'exchange_rate' => (string) $this->exchange_rate,
            'paid_amount_gateway' => (int) $this->paid_amount_gateway,
            'display_price_label' => $this->display_price_label,
            'promotional_tickets_granted' => (int) $this->promotional_tickets_granted,
            'status' => $this->status,
            'legal_terms_agreed' => (bool) $this->legal_terms_agreed,
            'expires_at' => $this->expires_at instanceof \Carbon\CarbonInterface
                ? $this->expires_at->toIso8601String()
                : (string) $this->expires_at,
            'created_at' => $this->created_at instanceof \Carbon\CarbonInterface
                ? $this->created_at->toIso8601String()
                : (string) $this->created_at,
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'order_id' => $item->order_id,
                        'course_id' => $item->course_id,
                        'course_part_id' => $item->course_part_id,
                        'item_type' => $item->item_type,
                        'price_cents' => (int) $item->price_cents,
                        'promotional_tickets_granted' => (int) $item->promotional_tickets_granted,
                        'course' => $item->relationLoaded('course') && $item->course ? [
                            'id' => $item->course->id,
                            'title_ar' => $item->course->title_ar,
                            'title_en' => $item->course->title_en,
                            'slug' => $item->course->slug,
                        ] : null,
                        'part' => $item->relationLoaded('part') && $item->part ? [
                            'id' => $item->part->id,
                            'part_number' => $item->part->part_number,
                            'title_ar' => $item->part->title_ar,
                            'title_en' => $item->part->title_en,
                        ] : null,
                    ];
                });
            }),
        ];
    }
}
