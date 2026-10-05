<?php

namespace Tests\Feature;

use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Order;
use App\Models\Prize;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\LiveDrawAlertNotification;
use App\Notifications\WinnerKycNotification;
use App\Services\Admin\DrawLifecycleService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class DrawNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $ticketHolder;
    protected User $nonTicketHolder;
    protected User $admin;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ticketHolder = User::factory()->create([
            'email' => 'ticketholder@example.com',
            'display_name' => 'Ticket Holder',
        ]);

        $this->nonTicketHolder = User::factory()->create([
            'email' => 'notickets@example.com',
            'display_name' => 'Non Ticket Holder',
        ]);

        $this->admin = User::factory()->create([
            'email' => 'admin@example.com',
            'display_name' => 'Admin User',
        ]);

        $this->order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $this->ticketHolder->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 13100,
            'display_price_label' => '13,000 IQD',
            'promotional_tickets_granted' => 1,
            'status' => 'completed',
            'tickets_status' => 'completed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
        ]);

        Ticket::create([
            'id' => (string) Str::uuid(),
            'order_id' => $this->order->id,
            'user_id' => $this->ticketHolder->id,
            'serial_number' => 'TCK-WIN-1001',
            'order_ticket_index' => 1,
            'issued_at' => now(),
        ]);
    }

    private function createDraw(array $attributes = []): Draw
    {
        return Draw::create(array_merge([
            'id' => (string) Str::uuid(),
            'tier' => 'daily',
            'execution_type' => 'live_broadcast',
            'title_ar' => 'سحب برونزي أسبوعي',
            'title_en' => 'Weekly Bronze Draw',
            'status' => 'upcoming',
            'is_published' => true,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addMinutes(10),
            'broadcast_url' => 'https://live.knzin.com/stream/weekly-bronze',
            'total_eligible_tickets' => 1,
        ], $attributes));
    }

    public function test_evaluate_draw_alerts_notifies_ticket_holders_within_15_minutes(): void
    {
        Notification::fake();

        // 1. Draw ending in 10 minutes (within 15m window) -> SHOULD notify
        $eligibleDraw = $this->createDraw([
            'ends_at' => Carbon::now()->addMinutes(10),
        ]);

        // 2. Draw ending in 45 minutes (> 15m window) -> SHOULD NOT notify
        $farDraw = $this->createDraw([
            'title_en' => 'Future Draw',
            'ends_at' => Carbon::now()->addMinutes(45),
        ]);

        // 3. Unpublished draw ending in 5 minutes -> SHOULD NOT notify
        $unpublishedDraw = $this->createDraw([
            'title_en' => 'Draft Draw',
            'is_published' => false,
            'ends_at' => Carbon::now()->addMinutes(5),
        ]);

        $exitCode = Artisan::call('notifications:evaluate-draw-alerts');
        $this->assertEquals(0, $exitCode);

        // Assert notification sent to ticket holder
        Notification::assertSentTo(
            $this->ticketHolder,
            LiveDrawAlertNotification::class,
            function (LiveDrawAlertNotification $notification) use ($eligibleDraw) {
                return $notification->draw->id === $eligibleDraw->id;
            }
        );

        // Assert notification NOT sent to user without tickets
        Notification::assertNotSentTo(
            $this->nonTicketHolder,
            LiveDrawAlertNotification::class
        );

        // Assert total count is exactly 1
        Notification::assertSentTimes(LiveDrawAlertNotification::class, 1);
    }

    public function test_evaluate_draw_alerts_uses_fallback_url_when_broadcast_url_is_null(): void
    {
        $draw = $this->createDraw([
            'broadcast_url' => null,
            'ends_at' => Carbon::now()->addMinutes(10),
        ]);

        $notification = new LiveDrawAlertNotification($draw, $this->ticketHolder);
        $payload = $notification->toArray($this->ticketHolder);

        $this->assertEquals("/draws/{$draw->id}/live", $payload['action_url']);
    }

    public function test_evaluate_draw_alerts_prevents_duplicate_dispatches(): void
    {
        Notification::fake();

        $draw = $this->createDraw([
            'ends_at' => Carbon::now()->addMinutes(12),
        ]);

        // First run
        Artisan::call('notifications:evaluate-draw-alerts');
        Notification::assertSentTimes(LiveDrawAlertNotification::class, 1);

        // Simulate database notification persistence
        \Illuminate\Support\Facades\DB::table('notifications')->insert([
            'id' => Uuid::uuid5(Uuid::NAMESPACE_OID, "draw_15m:{$draw->id}:{$this->ticketHolder->id}")->toString(),
            'type' => LiveDrawAlertNotification::class,
            'notifiable_type' => User::class,
            'notifiable_id' => $this->ticketHolder->id,
            'data' => json_encode(['title_en' => 'Live Draw']),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Second run
        Artisan::call('notifications:evaluate-draw-alerts');

        // Should still be exactly 1
        Notification::assertSentTimes(LiveDrawAlertNotification::class, 1);
    }

    public function test_draw_completion_dispatches_winner_kyc_notification_to_winning_ticket_owner(): void
    {
        Notification::fake();

        $draw = $this->createDraw([
            'status' => 'upcoming',
        ]);

        $prize = Prize::create([
            'id' => (string) Str::uuid(),
            'draw_id' => $draw->id,
            'title_ar' => 'آيفون 16 برو',
            'title_en' => 'iPhone 16 Pro',
            'category' => 'merchandise',
            'valuation_usd_cents' => 120000,
            'display_iqd_label' => '1,500,000 IQD',
            'image_url' => 'https://knzin.com/images/iphone16.jpg',
        ]);

        $winner = DrawWinner::create([
            'id' => (string) Str::uuid(),
            'draw_id' => $draw->id,
            'prize_id' => $prize->id,
            'winning_ticket_serial' => 'TCK-WIN-1001',
            'winner_masked_name' => 'T*** H***',
            'winner_governorate' => 'Baghdad',
            'prize_delivered' => false,
            'drawn_at' => now(),
        ]);

        $service = app(DrawLifecycleService::class);
        $service->complete($draw, $this->admin);

        Notification::assertSentTo(
            $this->ticketHolder,
            WinnerKycNotification::class,
            function (WinnerKycNotification $notification) use ($winner) {
                return $notification->winner->id === $winner->id
                    && $notification->id === Uuid::uuid5(Uuid::NAMESPACE_OID, "winner_kyc:{$winner->id}")->toString();
            }
        );

        Notification::assertNotSentTo(
            $this->nonTicketHolder,
            WinnerKycNotification::class
        );
    }
}
