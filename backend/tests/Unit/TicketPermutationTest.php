<?php

namespace Tests\Unit;

use App\Services\TicketMintingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TicketPermutationTest extends TestCase
{
    use RefreshDatabase;

    protected TicketMintingService $mintingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mintingService = app(TicketMintingService::class);
    }

    public function test_affine_permutation_bijection_is_strictly_one_to_one_across_sample_sequences(): void
    {
        $seenPermutations = [];
        $sampleCount = 1000;

        for ($seq = 1; $seq <= $sampleCount; $seq++) {
            $permuted = $this->mintingService->permuteSequence($seq);

            // Must fit within 40 bits
            $this->assertGreaterThanOrEqual(0, $permuted);
            $this->assertLessThan(TicketMintingService::MAX_SEQUENCE_BOUNDARY, $permuted);

            // Must be strictly distinct (injective property of bijection)
            $this->assertArrayNotHasKey(
                $permuted,
                $seenPermutations,
                "Collision detected for sequence {$seq}: permuted {$permuted} already seen"
            );

            $seenPermutations[$permuted] = $seq;

            // Formatted serial conforms to Crockford Base32
            $serial = $this->mintingService->formatSerial(2026, $permuted);
            $this->assertMatchesRegularExpression('/^KNZ-26-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$/', $serial);
        }

        $this->assertCount($sampleCount, $seenPermutations);
    }

    public function test_sequence_allocation_overflow_guard_throws_exception_at_boundary(): void
    {
        // Pre-seed year sequence near the boundary (2^40 - 5)
        $nearBoundary = TicketMintingService::MAX_SEQUENCE_BOUNDARY - 5;

        DB::table('ticket_sequences')->insert([
            'year' => 2026,
            'current_sequence' => $nearBoundary,
            'updated_at' => now(),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Annual ticket sequence exhausted for year 2026');

        // Attempting to allocate 10 more exceeds 2^40
        $this->mintingService->allocateSequenceBlock(2026, 10);
    }

    public function test_yearly_rollover_resets_sequence_cleanly_for_new_year(): void
    {
        // Year 2026 allocates 50 tickets
        [$start2026, $end2026] = $this->mintingService->allocateSequenceBlock(2026, 50);
        $this->assertEquals(1, $start2026);
        $this->assertEquals(50, $end2026);

        // Year 2027 starts at sequence 1 independently
        [$start2027, $end2027] = $this->mintingService->allocateSequenceBlock(2027, 15);
        $this->assertEquals(1, $start2027);
        $this->assertEquals(15, $end2027);

        // Verify MariaDB sequence records
        $seq2026 = DB::table('ticket_sequences')->where('year', 2026)->value('current_sequence');
        $seq2027 = DB::table('ticket_sequences')->where('year', 2027)->value('current_sequence');

        $this->assertEquals(50, $seq2026);
        $this->assertEquals(15, $seq2027);
    }
}
