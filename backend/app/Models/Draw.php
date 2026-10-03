<?php

namespace App\Models;

use App\Exceptions\ProtectedFieldException;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'is_published',
        'published_at',
        'published_by_user_id',
        'starts_at',
        'ends_at',
        'broadcast_url',
        'total_eligible_tickets',
        'server_seed_hash',
        'server_seed_encrypted',
        'server_seed_revealed',
        'seed_committed_at',
        'seed_revealed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'server_seed_encrypted',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'seed_committed_at' => 'datetime',
            'seed_revealed_at' => 'datetime',
            'total_eligible_tickets' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (Draw $draw) {
            if ($draw->isDirty(['server_seed_hash', 'server_seed_encrypted', 'seed_committed_at'])) {
                $originalHash = $draw->getOriginal('server_seed_hash');
                if ($originalHash !== null) {
                    throw new ProtectedFieldException('Seed commitment fields are strictly immutable once set.');
                }
            }
        });
    }

    /**
     * Scope for published draws only (excluding private drafts).
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
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
     * Administrator who published this draw.
     */
    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by_user_id');
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
     * Computes the dynamic effective status:
     * - completed -> completed
     * - ends_at <= now -> locked
     * - stored upcoming + published + starts_at <= now < ends_at -> active
     * - otherwise stored status
     */
    public function computeEffectiveStatus(): string
    {
        if ($this->status === 'completed') {
            return 'completed';
        }

        $now = Carbon::now();

        if ($this->ends_at && $now->greaterThanOrEqualTo($this->ends_at)) {
            return 'locked';
        }

        if ($this->status === 'upcoming' && $this->is_published && $this->starts_at && $this->starts_at->lessThanOrEqualTo($now)) {
            return 'active';
        }

        return $this->status;
    }
}
