<?php

namespace Database\Factories;

use App\Models\Draw;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Draw>
 */
class DrawFactory extends Factory
{
    protected $model = Draw::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب يومي اختباري',
            'title_en' => 'Test Daily Draw',
            'status' => 'upcoming',
            'is_published' => false,
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addDays(2),
            'broadcast_url' => null,
            'total_eligible_tickets' => 0,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
            'published_at' => now(),
        ]);
    }
}
