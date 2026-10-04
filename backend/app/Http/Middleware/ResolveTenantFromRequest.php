<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;

class ResolveTenantFromRequest
{
    /**
     * Resolve the active tenant exclusively from the request host.
     */
    public function handle(Request $request, Closure $next)
    {
        $host = TenantContext::hostFromRequest($request);
        if (TenantContext::isCentralHost($host)) {
            $request->attributes->set('resolved_domain', null);
            $request->attributes->set('central_domain', true);
            $request->attributes->set('tenant_customer_id', null);

            return $next($request);
        }

        $domain = TenantContext::resolveDomain($host);

        if (! $domain) {
            abort(404, 'Domain not configured.');
        }

        $request->attributes->set('resolved_domain', $domain);
        $request->attributes->set('central_domain', ! $domain || ! $domain->customer_id);
        $request->attributes->set('tenant_customer_id', $domain?->customer_id);

        return $next($request);
    }
}
