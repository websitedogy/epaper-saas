<?php

namespace App\Http\Requests\Api\V1\SuperAdmin;

use App\Models\Customer;
use App\Models\Domain;
use App\Services\DomainVerificationService;
use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['super-admin', 'super_admin']) ?? false;
    }

    public function rules(): array
    {
        $customer = $this->route('customer');
        $customerId = $customer instanceof Customer ? $customer->id : $customer;
        $primaryDomainId = $customer instanceof Customer
            ? Domain::query()->where('customer_id', $customer->id)->where('is_primary', true)->value('id')
            : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customerId)],
            'phone_number' => ['required', 'string', 'max:30'],
            'domain_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('customers', 'domain_name')->ignore($customerId),
                Rule::unique('domains', 'domain')->ignore($primaryDomainId),
            ],
            'paper_name' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'district' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:pending,active,suspended,expired'],
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
                $validator->errors()->add('domain_name', 'Use a tenant hostname such as paper.dogyepaper.com, not the platform host.');
            }
        });
    }
}
