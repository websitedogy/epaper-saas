<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super-admin', 'guard_name' => 'web'],
            ['name' => 'Customer Admin', 'slug' => 'customer-admin', 'guard_name' => 'web'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['slug' => $role['slug']],
                $role,
            );
        }

        $permissions = [
            'view_platform',
            'manage_customers',
            'manage_own_epaper',
            'view_own_epaper',
            'view_audit_logs',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission],
                [
                    'name' => ucfirst(str_replace('_', ' ', $permission)),
                    'slug' => $permission,
                    'guard_name' => 'web',
                ],
            );
        }

        $resellerRole = Role::withTrashed()->where('slug', 'reseller-admin')->first();
        if ($resellerRole) {
            $resellerRole->users()->detach();
            $resellerRole->permissions()->detach();
            $resellerRole->forceDelete();
        }

        Permission::withTrashed()
            ->whereIn('slug', ['manage_resellers', 'view_reseller_customers'])
            ->get()
            ->each(function (Permission $permission): void {
                $permission->roles()->detach();
                $permission->forceDelete();
            });
    }
}
