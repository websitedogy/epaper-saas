<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Domain extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'domain',
        'domain_status',
        'brand_name',
        'logo_url',
        'primary_color',
        'secondary_color',
        'is_primary',
        'verification_status',
        'ssl_status',
        'dns_verified_at',
        'ssl_issued_at',
        'last_checked_at',
        'verified_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'dns_verified_at' => 'datetime',
        'ssl_issued_at' => 'datetime',
        'last_checked_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function isActive(): bool
    {
        return $this->domain_status === 'active'
            && $this->verification_status === 'active'
            && $this->ssl_status === 'active';
    }
}
