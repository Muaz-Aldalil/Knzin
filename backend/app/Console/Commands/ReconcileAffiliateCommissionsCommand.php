<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\AffiliateCommissionService;
use Illuminate\Console\Command;

class ReconcileAffiliateCommissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:reconcile-commissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Detect completed referred orders missing sales commission ledger entries and safely backfill them idempotently';

    /**
     * Execute the console command.
     */
    public function handle(AffiliateCommissionService $commissionService): int
    {
        $this->info('Scanning completed referred orders for missing commission ledger entries...');

        // Find completed orders with referral attribution but no sales_commission ledger entry
        $orders = Order::where('status', 'completed')
            ->whereHas('referralAttribution')
            ->whereDoesntHave('affiliateLedgerEntries', function ($query) {
                $query->where('entry_type', 'sales_commission');
            })
            ->limit(500)
            ->get();

        $reconciledCount = 0;

        foreach ($orders as $order) {
            $entry = $commissionService->creditSalesCommission($order);
            if ($entry !== null) {
                $reconciledCount++;
                $this->line("Reconciled commission for order {$order->order_number}: entry ID {$entry->id}");
            }
        }

        $this->info("Commission reconciliation complete. Backfilled {$reconciledCount} order(s).");

        return self::SUCCESS;
    }
}
