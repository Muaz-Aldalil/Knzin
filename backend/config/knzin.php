<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Promotional Ticket Configuration & Obfuscation Parameters
    |--------------------------------------------------------------------------
    |
    | Non-sequential permutation parameters for canonical Crockford Base32
    | ticket serials (KNZ-YY-XXXX-YYYY). Modulus is 2^40 (1,099,511,627,776).
    | Multiplier MUST be an odd integer (coprime to 2^40) to guarantee a
    | strictly bijective 1-to-1 mapping across sequence integers.
    |
    */
    'ticket_multiplier' => (int) env('KNZIN_TICKET_MULTIPLIER', 382910471923),
    'ticket_adder' => (int) env('KNZIN_TICKET_ADDER', 543219876543),
    'ticket_xor_mask' => (int) env('KNZIN_TICKET_XOR_MASK', 388062083674),
];
