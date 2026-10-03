<?php

namespace Tests\Feature\Admin;

use App\Models\Draw;
use App\Models\User;
use App\Support\AdminCapabilities;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDrawSeedCommitmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_commitment_immutability_and_masking(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // 1. Create and publish draw
        $draw = Draw::create([
            'tier' => 'daily',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب يومي',
            'title_en' => 'Daily Draw',
            'status' => 'upcoming',
            'is_published' => false,
            'starts_at' => Carbon::now()->addDay(),
            'ends_at' => Carbon::now()->addDays(2),
        ]);

        $this->withHeaders($headers)->postJson("/api/v1/admin/draws/{$draw->id}/publish")->assertStatus(200);
        $publishedDraw = $draw->fresh();

        $originalHash = $publishedDraw->server_seed_hash;
        $this->assertNotNull($originalHash);

        // 2. Attempt to tamper with server_seed_hash via PATCH -> 422 ERR_PROTECTED_FIELD
        $tamperResponse = $this->withHeaders($headers)->patchJson("/api/v1/admin/draws/{$draw->id}", [
            'server_seed_hash' => 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        ]);
        $tamperResponse->assertStatus(422);

        // 3. API response never exposes server_seed_encrypted
        $getResponse = $this->withHeaders($headers)->getJson("/api/v1/admin/draws/{$draw->id}");
        $getResponse->assertStatus(200);
        $this->assertArrayNotHasKey('server_seed_encrypted', $getResponse->json('data'));
    }

    public function test_cannot_publish_draw_if_starts_at_has_passed(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;

        $pastDraw = Draw::create([
            'tier' => 'hourly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب منتهي التوقيت',
            'title_en' => 'Expired Schedule Draw',
            'status' => 'upcoming',
            'is_published' => false,
            'starts_at' => Carbon::now()->subMinutes(10),
            'ends_at' => Carbon::now()->addHour(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/draws/{$pastDraw->id}/publish");

        $response->assertStatus(409);
    }
}
