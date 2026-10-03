<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use RuntimeException;
use Tests\Support\TestDatabaseGuard;

class TestDatabaseGuardTest extends TestCase
{
    public function test_allows_databases_ending_with_test(): void
    {
        TestDatabaseGuard::assertSafe('knzin_test');
        TestDatabaseGuard::assertSafe('staging_test');
        $this->assertTrue(true);
    }

    public function test_aborts_on_development_database(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("unsafe database target detected ('knzin_db')");
        TestDatabaseGuard::assertSafe('knzin_db');
    }

    public function test_aborts_on_test_backup_database(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("unsafe database target detected ('knzin_test_backup')");
        TestDatabaseGuard::assertSafe('knzin_test_backup');
    }

    public function test_aborts_on_null_or_empty(): void
    {
        $this->expectException(RuntimeException::class);
        TestDatabaseGuard::assertSafe(null);
    }

    public function test_aborts_on_database_not_ending_with_test(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("does not end with '_test'");
        TestDatabaseGuard::assertSafe('knzin_production');
    }
}
