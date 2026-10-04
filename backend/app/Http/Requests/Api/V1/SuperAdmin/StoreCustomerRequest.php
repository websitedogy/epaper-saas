<?php

namespace App\Http\Requests\Api\V1\SuperAdmin;

use App\Support\TenantContext;
use App\Services\DomainVerificationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['super-admin', 'reseller-admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:customers,email'],
            'tenant_email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'tenant_password' => ['required', 'string', 'min:8', 'max:255'],
            'phone_number' => ['required', 'string', 'max:30'],
            'domain_name' => ['required', 'string', 'max:255', 'unique:customers,domain_name', 'unique:domains,domain'],
            'paper_name' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'district' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:pending,active,suspended,expired'],
            'reseller_id' => ['sometimes', 'nullable', 'uuid'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('domain_name')) {
            $this->merge([
                'domain_name' => app(DomainVerificationService::class)->normalize((string) $this->input('domain_name')),
            ]);
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $domain = (string) $this->input('domain_name');
            if ($domain !== '' && TenantContext::isCentralHost($domain)) {
                $validator->errors()->add('domain_name', 'Use a tenant hostname such as paper.localhost, not the platform host.');
            }
        });
    }
}
