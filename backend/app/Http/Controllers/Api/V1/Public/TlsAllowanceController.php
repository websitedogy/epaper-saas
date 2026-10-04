<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\SslProvisioningService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TlsAllowanceController extends BaseApiController
{
    public function __invoke(Request $request, SslProvisioningService $ssl): Response
    {
        $token = (string) config('domains.tls_ask_token');
        if ($token !== '' && $request->headers->get('X-TLS-Ask-Token') !== $token) {
            return response('', 403);
        }

        $domain = $ssl->allowsOnDemandHost((string) $request->query('domain', ''));

        if ($request->expectsJson()) {
            return $this->successResponse(['allowed' => $domain], $domain ? 'TLS allowed' : 'TLS denied', $domain ? 200 : 404);
        }

        return response('', $domain ? 200 : 404);
    }
}
