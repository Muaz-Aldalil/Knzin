<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketSequence extends Model
{
    protected $primaryKey = 'year';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'year',
        'current_sequence',
        'updated_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'current_sequence' => 'integer',
            'updated_at' => 'datetime',
        ];
    }
}
