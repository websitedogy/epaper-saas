<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\SuperAdmin\StoreCustomerRequest;
use App\Http\Requests\Api\V1\SuperAdmin\UpdateCustomerRequest;
use App\Mail\TenantWelcomeMail;
use App\Models\Customer;
use App\Models\Domain;
use App\Models\Role;
use App\Models\User;
use App\Support\TenantContext;
use App\Services\DomainVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SuperAdminClientController extends BaseApiController
{
    public function dashboard(): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $customerCounts = Customer::query()
            ->selectRaw('COUNT(*) as total_customers')
            ->selectRaw("SUM(status = 'active') as active_customers")
            ->selectRaw("SUM(status = 'pending') as pending_customers")
            ->selectRaw("SUM(status = 'suspended') as suspended_customers")
            ->selectRaw("SUM(status = 'expired') as expired_customers")
            ->first();
        $domainCounts = Domain::query()
            ->selectRaw("SUM(verification_status = 'active' AND ssl_status = 'active') as domains_connected")
            ->selectRaw("SUM(verification_status != 'active') as domains_pending")
            ->selectRaw("SUM(ssl_status = 'active') as ssl_active")
            ->first();

        $payload = [
            'total_customers' => (int) $customerCounts->total_customers,
            'active_customers' => (int) $customerCounts->active_customers,
            'pending_customers' => (int) $customerCounts->pending_customers,
            'suspended_customers' => (int) $customerCounts->suspended_customers,
            'expired_customers' => (int) $customerCounts->expired_customers,
            'domains_connected' => (int) $domainCounts->domains_connected,
            'domains_pending' => (int) $domainCounts->domains_pending,
            'ssl_active' => (int) $domainCounts->ssl_active,
            'renewals' => (int) Customer::whereHas('subscriptions', fn ($query) => $query->where('status', 'renewal'))->count(),
            'recent_clients' => Customer::query()->latest()->take(5)->get(['id', 'name', 'email', 'status', 'domain_name', 'default_domain', 'paper_name', 'created_at'])->map(function (Customer $customer): array {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'status' => $customer->status,
                    'domain_name' => $customer->domain_name ?? $customer->default_domain,
                    'paper_name' => $customer->paper_name,
                    'created_at' => $customer->created_at?->toISOString(),
                ];
            })->all(),
        ];

        return $this->successResponse($payload, 'Super admin client dashboard retrieved successfully')
            ->header('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::query()
            ->select(['id', 'name', 'email', 'phone_number', 'status', 'domain_name', 'paper_name', 'state', 'district', 'created_at'])
            ->when(request()->filled('status'), fn ($query) => $query->where('status', request('status')))
            ->when(request()->filled('search'), fn ($query) => $query->where(function ($builder) {
                $search = trim(request('search'));
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('domain_name', 'like', "%{$search}%")
                    ->orWhere('paper_name', 'like', "%{$search}%");
            }))
            ->orderByDesc('created_at')
            ->paginate((int) request('per_page', 15));

        return $this->successResponse($customers, 'Clients retrieved successfully')
            ->header('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $data = $request->validated();
        $tenantEmail = strtolower(trim((string) $data['tenant_email']));
        $tenantPassword = $data['tenant_password'];
        unset($data['tenant_email'], $data['tenant_password']);
        $data['domain_name'] = app(DomainVerificationService::class)->normalize((string) $data['domain_name']);
        $data['default_domain'] = $data['domain_name'];
        $data['name'] = trim((string) $data['name']);
        $data['email'] = strtolower(trim((string) $data['email']));
        $data['phone_number'] = trim((string) $data['phone_number']);
        $data['paper_name'] = trim((string) $data['paper_name']);
        $data['state'] = trim((string) $data['state']);
        $data['district'] = trim((string) $data['district']);
        if (TenantContext::isLocalDevelopmentHost($data['domain_name'])) {
            $data['status'] = 'active';
        }

        $customer = DB::transaction(function () use ($data, $tenantEmail, $tenantPassword): Customer {
            $customer = Customer::create($data);

            Domain::create([
                'customer_id' => $customer->id,
                'domain' => $customer->domain_name,
                'brand_name' => $customer->paper_name,
                'is_primary' => true,
                ...TenantContext::localReadyAttributes($customer->domain_name),
            ]);

            $tenantRole = Role::firstOrCreate(
                ['slug' => 'customer-admin'],
                ['name' => 'Customer Admin', 'slug' => 'customer-admin', 'guard_name' => 'web'],
            );

            $tenantUser = User::create([
                'customer_id' => $customer->id,
                'role_id' => $tenantRole->id,
                'name' => $customer->name,
                'email' => $tenantEmail,
                'password' => Hash::make($tenantPassword),
                'status' => 'active',
                'locale' => 'en',
            ]);
            $tenantUser->roles()->attach($tenantRole->id);

            return $customer;
        });

        $payload = [
            'client' => $customer->fresh(),
            'tenant_admin' => [
                'email' => $tenantEmail,
                'role' => 'customer-admin',
                'domain' => $customer->domain_name,
                'login_url' => $this->tenantLoginUrl($customer->domain_name),
            ],
        ];

        try {
            Mail::to($tenantEmail)->send(new TenantWelcomeMail(
                $customer->fresh(),
                $payload['tenant_admin']['login_url'],
                $tenantEmail,
            ));
        } catch (\Throwable $exception) {
            Log::warning('Tenant welcome email failed', ['error' => $exception->getMessage()]);
        }

        return $this->successResponse($payload, 'Client and tenant admin created successfully', 201);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $this->authorize('update', $customer);

        $data = $request->validated();
        $data['domain_name'] = app(DomainVerificationService::class)->normalize((string) $data['domain_name']);
        $data['default_domain'] = $data['domain_name'];
        $data['name'] = trim((string) $data['name']);
        $data['email'] = strtolower(trim((string) $data['email']));
        $data['phone_number'] = trim((string) $data['phone_number']);
        $data['paper_name'] = trim((string) $data['paper_name']);
        $data['state'] = trim((string) $data['state']);
        $data['district'] = trim((string) $data['district']);

        DB::transaction(function () use ($customer, $data): void {
            $previousDomain = $customer->domain_name;
            $customer->update($data);

            $domain = $customer->domains()->where('is_primary', true)->first()
                ?? $customer->domains()->where('domain', $previousDomain)->first();

            if (! $domain) {
                return;
            }

            $attributes = ['brand_name' => $customer->paper_name];
            if ($domain->domain !== $customer->domain_name) {
                $attributes['domain'] = $customer->domain_name;
                $attributes = array_merge($attributes, TenantContext::localReadyAttributes($customer->domain_name));
            }

            $domain->update($attributes);
        });

        return $this->successResponse($customer->fresh(), 'Client updated successfully');
    }

    private function tenantLoginUrl(string $domain): string
    {
        $frontend = (string) config('app.frontend_url', 'https://dogyepaper.com');
        $scheme = parse_url($frontend, PHP_URL_SCHEME) ?: 'http';
        $port = parse_url($frontend, PHP_URL_PORT);

        return sprintf('%s://%s%s/login', $scheme, $domain, $port ? ':'.$port : '');
    }
}
