<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    public function test_super_admin_can_login_and_receive_token(): void
    {
        $role = Role::where('slug', 'super-admin')->firstOrFail();
        $user = User::factory()->create([
            'email' => 'superadmin@example.com',
            'password' => bcrypt('Password123!'),
        ]);
        $user->roles()->attach($role->id);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'superadmin@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.user.email', 'superadmin@example.com');
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_invalid_credentials_return_401(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'WrongPassword123!',
        ]);

        $response->assertStatus(401);
    }

    public function test_non_super_admin_user_is_forbidden(): void
    {
        $role = Role::where('slug', 'customer-admin')->firstOrFail();
        $user = User::factory()->create([
            'email' => 'customer@example.com',
            'password' => bcrypt('Password123!'),
        ]);
        $user->roles()->attach($role->id);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'customer@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(403);
    }
}
