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

        $expiredCount = Order::where('status', 'pending')
            ->where('expires_at', '<=', $now)
            ->update([
                'status' => 'failed',
            ]);

        $this->info("Expired {$expiredCount} pending order(s) past their 48-hour TTL.");

        return self::SUCCESS;
    }
}
