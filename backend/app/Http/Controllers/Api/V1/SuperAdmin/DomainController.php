<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Api\BaseApiController;
use App\Jobs\ProvisionDomainSsl;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Domain;
use App\Services\DomainVerificationService;
use App\Services\SslProvisioningService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DomainController extends BaseApiController
{
    public function index(Request $request, DomainVerificationService $verification): JsonResponse
    {
        $domains = Domain::query()
            ->with('customer:id,name,email')
            ->when($request->filled('customer_id'), fn ($query) => $query->where('customer_id', $request->string('customer_id')))
            ->latest()
            ->get()
            ->map(fn (Domain $domain) => $this->present($domain, $verification));

        return $this->successResponse($domains, 'Domains retrieved successfully');
    }

    public function store(Request $request, DomainVerificationService $verification): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $data = $request->validate([
            'customer_id' => ['required', 'uuid', 'exists:customers,id'],
            'domain' => ['required', 'string', 'max:255', 'unique:domains,domain'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);
        $data['domain'] = $verification->normalize($data['domain']);

        $domain = DB::transaction(function () use ($data): Domain {
            if (($data['is_primary'] ?? false) === true) {
                Domain::where('customer_id', $data['customer_id'])->update(['is_primary' => false]);
            }

            return Domain::create([
                ...$data,
                ...TenantContext::localReadyAttributes($data['domain']),
            ]);
        });

        $this->audit($request, 'domain.created', $domain);

        return $this->successResponse($this->present($domain->load('customer:id,name,email'), $verification), 'Domain added successfully', 201);
    }

    public function update(Request $request, Domain $domain, DomainVerificationService $verification): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $data = $request->validate([
            'domain' => ['required', 'string', 'max:255', Rule::unique('domains', 'domain')->ignore($domain->id)],
            'is_primary' => ['sometimes', 'boolean'],
        ]);
        $data['domain'] = $verification->normalize($data['domain']);

        DB::transaction(function () use ($domain, $data): void {
            if (($data['is_primary'] ?? false) === true) {
                Domain::where('customer_id', $domain->customer_id)->where('id', '!=', $domain->id)->update(['is_primary' => false]);
            }

            $domain->update([
                ...$data,
                ...TenantContext::localReadyAttributes($data['domain']),
                'last_checked_at' => null,
            ]);
        });

        $this->audit($request, 'domain.updated', $domain);

        return $this->successResponse($this->present($domain->fresh()->load('customer:id,name,email'), $verification), 'Domain updated successfully');
    }

    public function destroy(Request $request, Domain $domain): JsonResponse
    {
        $this->authorize('create', Customer::class);
        $domain->delete();
        $this->audit($request, 'domain.deleted', $domain);

        return $this->successResponse(null, 'Domain removed successfully');
    }

    public function verify(Request $request, Domain $domain, DomainVerificationService $verification, SslProvisioningService $ssl): JsonResponse
    {
        $this->authorize('create', Customer::class);
        $result = $verification->verify($domain);
        $domain->forceFill(['last_checked_at' => now()]);

        if (! $result['verified']) {
            $domain->forceFill(['verification_status' => 'failed', 'ssl_status' => 'not_active'])->save();
            $this->audit($request, 'domain.verification_failed', $domain, $result);

            return $this->errorResponse($result['message'], 422, ['domain' => $domain->fresh(), 'dns' => $result['records']]);
        }

        $domain->forceFill([
            'verification_status' => 'dns_verified',
            'ssl_status' => 'ssl_provisioning',
            'dns_verified_at' => now(),
        ])->save();

        $sslResult = $ssl->inspect($domain);
        if ($sslResult['active']) {
            $ssl->markActive($domain);
        } elseif (config('domains.ssl_auto_provision')) {
            ProvisionDomainSsl::dispatch($domain->id);
        }

        $this->audit($request, 'domain.verified', $domain, ['dns' => $result, 'ssl' => $sslResult]);

        return $this->successResponse([
            'domain' => $this->present($domain->fresh()->load('customer:id,name,email'), $verification),
            'dns' => $result,
            'ssl' => $sslResult,
        ], $sslResult['message']);
    }

    public function provisionSsl(Request $request, Domain $domain, SslProvisioningService $ssl, DomainVerificationService $verification): JsonResponse
    {
        $this->authorize('create', Customer::class);
        abort_unless(in_array($domain->verification_status, ['dns_verified', 'active', 'ssl_provisioning'], true)
            || TenantContext::isPlatformManagedHost($domain->domain)
            || TenantContext::isLocalDevelopmentHost($domain->domain), 422, 'Verify DNS before provisioning SSL.');

        $domain->forceFill(['ssl_status' => 'ssl_provisioning'])->save();
        if (in_array(config('queue.default'), ['sync', 'null'], true)) {
            $result = $ssl->provision($domain->fresh()->load('customer'));
        } else {
            ProvisionDomainSsl::dispatch($domain->id);
            $result = ['status' => 'provisioning', 'message' => 'SSL provisioning was queued on the worker.'];
        }

        $this->audit($request, 'domain.ssl_provisioned', $domain, $result);

        return $this->successResponse([
            'domain' => $this->present($domain->fresh()->load('customer:id,name,email'), $verification),
            'ssl' => $result,
        ], $result['message'] ?? 'SSL provisioning started.');
    }

    public function activate(Request $request, Domain $domain): JsonResponse
    {
        $this->authorize('create', Customer::class);
        abort_unless($domain->verification_status === 'active' && $domain->ssl_status === 'active', 422, 'Domain requires verified DNS and active SSL before activation.');

        $domain->update(['verification_status' => 'active']);
        $this->audit($request, 'domain.activated', $domain);

        return $this->successResponse($this->present($domain->fresh()->load('customer:id,name,email'), app(DomainVerificationService::class)), 'Domain activated successfully');
    }

    public function deactivate(Request $request, Domain $domain): JsonResponse
    {
        $this->authorize('create', Customer::class);
        $domain->update(['verification_status' => 'dns_verified']);
        $this->audit($request, 'domain.deactivated', $domain);

        return $this->successResponse($this->present($domain->fresh()->load('customer:id,name,email'), app(DomainVerificationService::class)), 'Domain deactivated successfully');
    }

    private function audit(Request $request, string $event, Domain $domain, array $properties = []): void
    {
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'customer_id' => $domain->customer_id,
            'event' => $event,
            'subject_type' => Domain::class,
            'subject_id' => $domain->id,
            'properties' => $properties,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    private function present(Domain $domain, DomainVerificationService $verification): array
    {
        return [
            ...$domain->toArray(),
            'connection' => $verification->connectionGuide($domain),
        ];
    }
}
