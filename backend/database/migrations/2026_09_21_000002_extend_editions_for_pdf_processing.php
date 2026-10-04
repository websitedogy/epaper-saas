<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('editions', function (Blueprint $table): void {
            $table->date('edition_date')->nullable()->after('name');
            $table->string('original_pdf')->nullable()->after('edition_date');
            $table->unsignedInteger('total_pages')->default(0)->after('original_pdf');
            $table->unsignedTinyInteger('processing_progress')->default(0)->after('total_pages');
            $table->index(['customer_id', 'status', 'edition_date']);
        });

        Schema::create('edition_pages', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('edition_id')->constrained('editions')->cascadeOnDelete();
            $table->unsignedInteger('page_number');
            $table->string('image_path');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamps();
            $table->unique(['edition_id', 'page_number']);
            $table->index('edition_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('edition_pages');
        Schema::table('editions', function (Blueprint $table): void {
            $table->dropIndex(['customer_id', 'status', 'edition_date']);
            $table->dropColumn(['edition_date', 'original_pdf', 'total_pages', 'processing_progress']);
        });
    }
};
