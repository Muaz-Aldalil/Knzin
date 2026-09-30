<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

class ExpirePendingOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:expire-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire pending orders older than 48 hours by transitioning status to failed';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();
        $expiredCount = 0;

        // Process in bounded batches to avoid unbounded next-key table/index locks (DEF-03D)
        do {
            $orderIds = Order::where('status', 'pending')
                ->where('expires_at', '<=', $now)
                ->limit(500)
                ->pluck('id');

            if ($orderIds->isEmpty()) {
                break;
            }

            $affected = Order::whereIn('id', $orderIds)->update(['status' => 'failed']);
            $expiredCount += $affected;
        } while ($orderIds->count() === 500);

        $this->info("Expired {$expiredCount} pending order(s) past their 48-hour TTL.");

        return self::SUCCESS;
    }
}
