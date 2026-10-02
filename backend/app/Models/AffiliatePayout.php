<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliatePayout extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'affiliate_payouts';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'payout_number',
        'user_id',
        'amount_cents',
        'threshold_cents_at_request',
        'amount_iqd',
        'payout_method',
        'recipient_details',
        'status',
        'admin_reference_number',
        'admin_notes',
        'processed_by_admin_id',
        'processed_at',
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
            'threshold_cents_at_request' => 'integer',
            'amount_iqd' => 'integer',
            'recipient_details' => 'encrypted:json',
            'processed_at' => 'datetime',
        ];
    }

    /**
     * User who requested the payout.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Admin user who processed the payout.
     */
    public function processedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_admin_id');
    }

    /**
     * Associated ledger entries (e.g. payout_debit, reversal_credit).
     */
    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(AffiliateLedgerEntry::class, 'payout_id');
    }

    /**
     * Transition payout status to processing.
     */
    public function markProcessing(): bool
    {
        if ($this->status !== 'requested') {
            return false;
        }

        $this->status = 'processing';
        return $this->save();
    }

    /**
     * Transition payout status to completed with admin reference.
     */
    public function markCompleted(string $adminReferenceNumber, ?string $adminId = null, ?string $adminNotes = null): bool
    {
        if (!in_array($this->status, ['requested', 'processing'], true)) {
            return false;
        }

        $this->status = 'completed';
        $this->admin_reference_number = $adminReferenceNumber;
        $this->processed_by_admin_id = $adminId;
        $this->processed_at = now();

        if ($adminNotes !== null) {
            $this->admin_notes = $adminNotes;
        }

        return $this->save();
    }

    /**
     * Transition payout status to rejected.
     */
    public function markRejected(string $reason, ?string $adminId = null): bool
    {
        if (!in_array($this->status, ['requested', 'processing'], true)) {
            return false;
        }

        $this->status = 'rejected';
        $this->admin_notes = $reason;
        $this->processed_by_admin_id = $adminId;
        $this->processed_at = now();

        return $this->save();
    }
}
