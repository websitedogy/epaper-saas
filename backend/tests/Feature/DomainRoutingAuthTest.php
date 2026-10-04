<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Domain;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainRoutingAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_login_requires_the_matching_hostname(): void
    {
        $role = Role::create(['name' => 'Customer Admin', 'slug' => 'customer-admin', 'guard_name' => 'web']);
        $customer = Customer::factory()->create(['name' => 'ABC News']);
        Domain::create(['customer_id' => $customer->id, 'domain' => 'abcnews.localhost', 'verification_status' => 'active', 'ssl_status' => 'active']);
        $otherCustomer = Customer::factory()->create(['name' => 'Vaishu']);
        Domain::create(['customer_id' => $otherCustomer->id, 'domain' => 'vaishuepaper.localhost', 'verification_status' => 'active', 'ssl_status' => 'active']);
        $user = User::factory()->create([
            'customer_id' => $customer->id,
            'email' => 'admin@abcnews.test',
            'password' => bcrypt('Password123!'),
        ]);
        $user->roles()->attach($role);

        $this->withHeaders(['Host' => 'abcnews.localhost:3001'])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'Password123!',
            ])->assertOk();

        $this->withHeaders(['Host' => 'vaishuepaper.localhost:3001'])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'Password123!',
            ])->assertForbidden();
    }

    public function test_super_admin_cannot_use_a_tenant_hostname(): void
    {
        $role = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin', 'guard_name' => 'web']);
        $admin = User::factory()->create(['email' => 'admin@dogy.test']);
        $admin->roles()->attach($role);
        $customer = Customer::factory()->create();
        Domain::create(['customer_id' => $customer->id, 'domain' => 'abcnews.localhost', 'verification_status' => 'active', 'ssl_status' => 'active']);

        $this->withHeaders(['Host' => 'dogy.localhost:3001'])
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/super-admin/dashboard')
            ->assertOk();

        $this->withHeaders(['Host' => 'abcnews.localhost:3001'])
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/super-admin/dashboard')
            ->assertForbidden();
    }
}