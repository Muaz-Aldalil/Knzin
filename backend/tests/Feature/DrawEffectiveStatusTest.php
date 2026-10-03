<?php

namespace Tests\Feature;

use App\Models\Draw;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DrawEffectiveStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_dynamic_effective_status_derivation(): void
    {
        $now = Carbon::now();

        // 1. In-window published draw derives 'active'
        $activeDraw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب نشط',
            'title_en' => 'Active Draw',
            'status' => 'upcoming',
            'is_published' => true,
            'starts_at' => $now->copy()->subMinutes(10),
            'ends_at' => $now->copy()->addMinutes(30),
        ]);
        $this->assertEquals('active', $activeDraw->computeEffectiveStatus());

        // 2. Future draw derives 'upcoming'
        $futureDraw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب قادم',
            'title_en' => 'Upcoming Draw',
            'status' => 'upcoming',
            'is_published' => true,
            'starts_at' => $now->copy()->addHour(),
            'ends_at' => $now->copy()->addHours(2),
        ]);
        $this->assertEquals('upcoming', $futureDraw->computeEffectiveStatus());

        // 3. Past ends_at not completed derives 'locked'
        $lockedDraw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب مغلق',
            'title_en' => 'Locked Draw',
            'status' => 'upcoming',
            'is_published' => true,
            'starts_at' => $now->copy()->subHours(2),
            'ends_at' => $now->copy()->subMinute(),
        ]);
        $this->assertEquals('locked', $lockedDraw->computeEffectiveStatus());

        // 4. Stored completed derives 'completed'
        $completedDraw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب مكتمل',
            'title_en' => 'Completed Draw',
            'status' => 'completed',
            'is_published' => true,
            'starts_at' => $now->copy()->subDays(2),
            'ends_at' => $now->copy()->subDay(),
        ]);
        $this->assertEquals('completed', $completedDraw->computeEffectiveStatus());
    }
}
