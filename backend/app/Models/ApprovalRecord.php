<?php

namespace App\Models;

use App\Exceptions\UnauthorizedApprovalWriteException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalRecord extends Model
{
    use HasFactory;

    /**
     * Re-entrancy write authorization flag. Writes are ONLY permitted within ApprovalRegistryService.
     */
    private static bool $writePermitted = false;

    /**
     * Execute a closure within an authorized approval write context.
     */
    public static function permitWrite(callable $callback): mixed
    {
        $previous = self::$writePermitted;
        self::$writePermitted = true;
        try {
            return $callback();
        } finally {
            self::$writePermitted = $previous;
        }
    }

    /**
     * Bootstrap model events to strictly enforce trusted application boundary.
     */
    protected static function booted(): void
    {
        static::creating(function (ApprovalRecord $model) {
            if (!self::$writePermitted) {
                throw new UnauthorizedApprovalWriteException(
                    'Direct creation of ApprovalRecord outside the trusted ApprovalRegistryService boundary is strictly forbidden.'
                );
            }
        });

        static::updating(function (ApprovalRecord $model) {
            if (!self::$writePermitted) {
                throw new UnauthorizedApprovalWriteException(
                    'Direct update of ApprovalRecord outside the trusted ApprovalRegistryService boundary is strictly forbidden.'
                );
            }
        });

        static::deleting(function (ApprovalRecord $model) {
            if (!self::$writePermitted) {
                throw new UnauthorizedApprovalWriteException(
                    'Direct deletion of ApprovalRecord is strictly forbidden.'
                );
            }
        });
    }

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'approval_records';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'approval_id',
        'approval_type',
        'subject_type',
        'subject_id',
        'status',
        'approved_at',
        'approved_by',
        'source',
        'version',
        'revoked_at',
        'revoked_by',
        'revocation_reason',
        'superseded_at',
        'superseded_by_approval_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'revoked_at' => 'datetime',
            'superseded_at' => 'datetime',
            'version' => 'integer',
        ];
    }

    /**
     * Scope query to valid, non-revoked, non-superseded approved records.
     */
    public function scopeFresh(Builder $query): Builder
    {
        return $query->where('status', 'approved')
            ->whereNotNull('approved_at')
            ->whereNull('revoked_at')
            ->whereNull('superseded_at');
    }

    /**
     * State/Version-based freshness check.
     */
    public function isFresh(): bool
    {
        return $this->status === 'approved'
            && $this->approved_at !== null
            && $this->revoked_at === null
            && $this->superseded_at === null;
    }
}

