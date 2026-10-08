<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Domain;
use App\Models\Role;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenantAdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::firstOrCreate(
            ['slug' => 'customer-admin'],
            ['name' => 'Customer Admin', 'slug' => 'customer-admin', 'guard_name' => 'web'],
        );

        $domainName = 'abcnews.localhost';
        $customer = Customer::query()->firstOrCreate(
            ['domain_name' => $domainName],
            [
                'name' => 'ABC News',
                'slug' => 'abc-news',
                'email' => 'abcnews@example.com',
                'phone_number' => '0000000000',
                'paper_name' => 'ABC News',
                'state' => 'Telangana',
                'district' => 'Hyderabad',
                'status' => 'active',
                'default_domain' => $domainName,
            ],
        );

        Domain::query()->firstOrCreate(
            ['domain' => $domainName],
            [
                'customer_id' => $customer->id,
                'brand_name' => $customer->paper_name,
                'is_primary' => true,
                ...TenantContext::localReadyAttributes($domainName),
            ],
        );

        $user = User::query()->firstOrCreate(
            ['email' => 'tenant@abcnews.localhost'],
            [
                'customer_id' => $customer->id,
                'role_id' => $role->id,
                'name' => 'ABC News Admin',
                'password' => Hash::make('Password123!'),
                'status' => 'active',
                'locale' => 'en',
            ],
        );

        if (! $user->roles()->where('roles.id', $role->id)->exists()) {
            $user->roles()->attach($role->id);
        }
    }
}
