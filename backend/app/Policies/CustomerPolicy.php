<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super-admin', 'reseller-admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super-admin', 'reseller-admin']);
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->hasRole('super-admin')
            || $user->customer_id === $customer->id
            || $user->reseller_id === $customer->reseller_id;
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->hasRole('super-admin')
            || $user->reseller_id === $customer->reseller_id;
    }
}
