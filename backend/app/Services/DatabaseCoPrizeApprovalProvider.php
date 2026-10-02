<?php

namespace App\Services;

use App\Models\ApprovalRecord;
use App\Models\DrawWinner;
use App\Models\Ticket;

class DatabaseCoPrizeApprovalProvider implements CoPrizeApprovalProviderInterface
{
    /**
     * Retrieve trusted approval state and provenance for a winning ticket.
     */
    public function getApprovalState(string $winningTicketSerial): CoPrizeApprovalState
    {
        $drawWinner = DrawWinner::where('winning_ticket_serial', $winningTicketSerial)->first();
        $ticket = Ticket::where('serial_number', $winningTicketSerial)->first();

        if ($drawWinner === null || $ticket === null) {
            return new CoPrizeApprovalState(
                winningTicketSerial: $winningTicketSerial,
                kyc: new ApprovalProvenance(
                    approvalId: null,
                    approvalType: 'kyc',
                    subjectId: null,
                    status: 'not_found',
                    approvedAt: null,
                    approvedBy: null,
                    source: 'compliance_kyc_subsystem'
                ),
                drawIntegrity: new ApprovalProvenance(
                    approvalId: null,
                    approvalType: 'draw_integrity',
                    subjectId: null,
                    status: 'not_found',
                    approvedAt: null,
                    approvedBy: null,
                    source: 'draw_audit_engine'
                ),
                drawWinnerExists: false
            );
        }

        $winnerUserId = $ticket->user_id;
        $drawId = $drawWinner->draw_id;

        // 1. Resolve authoritative KYC approval for this exact winning user
        $kycRecord = ApprovalRecord::where('approval_type', 'kyc')
            ->where('subject_id', $winnerUserId)
            ->orderByDesc('version')
            ->first();

        $kycProvenance = $kycRecord !== null
            ? new ApprovalProvenance(
                approvalId: $kycRecord->approval_id,
                approvalType: 'kyc',
                subjectId: $kycRecord->subject_id,
                status: $kycRecord->status,
                approvedAt: $kycRecord->approved_at,
                approvedBy: $kycRecord->approved_by,
                source: $kycRecord->source ?? 'compliance_kyc_subsystem',
                version: $kycRecord->version,
                revokedAt: $kycRecord->revoked_at,
                revokedBy: $kycRecord->revoked_by,
                revocationReason: $kycRecord->revocation_reason,
                supersededAt: $kycRecord->superseded_at
            )
            : new ApprovalProvenance(
                approvalId: null,
                approvalType: 'kyc',
                subjectId: $winnerUserId,
                status: 'pending',
                approvedAt: null,
                approvedBy: null,
                source: 'compliance_kyc_subsystem'
            );

        // 2. Resolve authoritative Draw Integrity audit approval for this exact draw
        $drawAuditRecord = ApprovalRecord::where('approval_type', 'draw_integrity')
            ->where('subject_id', $drawId)
            ->orderByDesc('version')
            ->first();

        $drawAuditProvenance = $drawAuditRecord !== null
            ? new ApprovalProvenance(
                approvalId: $drawAuditRecord->approval_id,
                approvalType: 'draw_integrity',
                subjectId: $drawAuditRecord->subject_id,
                status: $drawAuditRecord->status,
                approvedAt: $drawAuditRecord->approved_at,
                approvedBy: $drawAuditRecord->approved_by,
                source: $drawAuditRecord->source ?? 'draw_audit_engine',
                version: $drawAuditRecord->version,
                revokedAt: $drawAuditRecord->revoked_at,
                revokedBy: $drawAuditRecord->revoked_by,
                revocationReason: $drawAuditRecord->revocation_reason,
                supersededAt: $drawAuditRecord->superseded_at
            )
            : new ApprovalProvenance(
                approvalId: null,
                approvalType: 'draw_integrity',
                subjectId: $drawId,
                status: 'pending',
                approvedAt: null,
                approvedBy: null,
                source: 'draw_audit_engine'
            );

        return new CoPrizeApprovalState(
            winningTicketSerial: $winningTicketSerial,
            kyc: $kycProvenance,
            drawIntegrity: $drawAuditProvenance,
            drawWinnerExists: true
        );
    }
}
