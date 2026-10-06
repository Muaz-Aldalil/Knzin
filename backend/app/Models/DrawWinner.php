<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrawWinner extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'draw_id',
        'prize_id',
        'winning_ticket_serial',
        'winner_masked_name',
        'winner_governorate',
        'prize_delivered',
        'stream_recording_url',
        'drawn_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'prize_delivered' => 'boolean',
            'drawn_at' => 'datetime',
        ];
    }

    /**
     * The draw won by this participant.
     */
    public function draw(): BelongsTo
    {
        return $this->belongsTo(Draw::class);
    }

    /**
     * The prize won by this participant.
     */
    public function prize(): BelongsTo
    {
        return $this->belongsTo(Prize::class);
    }

    /**
     * The canonical winning ticket associated with this winner record.
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'winning_ticket_serial', 'serial_number');
    }
}
