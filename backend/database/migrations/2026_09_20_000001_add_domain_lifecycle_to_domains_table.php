<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table): void {
            $table->string('verification_status')->default('not_connected')->after('is_primary');
            $table->string('ssl_status')->default('not_active')->after('verification_status');
            $table->timestamp('dns_verified_at')->nullable()->after('ssl_status');
            $table->timestamp('ssl_issued_at')->nullable()->after('dns_verified_at');
            $table->timestamp('last_checked_at')->nullable()->after('ssl_issued_at');
            $table->index(['customer_id', 'verification_status']);
            $table->index(['customer_id', 'ssl_status']);
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table): void {
            $table->dropIndex(['customer_id', 'verification_status']);
            $table->dropIndex(['customer_id', 'ssl_status']);
            $table->dropColumn([
                'verification_status',
                'ssl_status',
                'dns_verified_at',
                'ssl_issued_at',
                'last_checked_at',
            ]);
        });
    }
};
