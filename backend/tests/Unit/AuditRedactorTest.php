<?php

namespace Tests\Unit;

use App\Services\Admin\AuditRedactor;
use PHPUnit\Framework\TestCase;

class AuditRedactorTest extends TestCase
{
    public function test_sensitive_fields_are_redacted(): void
    {
        $redactor = new AuditRedactor();

        $input = [
            'id' => 123,
            'title' => 'Sample Action',
            'password' => 'supersecret123',
            'server_seed_encrypted' => 'AES256CIPHERTEXT...',
            'nested' => [
                'api_secret' => 'key_xyz',
                'normal_field' => 'visible',
            ],
        ];

        $output = $redactor->redact($input);

        $this->assertEquals(123, $output['id']);
        $this->assertEquals('Sample Action', $output['title']);
        $this->assertEquals('[REDACTED]', $output['password']);
        $this->assertEquals('[REDACTED]', $output['server_seed_encrypted']);
        $this->assertEquals('[REDACTED]', $output['nested']['api_secret']);
        $this->assertEquals('visible', $output['nested']['normal_field']);
    }
}
