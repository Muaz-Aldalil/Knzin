<?php

namespace App\Exceptions;

use RuntimeException;

class CoPrizeApprovalsIncompleteException extends RuntimeException
{
    public function __construct(
        string $message = 'Dual approvals incomplete for co-prize release.',
        public array $data = [],
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}
