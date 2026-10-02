<?php

namespace Tests\Unit;

use Tests\TestCase;

class AffiliateCoPrizeMathTest extends TestCase
{
    private function calculateCoPrize(int $prizeCents, int $rateBps = 4000): int
    {
        return intdiv($prizeCents * $rateBps, 10000);
    }

    public function test_ten_thousand_dollar_grand_prize_yields_four_thousand_dollar_co_prize(): void
    {
        $prizeValuationCents = 1_000_000; // $10,000.00
        $coPrizeCents = $this->calculateCoPrize($prizeValuationCents);

        $this->assertSame(400_000, $coPrizeCents, '$10,000 grand prize must yield exactly $4,000 (400,000 cents)');
    }

    public function test_fifty_thousand_dollar_grand_prize_yields_twenty_thousand_dollar_co_prize(): void
    {
        $prizeValuationCents = 5_000_000; // $50,000.00
        $coPrizeCents = $this->calculateCoPrize($prizeValuationCents);

        $this->assertSame(2_000_000, $coPrizeCents, '$50,000 grand prize must yield exactly $20,000 (2,000,000 cents)');
    }

    public function test_zero_valuation_yields_zero_co_prize(): void
    {
        $this->assertSame(0, $this->calculateCoPrize(0));
    }
}
