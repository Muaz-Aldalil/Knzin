<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TicketMintingService
{
    public const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    public const MAX_SEQUENCE_BOUNDARY = 1099511627776; // 2^40

    /**
     * Atomically allocate a contiguous block of sequence numbers for a specific year in MariaDB.
     *
     * @return array{0: int, 1: int} [$start, $end]
     */
    public function allocateSequenceBlock(int $year, int $count): array
    {
        return DB::transaction(function () use ($year, $count) {
            DB::table('ticket_sequences')->insertOrIgnore([
                'year' => $year,
                'current_sequence' => 0,
            ]);

            $row = DB::table('ticket_sequences')
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            $current = (int) $row->current_sequence;
            $start = $current + 1;
            $end = $current + $count;

            if ($end >= self::MAX_SEQUENCE_BOUNDARY) {
                throw new \RuntimeException("Annual ticket sequence exhausted for year {$year}");
            }

            DB::table('ticket_sequences')
                ->where('year', $year)
                ->update([
                    'current_sequence' => $end,
                    'updated_at' => now(),
                ]);

            return [$start, $end];
        });
    }

    /**
     * Compute 40-bit non-sequential affine permutation bijection:
     * P(S) = (S * M + C) % 2^40 ^ K
     */
    public function permuteSequence(int $sequence): int
    {
        $multiplier = (string) config('knzin.ticket_multiplier', 382910471923);
        $adder = (string) config('knzin.ticket_adder', 543219876543);
        $mask = (int) config('knzin.ticket_xor_mask', 388062083674);

        // Arbitrary precision arithmetic via BCMath to avoid 64-bit integer multiplication overflow
        $product = bcmul((string) $sequence, $multiplier);
        $sum = bcadd($product, $adder);
        $mod = (int) bcmod($sum, (string) self::MAX_SEQUENCE_BOUNDARY);

        return $mod ^ $mask;
    }

    /**
     * Format a 40-bit permuted sequence into canonical Crockford Base32 serial:
     * KNZ-YY-XXXX-YYYY
     */
    public function formatSerial(int $year, int $permuted): string
    {
        $alphabet = self::CROCKFORD_ALPHABET;
        $chars = '';

        for ($i = 7; $i >= 0; $i--) {
            $shift = $i * 5;
            $idx = ($permuted >> $shift) & 31;
            $chars .= $alphabet[$idx];
        }

        $part1 = substr($chars, 0, 4);
        $part2 = substr($chars, 4, 4);
        $yy = sprintf('%02d', $year % 100);

        return "KNZ-{$yy}-{$part1}-{$part2}";
    }

    /**
     * Idempotently mint promotional tickets for a completed order.
     * Derives missing delta, allocates sequence block, and inserts rows with strict index enforcement.
     */
    public function mintForOrder(Order $order): int
    {
        return DB::transaction(function () use ($order) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();
            if (!$lockedOrder) {
                return 0;
            }

            $existingCount = Ticket::where('order_id', $order->id)->count();

            // Determine entitled ticket count ($2 part = 1, $10 bundle = 15)
            $entitledCount = (int) $lockedOrder->promotional_tickets_granted;
            if ($entitledCount <= 0) {
                $hasBundle = $lockedOrder->items()->where('item_type', 'bundle')->exists();
                $entitledCount = $hasBundle ? 15 : 1;
            }

            $delta = $entitledCount - $existingCount;
            if ($delta <= 0) {
                if ($lockedOrder->tickets_status !== 'completed') {
                    $lockedOrder->update([
                        'tickets_status' => 'completed',
                        'tickets_minted_at' => $lockedOrder->tickets_minted_at ?? now('UTC'),
                    ]);
                }
                return 0;
            }

            $year = (int) Carbon::now('UTC')->format('Y');
            [$start, $end] = $this->allocateSequenceBlock($year, $delta);

            $orderItem = $lockedOrder->items()->first();
            $orderItemId = $orderItem?->id;

            $minted = 0;
            for ($index = $existingCount + 1; $index <= $entitledCount; $index++) {
                $seq = $start + ($index - $existingCount - 1);
                $permuted = $this->permuteSequence($seq);
                $serial = $this->formatSerial($year, $permuted);

                try {
                    Ticket::create([
                        'user_id' => $lockedOrder->user_id,
                        'order_id' => $lockedOrder->id,
                        'order_item_id' => $orderItemId,
                        'order_ticket_index' => $index,
                        'serial_number' => $serial,
                        'issued_at' => now('UTC'),
                    ]);
                    $minted++;
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    Log::warning("Ticket insert rejected by unique constraint on index {$index} for order {$lockedOrder->id}");
                }
            }

            $lockedOrder->update([
                'tickets_status' => 'completed',
                'tickets_minted_at' => now('UTC'),
            ]);

            return $minted;
        });
    }
}
