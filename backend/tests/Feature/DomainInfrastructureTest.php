<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Domain;
use App\Models\Role;
use App\Models\User;
use App\Services\DomainVerificationService;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_wildcard_hosts_are_auto_activated(): void
    {
        config(['domains.wildcard_base' => 'dogyepaper.com']);

        $this->assertTrue(TenantContext::isPlatformManagedHost('acme.dogyepaper.com'));
        $this->assertFalse(TenantContext::isPlatformManagedHost('dogyepaper.com'));

        $ready = TenantContext::localReadyAttributes('acme.dogyepaper.com');
        $this->assertSame('active', $ready['verification_status']);
        $this->assertSame('active', $ready['ssl_status']);
    }

    public function test_wildcard_hostname_verifies_without_public_dns(): void
    {
        config(['domains.wildcard_base' => 'dogyepaper.com']);
        $customer = Customer::query()->create([
            'name' => 'Acme',
            'email' => 'acme@example.com',
            'phone_number' => '1',
            'paper_name' => 'Acme Daily',
            'state' => 'TS',
            'district' => 'HYD',
            'domain_name' => 'acme.dogyepaper.com',
            'status' => 'active',
        ]);
        $domain = Domain::create([
            'customer_id' => $customer->id,
            'domain' => 'acme.dogyepaper.com',
            ...TenantContext::localReadyAttributes('acme.dogyepaper.com'),
        ]);

        $result = app(DomainVerificationService::class)->verify($domain);
        $this->assertTrue($result['verified']);
    }

    public function test_tls_ask_allows_verified_custom_domains(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Custom',
            'email' => 'custom@example.com',
            'phone_number' => '1',
            'paper_name' => 'Custom Daily',
            'state' => 'TS',
            'district' => 'HYD',
            'domain_name' => 'news.example',
            'status' => 'active',
        ]);
        Domain::create([
            'customer_id' => $customer->id,
            'domain' => 'news.example',
            'verification_status' => 'dns_verified',
            'ssl_status' => 'ssl_provisioning',
            'domain_status' => 'active',
        ]);

        $this->get('/api/v1/public/tls-allowed?domain=news.example')->assertOk();
        $this->get('/api/v1/public/tls-allowed?domain=unknown.example')->assertNotFound();
    }

    public function test_backup_command_succeeds_for_sqlite(): void
    {
        $this->artisan('app:backup')->assertSuccessful();
        $this->assertNotEmpty(\Illuminate\Support\Facades\Storage::disk('backups')->files());
    }

    public function test_super_admin_can_read_infrastructure(): void
    {
        $role = Role::firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin', 'slug' => 'super-admin', 'guard_name' => 'web']);
        $admin = User::factory()->create();
        $admin->roles()->sync([$role->id]);

        $this->actingAs($admin, 'web')
            ->getJson('/api/v1/super-admin/infrastructure')
            ->assertOk()
            ->assertJsonPath('data.ssl.auto_provision', true)
            ->assertJsonPath('success', true);
    }
}
