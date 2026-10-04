<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentWebhook extends Model
{
    use HasFactory;

    protected $fillable = [
        'gateway',
        'event_type',
        'idempotency_key',
        'payload',
        'headers',
        'signature_verified',
        'processed',
        'error_message',
        'ip_hash',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'headers' => 'array',
            'signature_verified' => 'boolean',
            'processed' => 'boolean',
        ];
    }
}
