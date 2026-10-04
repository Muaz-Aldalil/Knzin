<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'cover_image_url' => $this->cover_image_url,
            'bundle_price_cents' => (int) $this->bundle_price_cents,
            'bundle_promotional_tickets' => (int) $this->bundle_promotional_tickets,
            'display_price_label' => $this->display_price_label,
            'is_active' => (bool) $this->is_active,
            'outcomes' => $this->outcomes,
            'curriculum_summary_ar' => $this->curriculum_summary_ar,
            'curriculum_summary_en' => $this->curriculum_summary_en,
            'parts_count' => $this->parts_count ?? ($this->relationLoaded('parts') ? $this->parts->count() : 0),
            'parts' => CoursePartResource::collection($this->whenLoaded('parts')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
