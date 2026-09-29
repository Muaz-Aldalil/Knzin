<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prize extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'draw_id',
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'category',
        'valuation_usd_cents',
        'display_iqd_label',
        'image_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valuation_usd_cents' => 'integer',
        ];
    }

    /**
     * The draw associated with this prize.
     */
    public function draw(): BelongsTo
    {
        return $this->belongsTo(Draw::class);
    }

    /**
     * Format valuation in USD decimal representation for display.
     */
    public function getValuationUsdAttribute(): float
    {
        return round($this->valuation_usd_cents / 100, 2);
    }
}
