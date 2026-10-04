<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->where('customer_id', $this->requireCustomerId($request))
            ->latest()
            ->get();

        return $this->successResponse($categories, 'Categories retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $customerId = $this->requireCustomerId($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->where('customer_id', $customerId)->whereNull('deleted_at')],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category = Category::create([
            'customer_id' => $customerId,
            'name' => trim($data['name']),
            'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(4)),
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $this->successResponse($category, 'Category created successfully', 201);
    }
}
