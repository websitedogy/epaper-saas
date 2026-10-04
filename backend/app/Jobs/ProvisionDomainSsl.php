<?php

namespace App\Jobs;

use App\Models\Domain;
use App\Services\SslProvisioningService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProvisionDomainSsl implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 240;

    public function __construct(public string $domainId)
    {
    }

    public function handle(SslProvisioningService $ssl): void
    {
        $domain = Domain::query()->with('customer')->findOrFail($this->domainId);
        $ssl->provision($domain);
    }
}
