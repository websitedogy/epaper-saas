<?php

$csv = static fn (?string $value): array => array_values(array_filter(array_map(
    static fn (string $item): string => strtolower(trim($item)),
    explode(',', (string) $value),
)));

return [
    'server_ip' => env('DOMAIN_SERVER_IP'),
    'server_ips' => $csv(env('DOMAIN_SERVER_IPS', env('DOMAIN_SERVER_IP'))),
    'canonical_host' => env('DOMAIN_CANONICAL_HOST', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
    'wildcard_base' => strtolower((string) env('DOMAIN_WILDCARD_BASE', 'dogyepaper.com')),
    'cname_target' => strtolower((string) env('DOMAIN_CNAME_TARGET', 'tenants.dogyepaper.com')),
    'central_hosts' => $csv(env('DOMAIN_CENTRAL_HOSTS', 'dogy.localhost,dogyepaper.com,www.dogyepaper.com,api.dogyepaper.com')),
    'frontend_hosts' => $csv(env('DOMAIN_FRONTEND_HOSTS', 'dogyepaper.com,www.dogyepaper.com')),
    'ssl_auto_provision' => (bool) env('DOMAIN_SSL_AUTO_PROVISION', true),
    'ssl_provider' => env('DOMAIN_SSL_PROVIDER', 'caddy'),
    'ssl_command' => env('DOMAIN_SSL_COMMAND'),
    'ssl_email' => env('DOMAIN_SSL_EMAIL', env('MAIL_FROM_ADDRESS', 'ops@dogyepaper.com')),
    'tls_ask_token' => env('DOMAIN_TLS_ASK_TOKEN'),
    'servers' => array_values(array_filter([
        [
            'role' => 'app',
            'host' => env('SERVER_APP_HOST'),
            'ip' => env('SERVER_APP_IP', env('DOMAIN_SERVER_IP')),
        ],
        [
            'role' => 'worker',
            'host' => env('SERVER_WORKER_HOST'),
            'ip' => env('SERVER_WORKER_IP'),
        ],
        [
            'role' => 'frontend',
            'host' => env('SERVER_FRONTEND_HOST'),
            'ip' => env('SERVER_FRONTEND_IP'),
        ],
    ], static fn (array $server): bool => filled($server['host'] ?? null) || filled($server['ip'] ?? null))),
];
