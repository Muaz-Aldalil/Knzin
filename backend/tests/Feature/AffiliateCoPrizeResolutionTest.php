<?php

namespace Tests\Feature;

use App\Models\AdminCapability;
use App\Models\AffiliateLedgerEntry;
use App\Models\ApprovalRecord;
use App\Models\Course;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Ticket;
use App\Models\User;
use App\Services\AffiliateCoPrizeService;
use App\Services\ApprovalRegistryService;
use App\Services\OrderService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AffiliateCoPrizeResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $orderService;
    protected AffiliateCoPrizeService $coPrizeService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
        $this->seed(\Database\Seeders\PromotionalDrawSeeder::class);
        $this->orderService = app(OrderService::class);
        $this->coPrizeService = app(AffiliateCoPrizeService::class);
    }

    protected function issueTestKyc(string $userId, string $status = 'approved', ?string $source = 'compliance_kyc_subsystem'): ApprovalRecord
    {
        return app(ApprovalRegistryService::class)->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: $userId,
            status: $status,
            source: $source ?? 'compliance_kyc_subsystem',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
        );
    }

    protected function issueTestDrawAudit(string $drawId, string $status = 'approved', ?string $source = 'draw_audit_engine'): ApprovalRecord
    {
        return app(ApprovalRegistryService::class)->issueApproval(
            approvalType: 'draw_integrity',
            subjectType: 'draw',
            subjectId: $drawId,
            status: $status,
            source: $source ?? 'draw_audit_engine',
            systemPrincipal: 'draw_audit_engine',
            systemSecret: (string) config('knzin.subsystems.draw_audit_secret')
        );
    }

    protected function revokeTestApproval(string $approvalId, string $reason, string $type = 'kyc'): ApprovalRecord
    {
        $principal = ($type === 'kyc') ? 'compliance_kyc_subsystem' : 'draw_audit_engine';
        $secret = ($type === 'kyc') ? config('knzin.subsystems.compliance_kyc_secret') : config('knzin.subsystems.draw_audit_secret');

        return app(ApprovalRegistryService::class)->revokeApproval(
            approvalId: $approvalId,
            reason: $reason,
            systemPrincipal: $principal,
            systemSecret: (string) $secret
        );
    }

    protected function supersedeTestApproval(string $approvalId, string $newStatus = 'pending', string $type = 'kyc'): ApprovalRecord
    {
        $principal = ($type === 'kyc') ? 'compliance_kyc_subsystem' : 'draw_audit_engine';
        $secret = ($type === 'kyc') ? config('knzin.subsystems.compliance_kyc_secret') : config('knzin.subsystems.draw_audit_secret');

        return app(ApprovalRegistryService::class)->supersedeApproval(
            existingApprovalId: $approvalId,
            newStatus: $newStatus,
            source: $principal,
            systemPrincipal: $principal,
            systemSecret: (string) $secret
        );
    }

    protected function createReferredWinningTicket(string $referrerCode = 'LRN-PATRON', string $ticketSerial = 'KNZ-26-WINN-7777'): array
    {
        $referrer = User::factory()->create(['learner_code' => $referrerCode]);
        $buyer = User::factory()->create();
        $course = Course::first();

        $res = $this->orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
            'referral_code' => $referrerCode,
        ]);
        $order = $res['order'];

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'user_id' => $buyer->id,
            'serial_number' => $ticketSerial,
            'order_ticket_index' => 1,
            'sequence_number' => 101,
            'tier' => 'grand_prize',
            'status' => 'active',
        ]);

        $draw = Draw::firstOrFail();
        $drawWinner = DrawWinner::create([
            'draw_id' => $draw->id,
            'prize_id' => null,
            'winning_ticket_serial' => $ticketSerial,
            'winner_masked_name' => 'John D***',
            'winner_governorate' => 'Baghdad',
            'prize_delivered' => true,
            'drawn_at' => now(),
        ]);

        return [
            'referrer' => $referrer,
            'buyer' => $buyer,
            'order' => $order,
            'ticket' => $ticket,
            'draw' => $draw,
            'drawWinner' => $drawWinner,
        ];
    }

    public function test_referred_winning_ticket_awards_40_percent_pending_co_prize_with_zero_winner_deduction(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-PATRON', 'KNZ-26-WINN-7777');
        $grandPrizeCents = 1_000_000; // $10,000

        $entry = $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, $grandPrizeCents, $ctx['buyer']->id);

        $this->assertNotNull($entry, 'Co-prize ledger entry must be created for referred winning ticket');
        $this->assertEquals($ctx['referrer']->id, $entry->user_id);
        $this->assertEquals('co_prize_credit', $entry->entry_type);
        $this->assertEquals(400_000, $entry->amount_cents, 'Co-prize must be exactly 40% (400,000 cents)');
        $this->assertEquals('pending', $entry->status, 'Co-prize must be held in pending status under Option C');
        $this->assertNull($entry->matures_at, 'Option C co-prize has no auto-timer hold; requires trusted approval');

        // Replay attempt is strictly idempotent
        $replayEntry = $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, $grandPrizeCents, $ctx['buyer']->id);
        $this->assertEquals($entry->id, $replayEntry->id);
        $this->assertEquals(1, AffiliateLedgerEntry::where('idempotency_key', "co_prize_ticket_{$ctx['ticket']->serial_number}")->count());
    }

    public function test_valid_kyc_and_valid_draw_audit_permits_co_prize_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-VALID', 'KNZ-26-VAL-1111');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        // 1. Authoritative KYC Approval via trusted application boundary
        $this->issueTestKyc((string) $ctx['buyer']->id);

        // 2. Authoritative Draw Integrity Audit Approval via trusted application boundary
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        $released = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertNotNull($released);
        $this->assertEquals('available', $released->status, 'Co-prize transitions to available when both KYC and Draw Audit approvals are fresh and valid');
    }

    public function test_repeated_release_remains_idempotent(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-IDEMP', 'KNZ-26-IDEM-2222');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        $this->issueTestKyc((string) $ctx['buyer']->id);
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        $release1 = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('available', $release1->status);

        $release2 = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('available', $release2->status);
        $this->assertEquals($release1->id, $release2->id);
    }

    public function test_missing_kyc_approval_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-NOKYC', 'KNZ-26-NOK-3333');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        // Only Draw Audit exists, KYC missing
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Missing KYC approval must block co-prize release');
    }

    public function test_missing_draw_audit_approval_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-NOAUD', 'KNZ-26-NOA-4444');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        // Only KYC exists, Draw Audit missing
        $this->issueTestKyc((string) $ctx['buyer']->id);

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Missing Draw Audit approval must block co-prize release');
    }

    public function test_revoked_kyc_approval_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-REVKYC', 'KNZ-26-RVK-5555');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        $kyc = $this->issueTestKyc((string) $ctx['buyer']->id);
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        // Revoke KYC via trusted registry
        $this->revokeTestApproval($kyc->approval_id, 'Document forgery detected in re-verification', 'kyc');

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Revoked KYC approval must strictly block co-prize release');
    }

    public function test_revoked_draw_audit_approval_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-REVAUD', 'KNZ-26-RVA-6666');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        $this->issueTestKyc((string) $ctx['buyer']->id);
        $audit = $this->issueTestDrawAudit((string) $ctx['draw']->id);

        // Revoke Draw Audit via trusted registry
        $this->revokeTestApproval($audit->approval_id, 'Integrity hash mismatch in telemetry verification', 'draw_integrity');

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Revoked Draw Audit approval must strictly block co-prize release');
    }

    public function test_superseded_kyc_approval_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-SUPKYC', 'KNZ-26-SPK-7777');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        $kyc = $this->issueTestKyc((string) $ctx['buyer']->id);
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        // Superseded by newer revision via trusted registry
        $this->supersedeTestApproval($kyc->approval_id, 'pending', 'kyc');

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Superseded KYC approval must block co-prize release until new version is approved');
    }

    public function test_superseded_draw_audit_approval_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-SUPAUD', 'KNZ-26-SPA-8888');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        $this->issueTestKyc((string) $ctx['buyer']->id);
        $audit = $this->issueTestDrawAudit((string) $ctx['draw']->id);

        // Superseded by new audit run via trusted registry
        $this->supersedeTestApproval($audit->approval_id, 'pending', 'draw_integrity');

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Superseded Draw Audit approval must block co-prize release until new version is approved');
    }

    public function test_approval_belonging_to_another_winner_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-WRGUSR', 'KNZ-26-WGU-9999');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        $otherUser = User::factory()->create();

        // KYC approval exists for OTHER user, NOT the winner
        $this->issueTestKyc((string) $otherUser->id);
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Approval belonging to another user cannot authorize this winner co-prize release');
    }

    public function test_approval_belonging_to_another_draw_blocks_release(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-WRGDRW', 'KNZ-26-WGD-1010');
        $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);

        $this->issueTestKyc((string) $ctx['buyer']->id);

        $otherDraw = Draw::where('id', '!=', $ctx['draw']->id)->firstOrFail();

        // Draw audit exists for a different draw ID
        $this->issueTestDrawAudit((string) $otherDraw->id);

        $res = $this->coPrizeService->releaseCoPrize($ctx['ticket']->serial_number);
        $this->assertEquals('pending', $res->status, 'Approval belonging to another draw cannot authorize this co-prize release');
    }

    public function test_organic_direct_ticket_win_awards_zero_co_prize(): void
    {
        $buyer = User::factory()->create();
        $course = Course::first();

        $res = $this->orderService->createOrder([
            'email' => $buyer->email,
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'legal_shield_text' => 'canonical text',
            'idempotency_key' => (string) Str::uuid(),
        ]);
        $order = $res['order'];

        $ticketSerial = 'KNZ-26-ORGA-8888';
        Ticket::create([
            'order_id' => $order->id,
            'user_id' => $buyer->id,
            'serial_number' => $ticketSerial,
            'order_ticket_index' => 1,
            'sequence_number' => 102,
            'tier' => 'grand_prize',
            'status' => 'active',
        ]);

        $entry = $this->coPrizeService->awardCoPrize($ticketSerial, 1_000_000, $buyer->id);
        $this->assertNull($entry, 'Direct organic ticket must not generate a co-prize');
    }

    public function test_disqualified_winner_cancels_co_prize(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-DISQ', 'KNZ-26-DISQ-9999');
        $entry = $this->coPrizeService->awardCoPrize($ctx['ticket']->serial_number, 1_000_000, $ctx['buyer']->id);
        $this->assertEquals('pending', $entry->status);

        $cancelled = $this->coPrizeService->cancelCoPrize($ctx['ticket']->serial_number, 'Failed KYC verification');
        $this->assertNotNull($cancelled);
        $this->assertEquals('cancelled', $cancelled->status);
    }

    public function test_post_release_revocation_preserves_original_entry_and_requires_authorized_admin_adjudication(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-POSTREV', 'KNZ-26-POST-9999');
        $serial = $ctx['ticket']->serial_number;

        // 1. Award and release
        $entry = $this->coPrizeService->awardCoPrize($serial, 1_000_000, $ctx['buyer']->id);
        $this->assertEquals(400_000, $entry->amount_cents);

        $kyc = $this->issueTestKyc((string) $ctx['buyer']->id);
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        $released = $this->coPrizeService->releaseCoPrize($serial);
        $this->assertEquals('available', $released->status);

        // 2. Post-release revocation occurs in compliance domain
        $this->revokeTestApproval($kyc->approval_id, 'Post-draw identification fraudulent document uncovered', 'kyc');

        // Check: Original ledger entry is strictly preserved (never mutated or deleted)
        $originalRefreshed = $entry->fresh();
        $this->assertNotNull($originalRefreshed);
        $this->assertEquals(400_000, $originalRefreshed->amount_cents, 'Original entry amount_cents must NEVER be rewritten');
        $this->assertEquals('available', $originalRefreshed->status, 'Original entry status remains available; financial history preserved');

        // Check: Attempted adjudication by ordinary user throws AuthorizationException
        $ordinaryUser = User::factory()->create();
        $this->expectException(AuthorizationException::class);
        $this->coPrizeService->adjudicateCoPrizeRevocation($serial, 'Clawback after KYC fraud', $ordinaryUser);
    }

    public function test_authorized_admin_adjudication_creates_compensating_reversal_entry(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-ADJUD', 'KNZ-26-ADJ-8888');
        $serial = $ctx['ticket']->serial_number;

        $entry = $this->coPrizeService->awardCoPrize($serial, 1_000_000, $ctx['buyer']->id);

        $this->issueTestKyc((string) $ctx['buyer']->id);
        $this->issueTestDrawAudit((string) $ctx['draw']->id);

        $this->coPrizeService->releaseCoPrize($serial);

        // Authorized Admin performs adjudication
        $admin = User::factory()->create(['email' => 'admin-adjudicator@knzin.com']);
        $admin->grantCapability('adjudicate_affiliate_coprize');

        $reversalEntry = $this->coPrizeService->adjudicateCoPrizeRevocation(
            $serial,
            'Formal compliance clawback after post-release KYC audit failure',
            $admin
        );

        $this->assertNotNull($reversalEntry);
        $this->assertEquals('reversal_debit', $reversalEntry->entry_type);
        $this->assertEquals(-400_000, $reversalEntry->amount_cents, 'Reversal must be compensating debit equal to negative of original credit');
        $this->assertEquals('cleared', $reversalEntry->status);
        $this->assertEquals("co_prize_reversal_{$serial}", $reversalEntry->idempotency_key);

        // Original entry is preserved intact
        $originalEntry = $entry->fresh();
        $this->assertEquals(400_000, $originalEntry->amount_cents);
        $this->assertEquals('available', $originalEntry->status);

        // Net balance across subledger for this co-prize is now 0 (400,000 + -400,000)
        $subledgerNet = AffiliateLedgerEntry::where('user_id', $ctx['referrer']->id)->sum('amount_cents');
        $this->assertEquals(0, $subledgerNet, 'Net subledger for co-prize award and compensating reversal must be 0');

        // Repeated adjudication is idempotent
        $replayReversal = $this->coPrizeService->adjudicateCoPrizeRevocation(
            $serial,
            'Formal compliance clawback retry',
            $admin
        );
        $this->assertEquals($reversalEntry->id, $replayReversal->id);
    }

    public function test_untrusted_caller_cannot_issue_kyc_or_draw_approval(): void
    {
        $registry = app(\App\Services\ApprovalRegistryServiceInterface::class);
        $ordinaryUser = User::factory()->create();
        $targetUser = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage('Unauthorized actor cannot issue or modify KYC approvals.');

        $registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'untrusted_caller',
            authorizer: $ordinaryUser
        );
    }

    public function test_approval_registry_enforces_versioning_and_prevents_reactivating_terminal_state(): void
    {
        $registry = app(\App\Services\ApprovalRegistryServiceInterface::class);
        $targetUser = User::factory()->create();

        // 1. Issue v1 via trusted system principal with secret
        $v1 = $registry->issueApproval(
            approvalType: 'kyc',
            subjectType: 'user',
            subjectId: (string) $targetUser->id,
            status: 'approved',
            source: 'compliance_kyc_subsystem',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
        );
        $this->assertEquals(1, $v1->version);
        $this->assertEquals('approved', $v1->status);

        // 2. Revoke v1
        $revoked = $registry->revokeApproval(
            approvalId: $v1->approval_id,
            reason: 'Document validation discrepancy',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
        );
        $this->assertEquals('revoked', $revoked->status);

        // 3. Invariant: Terminal revoked state cannot be superseded or reactivated
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage("Cannot supersede a revoked approval record [{$v1->approval_id}].");

        $registry->supersedeApproval(
            existingApprovalId: $v1->approval_id,
            newStatus: 'approved',
            source: 'compliance_kyc_subsystem',
            systemPrincipal: 'compliance_kyc_subsystem',
            systemSecret: (string) config('knzin.subsystems.compliance_kyc_secret')
        );
    }

    public function test_database_enforces_unique_approval_version_constraint(): void
    {
        $targetUser = User::factory()->create();

        ApprovalRecord::permitWrite(function () use ($targetUser) {
            ApprovalRecord::create([
                'approval_id' => 'KYC-UQ-V1',
                'approval_type' => 'kyc',
                'subject_type' => 'user',
                'subject_id' => (string) $targetUser->id,
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => 'compliance_officer_1',
                'source' => 'compliance_kyc_subsystem',
                'version' => 1,
            ]);

            // Attempt duplicate version for same type, subject_type, and subject_id
            $this->expectException(\Illuminate\Database\QueryException::class);

            ApprovalRecord::create([
                'approval_id' => 'KYC-UQ-V1-DUP',
                'approval_type' => 'kyc',
                'subject_type' => 'user',
                'subject_id' => (string) $targetUser->id,
                'status' => 'pending',
                'approved_at' => null,
                'approved_by' => 'imposter',
                'source' => 'compliance_kyc_subsystem',
                'version' => 1,
            ]);
        });
    }

    public function test_settings_admin_cannot_adjudicate_coprize_reversal(): void
    {
        $ctx = $this->createReferredWinningTicket('LRN-ADJFAIL', 'KNZ-26-ADJ-FAIL');
        $serial = $ctx['ticket']->serial_number;

        $settingsAdmin = User::factory()->create();
        $settingsAdmin->grantCapability('manage_platform_settings', null, 'bootstrap');

        $this->expectException(AuthorizationException::class);
        $this->expectExceptionMessage("lacks required capability 'adjudicate_affiliate_coprize'");

        $this->coPrizeService->adjudicateCoPrizeRevocation(
            $serial,
            'Unauthorized attempt by settings admin',
            $settingsAdmin
        );
    }
}
