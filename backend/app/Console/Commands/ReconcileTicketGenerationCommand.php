<?php

namespace App\Console\Commands;

use App\Jobs\GenerateTicketsJob;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReconcileTicketGenerationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:reconcile-ticket-generation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Detect stale completed orders with pending ticket generation and re-dispatch generation jobs';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $staleThreshold = Carbon::now('UTC')->subMinutes(2);

        $staleOrders = Order::where('status', 'completed')
            ->where('tickets_status', 'pending')
            ->where('created_at', '<=', $staleThreshold)
            ->limit(100)
            ->get();

        if ($staleOrders->isEmpty()) {
            $this->info('No stale pending ticket orders detected.');
            return self::SUCCESS;
        }

        $recovered = 0;
        foreach ($staleOrders as $order) {
            GenerateTicketsJob::dispatch($order->id);
            $recovered++;
            Log::info("ReconcileTicketGenerationCommand: Re-dispatched ticket generation for order {$order->id}");
        }

        $this->info("Reconciled and re-dispatched ticket generation for {$recovered} order(s).");

        return self::SUCCESS;
    }
}
