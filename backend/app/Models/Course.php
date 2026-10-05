<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'slug',
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'cover_image_url',
        'bundle_price_cents',
        'bundle_promotional_tickets',
        'display_price_label',
        'is_active',
        'outcomes',
        'curriculum_summary_ar',
        'curriculum_summary_en',
        'content_version',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'bundle_price_cents' => 'integer',
            'bundle_promotional_tickets' => 'integer',
            'is_active' => 'boolean',
            'outcomes' => 'array',
            'content_version' => 'integer',
        ];
    }

    /**
     * Get all modular parts for this course.
     */
    public function parts(): HasMany
    {
        return $this->hasMany(CoursePart::class)->orderBy('part_number', 'asc');
    }

    /**
     * Get all order items for this course.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
