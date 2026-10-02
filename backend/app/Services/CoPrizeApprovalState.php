<?php

namespace App\Services;

class CoPrizeApprovalState
{
    public function __construct(
        public readonly string $winningTicketSerial,
        public readonly ApprovalProvenance $kyc,
        public readonly ApprovalProvenance $drawIntegrity,
        public readonly bool $drawWinnerExists = true
    ) {}

    /**
     * Check if KYC approval is valid.
     */
    public function isKycApproved(): bool
    {
        return $this->kyc->isApproved();
    }

    /**
     * Check if Draw Integrity audit approval is valid.
     */
    public function isDrawIntegrityApproved(): bool
    {
        return $this->drawIntegrity->isApproved();
    }

    /**
     * Release invariant: KYC approval is valid AND draw-integrity approval is valid
     * AND originating DrawWinner record is verified.
     */
    public function isFullyApproved(): bool
    {
        return $this->drawWinnerExists && $this->isKycApproved() && $this->isDrawIntegrityApproved();
    }
}
