<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'order_id' => Order::factory(),
            'order_ticket_index' => 1,
            'serial_number' => 'KNZ-26-' . Str::upper(Str::random(12)),
            'issued_at' => now(),
        ];
    }
}
