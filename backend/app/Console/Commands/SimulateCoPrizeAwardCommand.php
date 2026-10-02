<?php

namespace App\Console\Commands;

use App\Models\DrawWinner;
use App\Models\Ticket;
use App\Services\AffiliateCoPrizeService;
use App\Services\ApprovalRegistryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\App;

class SimulateCoPrizeAwardCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:test-co-prize-award 
                            {--ticket= : The winning ticket serial number} 
                            {--prize-cents=1000000 : Prize valuation in USD cents (default: $10,000)}
                            {--release : Immediately simulate trusted KYC and draw audit approval and release hold}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simulate 40% grand-prize co-share award for a winning ticket (Test & Staging only)';

    /**
     * Execute the console command.
     */
    public function handle(AffiliateCoPrizeService $service, ApprovalRegistryService $approvalRegistry): int
    {
        if (App::environment('production')) {
            $this->error('CRITICAL: This simulation command cannot be executed in production environment.');
            return self::FAILURE;
        }

        $ticketSerial = (string) $this->option('ticket');
        $prizeCents = (int) $this->option('prize-cents');
        $shouldRelease = (bool) $this->option('release');

        if (empty($ticketSerial)) {
            $this->error('The --ticket option is required.');
            return self::FAILURE;
        }

        $this->info("Evaluating 40% co-prize allocation for winning ticket: {$ticketSerial} (Prize: \${$prizeCents}/100)...");

        $entry = $service->awardCoPrize($ticketSerial, $prizeCents);

        if ($entry === null) {
            $this->warn("No co-prize allocated. Ticket either does not exist or was an organic, unreferred purchase.");
            return self::SUCCESS;
        }

        $this->info("Co-prize credited successfully:");
        $this->line(" - Entry ID: {$entry->id}");
        $this->line(" - Referrer User ID: {$entry->user_id}");
        $this->line(" - Amount: \${$entry->amount_cents}/100 ({$entry->amount_cents} cents)");
        $this->line(" - Status: {$entry->status} (Option C pending hold)");

        if ($shouldRelease) {
            $ticket = Ticket::where('serial_number', $ticketSerial)->first();
            $drawWinner = DrawWinner::where('winning_ticket_serial', $ticketSerial)->first();

            if ($ticket !== null && $drawWinner !== null) {
                // Populate authoritative KYC approval record via trusted application boundary
                $approvalRegistry->issueApproval(
                    approvalType: 'kyc',
                    subjectType: 'user',
                    subjectId: (string) $ticket->user_id,
                    status: 'approved',
                    source: 'compliance_kyc_subsystem',
                    systemPrincipal: 'compliance_kyc_subsystem',
                    systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
                );

                // Populate authoritative Draw Audit approval record via trusted application boundary
                $approvalRegistry->issueApproval(
                    approvalType: 'draw_integrity',
                    subjectType: 'draw',
                    subjectId: (string) $drawWinner->draw_id,
                    status: 'approved',
                    source: 'draw_audit_engine',
                    systemPrincipal: 'draw_audit_engine',
                    systemSecret: (string) config('knzin.subsystems.draw_audit_secret')
                );

                $released = $service->releaseCoPrize($ticketSerial);
                $this->info("Trusted KYC & Draw Audit verified: Status transitioned to '{$released->status}'.");
            }
        }


        return self::SUCCESS;
    }
}
