<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table): void {
            $table->foreignUuid('customer_id')->nullable()->change();
            $table->string('domain_status')->default('active')->after('domain');
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table): void {
            $table->dropColumn('domain_status');
            $table->foreignUuid('customer_id')->nullable(false)->change();
        });
    }
};