<?php

namespace App\Services\Admin;

class AuditRedactor
{
    private const DENIED_PATTERNS = [
        'password',
        'token',
        'secret',
        'server_seed_encrypted',
        'server_seed_revealed',
        'recipient_details',
        'authorization',
        'receipt_path',
        'cookie',
        'credit_card',
        'private_key',
    ];

    /**
     * Recursively redacts sensitive keys from an associative state array.
     */
    public function redact(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        $redacted = [];

        foreach ($data as $key => $value) {
            if ($this->isSensitiveKey((string) $key)) {
                $redacted[$key] = '[REDACTED]';
                continue;
            }

            if (is_array($value)) {
                $redacted[$key] = $this->redact($value);
            } else {
                $redacted[$key] = $value;
            }
        }

        return $redacted;
    }

    private function isSensitiveKey(string $key): bool
    {
        $normalizedKey = strtolower(trim($key));

        foreach (self::DENIED_PATTERNS as $pattern) {
            if (str_contains($normalizedKey, $pattern)) {
                return true;
            }
        }

        return false;
    }
}
