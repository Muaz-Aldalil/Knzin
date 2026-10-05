<?php

namespace App\Console\Commands;

use App\Models\Draw;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\LiveDrawAlertNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class EvaluateDrawAlertsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:evaluate-draw-alerts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evaluate draws concluding within 15 minutes and dispatch live stream alerts to ticket holders';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = Carbon::now();
        $windowEnd = Carbon::now()->addMinutes(15);

        // Find published draws ending within the [now, now + 15m] window
        $draws = Draw::query()
            ->where('is_published', true)
            ->whereIn('status', ['upcoming', 'active'])
            ->whereBetween('ends_at', [$now, $windowEnd])
            ->get();

        $dispatchedCount = 0;

        foreach ($draws as $draw) {
            // Find users who hold promotional tickets
            $ticketUserIds = Ticket::query()->distinct()->pluck('user_id');
            $users = User::query()->whereIn('id', $ticketUserIds)->get();

            foreach ($users as $user) {
                $notificationId = Uuid::uuid5(
                    Uuid::NAMESPACE_OID,
                    "draw_15m:{$draw->id}:{$user->id}"
                )->toString();

                // Idempotency check: skip if alert was already dispatched to this user for this draw
                if (DB::table('notifications')->where('id', $notificationId)->exists()) {
                    continue;
                }

                $user->notify(new LiveDrawAlertNotification($draw, $user));
                $dispatchedCount++;
            }
        }

        $this->info("Processed {$dispatchedCount} live draw alert notifications across {$draws->count()} upcoming draws.");

        return Command::SUCCESS;
    }
}
