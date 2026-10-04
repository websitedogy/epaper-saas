<?php

namespace App\Services;

use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function login(array $credentials, Request $request): array
    {
        unset($credentials['remember']);

        $user = User::query()
            ->with(['roles:id,slug', 'customer:id,name,domain_name,paper_name'])
            ->where('email', $credentials['email'])
            ->first();

        if (! $user || ! Hash::check((string) $credentials['password'], $user->password)) {
            throw new AuthenticationException('Invalid credentials provided.');
        }

        $tenantId = TenantContext::currentCustomerId($request);
        $isCentral = (bool) $request->attributes->get('central_domain');
        $allowed = $isCentral
            ? $user->hasAnyRole(['super-admin', 'super_admin'])
            : $user->customer_id === $tenantId && $user->hasAnyRole(['customer-admin']);

        if (! $allowed) {
            throw new AuthorizationException('This account is not authorized for this domain.');
        }

        Auth::login($user);
        $userId = $user->id;
        defer(static function () use ($userId): void {
            User::query()->whereKey($userId)->update(['last_login_at' => now()]);
        });

        $token = $user->createToken('api-token', [
            'host:'.TenantContext::normalizeHost($request->getHost()),
            'tenant:'.($tenantId ?? 'central'),
        ])->plainTextToken;

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ];
    }

    public function logout(): void
    {
        $user = Auth::user();

        if ($user) {
            $user->currentAccessToken()?->delete();
        }
    }
}
