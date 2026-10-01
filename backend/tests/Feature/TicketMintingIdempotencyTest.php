<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketMintingService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TicketMintingIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Course $course;
    protected CoursePart $part;
    protected TicketMintingService $mintingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->user = User::factory()->create();
        $this->course = Course::with('parts')->first();
        $this->part = $this->course->parts->first();
        $this->mintingService = app(TicketMintingService::class);
    }

    private function createOrder(string $itemType = 'bundle', int $ticketsCount = 15): Order
    {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $this->user->id,
            'total_amount_cents' => $itemType === 'bundle' ? 1000 : 200,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => $itemType === 'bundle' ? 13100 : 2620,
            'display_price_label' => $itemType === 'bundle' ? '13,000 IQD' : '2,000 IQD',
            'promotional_tickets_granted' => $ticketsCount,
            'status' => 'completed',
            'tickets_status' => 'pending',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $this->course->id,
            'course_part_id' => $itemType === 'part' ? $this->part->id : null,
            'item_type' => $itemType,
            'price_cents' => $itemType === 'bundle' ? 1000 : 200,
            'promotional_tickets_granted' => $ticketsCount,
        ]);

        return $order;
    }

    public function test_single_part_order_mints_exactly_1_ticket(): void
    {
        $order = $this->createOrder('part', 1);

        $minted = $this->mintingService->mintForOrder($order);

        $this->assertEquals(1, $minted);
        $this->assertEquals(1, Ticket::where('order_id', $order->id)->count());

        $order->refresh();
        $this->assertEquals('completed', $order->tickets_status);
        $this->assertNotNull($order->tickets_minted_at);
    }

    public function test_bundle_order_mints_exactly_15_tickets(): void
    {
        $order = $this->createOrder('bundle', 15);

        $minted = $this->mintingService->mintForOrder($order);

        $this->assertEquals(15, $minted);
        $this->assertEquals(15, Ticket::where('order_id', $order->id)->count());

        $order->refresh();
        $this->assertEquals('completed', $order->tickets_status);
        $this->assertNotNull($order->tickets_minted_at);
    }

    public function test_all_serials_conform_to_canonical_crockford_base32_regex(): void
    {
        $order = $this->createOrder('bundle', 15);
        $this->mintingService->mintForOrder($order);

        $tickets = Ticket::where('order_id', $order->id)->get();
        $this->assertCount(15, $tickets);

        $pattern = '/^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$/';
        $serials = [];

        foreach ($tickets as $ticket) {
            $this->assertMatchesRegularExpression(
                $pattern,
                $ticket->serial_number,
                "Serial {$ticket->serial_number} does not match canonical Crockford Base32 pattern"
            );
            $serials[] = $ticket->serial_number;
        }

        // Serials must be pairwise distinct
        $this->assertCount(15, array_unique($serials));
    }

    public function test_uq_order_ticket_index_uniqueness_rejects_duplicate_insert_attempts(): void
    {
        $order = $this->createOrder('part', 1);
        $this->mintingService->mintForOrder($order);

        $existing = Ticket::where('order_id', $order->id)->first();
        $this->assertNotNull($existing);

        $this->expectException(QueryException::class);

        // Attempt direct insertion of duplicate (order_id, order_ticket_index = 1)
        Ticket::create([
            'user_id' => $this->user->id,
            'order_id' => $order->id,
            'order_item_id' => $existing->order_item_id,
            'order_ticket_index' => 1,
            'serial_number' => 'KNZ-26-XXXX-YYYY',
            'issued_at' => now('UTC'),
        ]);
    }

    public function test_simulated_worker_crash_after_partial_insert_resumes_and_mints_exact_delta(): void
    {
        $order = $this->createOrder('bundle', 15);
        $orderItem = $order->items->first();

        // Simulate crash: only 5 of 15 tickets were inserted before worker died
        for ($i = 1; $i <= 5; $i++) {
            Ticket::create([
                'user_id' => $this->user->id,
                'order_id' => $order->id,
                'order_item_id' => $orderItem->id,
                'order_ticket_index' => $i,
                'serial_number' => "KNZ-26-CRSH-000{$i}",
                'issued_at' => now('UTC'),
            ]);
        }

        $this->assertEquals(5, Ticket::where('order_id', $order->id)->count());

        // Worker recovers/retries job
        $mintedDelta = $this->mintingService->mintForOrder($order);

        // Delta must be exactly 10
        $this->assertEquals(10, $mintedDelta);
        $this->assertEquals(15, Ticket::where('order_id', $order->id)->count());

        // Verify all indices 1..15 are present without gaps
        $indices = Ticket::where('order_id', $order->id)->pluck('order_ticket_index')->sort()->values()->all();
        $this->assertEquals(range(1, 15), $indices);

        $order->refresh();
        $this->assertEquals('completed', $order->tickets_status);
    }

    /**
     * Sequential automated simulation: verifies that duplicate worker invocations
     * (e.g. queue retry, webhook race) mint exactly 15 tickets with zero duplicate rows.
     */
    public function test_duplicate_worker_invocation_simulation_produces_exactly_15_tickets_total(): void
    {
        $order = $this->createOrder('bundle', 15);

        // First worker execution
        $firstRunMinted = $this->mintingService->mintForOrder($order);
        $this->assertEquals(15, $firstRunMinted);

        // Duplicate worker invocation (e.g. queue retry, webhook race)
        $secondRunMinted = $this->mintingService->mintForOrder($order);
        $this->assertEquals(0, $secondRunMinted);

        // Total remains exactly 15 tickets, zero duplicates
        $this->assertEquals(15, Ticket::where('order_id', $order->id)->count());
    }

    /**
     * Sequential simulation: verifies that consecutive allocation blocks
     * yield strictly disjoint sequence slices with zero overlap.
     */
    public function test_sequential_sequence_allocation_slices_are_strictly_disjoint(): void
    {
        $year = (int) date('Y');

        // Worker A allocates chunk of 15
        [$startSeqA, $endSeqA] = $this->mintingService->allocateSequenceBlock($year, 15);

        // Worker B allocates chunk of 15
        [$startSeqB, $endSeqB] = $this->mintingService->allocateSequenceBlock($year, 15);

        // Slice A: [$startSeqA .. $endSeqA]
        // Slice B: [$startSeqB .. $endSeqB]
        $sliceA = range($startSeqA, $endSeqA);
        $sliceB = range($startSeqB, $endSeqB);

        $this->assertEquals($startSeqA + 15, $startSeqB);
        $this->assertEquals($startSeqB + 14, $endSeqB);
        $this->assertEmpty(array_intersect($sliceA, $sliceB), 'Sequence allocation slices must be strictly disjoint');
    }
}
