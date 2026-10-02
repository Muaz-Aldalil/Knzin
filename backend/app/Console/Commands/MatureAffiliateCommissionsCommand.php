<?php

namespace App\Console\Commands;

use App\Models\AffiliateLedgerEntry;
use Illuminate\Console\Command;

class MatureAffiliateCommissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:mature-commissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Transition matured pending affiliate sales commissions past their holding period to available';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();
        $maturedCount = 0;

        // Process in bounded batches to avoid unbounded row locks
        do {
            $entryIds = AffiliateLedgerEntry::where('entry_type', 'sales_commission')
                ->where('status', 'pending')
                ->whereNotNull('matures_at')
                ->where('matures_at', '<=', $now)
                ->limit(500)
                ->pluck('id');

            if ($entryIds->isEmpty()) {
                break;
            }

            $affected = AffiliateLedgerEntry::whereIn('id', $entryIds)
                ->update(['status' => 'available']);

            $maturedCount += $affected;
        } while ($entryIds->count() === 500);

        $this->info("Successfully matured {$maturedCount} affiliate sales commission ledger entry(ies).");

        return self::SUCCESS;
    }
}
