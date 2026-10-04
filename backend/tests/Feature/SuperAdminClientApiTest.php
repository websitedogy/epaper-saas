<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Domain;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminClientApiTest extends TestCase
{
    use RefreshDatabase;

    protected function actingAsSuperAdmin(): User
    {
        $role = Role::firstOrCreate(
            ['slug' => 'super-admin'],
            ['name' => 'Super Admin', 'slug' => 'super-admin', 'guard_name' => 'web'],
        );

        $user = User::factory()->create([
            'email' => 'admin@dogy.local',
            'password' => bcrypt('password123'),
        ]);

        $user->roles()->sync([$role->id]);

        return $user;
    }

    public function test_super_admin_dashboard_endpoint_is_protected(): void
    {
        $admin = $this->actingAsSuperAdmin();

        $response = $this->actingAs($admin, 'web')->getJson('/api/v1/super-admin/dashboard');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);
    }

    public function test_super_admin_can_create_a_client(): void
    {
        $admin = $this->actingAsSuperAdmin();

        $response = $this->actingAs($admin, 'web')->postJson('/api/v1/super-admin/clients', [
            'name' => 'Acme Journal',
            'phone_number' => '+1 555 123 4567',
            'email' => 'client@acme.com',
            'domain_name' => 'acmejournal.com',
            'paper_name' => 'Acme Daily',
            'state' => 'California',
            'district' => 'Los Angeles',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Acme Journal');

        $this->assertDatabaseHas('customers', [
            'name' => 'Acme Journal',
            'email' => 'client@acme.com',
            'status' => 'pending',
        ]);
    }

    public function test_super_admin_can_update_a_client(): void
    {
        $admin = $this->actingAsSuperAdmin();
        $customer = Customer::query()->create([
            'name' => 'ABC News',
            'email' => 'abcnews@example.com',
            'phone_number' => '0000000000',
            'domain_name' => 'abcnews.localhost',
            'default_domain' => 'abcnews.localhost',
            'paper_name' => 'ABC News',
            'state' => 'Telangana',
            'district' => 'Hyderabad',
            'status' => 'active',
        ]);
        Domain::query()->create([
            'customer_id' => $customer->id,
            'domain' => 'abcnews.localhost',
            'brand_name' => 'ABC News',
            'is_primary' => true,
            'domain_status' => 'active',
            'verification_status' => 'active',
            'ssl_status' => 'active',
        ]);

        $response = $this->actingAs($admin, 'web')->putJson('/api/v1/super-admin/clients/'.$customer->id, [
            'name' => 'ABC News Daily',
            'email' => 'desk@abcnews.example',
            'phone_number' => '9999999999',
            'domain_name' => 'abcnews.localhost',
            'paper_name' => 'ABC Daily',
            'state' => 'Telangana',
            'district' => 'Hyderabad',
            'status' => 'pending',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'ABC News Daily')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => 'ABC News Daily',
            'paper_name' => 'ABC Daily',
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('domains', [
            'customer_id' => $customer->id,
            'domain' => 'abcnews.localhost',
            'brand_name' => 'ABC Daily',
        ]);
    }
}
