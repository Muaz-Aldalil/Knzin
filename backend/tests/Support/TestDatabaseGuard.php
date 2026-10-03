<?php

namespace Tests\Support;

use RuntimeException;

class TestDatabaseGuard
{
    /**
     * Asserts that the configured database is a dedicated test database.
     *
     * @param string|null $databaseName
     * @throws RuntimeException
     */
    public static function assertSafe(?string $databaseName): void
    {
        if ($databaseName === null || trim($databaseName) === '') {
            throw new RuntimeException("Test execution aborted: database name is empty or not configured.");
        }

        if ($databaseName === 'knzin_db' || $databaseName === 'knzin_test_backup') {
            throw new RuntimeException("Test execution aborted: unsafe database target detected ('{$databaseName}'). Tests must run against a dedicated test database.");
        }

        if (!str_ends_with($databaseName, '_test')) {
            throw new RuntimeException("Test execution aborted: database name '{$databaseName}' does not end with '_test'. Tests must run against a database ending in '_test'.");
        }
    }
}
