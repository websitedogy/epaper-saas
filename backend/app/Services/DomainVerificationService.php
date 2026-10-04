<?php

namespace App\Services;

use App\Models\Domain;
use App\Support\TenantContext;

class DomainVerificationService
{
    public function verify(Domain $domain): array
    {
        $host = $this->normalize($domain->domain);

        if (TenantContext::isLocalDevelopmentHost($host) || TenantContext::isPlatformManagedHost($host)) {
            return [
                'verified' => true,
                'message' => TenantContext::isPlatformManagedHost($host)
                    ? 'Wildcard platform hostname is ready. No customer DNS change is required.'
                    : 'Local development domain verified automatically.',
                'records' => ['a' => ['127.0.0.1'], 'cname' => []],
            ];
        }

        $records = @dns_get_record($host, DNS_A | DNS_AAAA | DNS_CNAME) ?: [];
        $aRecords = collect($records)->pluck('ip')->filter()->values()->all();
        $aaaaRecords = collect($records)->pluck('ipv6')->filter()->values()->all();
        $cnameRecords = collect($records)
            ->pluck('target')
            ->filter()
            ->map(fn (string $value) => TenantContext::normalizeHost($value))
            ->values()
            ->all();

        $acceptedIps = TenantContext::acceptedServerIps();
        $verifiedByA = $acceptedIps !== [] && count(array_intersect($acceptedIps, $aRecords)) > 0;
        $verifiedByCname = count(array_intersect(TenantContext::cnameTargets(), $cnameRecords)) > 0;

        if ($verifiedByA || $verifiedByCname) {
            return [
                'verified' => true,
                'message' => $verifiedByCname
                    ? 'CNAME points at the Dogy wildcard target.'
                    : 'A record points at a Dogy application server.',
                'records' => ['a' => $aRecords, 'aaaa' => $aaaaRecords, 'cname' => $cnameRecords],
            ];
        }

        if ($aRecords === [] && $aaaaRecords === [] && $cnameRecords === []) {
            return [
                'verified' => false,
                'message' => 'DNS record not found yet. Add the A or CNAME record from the connection guide.',
                'records' => ['a' => [], 'aaaa' => [], 'cname' => []],
            ];
        }

        return [
            'verified' => false,
            'message' => 'Domain is pointing to another server, or DNS has not finished propagating.',
            'records' => ['a' => $aRecords, 'aaaa' => $aaaaRecords, 'cname' => $cnameRecords],
        ];
    }

    public function connectionGuide(Domain $domain): array
    {
        $host = $this->normalize($domain->domain);
        $wildcardBase = TenantContext::normalizeHost((string) config('domains.wildcard_base'));
        $cnameTarget = TenantContext::normalizeHost((string) config('domains.cname_target'));
        $serverIps = TenantContext::acceptedServerIps();

        if (TenantContext::isLocalDevelopmentHost($host)) {
            return [
                'mode' => 'local',
                'summary' => 'Local .localhost hosts are activated automatically.',
                'records' => [],
            ];
        }

        if (TenantContext::isPlatformManagedHost($host)) {
            return [
                'mode' => 'wildcard',
                'summary' => 'This hostname is covered by *.'.$wildcardBase.'. Point the platform wildcard at the app servers once.',
                'records' => [
                    ['type' => 'A', 'host' => '*', 'value' => $serverIps[0] ?? 'YOUR_APP_SERVER_IP', 'zone' => $wildcardBase],
                    ['type' => 'CNAME', 'host' => '*', 'value' => $cnameTarget, 'zone' => $wildcardBase],
                ],
            ];
        }

        return [
            'mode' => 'custom',
            'summary' => 'Point the customer domain at Dogy, then auto-SSL can issue a certificate.',
            'records' => [
                ['type' => 'CNAME', 'host' => $host, 'value' => $cnameTarget ?: ('tenants.'.$wildcardBase)],
                ...array_map(
                    fn (string $ip) => ['type' => 'A', 'host' => $host, 'value' => $ip],
                    $serverIps,
                ),
            ],
        ];
    }

    public function normalize(string $domain): string
    {
        return TenantContext::normalizeHost($domain);
    }
}
