<?php

namespace Tests\Feature;

use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicDrawVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_drafts_are_excluded_from_all_four_public_consumers(): void
    {
        $now = Carbon::now();

        // Create private draft draw
        $draftDraw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'مسودة خاصة مخفية',
            'title_en' => 'Hidden Private Draft Draw',
            'status' => 'upcoming',
            'is_published' => false,
            'starts_at' => $now->copy()->subMinute(),
            'ends_at' => $now->copy()->addHour(),
        ]);

        // Create published active draw
        $publishedDraw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب عام معلن',
            'title_en' => 'Public Announced Draw',
            'status' => 'upcoming',
            'is_published' => true,
            'starts_at' => $now->copy()->subMinute(),
            'ends_at' => $now->copy()->addHour(),
        ]);

        // 1. Consumer 1: GET /api/v1/draws/active
        $activeResponse = $this->getJson('/api/v1/draws/active');
        $activeResponse->assertStatus(200);
        $activeIds = collect($activeResponse->json('data.draws'))->pluck('id')->all();
        $this->assertContains((string) $publishedDraw->id, $activeIds);
        $this->assertNotContains((string) $draftDraw->id, $activeIds);

        // 2. Consumer 2: GET /api/v1/draws/concluded (with a winner)
        $publishedConcluded = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب منتهي منشور',
            'title_en' => 'Published Concluded',
            'status' => 'completed',
            'is_published' => true,
            'starts_at' => $now->copy()->subDays(2),
            'ends_at' => $now->copy()->subDay(),
        ]);
        $user = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $ticket = Ticket::factory()->create([
            'user_id' => $user->id,
            'serial_number' => 'KNZ-26-TEST-DRAFT',
        ]);
        DrawWinner::create([
            'draw_id' => $publishedConcluded->id,
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'winning_ticket_serial' => $ticket->serial_number,
            'winner_masked_name' => 'A*** M***',
            'winner_governorate' => 'Baghdad',
            'drawn_at' => now(),
        ]);

        $concludedResponse = $this->getJson('/api/v1/draws/concluded');
        $concludedResponse->assertStatus(200);
        $concludedIds = collect($concludedResponse->json('data.draws'))->pluck('id')->all();
        $this->assertContains((string) $publishedConcluded->id, $concludedIds);
        $this->assertNotContains((string) $draftDraw->id, $concludedIds);

        // 3. Consumer 3: GET /api/v1/user/tickets
        $token = $user->createToken('user_token')->plainTextToken;
        $ticketsResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/user/tickets');
        $ticketsResponse->assertStatus(200);
        $activeTiers = $ticketsResponse->json('data.active_draws');
        $this->assertEquals((string) $publishedDraw->id, $activeTiers['daily']['id'] ?? null);

        // 4. Consumer 4: GET /api/v1/activity/recent
        $activityResponse = $this->getJson('/api/v1/activity/recent');
        $activityResponse->assertStatus(200);
        $activityEvents = $activityResponse->json('data.events');
        $eventDrawIds = collect($activityEvents)
            ->filter(fn ($e) => ($e['type'] ?? '') === 'promotional_draw')
            ->pluck('draw_id')
            ->all();
        $this->assertNotContains((string) $draftDraw->id, $eventDrawIds);
    }
}
