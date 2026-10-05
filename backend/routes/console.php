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

// Feature 007: Scheduled reconciliation for dropped payment transactions
Schedule::command('payments:reconcile')->everyFiveMinutes()->withoutOverlapping(10);

// Feature 009: Scheduled evaluator for abandoned pending orders (every 10 minutes)
Schedule::command('notifications:evaluate-abandoned-orders')->everyTenMinutes()->withoutOverlapping(10);

// Feature 009: Scheduled evaluator for live draw stream alerts (every 5 minutes)
Schedule::command('notifications:evaluate-draw-alerts')->everyFiveMinutes()->withoutOverlapping(5);

// Feature 009: Scheduled evaluator for course mission inactivity reminders (hourly)
Schedule::command('notifications:evaluate-mission-reminders')->hourly()->withoutOverlapping(30);

// Feature 009: Scheduled daily retention cleanup for read notifications (> 60 days)
Schedule::command('notifications:prune-read')->dailyAt('03:00')->withoutOverlapping(60);

