<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SubCategoryController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $customerId = $this->requireCustomerId($request);
        $subCategories = SubCategory::query()
            ->with('category:id,name')
            ->whereHas('category', fn ($query) => $query->where('customer_id', $customerId))
            ->latest()
            ->get()
            ->map(fn (SubCategory $item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'description' => $item->description,
                'is_active' => $item->is_active,
                'category_id' => $item->category_id,
                'category' => $item->category?->name,
            ]);

        return $this->successResponse($subCategories, 'Sub categories retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $customerId = $this->requireCustomerId($request);
        $data = $request->validate([
            'category_id' => [
                'required',
                'uuid',
                Rule::exists('categories', 'id')->where('customer_id', $customerId)->whereNull('deleted_at'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $subCategory = SubCategory::create([
            'category_id' => $data['category_id'],
            'name' => trim($data['name']),
            'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(4)),
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $this->successResponse($subCategory->load('category:id,name'), 'Sub category created successfully', 201);
    }
}
