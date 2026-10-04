<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->index(['status', 'created_at']);
        });

        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->index(['status', 'expires_at']);
        });

        Schema::table('domains', function (Blueprint $table): void {
            $table->index(['verification_status', 'ssl_status']);
        });
    }

    public function down(): void
    {
        Schema::table('customers', fn (Blueprint $table) => $table->dropIndex(['status', 'created_at']));
        Schema::table('subscriptions', fn (Blueprint $table) => $table->dropIndex(['status', 'expires_at']));
        Schema::table('domains', fn (Blueprint $table) => $table->dropIndex(['verification_status', 'ssl_status']));
    }
};