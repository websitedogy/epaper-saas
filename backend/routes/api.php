<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\System\HealthController;
use App\Http\Controllers\Api\V1\Customer\CustomerDashboardController;
use App\Http\Controllers\Api\V1\Customer\EditionController;
use App\Http\Controllers\Api\V1\Public\PublicSiteController;
use App\Http\Controllers\Api\V1\Public\TlsAllowanceController;
use App\Http\Controllers\Api\V1\SuperAdmin\DomainController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('health', [HealthController::class, 'index']);
    Route::get('public/tls-allowed', TlsAllowanceController::class);

    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('tenant');
        Route::middleware(['auth:sanctum', 'tenant', 'domain_access'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'tenant', 'domain_access', 'super_admin'])->group(function () {
        Route::prefix('super-admin')->group(function () {
            Route::get('dashboard', [\App\Http\Controllers\Api\V1\SuperAdmin\SuperAdminClientController::class, 'dashboard']);
            Route::get('infrastructure', \App\Http\Controllers\Api\V1\SuperAdmin\InfrastructureController::class);
            Route::get('clients', [\App\Http\Controllers\Api\V1\SuperAdmin\SuperAdminClientController::class, 'index']);
            Route::post('clients', [\App\Http\Controllers\Api\V1\SuperAdmin\SuperAdminClientController::class, 'store']);
            Route::put('clients/{customer}', [\App\Http\Controllers\Api\V1\SuperAdmin\SuperAdminClientController::class, 'update']);
            Route::get('domains', [DomainController::class, 'index']);
            Route::post('domains', [DomainController::class, 'store']);
            Route::put('domains/{domain}', [DomainController::class, 'update']);
            Route::delete('domains/{domain}', [DomainController::class, 'destroy']);
            Route::post('domains/{domain}/verify', [DomainController::class, 'verify']);
            Route::post('domains/{domain}/ssl', [DomainController::class, 'provisionSsl']);
            Route::post('domains/{domain}/activate', [DomainController::class, 'activate']);
            Route::post('domains/{domain}/deactivate', [DomainController::class, 'deactivate']);
        });

    });

    Route::middleware(['auth:sanctum', 'tenant', 'domain_access'])->prefix('customer')->group(function () {
        Route::get('dashboard', CustomerDashboardController::class);
        Route::get('categories', [\App\Http\Controllers\Api\V1\Customer\CategoryController::class, 'index']);
        Route::post('categories', [\App\Http\Controllers\Api\V1\Customer\CategoryController::class, 'store']);
        Route::get('sub-categories', [\App\Http\Controllers\Api\V1\Customer\SubCategoryController::class, 'index']);
        Route::post('sub-categories', [\App\Http\Controllers\Api\V1\Customer\SubCategoryController::class, 'store']);
        Route::get('editions', [EditionController::class, 'index']);
        Route::post('editions', [EditionController::class, 'store']);
        Route::get('editions/{edition}', [EditionController::class, 'show']);
        Route::post('editions/{edition}/extract', [EditionController::class, 'extract']);
        Route::post('editions/{edition}/publish', [EditionController::class, 'publish']);
        Route::get('editions/{edition}/pages/{page}', [EditionController::class, 'pageImage'])->whereNumber('page');
    });

    Route::middleware('tenant')->group(function () {
        Route::get('public/site', PublicSiteController::class);
        Route::get('public/editions/{slug}', [EditionController::class, 'publicShow'])->name('public.edition.show');
        Route::get('public/editions/{slug}/pages/{page}', [EditionController::class, 'publicPageImage'])->whereNumber('page')->name('public.edition.page');
    });
});
