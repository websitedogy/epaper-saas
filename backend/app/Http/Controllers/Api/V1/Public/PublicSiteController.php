<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Edition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicSiteController extends BaseApiController
{
    public function __invoke(Request $request): JsonResponse
    {
        if ((bool) $request->attributes->get('central_domain')) {
            return $this->successResponse([
                'kind' => 'central',
                'paper' => null,
                'editions' => [],
            ], 'Platform site');
        }

        $domain = $request->attributes->get('resolved_domain');
        $customer = $domain?->customer;
        abort_unless($customer, 404, 'Domain not configured.');

        $editions = Edition::query()
            ->where('customer_id', $customer->id)
            ->where('status', 'published')
            ->latest('edition_date')
            ->limit(12)
            ->with(['pages' => fn ($query) => $query->where('page_number', 1)])
            ->get()
            ->map(fn (Edition $edition): array => [
                'id' => $edition->id,
                'name' => $edition->name,
                'slug' => $edition->slug,
                'edition_date' => $edition->edition_date?->toDateString(),
                'total_pages' => $edition->total_pages,
                'cover_url' => $edition->pages->first()
                    ? route('public.edition.page', ['slug' => $edition->slug, 'page' => 1])
                    : null,
            ])
            ->values()
            ->all();

        return $this->successResponse([
            'kind' => 'tenant',
            'paper' => [
                'name' => $customer->paper_name ?: $domain->brand_name ?: $customer->name,
                'domain' => $domain->domain,
                'logo_url' => $domain->logo_url,
            ],
            'editions' => $editions,
        ], 'Tenant newspaper site');
    }
}
