<?php

namespace App\Exceptions;

use Exception;

class PayoutThresholdUnmetException extends Exception
{
    public function __construct(
        public int $requestedAmountCents,
        public int $minimumThresholdCents,
        public int $availableBalanceCents,
        string $message = 'مبلغ السحب المطلوب أقل من الحد الأدنى المسموح به حالياً للسحب.'
    ) {
        parent::__construct($message);
    }
}
