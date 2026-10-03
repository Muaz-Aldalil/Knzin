<?php

namespace Tests\Feature\Admin;

use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Ticket;
use App\Models\User;
use App\Support\AdminCapabilities;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDrawLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_draw_draft_creation_publishing_and_completion_with_winner(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // 1. Create private draft
        $startsAt = Carbon::now()->addDays(2)->toIso8601String();
        $endsAt = Carbon::now()->addDays(5)->toIso8601String();

        $createResponse = $this->withHeaders($headers)->postJson('/api/v1/admin/draws', [
            'tier' => 'monthly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب الذهب التجريبي',
            'title_en' => 'Test Gold Promotional Draw',
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'broadcast_url' => 'https://youtube.com/live/test',
        ]);

        $createResponse->assertStatus(201);
        $createResponse->assertJsonPath('data.is_published', false);
        $createResponse->assertJsonPath('data.stage', 'draft');
        $createResponse->assertJsonPath('data.status', 'upcoming');

        $drawId = $createResponse->json('data.id');

        // 2. Publish draft with cryptographic seed pre-commitment
        $publishResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/draws/{$drawId}/publish");
        $publishResponse->assertStatus(200);
        $publishResponse->assertJsonPath('data.is_published', true);
        $this->assertNotNull($publishResponse->json('data.seed_commitment.server_seed_hash'));

        // 3. Attempt completion without canonical winner record -> 409 ERR_CANONICAL_RESULT_MISSING
        $prematureComplete = $this->withHeaders($headers)->postJson("/api/v1/admin/draws/{$drawId}/complete");
        $prematureComplete->assertStatus(409);
        $prematureComplete->assertJsonPath('code', 'ERR_STATE_CONFLICT');

        // 4. Create canonical winner record
        $winnerUser = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $ticket = Ticket::factory()->create([
            'user_id' => $winnerUser->id,
            'serial_number' => 'KNZ-26-W1NN-GOLD',
        ]);

        DrawWinner::create([
            'draw_id' => $drawId,
            'ticket_id' => $ticket->id,
            'user_id' => $winnerUser->id,
            'winning_ticket_serial' => $ticket->serial_number,
            'winner_masked_name' => 'F*** H***',
            'winner_governorate' => 'Erbil',
            'drawn_at' => now(),
        ]);

        // 5. Complete draw -> stored completed and seed revealed
        $completeResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/draws/{$drawId}/complete");
        $completeResponse->assertStatus(200);
        $completeResponse->assertJsonPath('data.status', 'completed');
        $completeResponse->assertJsonPath('data.stage', 'completed');
        $this->assertNotNull($completeResponse->json('data.seed_verification.server_seed_revealed'));

        // 6. Idempotent replay: already completed -> 200
        $replayComplete = $this->withHeaders($headers)->postJson("/api/v1/admin/draws/{$drawId}/complete");
        $replayComplete->assertStatus(200);
    }
}
