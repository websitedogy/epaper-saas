<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Category;
use App\Models\Edition;
use App\Models\SubCategory;
use Illuminate\Http\JsonResponse;

class CustomerDashboardController extends BaseApiController
{
    public function __invoke(): JsonResponse
    {
        $customerId = request()->user()->customer_id;

        abort_if(! $customerId, 403, 'A customer tenant is required.');

        $categories = Category::query()->where('customer_id', $customerId);
        $subCategories = SubCategory::query()->whereHas('category', fn ($query) => $query->where('customer_id', $customerId));
        $editions = Edition::query()->where('customer_id', $customerId);

        $recentEditions = (clone $editions)
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'slug', 'status', 'total_pages', 'published_at', 'created_at'])
            ->map(fn (Edition $edition): array => [
                'id' => $edition->id,
                'name' => $edition->name,
                'slug' => $edition->slug,
                'category' => null,
                'status' => $edition->status,
                'total_pages' => $edition->total_pages,
                'date' => ($edition->published_at ?? $edition->created_at)?->format('d M Y, h:i A'),
            ])
            ->values()
            ->all();

        return $this->successResponse([
            'stats' => [
                'categories' => $categories->count(),
                'sub_categories' => $subCategories->count(),
                'editions' => (clone $editions)->count(),
                'published_editions' => (clone $editions)->where('status', 'published')->count(),
                'pending_editions' => (clone $editions)->where('status', '!=', 'published')->count(),
                'ai_tasks' => 0,
                'ai_tasks_pending' => 0,
            ],
            'recent_editions' => $recentEditions,
        ], 'Tenant dashboard retrieved successfully');
    }
}
