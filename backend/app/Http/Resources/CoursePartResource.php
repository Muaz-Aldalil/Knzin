<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoursePartResource extends JsonResource
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
            'course_id' => $this->course_id,
            'part_number' => (int) $this->part_number,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'syllabus_ar' => $this->syllabus_ar,
            'syllabus_en' => $this->syllabus_en,
            'part_price_cents' => (int) $this->part_price_cents,
            'part_promotional_tickets' => (int) $this->part_promotional_tickets,
            'display_price_label' => $this->display_price_label,
            'resource_types' => $this->resource_types ?? ['video', 'pdf'],
            'duration_minutes' => (int) $this->duration_minutes,
            'is_free' => (bool) ($this->is_free ?? ($this->part_number === 1)),
            'is_active' => (bool) $this->is_active,
            'video_url' => $this->video_url,
            'pdf_url' => $this->pdf_url,
            'pdf_title_ar' => $this->pdf_title_ar,
            'pdf_title_en' => $this->pdf_title_en,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
