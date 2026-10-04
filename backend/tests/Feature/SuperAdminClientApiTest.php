<?php

namespace Tests\Feature;

use App\Models\Customer;
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
}
