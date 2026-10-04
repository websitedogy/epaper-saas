<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_role', function (Blueprint $table) {
            $table->uuid('permission_id');
            $table->uuid('role_id');
            $table->timestamps();

            $table->primary(['permission_id', 'role_id']);
            $table->index('permission_id');
            $table->index('role_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_role');
    }
};
