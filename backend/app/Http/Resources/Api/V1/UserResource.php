<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'locale' => $this->locale,
            'role_id' => $this->role_id,
            'reseller_id' => $this->reseller_id,
            'customer_id' => $this->customer_id,
            'roles' => $this->relationLoaded('roles')
                ? $this->roles->pluck('slug')->values()->all()
                : $this->roles()->pluck('slug')->values()->all(),
            'customer' => $this->when($this->customer_id && $this->relationLoaded('customer'), fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'domain_name' => $this->customer->domain_name,
                'paper_name' => $this->customer->paper_name,
            ]),
            'last_login_at' => $this->last_login_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
