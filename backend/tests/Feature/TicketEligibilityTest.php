<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Draw;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketEligibilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Course $course;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->user = User::factory()->create();
        $this->course = Course::first();

        $this->order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-ELIG-01',
            'user_id' => $this->user->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 13100,
            'display_price_label' => '13,000 IQD',
            'promotional_tickets_granted' => 15,
            'status' => 'completed',
            'tickets_status' => 'completed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);
    }

    private function createTicketWithIssuedAt(Carbon $issuedAt, int $index, string $serial): Ticket
    {
        return Ticket::create([
            'user_id' => $this->user->id,
            'order_id' => $this->order->id,
            'order_ticket_index' => $index,
            'serial_number' => $serial,
            'issued_at' => $issuedAt,
        ]);
    }

    public function test_half_open_interval_starts_at_lte_issued_at_lt_ends_at_in_utc(): void
    {
        $base = Carbon::parse('2026-10-01 10:00:00', 'UTC');
        Carbon::setTestNow($base->copy()->addMinutes(30)); // 10:30 UTC

        $draw = Draw::create([
            'tier' => 'hourly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب الساعة 10',
            'title_en' => '10:00 Hourly Draw',
            'status' => 'active',
            'starts_at' => Carbon::parse('2026-10-01 10:00:00', 'UTC'),
            'ends_at' => Carbon::parse('2026-10-01 11:00:00', 'UTC'),
            'total_eligible_tickets' => 0,
        ]);

        // Ticket 1: Exactly at starts_at (10:00:00) -> Eligible
        $t1 = $this->createTicketWithIssuedAt(Carbon::parse('2026-10-01 10:00:00', 'UTC'), 1, 'KNZ-26-AAAA-0001');

        // Ticket 2: Inside interval (10:30:00) -> Eligible
        $t2 = $this->createTicketWithIssuedAt(Carbon::parse('2026-10-01 10:30:00', 'UTC'), 2, 'KNZ-26-AAAA-0002');

        // Ticket 3: Before starts_at (09:59:59) -> Ineligible
        $t3 = $this->createTicketWithIssuedAt(Carbon::parse('2026-10-01 09:59:59', 'UTC'), 3, 'KNZ-26-AAAA-0003');

        // Ticket 4: Exactly at ends_at (11:00:00) -> Ineligible for this draw (half-open < ends_at)
        $t4 = $this->createTicketWithIssuedAt(Carbon::parse('2026-10-01 11:00:00', 'UTC'), 4, 'KNZ-26-AAAA-0004');

        Sanctum::actingAs($this->user, ['*']);
        $response = $this->getJson('/api/v1/user/tickets');
        $response->assertStatus(200);

        $ticketsData = collect($response->json('data.tickets'));

        $r1 = $ticketsData->firstWhere('id', $t1->id);
        $this->assertTrue($r1['eligibility']['hourly']['is_eligible']);
        $this->assertEquals('active', $r1['eligibility']['hourly']['status']);

        $r2 = $ticketsData->firstWhere('id', $t2->id);
        $this->assertTrue($r2['eligibility']['hourly']['is_eligible']);
        $this->assertEquals('active', $r2['eligibility']['hourly']['status']);

        $r3 = $ticketsData->firstWhere('id', $t3->id);
        $this->assertFalse($r3['eligibility']['hourly']['is_eligible']);
        $this->assertEquals('concluded', $r3['eligibility']['hourly']['status']);

        $r4 = $ticketsData->firstWhere('id', $t4->id);
        $this->assertFalse($r4['eligibility']['hourly']['is_eligible']);
        $this->assertEquals('concluded', $r4['eligibility']['hourly']['status']);

        Carbon::setTestNow();
    }

    public function test_ticket_issued_at_exact_ends_at_qualifies_for_next_draw_window(): void
    {
        $base = Carbon::parse('2026-10-01 11:05:00', 'UTC');
        Carbon::setTestNow($base);

        // Previous draw that ended at 11:00:00
        $drawOld = Draw::create([
            'tier' => 'hourly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب الساعة 10',
            'title_en' => '10:00 Draw',
            'status' => 'completed',
            'starts_at' => Carbon::parse('2026-10-01 10:00:00', 'UTC'),
            'ends_at' => Carbon::parse('2026-10-01 11:00:00', 'UTC'),
            'total_eligible_tickets' => 0,
        ]);

        // Next active draw starting at exact 11:00:00
        $drawNew = Draw::create([
            'tier' => 'hourly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب الساعة 11',
            'title_en' => '11:00 Draw',
            'status' => 'active',
            'starts_at' => Carbon::parse('2026-10-01 11:00:00', 'UTC'),
            'ends_at' => Carbon::parse('2026-10-01 12:00:00', 'UTC'),
            'total_eligible_tickets' => 0,
        ]);

        $ticket = $this->createTicketWithIssuedAt(Carbon::parse('2026-10-01 11:00:00', 'UTC'), 1, 'KNZ-26-BBBB-0001');

        Sanctum::actingAs($this->user, ['*']);
        $response = $this->getJson('/api/v1/user/tickets');
        $response->assertStatus(200);

        $ticketData = collect($response->json('data.tickets'))->firstWhere('id', $ticket->id);
        $this->assertTrue($ticketData['eligibility']['hourly']['is_eligible']);
        $this->assertEquals('active', $ticketData['eligibility']['hourly']['status']);

        Carbon::setTestNow();
    }

    public function test_draw_with_status_locked_closes_ticket_accumulation(): void
    {
        $now = Carbon::parse('2026-10-01 11:05:00', 'UTC');
        Carbon::setTestNow($now);

        // Draw where ends_at has arrived, computeEffectiveStatus() evaluates to 'locked'
        $draw = Draw::create([
            'tier' => 'hourly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب مغلق للمراجعة',
            'title_en' => 'Locked Draw for Verification',
            'status' => 'active',
            'starts_at' => Carbon::parse('2026-10-01 10:00:00', 'UTC'),
            'ends_at' => Carbon::parse('2026-10-01 11:00:00', 'UTC'),
            'total_eligible_tickets' => 10,
        ]);

        $ticket = $this->createTicketWithIssuedAt(Carbon::parse('2026-10-01 10:30:00', 'UTC'), 1, 'KNZ-26-CCCC-0001');

        Sanctum::actingAs($this->user, ['*']);
        $response = $this->getJson('/api/v1/user/tickets');
        $response->assertStatus(200);

        $ticketData = collect($response->json('data.tickets'))->firstWhere('id', $ticket->id);
        $this->assertTrue($ticketData['eligibility']['hourly']['is_eligible']);
        // When draw is locked, status must reflect locked
        $this->assertEquals('locked', $ticketData['eligibility']['hourly']['status']);

        Carbon::setTestNow();
    }

    public function test_monthly_grand_draw_evaluates_designated_calendar_month(): void
    {
        // February 2026 has 28 days (not 30)
        $febStart = Carbon::parse('2026-02-01 00:00:00', 'UTC');
        $febEnd = Carbon::parse('2026-03-01 00:00:00', 'UTC');

        Carbon::setTestNow(Carbon::parse('2026-02-15 12:00:00', 'UTC'));

        $draw = Draw::create([
            'tier' => 'monthly',
            'execution_type' => 'live_broadcast',
            'title_ar' => 'سحب شهر فبراير الكبير',
            'title_en' => 'February Grand Draw',
            'status' => 'active',
            'starts_at' => $febStart,
            'ends_at' => $febEnd,
            'total_eligible_tickets' => 0,
        ]);

        // Ticket 1: Last second of February 28
        $t1 = $this->createTicketWithIssuedAt(Carbon::parse('2026-02-28 23:59:59', 'UTC'), 1, 'KNZ-26-DDDD-0001');

        // Ticket 2: First second of March 1 (ineligible for February draw)
        $t2 = $this->createTicketWithIssuedAt(Carbon::parse('2026-03-01 00:00:00', 'UTC'), 2, 'KNZ-26-DDDD-0002');

        Sanctum::actingAs($this->user, ['*']);
        $response = $this->getJson('/api/v1/user/tickets');
        $response->assertStatus(200);

        $ticketsData = collect($response->json('data.tickets'));

        $r1 = $ticketsData->firstWhere('id', $t1->id);
        $this->assertTrue($r1['eligibility']['monthly']['is_eligible']);
        $this->assertEquals('active', $r1['eligibility']['monthly']['status']);

        $r2 = $ticketsData->firstWhere('id', $t2->id);
        $this->assertFalse($r2['eligibility']['monthly']['is_eligible']);
        $this->assertEquals('concluded', $r2['eligibility']['monthly']['status']);

        Carbon::setTestNow();
    }

    public function test_tickets_remain_queryable_in_ledger_after_draw_conclusion(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-01 15:00:00', 'UTC'));

        // Concluded draw with status = 'completed'
        Draw::create([
            'tier' => 'hourly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب منتهي تماماً',
            'title_en' => 'Fully Completed Draw',
            'status' => 'completed',
            'starts_at' => Carbon::parse('2026-10-01 10:00:00', 'UTC'),
            'ends_at' => Carbon::parse('2026-10-01 11:00:00', 'UTC'),
            'total_eligible_tickets' => 10,
        ]);

        $ticket = $this->createTicketWithIssuedAt(Carbon::parse('2026-10-01 10:30:00', 'UTC'), 1, 'KNZ-26-EEEE-0001');

        Sanctum::actingAs($this->user, ['*']);
        $response = $this->getJson('/api/v1/user/tickets');
        $response->assertStatus(200);

        // Ticket still appears in user's ledger
        $this->assertEquals(1, $response->json('data.total_tickets'));
        $ticketData = collect($response->json('data.tickets'))->firstWhere('id', $ticket->id);
        $this->assertNotNull($ticketData);
        $this->assertEquals('KNZ-26-EEEE-0001', $ticketData['serial_number']);
        $this->assertEquals('concluded', $ticketData['eligibility']['hourly']['status']);

        Carbon::setTestNow();
    }
}
