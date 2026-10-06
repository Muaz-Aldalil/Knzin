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

    /*
    |--------------------------------------------------------------------------
    | Feature 006: Affiliate & Referral Engine Policy Configuration
    |--------------------------------------------------------------------------
    |
    | Centralized financial and attribution constants:
    | - commission_rate_bps: 2500 (25.00% direct course sales commission)
    | - payout_min_cents: 5000 ($50.00 default baseline minimum withdrawal)
    | - maturation_hours: 24 (24-hour maturation hold for sales commissions)
    | - cookie_duration_days: 30 (30-day last-click attribution window)
    | - co_prize_rate_bps: 4000 (40.00% marketing pool grand-prize co-share)
    |
    */
    'affiliate' => [
        'commission_rate_bps' => (int) env('KNZIN_AFFILIATE_COMMISSION_RATE_BPS', 2500),
        'payout_min_cents' => (int) env('KNZIN_AFFILIATE_PAYOUT_MIN_CENTS', 5000),
        'maturation_hours' => (int) env('KNZIN_AFFILIATE_MATURATION_HOURS', 24),
        'cookie_duration_days' => (int) env('KNZIN_AFFILIATE_COOKIE_DURATION_DAYS', 30),
        'co_prize_rate_bps' => (int) env('KNZIN_AFFILIATE_CO_PRIZE_RATE_BPS', 4000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication & Verification Security
    |--------------------------------------------------------------------------
    */
    'auth' => [
        'expose_dev_otp' => (bool) env('KNZIN_EXPOSE_DEV_OTP', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Administrative Provisioning & Bootstrap
    |--------------------------------------------------------------------------
    |
    | Deployment secret token used for the one-time out-of-band bootstrap
    | of the first Administrator when zero active administrators exist.
    |
    */
    'admin' => [
        'bootstrap_token' => env('KNZIN_ADMIN_BOOTSTRAP_TOKEN', env('APP_ENV') === 'production' ? null : 'knzin-bootstrap-secret-change-in-prod'),
        'session_max_age_minutes' => (int) env('KNZIN_ADMIN_SESSION_MAX_AGE_MINUTES', 480),
    ],

    /*
    |--------------------------------------------------------------------------
    | Trusted Subsystem Shared Secrets
    |--------------------------------------------------------------------------
    |
    | Cryptographic tokens for internal trusted subsystems issuing authoritative
    | domain approvals (KYC, Draw Integrity) out-of-band.
    |
    */
    'subsystems' => [
        'compliance_kyc_secret' => env('KNZIN_COMPLIANCE_KYC_SECRET', env('APP_ENV') === 'production' ? null : 'knzin-kyc-subsystem-auth-secret-default'),
        'draw_audit_secret' => env('KNZIN_DRAW_AUDIT_SECRET', env('APP_ENV') === 'production' ? null : 'knzin-draw-audit-subsystem-auth-secret-default'),
    ],
];

