<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Draw extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tier',
        'execution_type',
        'title_ar',
        'title_en',
        'status',
        'starts_at',
        'ends_at',
        'broadcast_url',
        'total_eligible_tickets',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'total_eligible_tickets' => 'integer',
        ];
    }

    /**
     * Primary prize for this draw.
     */
    public function prize(): HasOne
    {
        return $this->hasOne(Prize::class);
    }

    /**
     * All prizes attached to this draw.
     */
    public function prizes(): HasMany
    {
        return $this->hasMany(Prize::class);
    }

    /**
     * Verified winner record for this draw.
     */
    public function winner(): HasOne
    {
        return $this->hasOne(DrawWinner::class);
    }

    /**
     * Scope for active draws.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for upcoming draws.
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('status', 'upcoming');
    }

    /**
     * Scope for locked draws.
     */
    public function scopeLocked(Builder $query): Builder
    {
        return $query->where('status', 'locked');
    }

    /**
     * Scope for concluded completed draws.
     */
    public function scopeConcluded(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for draws within the active/rolling window for real-time display.
     * Prevents post-deadline black-hole disappearance before conclusion (DEF-04B).
     */
    public function scopeRollingWindow(Builder $query): Builder
    {
        $now = Carbon::now();
        return $query->where('starts_at', '<=', $now)
            ->where('status', '!=', 'completed');
    }

    /**
     * Scope filtering by draw tier.
     */
    public function scopeTier(Builder $query, string $tier): Builder
    {
        return $query->where('tier', $tier);
    }

    /**
     * Computes the dynamic locked state when ends_at <= now().
     */
    public function computeEffectiveStatus(): string
    {
        if ($this->status === 'completed') {
            return 'completed';
        }

        if ($this->ends_at && Carbon::now()->greaterThanOrEqualTo($this->ends_at)) {
            return 'locked';
        }

        return $this->status;
    }
}
