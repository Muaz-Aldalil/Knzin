<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TestDatabaseSmokeTest extends TestCase
{
    public function test_active_database_is_knzin_test(): void
    {
        $databaseName = DB::selectOne('SELECT DATABASE() AS db')->db;
        $this->assertSame('knzin_test', $databaseName);
    }
}
