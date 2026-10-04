<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->hasRole('super-admin')
            || $user->customer_id === $customer->id;
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->hasRole('super-admin');
    }
}
