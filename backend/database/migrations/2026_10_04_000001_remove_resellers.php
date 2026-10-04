<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('customers', 'reseller_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropConstrainedForeignId('reseller_id');
            });
        }

        if (Schema::hasColumn('audit_logs', 'reseller_id')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->dropForeign(['reseller_id']);
                $table->dropIndex(['reseller_id', 'event']);
                $table->dropColumn('reseller_id');
            });
        }

        if (Schema::hasColumn('users', 'reseller_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(['reseller_id', 'customer_id', 'role_id']);
                $table->dropColumn('reseller_id');
                $table->index(['customer_id', 'role_id']);
            });
        }

        Schema::dropIfExists('resellers');

        $roleIds = DB::table('roles')->where('slug', 'reseller-admin')->pluck('id');
        if ($roleIds->isNotEmpty()) {
            DB::table('role_user')->whereIn('role_id', $roleIds)->delete();
            DB::table('permission_role')->whereIn('role_id', $roleIds)->delete();
            DB::table('roles')->whereIn('id', $roleIds)->delete();
        }

        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['manage_resellers', 'view_reseller_customers'])
            ->pluck('id');
        if ($permissionIds->isNotEmpty()) {
            DB::table('permission_role')->whereIn('permission_id', $permissionIds)->delete();
            DB::table('permissions')->whereIn('id', $permissionIds)->delete();
        }
    }

    public function down(): void
    {
        Schema::create('resellers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->nullable();
            $table->string('status')->default('active');
            $table->string('default_domain')->nullable();
            $table->jsonb('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->uuid('reseller_id')->nullable();
            $table->dropIndex(['customer_id', 'role_id']);
            $table->index(['reseller_id', 'customer_id', 'role_id']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreignUuid('reseller_id')->nullable()->constrained('resellers')->nullOnDelete();
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreignUuid('reseller_id')->nullable()->constrained('resellers')->nullOnDelete();
            $table->index(['reseller_id', 'event']);
        });
    }
};
