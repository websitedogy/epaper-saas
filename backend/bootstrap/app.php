<?php

use App\Http\Middleware\AllowTenantCors;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureDomainAccess;
use App\Http\Middleware\ResolveTenantFromRequest;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('domains:reconcile')->hourly();
        $schedule->command('app:backup')->dailyAt((string) config('backup.daily_at', '02:15'));
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(AllowTenantCors::class);
        $middleware->alias([
            'tenant' => ResolveTenantFromRequest::class,
            'super_admin' => EnsureSuperAdmin::class,
            'domain_access' => EnsureDomainAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
