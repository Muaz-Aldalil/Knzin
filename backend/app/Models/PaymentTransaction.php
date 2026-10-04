<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'gateway',
        'gateway_transaction_id',
        'amount_iqd',
        'currency',
        'status',
        'checkout_url',
        'gateway_response',
        'attempt_number',
        'expires_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_iqd' => 'integer',
            'attempt_number' => 'integer',
            'gateway_response' => 'array',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, ['success', 'failed', 'expired', 'duplicate_charge_flagged'], true);
    }
}
