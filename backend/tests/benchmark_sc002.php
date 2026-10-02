<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Support\Str;

echo "=== BENCHMARK: SC-002 Referrer Sales Commission Accrual Latency ===\n";

Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\CourseCatalogSeeder']);
Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\PromotionalDrawSeeder']);

$orderService = app(OrderService::class);
$course = Course::firstOrFail();

// Warmup run to warm up JIT, autoloader, and DB connections
$warmupReferrer = User::factory()->create(['learner_code' => 'LRN-W' . Str::random(4)]);
$warmupBuyer = User::factory()->create();
$warmupRes = $orderService->createOrder([
    'email' => $warmupBuyer->email,
    'user_id' => $warmupBuyer->id,
    'course_id' => $course->id,
    'item_type' => 'bundle',
    'legal_terms_agreed' => true,
    'legal_shield_text' => 'canonical text',
    'idempotency_key' => 'warmup_' . Str::random(8),
    'referral_code' => $warmupReferrer->learner_code,
]);
$orderService->fulfillOrder($warmupRes['order']);

$runs = 20;
$durationsMs = [];

for ($i = 1; $i <= $runs; $i++) {
    $code = 'LRN-B' . sprintf('%02d', $i) . Str::random(3);
    $referrer = User::factory()->create(['learner_code' => $code]);
    $buyer = User::factory()->create();

    $res = $orderService->createOrder([
        'email' => $buyer->email,
        'user_id' => $buyer->id,
        'course_id' => $course->id,
        'item_type' => 'bundle',
        'legal_terms_agreed' => true,
        'legal_shield_text' => 'canonical text',
        'idempotency_key' => 'bench_ord_' . $i . '_' . Str::random(8),
        'referral_code' => $referrer->learner_code,
    ]);
    $order = $res['order'];

    // Measure exact fulfillment + commission ledger entry creation latency
    $startTime = microtime(true);
    $fulfilled = $orderService->fulfillOrder($order);
    $durationMs = (microtime(true) - $startTime) * 1000;

    $durationsMs[] = $durationMs;
    echo sprintf("Run #%02d: %.2f ms (Status: %s, Tickets: %d)\n", $i, $durationMs, $fulfilled->status, $fulfilled->promotional_tickets_granted);
}

sort($durationsMs);
$min = min($durationsMs);
$max = max($durationsMs);
$avg = array_sum($durationsMs) / count($durationsMs);
$p95Index = (int) floor(0.95 * count($durationsMs));
$p95 = $durationsMs[$p95Index];

echo "\n--- BENCHMARK RESULTS ---\n";
echo sprintf("Runs: %d\n", $runs);
echo sprintf("Min: %.2f ms\n", $min);
echo sprintf("Average: %.2f ms\n", $avg);
echo sprintf("P95: %.2f ms\n", $p95);
echo sprintf("Max: %.2f ms\n", $max);
echo sprintf("Target: < 500.00 ms\n");
echo sprintf("Verdict: %s\n", ($max < 500.0) ? "PASS" : "FAIL");
