<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\OrderService;
use App\Services\Payments\PaymentGatewayManager;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReconcilePaymentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:reconcile {--dry-run : Simulate reconciliation without updating database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcile dropped/stale pending payment transactions with payment gateways and fulfill cleared orders';

    public function __construct(
        protected PaymentGatewayManager $paymentManager,
        protected OrderService $orderService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = (bool) $this->option('dry-run');

        // Target transactions older than 10 minutes and younger than 24 hours
        $staleThreshold = Carbon::now('UTC')->subMinutes(10);
        $expiredThreshold = Carbon::now('UTC')->subHours(24);

        $transactions = PaymentTransaction::with('order')
            ->where('status', 'initiated')
            ->where('created_at', '<=', $staleThreshold)
            ->where('created_at', '>=', $expiredThreshold)
            ->limit(100)
            ->get();

        if ($transactions->isEmpty()) {
            $this->info('No stale pending payment transactions requiring reconciliation.');
            return self::SUCCESS;
        }

        $this->info(sprintf('Found %d stale transaction(s) to reconcile.%s', 
            $transactions->count(), 
            $isDryRun ? ' [DRY RUN MODE]' : ''
        ));

        $recovered = 0;
        $failed = 0;
        $expired = 0;

        foreach ($transactions as $txn) {
            $order = $txn->order;
            if (!$order) {
                continue;
            }

            // If order has already expired
            if ($order->isExpired() || ($order->expires_at && $order->expires_at->isPast())) {
                if (!$isDryRun) {
                    $txn->update(['status' => 'expired']);
                }
                $expired++;
                continue;
            }

            try {
                $driver = $this->paymentManager->driver($txn->gateway);
                $status = $driver->checkStatus($txn);

                $this->line(sprintf('Transaction %s (%s): Gateway status = %s', $txn->id, $txn->gateway, $status));

                if ($isDryRun) {
                    continue;
                }

                if ($status === 'success') {
                    DB::transaction(function () use ($txn, $order) {
                        /** @var Order $lockedOrder */
                        $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();
                        /** @var PaymentTransaction $lockedTxn */
                        $lockedTxn = PaymentTransaction::where('id', $txn->id)->lockForUpdate()->firstOrFail();

                        if ($lockedOrder->status === 'completed') {
                            $lockedTxn->update([
                                'status' => 'duplicate_charge_flagged',
                                'paid_at' => now(),
                            ]);
                            Log::warning("ReconcilePaymentsCommand: Order {$lockedOrder->order_number} already completed. Marked txn {$lockedTxn->id} as duplicate_charge_flagged.");
                            return;
                        }

                        $lockedTxn->update([
                            'status' => 'success',
                            'paid_at' => now(),
                        ]);

                        $this->orderService->fulfillOrder($lockedOrder);

                        Log::info("ReconcilePaymentsCommand: Recovered and fulfilled order {$lockedOrder->order_number} (Txn: {$lockedTxn->id})");
                    });

                    $recovered++;
                } elseif (in_array($status, ['failed', 'canceled', 'cancelled'], true)) {
                    $txn->update(['status' => 'failed']);
                    $failed++;
                    Log::info("ReconcilePaymentsCommand: Marked transaction {$txn->id} as failed");
                } elseif ($status === 'expired') {
                    $txn->update(['status' => 'expired']);
                    $expired++;
                    Log::info("ReconcilePaymentsCommand: Marked transaction {$txn->id} as expired");
                }
            } catch (\Throwable $e) {
                Log::error("ReconcilePaymentsCommand: Error reconciling transaction {$txn->id}: " . $e->getMessage(), [
                    'exception' => $e,
                ]);
            }
        }

        $this->info(sprintf(
            'Reconciliation complete. Recovered: %d, Failed: %d, Expired: %d%s',
            $recovered,
            $failed,
            $expired,
            $isDryRun ? ' (No database mutations applied)' : ''
        ));

        return self::SUCCESS;
    }
}
