<?php

namespace App\Models;

use App\Exceptions\ImmutableLedgerException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateLedgerEntry extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'affiliate_ledger_entries';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'order_id',
        'payout_id',
        'entry_type',
        'amount_cents',
        'currency',
        'status',
        'funding_source',
        'metadata',
        'matures_at',
        'idempotency_key',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'matures_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Bootstrap model events to enforce strict append-only financial immutability.
     */
    protected static function booted(): void
    {
        static::updating(function (AffiliateLedgerEntry $entry) {
            $immutableFields = [
                'user_id',
                'order_id',
                'payout_id',
                'entry_type',
                'amount_cents',
                'currency',
                'funding_source',
                'idempotency_key',
                'metadata',
                'created_at',
            ];

            foreach ($immutableFields as $field) {
                if ($entry->isDirty($field)) {
                    throw new ImmutableLedgerException(
                        "Affiliate ledger financial figures are immutable. Cannot modify amount_cents, currency, or idempotency_key. Field [{$field}] cannot be modified on entry ID {$entry->id}."
                    );
                }
            }
        });

        static::deleting(function (AffiliateLedgerEntry $entry) {
            throw new ImmutableLedgerException(
                "Affiliate ledger is strictly append-only. Cannot delete entry ID {$entry->id}."
            );
        });
    }

    /**
     * User owning this ledger entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Associated order (for sales_commission or reversal).
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Associated payout (for payout_debit or rejection reversal).
     */
    public function payout(): BelongsTo
    {
        return $this->belongsTo(AffiliatePayout::class, 'payout_id');
    }

    /**
     * Scope query to mature entries eligible for available balance.
     * Includes mature credits (cleared/available or matured past hold) and active debits.
     */
    public function scopeMatureAvailable(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            // Mature credits
            $q->where(function (Builder $credits) {
                $credits->whereIn('entry_type', ['sales_commission', 'co_prize_credit', 'reversal_credit'])
                    ->where(function (Builder $status) {
                        $status->whereIn('status', ['available', 'cleared'])
                            ->orWhere(function (Builder $maturePending) {
                                $maturePending->where('status', 'pending')
                                    ->whereNotNull('matures_at')
                                    ->where('matures_at', '<=', now());
                            });
                    });
            })
            // Debits that have not been cancelled
            ->orWhere(function (Builder $debits) {
                $debits->whereIn('entry_type', ['payout_debit', 'reversal_debit'])
                    ->where('status', '!=', 'cancelled');
            });
        });
    }

    /**
     * Scope query to entries currently in maturation or KYC hold.
     */
    public function scopePendingHold(Builder $query): Builder
    {
        return $query->where('status', 'pending')
            ->where(function (Builder $q) {
                $q->whereNull('matures_at')
                    ->orWhere('matures_at', '>', now());
            });
    }
}
