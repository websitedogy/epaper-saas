<?php

namespace App\Http\Controllers\Api\V1\System;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class HealthController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'editions_disk' => $this->checkDisk('editions'),
            'backups_disk' => $this->checkDisk((string) config('backup.disk')),
        ];

        $healthy = ! in_array(false, $checks, true);

        return response()->json([
            'success' => $healthy,
            'message' => $healthy ? 'API is healthy' : 'API has a degraded dependency',
            'data' => [
                'app_name' => config('app.name'),
                'environment' => config('app.env'),
                'version' => 'v1',
                'timestamp' => now()->toIso8601String(),
                'queue' => config('queue.default'),
                'mailer' => config('mail.default'),
                'checks' => $checks,
            ],
        ], $healthy ? 200 : 503);
    }

    private function checkDatabase(): bool
    {
        try {
            DB::select('select 1');

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function checkRedis(): bool
    {
        if (config('queue.default') !== 'redis' && config('cache.default') !== 'redis') {
            return true;
        }

        try {
            Redis::connection()->ping();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function checkDisk(string $disk): bool
    {
        try {
            Storage::disk($disk)->directories();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
