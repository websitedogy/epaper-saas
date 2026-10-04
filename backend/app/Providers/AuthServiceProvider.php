<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\Reseller;
use App\Models\User;
use App\Policies\CustomerPolicy;
use App\Policies\ResellerPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
        Reseller::class => ResellerPolicy::class,
        Customer::class => CustomerPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function (User $user, string $ability) {
            if ($user->hasAnyRole(['super-admin', 'super_admin'])) {
                return true;
            }

            return null;
        });
    }
}
