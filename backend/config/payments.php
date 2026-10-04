<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway Driver
    |--------------------------------------------------------------------------
    |
    | Supported: "simulator", "zaincash", "asiahawala"
    |
    */
    'default' => env('PAYMENT_DEFAULT_GATEWAY', 'simulator'),

    /*
    |--------------------------------------------------------------------------
    | Simulator Enabled Flag
    |--------------------------------------------------------------------------
    |
    | When true or in testing/local environment, fallback to deterministic
    | SimulatorDriver without making external telco network calls.
    |
    */
    'simulator_enabled' => (bool) env('KNZIN_PAYMENT_SIMULATOR', true),

    /*
    |--------------------------------------------------------------------------
    | Standard Market Iraqi Dinar Integer Denominations (Decision D-2)
    |--------------------------------------------------------------------------
    */
    'amounts' => [
        'part' => 2600,     // $2.00 part -> 2,600 IQD (1 sweepstakes ticket)
        'bundle' => 13000,  // $10.00 bundle -> 13,000 IQD (15 sweepstakes tickets)
    ],

    /*
    |--------------------------------------------------------------------------
    | Lifecycle Timers (Decisions D-5)
    |--------------------------------------------------------------------------
    */
    'order_ttl_hours' => 24,
    'session_ttl_minutes' => 30,

    /*
    |--------------------------------------------------------------------------
    | Outbound HTTP Network Policies
    |--------------------------------------------------------------------------
    */
    'http_timeout_seconds' => 10,
    'http_retries' => 2,

    /*
    |--------------------------------------------------------------------------
    | Gateway Specific Configurations
    |--------------------------------------------------------------------------
    */
    'gateways' => [
        'zaincash' => [
            'msisdn' => env('ZAINCASH_MSISDN', '9647833000000'),
            'secret' => env('ZAINCASH_SECRET', 'test_secret_key_change_in_production'),
            'merchant_id' => env('ZAINCASH_MERCHANT_ID', '5ff8561dad82562d9502e614'),
            'is_production' => (bool) env('ZAINCASH_IS_PRODUCTION', false),
            'init_url' => env(
                'ZAINCASH_INIT_URL',
                env('ZAINCASH_IS_PRODUCTION', false)
                    ? 'https://api.zaincash.iq/transaction/init'
                    : 'https://test.zaincash.iq/transaction/init'
            ),
            'checkout_base_url' => env(
                'ZAINCASH_CHECKOUT_BASE_URL',
                env('ZAINCASH_IS_PRODUCTION', false)
                    ? 'https://api.zaincash.iq/transaction/pay'
                    : 'https://test.zaincash.iq/transaction/pay'
            ),
            'status_url' => env(
                'ZAINCASH_STATUS_URL',
                env('ZAINCASH_IS_PRODUCTION', false)
                    ? 'https://api.zaincash.iq/transaction/get'
                    : 'https://test.zaincash.iq/transaction/get'
            ),
            'callback_url' => env('ZAINCASH_CALLBACK_URL', 'http://127.0.0.1:8000/api/v1/payments/webhooks/zaincash'),
        ],

        'asiahawala' => [
            'merchant_id' => env('ASIAHAWALA_MERCHANT_ID', 'AH_TEST_MERCHANT_01'),
            'api_key' => env('ASIAHAWALA_API_KEY', 'ah_test_api_key_12345'),
            'secret_key' => env('ASIAHAWALA_SECRET_KEY', 'ah_test_secret_key_67890'),
            'endpoint' => env('ASIAHAWALA_ENDPOINT', 'https://sandbox.asiahawala.iq'),
            'callback_url' => env('ASIAHAWALA_CALLBACK_URL', 'http://127.0.0.1:8000/api/v1/payments/webhooks/asiahawala'),
        ],

        'simulator' => [
            'name' => 'KNZiN Deterministic Payment Sandbox Simulator',
            'callback_url' => 'http://127.0.0.1:8000/api/v1/payments/webhooks/simulator',
        ],
    ],

];
