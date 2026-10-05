<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationRetentionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'retention_test@example.com',
            'display_name' => 'Retention Tester',
            'status' => 'active',
        ]);
    }

    public function test_prunes_read_notifications_older_than_60_days_while_preserving_unread_and_recent(): void
    {
        $oldReadId = (string) Str::uuid();
        $recentReadId = (string) Str::uuid();
        $oldUnreadId = (string) Str::uuid();
        $recentUnreadId = (string) Str::uuid();

        // 1. Read notification older than 60 days (e.g., 65 days ago) -> MUST BE PRUNED
        DB::table('notifications')->insert([
            'id' => $oldReadId,
            'type' => 'App\\Notifications\\OrderConfirmationNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $this->user->id,
            'data' => json_encode(['title_ar' => 'إشعار قديم مقروء', 'title_en' => 'Old Read']),
            'read_at' => Carbon::now()->subDays(65),
            'created_at' => Carbon::now()->subDays(65),
            'updated_at' => Carbon::now()->subDays(65),
        ]);

        // 2. Read notification within 60 days (e.g., 20 days ago) -> MUST BE RETAINED
        DB::table('notifications')->insert([
            'id' => $recentReadId,
            'type' => 'App\\Notifications\\OrderConfirmationNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $this->user->id,
            'data' => json_encode(['title_ar' => 'إشعار حديث مقروء', 'title_en' => 'Recent Read']),
            'read_at' => Carbon::now()->subDays(20),
            'created_at' => Carbon::now()->subDays(20),
            'updated_at' => Carbon::now()->subDays(20),
        ]);

        // 3. Ancient UNREAD notification (e.g., 180 days ago) -> MUST BE RETAINED INDEFINITELY
        DB::table('notifications')->insert([
            'id' => $oldUnreadId,
            'type' => 'App\\Notifications\\LiveDrawAlertNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $this->user->id,
            'data' => json_encode(['title_ar' => 'إشعار قديم غير مقروء', 'title_en' => 'Old Unread']),
            'read_at' => null,
            'created_at' => Carbon::now()->subDays(180),
            'updated_at' => Carbon::now()->subDays(180),
        ]);

        // 4. Recent UNREAD notification -> MUST BE RETAINED
        DB::table('notifications')->insert([
            'id' => $recentUnreadId,
            'type' => 'App\\Notifications\\LiveDrawAlertNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $this->user->id,
            'data' => json_encode(['title_ar' => 'إشعار حديث غير مقروء', 'title_en' => 'Recent Unread']),
            'read_at' => null,
            'created_at' => Carbon::now()->subHours(1),
            'updated_at' => Carbon::now()->subHours(1),
        ]);

        $this->assertEquals(4, DB::table('notifications')->count());

        // Execute prune command
        $exitCode = Artisan::call('notifications:prune-read');
        $this->assertEquals(0, $exitCode);

        // Verify pruning results
        $this->assertDatabaseMissing('notifications', ['id' => $oldReadId]);
        $this->assertDatabaseHas('notifications', ['id' => $recentReadId]);
        $this->assertDatabaseHas('notifications', ['id' => $oldUnreadId]);
        $this->assertDatabaseHas('notifications', ['id' => $recentUnreadId]);

        $this->assertEquals(3, DB::table('notifications')->count());
    }

    public function test_prune_command_is_scheduled_daily_at_0300(): void
    {
        $schedule = app(Schedule::class);
        $events = collect($schedule->events());

        $pruneEvent = $events->first(function ($event) {
            return str_contains($event->command ?? '', 'notifications:prune-read');
        });

        $this->assertNotNull($pruneEvent, 'notifications:prune-read must be registered in the console scheduler');
        $this->assertEquals('0 3 * * *', $pruneEvent->expression, 'Must run daily at 03:00');
    }
}
