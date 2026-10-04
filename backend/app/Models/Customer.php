<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone_number',
        'slug',
        'status',
        'paper_name',
        'state',
        'district',
        'default_domain',
        'domain_name',
        'brand_name',
        'logo_url',
        'primary_color',
        'secondary_color',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Customer $customer): void {
            $customer->slug ??= str($customer->name)->slug()->toString();
            $customer->default_domain ??= $customer->domain_name;
            $customer->domain_name ??= $customer->default_domain;
            $customer->status ??= 'pending';
        });
    }

    public function domains()
    {
        return $this->hasMany(Domain::class);
    }

    public function primaryDomain()
    {
        return $this->hasOne(Domain::class)->where('is_primary', true);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
