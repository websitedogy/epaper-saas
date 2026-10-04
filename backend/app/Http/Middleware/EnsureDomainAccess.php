<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDomainAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $isCentral = (bool) $request->attributes->get('central_domain');
        $tenantId = $request->attributes->get('tenant_customer_id');

        $allowed = $isCentral
            ? $user?->hasAnyRole(['super-admin', 'super_admin'])
            : $user?->customer_id === $tenantId && $user?->hasAnyRole(['customer-admin']);

        abort_unless($allowed, Response::HTTP_FORBIDDEN, 'This account is not authorized for this domain.');

        return $next($request);
    }
}