<?php

use Laravel\Sanctum\Sanctum;

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'dogyepaper.com,www.dogyepaper.com,api.dogyepaper.com')),

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'verify_csrf' => Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    ],

    'provider' => 'users',

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],

    'prefix' => 'api',

    'domain' => env('SANCTUM_DOMAIN'),

    'features' => [
        'abilities' => true,
        'expiration' => false,
        'verify_csrf' => true,
    ],
];
