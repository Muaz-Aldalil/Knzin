<?php

namespace Tests\Unit;

use Tests\TestCase;

class AffiliateCommissionMathTest extends TestCase
{
    /**
     * Pure integer cents commission formulation: intdiv($cents * 2500, 10000)
     */
    private function calculate(int $amountCents, int $rateBps = 2500): int
    {
        return intdiv($amountCents * $rateBps, 10000);
    }

    public function test_two_dollar_part_yields_exact_fifty_cents_commission(): void
    {
        $partPriceCents = 200; // $2.00
        $commissionCents = $this->calculate($partPriceCents);

        $this->assertSame(50, $commissionCents, '$2.00 part must yield exactly 50 cents ($0.50) commission');
    }

    public function test_ten_dollar_bundle_yields_exact_two_hundred_fifty_cents_commission(): void
    {
        $bundlePriceCents = 1000; // $10.00
        $commissionCents = $this->calculate($bundlePriceCents);

        $this->assertSame(250, $commissionCents, '$10.00 bundle must yield exactly 250 cents ($2.50) commission');
    }

    public function test_zero_amount_yields_zero_commission(): void
    {
        $this->assertSame(0, $this->calculate(0));
    }

    public function test_integer_division_truncates_without_floating_point_imprecision(): void
    {
        // 99 cents * 2500 = 247,500 / 10,000 = 24 cents (floor)
        $this->assertSame(24, $this->calculate(99));

        // 101 cents * 2500 = 252,500 / 10,000 = 25 cents (floor)
        $this->assertSame(25, $this->calculate(101));
    }
}
