<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Phase 7: Scheduled hourly run for 48h order TTL expiration
Schedule::command('orders:expire-pending')->hourly();

// Feature 005: Scheduled reconciliation for asynchronous ticket generation
Schedule::command('knzin:reconcile-ticket-generation')->everyFiveMinutes();

// Feature 006: Scheduled hourly maturation for affiliate sales commissions
Schedule::command('knzin:mature-commissions')->hourly();

