<?php

namespace Tests\Feature\Admin;

use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Prize;
use App\Models\Ticket;
use App\Models\User;
use App\Support\AdminCapabilities;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDrawEditingBoundariesTest extends TestCase
{
    use RefreshDatabase;

    public function test_operational_editing_and_boundaries(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $draw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب قبل التعديل',
            'title_en' => 'Draw Before Edit',
            'status' => 'upcoming',
            'is_published' => true,
            'starts_at' => Carbon::now()->addHour(),
            'ends_at' => Carbon::now()->addHours(5),
        ]);

        // 1. Operational edit: update title, broadcast_url, ends_at -> 200
        $newEndsAt = Carbon::now()->addHours(6)->toIso8601String();
        $editResponse = $this->withHeaders($headers)->patchJson("/api/v1/admin/draws/{$draw->id}", [
            'title_en' => 'Draw Updated Title',
            'broadcast_url' => 'https://youtube.com/live/updated',
            'ends_at' => $newEndsAt,
        ]);
        $editResponse->assertStatus(200);
        $editResponse->assertJsonPath('data.title_en', 'Draw Updated Title');
        $editResponse->assertJsonPath('data.broadcast_url', 'https://youtube.com/live/updated');

        // 2. Add prize to draw -> 201
        $prizeResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/draws/{$draw->id}/prizes", [
            'title_ar' => 'سيارة فاخرة',
            'title_en' => 'Luxury Car',
            'category' => 'merchandise',
            'valuation_usd_cents' => 3500000,
        ]);
        $prizeResponse->assertStatus(201);
        $prizeId = $prizeResponse->json('data.id');

        // 3. Update prize -> 200
        $updatePrizeResponse = $this->withHeaders($headers)->patchJson("/api/v1/admin/prizes/{$prizeId}", [
            'title_en' => 'Luxury Electric Car',
        ]);
        $updatePrizeResponse->assertStatus(200);

        // 4. Delete prize when no winner references it -> 200
        $deletePrizeResponse = $this->withHeaders($headers)->deleteJson("/api/v1/admin/prizes/{$prizeId}");
        $deletePrizeResponse->assertStatus(200);
        $this->assertNull(Prize::find($prizeId));

        // 5. Create winner and test winner metadata update
        $winnerUser = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $ticket = Ticket::factory()->create([
            'user_id' => $winnerUser->id,
            'serial_number' => 'KNZ-26-W1NN-EDIT',
        ]);

        $winner = DrawWinner::create([
            'draw_id' => $draw->id,
            'ticket_id' => $ticket->id,
            'user_id' => $winnerUser->id,
            'winning_ticket_serial' => $ticket->serial_number,
            'winner_masked_name' => 'M*** K***',
            'winner_governorate' => 'Basra',
            'drawn_at' => now(),
        ]);

        $winnerEditResponse = $this->withHeaders($headers)->patchJson("/api/v1/admin/draws/{$draw->id}/winner", [
            'prize_delivered' => true,
            'stream_recording_url' => 'https://youtube.com/watch?v=recorded',
        ]);
        $winnerEditResponse->assertStatus(200);
        $this->assertTrue((bool) $winner->fresh()->prize_delivered);
        $this->assertEquals('https://youtube.com/watch?v=recorded', $winner->fresh()->stream_recording_url);

        // 6. Schedule is read-only when canonical winner exists -> 409
        $conflictSchedule = $this->withHeaders($headers)->patchJson("/api/v1/admin/draws/{$draw->id}", [
            'starts_at' => Carbon::now()->addDays(1)->toIso8601String(),
        ]);
        $conflictSchedule->assertStatus(409);
    }
}
