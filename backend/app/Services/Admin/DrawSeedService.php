<?php

namespace App\Services\Admin;

use App\Models\Draw;
use Illuminate\Support\Facades\Crypt;
use RuntimeException;
use SensitiveParameter;

class DrawSeedService
{
    /**
     * Generate CSPRNG server seed, compute SHA-256 commitment hash, and encrypt seed.
     *
     * @return array{hash: string, encrypted: string, committed_at: \Illuminate\Support\Carbon}
     */
    public function generateAndCommit(Draw $draw): array
    {
        $rawBytes = random_bytes(32);
        $seedHex = strtolower(bin2hex($rawBytes));
        $hash = hash('sha256', $seedHex);
        $encrypted = Crypt::encryptString($seedHex);

        // Self-check verification round-trip before persisting
        $decryptedCheck = Crypt::decryptString($encrypted);
        if (!hash_equals($hash, hash('sha256', $decryptedCheck))) {
            throw new RuntimeException('Cryptographic commitment failure: decrypted seed failed self-verification.');
        }

        return [
            'hash' => $hash,
            'encrypted' => $encrypted,
            'committed_at' => now(),
        ];
    }

    /**
     * Decrypt and verify the revealed server seed against the stored cryptographic hash.
     */
    public function reveal(Draw $draw): string
    {
        if (empty($draw->server_seed_encrypted) || empty($draw->server_seed_hash)) {
            throw new RuntimeException('Cannot reveal seed: no cryptographic commitment exists for this draw.');
        }

        $decryptedSeed = Crypt::decryptString($draw->server_seed_encrypted);

        if (!hash_equals($draw->server_seed_hash, hash('sha256', $decryptedSeed))) {
            throw new RuntimeException('Seed verification failed: decrypted seed does not match commitment hash.');
        }

        return $decryptedSeed;
    }

    /**
     * Generate 32 bytes (64 hex characters) CSPRNG raw seed.
     */
    public function generateSeed(): string
    {
        return strtolower(bin2hex(random_bytes(32)));
    }

    /**
     * Compute SHA-256 hash of seed.
     */
    public function hashSeed(string $seed): string
    {
        return hash('sha256', strtolower(trim($seed)));
    }

    /**
     * Verify a revealed seed against a commitment hash.
     */
    public function verifyRevealedSeed(#[SensitiveParameter] string $revealedSeed, string $expectedHash): bool
    {
        return hash_equals($expectedHash, $this->hashSeed($revealedSeed));
    }

    /**
     * Verify revealed seed directly on a Draw model.
     */
    public function verifyReveal(Draw $draw): bool
    {
        if (empty($draw->server_seed_hash) || empty($draw->server_seed_revealed)) {
            return false;
        }

        return $this->verifyRevealedSeed((string) $draw->server_seed_revealed, (string) $draw->server_seed_hash);
    }
}
