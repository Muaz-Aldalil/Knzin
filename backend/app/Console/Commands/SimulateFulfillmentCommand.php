<?php

namespace App\Console\Commands;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SimulateFulfillmentCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:simulate-fulfillment 
                            {--email=tester@example.com : Learner email address}
                            {--course= : Course slug or UUID}
                            {--type=bundle : Purchase item type (bundle or part)}
                            {--part= : Course part number (when type is part)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simulate completed order fulfillment and queued ticket minting (non-production only)';

    /**
     * Execute the console command.
     */
    public function handle(OrderService $orderService): int
    {
        // Strict guard: strictly prohibited in production
        if (app()->environment('production')) {
            $this->error('The fulfillment simulator is strictly prohibited in production environments.');
            return self::FAILURE;
        }

        $email = strtolower(trim((string) $this->option('email')));
        $courseInput = (string) $this->option('course');
        $type = strtolower((string) $this->option('type'));
        $partNumber = $this->option('part');

        // Resolve course
        $course = Course::where('slug', $courseInput)->orWhere('id', $courseInput)->first();
        if (!$course) {
            $course = Course::where('is_published', true)->first();
        }

        if (!$course) {
            $this->error('No course found to simulate fulfillment.');
            return self::FAILURE;
        }

        $coursePart = null;
        if ($type === 'part') {
            $partQuery = CoursePart::where('course_id', $course->id);
            if ($partNumber) {
                $partQuery->where('part_number', (int) $partNumber);
            } else {
                $partQuery->where('part_number', '>', 1);
            }
            $coursePart = $partQuery->first();

            if (!$coursePart) {
                $this->error("Part {$partNumber} not found for course {$course->slug}.");
                return self::FAILURE;
            }
        }

        // Resolve or create user
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'display_name' => 'Simulated Learner',
                'auth_provider' => 'guest',
                'status' => 'active',
            ]
        );

        $totalAmountCents = $type === 'bundle' ? $course->bundle_price_cents : $coursePart->part_price_cents;
        $promotionalTickets = $type === 'bundle' ? $course->bundle_promotional_tickets : $coursePart->part_promotional_tickets;
        $displayPriceLabel = $type === 'bundle' ? $course->display_price_label : $coursePart->display_price_label;
        $paidAmountGateway = intdiv($totalAmountCents * 131, 10);

        // Create completed order
        $order = Order::create([
            'order_number' => 'KNZ-SIM-' . date('Y') . '-' . strtoupper(Str::random(6)),
            'user_id' => $user->id,
            'total_amount_cents' => $totalAmountCents,
            'currency' => 'USD',
            'exchange_rate' => OrderService::FROZEN_EXCHANGE_RATE,
            'paid_amount_gateway' => $paidAmountGateway,
            'display_price_label' => $displayPriceLabel,
            'promotional_tickets_granted' => $promotionalTickets,
            'status' => 'pending',
            'tickets_status' => 'pending',
            'idempotency_key' => 'sim_' . Str::uuid()->toString(),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => now(),
            'expires_at' => now()->addHours(48),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_part_id' => $coursePart?->id,
            'item_type' => $type,
            'price_cents' => $totalAmountCents,
            'promotional_tickets_granted' => $promotionalTickets,
        ]);

        // Fulfill order
        $fulfilled = $orderService->fulfillOrder($order);

        $this->info("Simulated completed fulfillment for order: {$fulfilled->order_number}");
        $this->line("User: {$user->email} ({$user->id})");
        $this->line("Course: {$course->title_ar} [{$type}]");
        $this->line("Tickets Entitled: {$promotionalTickets}");
        $this->line("Status: {$fulfilled->status} | Tickets Status: {$fulfilled->tickets_status}");

        return self::SUCCESS;
    }
}
