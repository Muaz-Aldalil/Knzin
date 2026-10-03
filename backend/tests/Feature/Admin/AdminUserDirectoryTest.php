<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_directory_lookup_and_minimum_search_validation(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $user1 = User::factory()->create([
            'email' => 'ahmed.ali@example.com',
            'learner_code' => 'LRN-AHMED1',
            'status' => 'active',
            'auth_provider' => 'google',
        ]);
        $user1->grantCapability(AdminCapabilities::ISSUE_KYC_APPROVAL, $admin, 'delegated_admin');

        // 1. Search with less than 3 chars -> 422
        $shortSearch = $this->withHeaders($headers)->getJson('/api/v1/admin/users?search=ah');
        $shortSearch->assertStatus(422);

        // 2. Search by email prefix -> 200
        $emailSearch = $this->withHeaders($headers)->getJson('/api/v1/admin/users?search=ahmed');
        $emailSearch->assertStatus(200);
        $emailSearch->assertJsonPath('data.items.0.id', $user1->id);
        $emailSearch->assertJsonPath('data.items.0.active_capabilities.0', AdminCapabilities::ISSUE_KYC_APPROVAL);

        // 3. Search by learner code -> 200
        $codeSearch = $this->withHeaders($headers)->getJson("/api/v1/admin/users?search={$user1->learner_code}");
        $codeSearch->assertStatus(200);
        $codeSearch->assertJsonPath('data.items.0.id', $user1->id);

        // 4. Search by exact UUID -> 200
        $uuidSearch = $this->withHeaders($headers)->getJson("/api/v1/admin/users?search={$user1->id}");
        $uuidSearch->assertStatus(200);
        $uuidSearch->assertJsonPath('data.items.0.id', $user1->id);
    }
}
