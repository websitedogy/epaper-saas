<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $user?->loadMissing('roles:id,slug');

        if (! $user || ! $user->hasAnyRole(['super-admin', 'super_admin'])) {
            abort(Response::HTTP_FORBIDDEN, 'Forbidden. Super Admin access required.');
        }

        return $next($request);
    }
}
