<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        $payload = $this->all();

        if (empty($payload) && ! empty($this->getContent())) {
            $decoded = json_decode($this->getContent(), true);

            if (is_array($decoded)) {
                $this->replace($decoded);
            }
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }
}
