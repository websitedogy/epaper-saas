<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Api\BaseApiController;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class InfrastructureController extends BaseApiController
{
    public function __invoke(): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\Customer::class);

        $servers = collect(config('domains.servers', []))->map(function (array $server): array {
            $host = $server['host'] ?? null;
            $healthUrl = $host ? 'https://'.TenantContext::normalizeHost((string) $host).'/up' : null;
            $healthy = null;
            if ($healthUrl) {
                try {
                    $healthy = Http::timeout(3)->get($healthUrl)->successful();
                } catch (\Throwable) {
                    $healthy = false;
                }
            }

            return [
                'role' => $server['role'] ?? 'app',
                'host' => $host,
                'ip' => $server['ip'] ?? null,
                'healthy' => $healthy,
            ];
        })->values()->all();

        return $this->successResponse([
            'wildcard_base' => config('domains.wildcard_base'),
            'cname_target' => config('domains.cname_target'),
            'server_ips' => TenantContext::acceptedServerIps(),
            'frontend_hosts' => config('domains.frontend_hosts'),
            'ssl' => [
                'auto_provision' => (bool) config('domains.ssl_auto_provision'),
                'provider' => config('domains.ssl_provider'),
            ],
            'storage' => [
                'editions' => config('editions.disk'),
                'backups' => config('backup.disk'),
                'editions_ready' => $this->diskReady('editions'),
                'backups_ready' => $this->diskReady((string) config('backup.disk')),
            ],
            'queue' => [
                'connection' => config('queue.default'),
                'redis' => $this->redisReady(),
            ],
            'mailer' => config('mail.default'),
            'database' => config('database.default'),
            'servers' => $servers,
        ], 'Infrastructure status retrieved successfully');
    }

    private function diskReady(string $disk): bool
    {
        try {
            Storage::disk($disk)->directories();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function redisReady(): bool
    {
        if (! in_array(config('queue.default'), ['redis'], true) && config('cache.default') !== 'redis') {
            return false;
        }

        try {
            Redis::connection()->ping();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
