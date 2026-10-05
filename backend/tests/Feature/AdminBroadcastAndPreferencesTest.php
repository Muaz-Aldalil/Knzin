<?php

namespace Tests\Feature;

use App\Models\AdminBroadcast;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\AdminBroadcastNotification;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class AdminBroadcastAndPreferencesTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $optedOutUser;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'regular@example.com',
            'display_name' => 'Regular Learner',
        ]);

        $this->optedOutUser = User::factory()->create([
            'email' => 'optedout@example.com',
            'display_name' => 'Opted Out User',
        ]);

        NotificationPreference::create([
            'id' => (string) Str::uuid(),
            'user_id' => $this->optedOutUser->id,
            'course_announcements' => true,
            'prize_draw_promotions' => true,
            'admin_broadcasts' => false,
        ]);

        $this->admin = User::factory()->create([
            'email' => 'platformadmin@example.com',
            'display_name' => 'Platform Admin',
            'status' => 'active',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
        ]);
        $this->admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
    }

    public function test_get_preferences_returns_default_toggles_for_authenticated_user(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/notifications/preferences');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'course_announcements' => true,
                    'prize_draw_promotions' => true,
                    'admin_broadcasts' => true,
                    'is_unsubscribed_from_all' => false,
                ],
            ]);
    }

    public function test_update_preferences_persists_marketing_toggles(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson('/api/v1/notifications/preferences', [
            'course_announcements' => false,
            'admin_broadcasts' => false,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'course_announcements' => false,
                    'prize_draw_promotions' => true,
                    'admin_broadcasts' => false,
                    'is_unsubscribed_from_all' => false,
                ],
            ]);

        $pref = NotificationPreference::where('user_id', $this->user->id)->first();
        $this->assertFalse((bool) $pref->course_announcements);
        $this->assertTrue((bool) $pref->prize_draw_promotions);
        $this->assertFalse((bool) $pref->admin_broadcasts);
    }

    public function test_signed_unsubscribe_rejects_tampered_or_invalid_signature(): void
    {
        $response = $this->getJson('/api/v1/notifications/unsubscribe?user=' . $this->user->id . '&signature=invalidsig');

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'fail',
                'code' => 'ERR_INVALID_SIGNATURE',
            ]);
    }

    public function test_signed_unsubscribe_sets_preferences_with_valid_signature(): void
    {
        $signedUrl = URL::signedRoute('api.v1.notifications.unsubscribe', [
            'user' => $this->user->id,
            'category' => 'all',
        ]);

        $response = $this->getJson($signedUrl);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'message' => 'Successfully unsubscribed from marketing communications.',
                ],
            ]);

        $pref = NotificationPreference::where('user_id', $this->user->id)->first();
        $this->assertNotNull($pref->unsubscribed_at);
        $this->assertFalse((bool) $pref->course_announcements);
        $this->assertFalse((bool) $pref->prize_draw_promotions);
        $this->assertFalse((bool) $pref->admin_broadcasts);
    }

    public function test_admin_broadcast_requires_manage_platform_settings_capability(): void
    {
        Sanctum::actingAs($this->user); // Regular user lacking capability

        $response = $this->postJson('/api/v1/admin/notifications/broadcast', [
            'title_ar' => 'إعلان هام',
            'title_en' => 'Important Announcement',
            'body_ar' => 'نص الإعلان',
            'body_en' => 'Announcement body',
            'channels' => ['in_app', 'email'],
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_broadcast_dispatches_notifications_respecting_user_preferences(): void
    {
        Notification::fake();
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/admin/notifications/broadcast', [
            'title_ar' => 'تحديث منصة كنزين السنوي',
            'title_en' => 'Annual KNZiN Platform Update',
            'body_ar' => 'يسرنا إطلاق الميزات الجديدة وتحديث واجهات التعليم.',
            'body_en' => 'We are excited to launch new learning features.',
            'channels' => ['in_app', 'email'],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
            ]);

        $broadcastId = $response->json('data.broadcast_id');
        $this->assertNotNull($broadcastId);

        $broadcast = AdminBroadcast::find($broadcastId);
        $this->assertNotNull($broadcast);

        // Regular user with admin_broadcasts = true SHOULD receive notification
        Notification::assertSentTo(
            $this->user,
            AdminBroadcastNotification::class,
            function (AdminBroadcastNotification $notification) use ($broadcast) {
                return $notification->broadcast->id === $broadcast->id
                    && $notification->id === Uuid::uuid5(Uuid::NAMESPACE_OID, "broadcast:{$broadcast->id}:{$this->user->id}")->toString();
            }
        );

        // Opted-out user MUST NOT receive notification
        Notification::assertNotSentTo(
            $this->optedOutUser,
            AdminBroadcastNotification::class
        );
    }
}
