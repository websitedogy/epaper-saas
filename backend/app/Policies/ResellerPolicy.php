<?php

namespace App\Policies;

use App\Models\Reseller;
use App\Models\User;

class ResellerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super-admin']);
    }

    public function view(User $user, Reseller $reseller): bool
    {
        return $user->hasRole('super-admin')
            || $user->reseller_id === $reseller->id;
    }

    public function update(User $user, Reseller $reseller): bool
    {
        return $user->hasRole('super-admin')
            || $user->reseller_id === $reseller->id;
    }
}
