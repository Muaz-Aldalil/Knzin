<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;
    protected User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userA = User::factory()->create([
            'email' => 'userA@example.com',
            'display_name' => 'User Alpha',
        ]);

        $this->userB = User::factory()->create([
            'email' => 'userB@example.com',
            'display_name' => 'User Beta',
        ]);
    }

    private function createNotification(User $user, array $overrides = []): string
    {
        $id = (string) Str::uuid();

        $data = array_merge([
            'category' => 'transactional',
            'title_ar' => 'إشعار تجريبي',
            'title_en' => 'Test Notification',
            'body_ar' => 'محتوى الإشعار التجريبي.',
            'body_en' => 'Test notification body content.',
            'action_type' => 'navigate',
            'action_url' => '/dashboard',
            'entity_type' => 'order',
            'entity_id' => (string) Str::uuid(),
            'metadata' => ['test' => true],
        ], $overrides);

        \Illuminate\Support\Facades\DB::table('notifications')->insert([
            'id' => $id,
            'type' => 'App\Notifications\OrderConfirmationNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => json_encode($data),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/notifications');
        $response->assertStatus(401);

        $countResponse = $this->getJson('/api/v1/notifications/unread-count');
        $countResponse->assertStatus(401);
    }

    public function test_user_can_fetch_paginated_notifications(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->createNotification($this->userA, ['title_en' => "Notification {$i}"]);
        }

        // Notification belonging to another user must never appear
        $this->createNotification($this->userB, ['title_en' => 'User B Notification']);

        $response = $this->actingAs($this->userA)
            ->withHeader('X-Locale', 'en')
            ->getJson('/api/v1/notifications?per_page=10');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonCount(5, 'data');

        $titles = collect($response->json('data'))->pluck('title')->toArray();
        $this->assertContains('Notification 0', $titles);
        $this->assertNotContains('User B Notification', $titles);
    }

    public function test_unread_count_returns_accurate_number(): void
    {
        $id1 = $this->createNotification($this->userA);
        $id2 = $this->createNotification($this->userA);
        $id3 = $this->createNotification($this->userA);

        $response = $this->actingAs($this->userA)->getJson('/api/v1/notifications/unread-count');
        $response->assertStatus(200)->assertJsonPath('data.unread_count', 3);

        // Mark one as read
        \Illuminate\Support\Facades\DB::table('notifications')
            ->where('id', $id1)
            ->update(['read_at' => now()]);

        $response2 = $this->actingAs($this->userA)->getJson('/api/v1/notifications/unread-count');
        $response2->assertStatus(200)->assertJsonPath('data.unread_count', 2);
    }

    public function test_mark_as_read_mutation_succeeds_and_updates_state(): void
    {
        $id = $this->createNotification($this->userA);

        $response = $this->actingAs($this->userA)
            ->patchJson("/api/v1/notifications/{$id}/read");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.is_read', true);

        $this->assertDatabaseMissing('notifications', [
            'id' => $id,
            'read_at' => null,
        ]);
    }

    public function test_idor_protection_cross_user_returns_404(): void
    {
        // Notification belongs to User B
        $idB = $this->createNotification($this->userB);

        // User A attempts to mark User B's notification as read
        $response = $this->actingAs($this->userA)
            ->patchJson("/api/v1/notifications/{$idB}/read");

        $response->assertStatus(404)
            ->assertJsonPath('status', 'fail')
            ->assertJsonPath('message', 'Notification not found.');
    }

    public function test_mark_all_as_read_clears_unread_status_for_user(): void
    {
        $id1 = $this->createNotification($this->userA);
        $id2 = $this->createNotification($this->userA);
        $idB = $this->createNotification($this->userB);

        $response = $this->actingAs($this->userA)
            ->postJson('/api/v1/notifications/mark-all-read');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // User A unread count is now 0
        $this->assertEquals(0, $this->userA->unreadNotifications()->count());

        // User B notification remains unread
        $this->assertEquals(1, $this->userB->unreadNotifications()->count());
    }
}
