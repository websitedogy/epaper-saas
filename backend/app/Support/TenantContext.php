<?php

namespace App\Support;

use App\Models\Customer;
use App\Models\Domain;
use Illuminate\Http\Request;

class TenantContext
{
    public static function hostFromRequest(Request $request): string
    {
        $candidates = [
            $request->headers->get('X-Tenant-Host'),
            $request->headers->get('X-Forwarded-Host'),
            parse_url((string) $request->headers->get('Origin'), PHP_URL_HOST),
            $request->getHost(),
        ];

        foreach ($candidates as $candidate) {
            if (! is_string($candidate) || trim($candidate) === '') {
                continue;
            }

            $normalized = self::normalizeHost(explode(',', $candidate)[0]);
            if ($normalized === '') {
                continue;
            }

            if (self::isCentralHost($normalized) || self::resolveDomain($normalized)) {
                return $normalized;
            }
        }

        return self::normalizeHost($request->getHost());
    }

    public static function currentCustomerId(Request $request): ?string
    {
        return $request->attributes->get('tenant_customer_id');
    }

    public static function resolveFromHost(string $host): ?Customer
    {
        return self::resolveDomain($host)?->customer;
    }

    public static function resolveDomain(string $host): ?Domain
    {
        $normalizedHost = self::normalizeHost($host);

        $domain = Domain::query()
            ->with('customer')
            ->where('domain', $normalizedHost)
            ->where('domain_status', 'active')
            ->first();

        if (! $domain) {
            return null;
        }

        if (! $domain->customer_id || self::isLocalDevelopmentHost($normalizedHost)) {
            return $domain;
        }

        if ($domain->verification_status === 'active' && $domain->ssl_status === 'active') {
            return $domain;
        }

        return null;
    }

    public static function normalizeHost(string $host): string
    {
        $host = strtolower(trim($host));
        $host = preg_replace('/^https?:\/\//', '', $host) ?? $host;

        return trim(explode(':', explode('/', $host)[0])[0], '.');
    }

    public static function isLocalDevelopmentHost(string $host): bool
    {
        $normalizedHost = self::normalizeHost($host);

        return $normalizedHost === 'localhost'
            || $normalizedHost === '127.0.0.1'
            || $normalizedHost === '::1'
            || str_ends_with($normalizedHost, '.localhost');
    }

    public static function localReadyAttributes(string $host): array
    {
        if (self::isLocalDevelopmentHost($host) || self::isPlatformManagedHost($host)) {
            return [
                'domain_status' => 'active',
                'verification_status' => 'active',
                'ssl_status' => 'active',
                'dns_verified_at' => now(),
                'ssl_issued_at' => now(),
            ];
        }

        return [
            'domain_status' => 'active',
            'verification_status' => 'not_connected',
            'ssl_status' => 'not_active',
        ];
    }

    public static function isCentralHost(string $host): bool
    {
        $normalizedHost = self::normalizeHost($host);
        if (in_array($normalizedHost, ['localhost', '127.0.0.1', '::1', 'dogy.localhost'], true)) {
            return true;
        }

        $configuredHosts = [
            config('domains.canonical_host'),
            parse_url((string) config('app.url'), PHP_URL_HOST),
            ...config('domains.central_hosts', []),
        ];

        return in_array($normalizedHost, array_filter(array_map(
            static fn ($value): string => self::normalizeHost((string) $value),
            $configuredHosts,
        )), true);
    }

    public static function isPlatformManagedHost(string $host): bool
    {
        $normalizedHost = self::normalizeHost($host);
        if ($normalizedHost === '' || self::isCentralHost($normalizedHost) || self::isLocalDevelopmentHost($normalizedHost)) {
            return false;
        }

        $wildcardBase = self::normalizeHost((string) config('domains.wildcard_base'));

        return $wildcardBase !== '' && str_ends_with($normalizedHost, '.'.$wildcardBase);
    }

    public static function acceptedServerIps(): array
    {
        return array_values(array_unique(array_filter([
            (string) config('domains.server_ip'),
            ...array_map('strval', config('domains.server_ips', [])),
            ...array_map(
                static fn (array $server): string => (string) ($server['ip'] ?? ''),
                config('domains.servers', []),
            ),
        ])));
    }

    public static function cnameTargets(): array
    {
        return array_values(array_unique(array_filter(array_map(
            [self::class, 'normalizeHost'],
            [
                (string) config('domains.cname_target'),
                (string) config('domains.canonical_host'),
                (string) config('domains.wildcard_base'),
                'tenants.'.config('domains.wildcard_base'),
                'www.'.config('domains.wildcard_base'),
            ],
        ))));
    }
}
