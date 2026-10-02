<?php

namespace App\Services;

interface CoPrizeApprovalProviderInterface
{
    /**
     * Retrieve trusted approval state and provenance for a winning ticket.
     */
    public function getApprovalState(string $winningTicketSerial): CoPrizeApprovalState;
}
