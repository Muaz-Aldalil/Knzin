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
        ];
    }
}
