<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Ticket;
use App\Notifications\TicketIssuanceNotification;
use App\Services\TicketMintingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateTicketsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [5, 15, 30];

    /**
     * Create a new job instance.
     */
    public function __construct(public string $orderId)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(TicketMintingService $mintingService): void
    {
        $order = Order::find($this->orderId);

        if (!$order) {
            Log::warning("GenerateTicketsJob: Order {$this->orderId} not found.");
            return;
        }

        if ($order->status !== 'completed') {
            Log::info("GenerateTicketsJob: Order {$this->orderId} is in '{$order->status}' status, skipping ticket minting.");
            return;
        }

        if ($order->tickets_status === 'completed') {
            Log::info("GenerateTicketsJob: Order {$this->orderId} tickets already completed.");
            return;
        }

        try {
            $minted = $mintingService->mintForOrder($order);
            Log::info("GenerateTicketsJob: Successfully minted {$minted} tickets for order {$order->id}.");

            if ($minted > 0 && $order->user) {
                $notificationId = \Ramsey\Uuid\Uuid::uuid5(
                    \Ramsey\Uuid\Uuid::NAMESPACE_OID,
                    "ticket_issuance:{$order->id}:{$order->user_id}"
                )->toString();

                if (!\Illuminate\Support\Facades\DB::table('notifications')->where('id', $notificationId)->exists()) {
                    $serials = Ticket::where('order_id', $order->id)->pluck('serial_number')->toArray();
                    $order->user->notify(new TicketIssuanceNotification($order, $serials));
                }
            }
        } catch (\Throwable $e) {
            Log::error("GenerateTicketsJob: Failed to mint tickets for order {$order->id}: {$e->getMessage()}", [
                'exception' => $e,
            ]);
            throw $e;
        }
    }
}
