<?php

namespace App\Console\Commands;

use App\Jobs\ProvisionDomainSsl;
use App\Models\Domain;
use App\Services\DomainVerificationService;
use App\Services\SslProvisioningService;
use App\Support\TenantContext;
use Illuminate\Console\Command;

class ReconcileDomains extends Command
{
    protected $signature = 'domains:reconcile';
    protected $description = 'Re-check DNS and continue auto-SSL for customer domains.';

    public function handle(DomainVerificationService $verification, SslProvisioningService $ssl): int
    {
        Domain::query()->with('customer')->chunkById(50, function ($domains) use ($verification, $ssl): void {
            foreach ($domains as $domain) {
                if (TenantContext::isLocalDevelopmentHost($domain->domain) || TenantContext::isPlatformManagedHost($domain->domain)) {
                    $ssl->markActive($domain);
                    continue;
                }

                $dns = $verification->verify($domain);
                $domain->forceFill(['last_checked_at' => now()]);
                if (! $dns['verified']) {
                    $domain->save();
                    continue;
                }

                $domain->forceFill([
                    'verification_status' => $domain->verification_status === 'active' ? 'active' : 'dns_verified',
                    'dns_verified_at' => $domain->dns_verified_at ?? now(),
                ])->save();

                $inspection = $ssl->inspect($domain);
                if ($inspection['active']) {
                    $ssl->markActive($domain);
                    continue;
                }

                if (config('domains.ssl_auto_provision') && $domain->ssl_status !== 'active') {
                    $domain->forceFill(['ssl_status' => 'ssl_provisioning'])->save();
                    ProvisionDomainSsl::dispatch($domain->id);
                }
            }
        });

        $this->info('Domain reconciliation queued.');

        return self::SUCCESS;
    }
}
