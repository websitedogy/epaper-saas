<?php

namespace App\Http\Controllers\Api;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class BaseApiController extends Controller
{
    use AuthorizesRequests;

    protected function successResponse(mixed $data = null, string $message = 'Operation successful', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function errorResponse(string $message = 'Something went wrong', int $status = 400, mixed $data = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function requireCustomerId(?\Illuminate\Http\Request $request = null): string
    {
        $request ??= request();
        abort_unless($request->user()?->customer_id, 403, 'Tenant access required.');

        return (string) $request->user()->customer_id;
    }
}
