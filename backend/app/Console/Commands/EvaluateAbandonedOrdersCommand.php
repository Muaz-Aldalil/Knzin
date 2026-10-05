<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Notifications\AbandonedOrderRecoveryNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class EvaluateAbandonedOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:evaluate-abandoned-orders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evaluate pending orders older than 2 hours and dispatch recovery notifications';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $threshold = Carbon::now()->subHours(2);

        // Find pending orders created at least 2 hours ago that haven't received recovery notification
        $orders = Order::query()
            ->where('status', 'pending')
            ->where('created_at', '<=', $threshold)
            ->whereNull('recovery_notification_sent_at')
            ->with('user')
            ->get();

        $count = 0;

        foreach ($orders as $order) {
            // Atomic row-level update prevents race conditions across overlapping/concurrent command instances
            $affected = Order::query()
                ->where('id', $order->id)
                ->where('status', 'pending')
                ->whereNull('recovery_notification_sent_at')
                ->update(['recovery_notification_sent_at' => Carbon::now()]);

            if ($affected > 0 && $order->user) {
                $order->user->notify(new AbandonedOrderRecoveryNotification($order));
                $count++;
            }
        }

        $this->info("Processed {$count} abandoned order recovery notifications.");

        return Command::SUCCESS;
    }
}
