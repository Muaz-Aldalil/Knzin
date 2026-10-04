<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CoursePart extends Model
{
    use HasFactory, HasUuids;

    protected $attributes = [
        'resource_types' => '["video","pdf"]',
        'is_active' => true,
        'is_free' => false,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'part_number',
        'title_ar',
        'title_en',
        'syllabus_ar',
        'syllabus_en',
        'part_price_cents',
        'part_promotional_tickets',
        'display_price_label',
        'resource_types',
        'duration_minutes',
        'is_active',
        'is_free',
        'video_url',
        'pdf_url',
        'pdf_title_ar',
        'pdf_title_en',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'part_number' => 'integer',
            'part_price_cents' => 'integer',
            'part_promotional_tickets' => 'integer',
            'resource_types' => 'array',
            'duration_minutes' => 'integer',
            'is_active' => 'boolean',
            'is_free' => 'boolean',
        ];
    }

    /**
     * Get the course that owns this part.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get all order items for this part.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
