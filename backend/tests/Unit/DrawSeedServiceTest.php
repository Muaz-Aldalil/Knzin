<?php

namespace Tests\Unit;

use App\Models\Draw;
use App\Services\Admin\DrawSeedService;
use PHPUnit\Framework\TestCase;

class DrawSeedServiceTest extends TestCase
{
    public function test_csprng_seed_generation_and_hashing(): void
    {
        $service = new DrawSeedService();
        $seed = $service->generateSeed();

        $this->assertEquals(64, strlen($seed));
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $seed);

        $hash = $service->hashSeed($seed);
        $this->assertEquals(hash('sha256', $seed), $hash);
    }

    public function test_reveal_verification(): void
    {
        $service = new DrawSeedService();
        $seed = $service->generateSeed();
        $hash = $service->hashSeed($seed);

        $draw = new Draw();
        $draw->server_seed_hash = $hash;
        $draw->server_seed_revealed = $seed;

        $this->assertTrue($service->verifyReveal($draw));

        $draw->server_seed_revealed = '0000000000000000000000000000000000000000000000000000000000000000';
        $this->assertFalse($service->verifyReveal($draw));
    }
}
