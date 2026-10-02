<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminCapability extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'admin_capabilities';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'capability',
        'status',
        'provisioning_source',
        'granted_at',
        'granted_by_user_id',
        'revoked_at',
        'revoked_by_user_id',
        'revocation_reason',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /**
     * Scope query to only active, non-revoked capabilities.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')->whereNull('revoked_at');
    }

    /**
     * User owning this admin capability.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Admin user who granted this capability.
     */
    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by_user_id');
    }

    /**
     * Admin user who revoked this capability.
     */
    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by_user_id');
    }

    /**
     * Revoke this capability with provenance.
     */
    public function revoke(?User $revokedBy = null, ?string $reason = null): bool
    {
        $this->status = 'revoked';
        $this->revoked_at = now();
        $this->revoked_by_user_id = $revokedBy?->id;
        $this->revocation_reason = $reason;
        return $this->save();
    }
}
