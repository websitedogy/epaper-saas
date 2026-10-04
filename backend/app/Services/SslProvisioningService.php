<?php

namespace App\Services;

use App\Mail\DomainLiveMail;
use App\Models\Domain;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Process\Process;

class SslProvisioningService
{
    public function inspect(Domain $domain): array
    {
        if (TenantContext::isLocalDevelopmentHost($domain->domain) || TenantContext::isPlatformManagedHost($domain->domain)) {
            return [
                'active' => true,
                'status' => 'active',
                'provider' => TenantContext::isPlatformManagedHost($domain->domain) ? 'wildcard' : 'local',
                'message' => TenantContext::isPlatformManagedHost($domain->domain)
                    ? 'Covered by the platform wildcard certificate.'
                    : 'Local development SSL is not required.',
            ];
        }

        $certificate = $this->peerCertificate($domain->domain);
        if ($certificate['active']) {
            return [
                'active' => true,
                'status' => 'active',
                'provider' => 'existing',
                'expires_at' => $certificate['expires_at'],
                'message' => 'HTTPS certificate is valid.',
            ];
        }

        return [
            'active' => false,
            'status' => config('domains.ssl_auto_provision') ? 'provisioning' : 'pending',
            'provider' => config('domains.ssl_provider'),
            'message' => $certificate['message'] ?: 'DNS is verified. SSL will be issued automatically.',
        ];
    }

    public function provision(Domain $domain): array
    {
        $inspection = $this->inspect($domain);
        if ($inspection['active']) {
            $this->markActive($domain);

            return $inspection;
        }

        $provider = (string) config('domains.ssl_provider', 'caddy');
        $result = match ($provider) {
            'cloudflare' => $this->provisionWithCloudflare($domain),
            'certbot' => $this->provisionWithCertbot($domain),
            default => [
                'active' => false,
                'status' => 'provisioning',
                'provider' => 'caddy',
                'message' => 'Caddy on-demand TLS will issue a certificate the first time this hostname is requested.',
            ],
        };

        $inspection = $this->inspect($domain);
        if ($inspection['active']) {
            $this->markActive($domain);

            return $inspection;
        }

        $domain->forceFill([
            'ssl_status' => 'ssl_provisioning',
        ])->save();

        return $result + ['active' => false];
    }

    public function markActive(Domain $domain): void
    {
        $wasInactive = $domain->ssl_status !== 'active';
        $domain->forceFill([
            'verification_status' => 'active',
            'ssl_status' => 'active',
            'ssl_issued_at' => $domain->ssl_issued_at ?? now(),
            'dns_verified_at' => $domain->dns_verified_at ?? now(),
        ])->save();

        if ($wasInactive) {
            $this->notifyLive($domain->fresh());
        }
    }

    public function allowsOnDemandHost(string $host): bool
    {
        $normalized = TenantContext::normalizeHost($host);
        if ($normalized === '' || TenantContext::isCentralHost($normalized) || TenantContext::isPlatformManagedHost($normalized)) {
            return TenantContext::isCentralHost($normalized) || TenantContext::isPlatformManagedHost($normalized);
        }

        $domain = TenantContext::resolveDomain($normalized) ?? Domain::query()->where('domain', $normalized)->first();

        return (bool) $domain?->verification_status && in_array($domain->verification_status, ['dns_verified', 'active', 'ssl_provisioning'], true);
    }

    private function peerCertificate(string $host): array
    {
        $context = stream_context_create([
            'ssl' => [
                'capture_peer_cert' => true,
                'verify_peer' => true,
                'verify_peer_name' => true,
                'SNI_enabled' => true,
                'peer_name' => $host,
            ],
        ]);
        $client = @stream_socket_client('ssl://'.$host.':443', $errno, $errstr, 8, STREAM_CLIENT_CONNECT, $context);
        if (! is_resource($client)) {
            return ['active' => false, 'expires_at' => null, 'message' => trim($errstr) ?: 'HTTPS is not responding yet.'];
        }

        $params = stream_context_get_params($client);
        fclose($client);
        $cert = $params['options']['ssl']['peer_certificate'] ?? null;
        if (! $cert) {
            return ['active' => false, 'expires_at' => null, 'message' => 'No certificate was presented.'];
        }

        $parsed = openssl_x509_parse($cert) ?: [];
        $expiresAt = isset($parsed['validTo_time_t']) ? date('c', (int) $parsed['validTo_time_t']) : null;

        return [
            'active' => true,
            'expires_at' => $expiresAt,
            'message' => 'Certificate is valid.',
        ];
    }

    private function provisionWithCloudflare(Domain $domain): array
    {
        $token = (string) config('services.cloudflare.api_token');
        $zoneId = (string) config('services.cloudflare.zone_id');
        if ($token === '' || $zoneId === '') {
            return ['status' => 'pending', 'provider' => 'cloudflare', 'message' => 'Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to auto-issue custom hostnames.'];
        }

        $response = Http::withToken($token)
            ->acceptJson()
            ->timeout(20)
            ->post('https://api.cloudflare.com/client/v4/zones/'.$zoneId.'/custom_hostnames', [
                'hostname' => $domain->domain,
                'ssl' => [
                    'method' => 'http',
                    'type' => 'dv',
                    'settings' => ['min_tls_version' => '1.2'],
                ],
            ]);

        if ($response->status() === 409 || $response->successful()) {
            return [
                'status' => 'provisioning',
                'provider' => 'cloudflare',
                'message' => 'Cloudflare custom hostname requested. SSL becomes active after hostname validation.',
            ];
        }

        Log::warning('Cloudflare SSL provisioning failed', ['domain' => $domain->domain, 'body' => $response->json()]);

        return [
            'status' => 'failed',
            'provider' => 'cloudflare',
            'message' => $response->json('errors.0.message') ?: 'Cloudflare rejected the custom hostname.',
        ];
    }

    private function provisionWithCertbot(Domain $domain): array
    {
        $command = (string) config('domains.ssl_command');
        if ($command === '') {
            return ['status' => 'pending', 'provider' => 'certbot', 'message' => 'Set DOMAIN_SSL_COMMAND to a certbot command, using {domain} and {email} placeholders.'];
        }

        $rendered = strtr($command, [
            '{domain}' => $domain->domain,
            '{email}' => (string) config('domains.ssl_email'),
        ]);
        $process = Process::fromShellCommandline($rendered);
        $process->setTimeout(180);
        $process->run();

        if (! $process->isSuccessful()) {
            Log::warning('Certbot SSL provisioning failed', ['domain' => $domain->domain, 'error' => $process->getErrorOutput()]);

            return [
                'status' => 'failed',
                'provider' => 'certbot',
                'message' => trim($process->getErrorOutput()) ?: 'Certbot did not issue a certificate.',
            ];
        }

        return [
            'status' => 'active',
            'provider' => 'certbot',
            'message' => 'Certificate issued with Certbot.',
        ];
    }

    private function notifyLive(Domain $domain): void
    {
        $email = $domain->customer?->email;
        if (! $email) {
            return;
        }

        try {
            Mail::to($email)->send(new DomainLiveMail($domain));
        } catch (\Throwable $exception) {
            Log::warning('Domain live email failed', ['domain' => $domain->domain, 'error' => $exception->getMessage()]);
        }
    }
}
