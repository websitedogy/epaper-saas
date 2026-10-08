<?php

namespace App\Http\Middleware;

use App\Models\Domain;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowTenantCors
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS') && $this->allowedOrigin($request)) {
            return response('', 204, $this->corsHeaders($request));
        }

        $response = $next($request);

        return $this->applyCorsHeaders($request, $response);
    }

    public function applyCorsHeaders(Request $request, Response $response): Response
    {
        if ($this->allowedOrigin($request)) {
            foreach ($this->corsHeaders($request) as $key => $value) {
                $response->headers->set($key, $value);
            }
        }

        return $response;
    }

    private function allowedOrigin(Request $request): bool
    {
        $origin = $request->headers->get('Origin');
        if (! $origin) {
            return false;
        }

        $host = TenantContext::normalizeHost((string) parse_url($origin, PHP_URL_HOST));
        if ($host === '') {
            return false;
        }

        if (TenantContext::isCentralHost($host) || TenantContext::isLocalDevelopmentHost($host) || TenantContext::isPlatformManagedHost($host)) {
            return true;
        }

        if (in_array($host, config('domains.frontend_hosts', []), true)) {
            return true;
        }

        return Domain::query()->where('domain', $host)->exists();
    }

    private function corsHeaders(Request $request): array
    {
        return [
            'Access-Control-Allow-Origin' => $request->headers->get('Origin'),
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Tenant-Host, X-Requested-With, Accept',
            'Access-Control-Allow-Credentials' => 'true',
            'Vary' => 'Origin',
        ];
    }
}
