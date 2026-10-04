<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_number',
        'user_id',
        'total_amount_cents',
        'currency',
        'exchange_rate',
        'paid_amount_gateway',
        'display_price_label',
        'promotional_tickets_granted',
        'status',
        'tickets_status',
        'tickets_minted_at',
        'idempotency_key',
        'legal_terms_agreed',
        'terms_agreed_ip',
        'terms_agreed_at',
        'quiz_answers',
        'quiz_completed_at',
        'expires_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount_cents' => 'integer',
            'exchange_rate' => 'decimal:4',
            'paid_amount_gateway' => 'integer',
            'promotional_tickets_granted' => 'integer',
            'tickets_minted_at' => 'datetime',
            'legal_terms_agreed' => 'boolean',
            'terms_agreed_at' => 'datetime',
            'quiz_answers' => 'array',
            'quiz_completed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Get the user who placed this order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all line items for this order.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get all course entitlements granted by this order.
     */
    public function courseEntitlements(): HasMany
    {
        return $this->hasMany(CourseEntitlement::class);
    }

    /**
     * Get all promotional tickets minted for this order.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Check if order is expired.
     */
    public function isExpired(): bool
    {
        return $this->status === 'pending' && $this->expires_at->isPast();
    }

    /**
     * Referral attribution record for this order (if referred).
     */
    public function referralAttribution(): HasOne
    {
        return $this->hasOne(ReferralAttribution::class);
    }

    /**
     * Affiliate ledger entries minted or reversed for this order.
     */
    public function affiliateLedgerEntries(): HasMany
    {
        return $this->hasMany(AffiliateLedgerEntry::class);
    }

    /**
     * Payment transaction attempts for this order (1:N multi-attempt continuity).
     */
    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    /**
     * Latest payment transaction for this order.
     */
    public function latestPaymentTransaction(): HasOne
    {
        return $this->hasOne(PaymentTransaction::class)->latestOfMany();
    }
}

