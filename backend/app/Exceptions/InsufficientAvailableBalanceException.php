<?php

namespace App\Exceptions;

use Exception;

class InsufficientAvailableBalanceException extends Exception
{
    public function __construct(
        public int $requestedAmountCents,
        public int $availableBalanceCents,
        public int $pendingBalanceCents,
        string $message = 'رصيدك المتاح للسحب حالياً غير كافٍ. قد تكون بعض العمولات ما زالت في فترة التعليق (24 ساعة).'
    ) {
        parent::__construct($message);
    }
}
