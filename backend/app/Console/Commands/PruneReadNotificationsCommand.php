<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneReadNotificationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:prune-read';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prune read notifications older than 60 days while retaining unread notifications indefinitely';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $cutoff = Carbon::now()->subDays(60);

        // Retention policy (DEC-008, FR-026):
        // Read notifications older than 60 days are permanently purged to prevent database bloat.
        // Unread notifications are NEVER purged and must remain available indefinitely.
        $deletedCount = DB::table('notifications')
            ->whereNotNull('read_at')
            ->where('read_at', '<=', $cutoff)
            ->delete();

        $this->info("Pruned {$deletedCount} read notification(s) older than 60 days.");

        return Command::SUCCESS;
    }
}
