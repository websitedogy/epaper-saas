<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

class AuthController extends BaseApiController
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $this->authService->login($request->validated(), $request);

        return $this->successResponse([
            'token' => $payload['token'],
            'token_type' => $payload['token_type'],
            'user' => new UserResource($payload['user']),
        ], 'User authenticated successfully');
    }

    public function me(): JsonResponse
    {
        return $this->successResponse(
            new UserResource(auth()->user()->loadMissing(['roles:id,slug', 'customer:id,name,domain_name,paper_name'])),
            'User profile retrieved successfully',
        );
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return $this->successResponse(null, 'User logged out successfully');
    }
}
