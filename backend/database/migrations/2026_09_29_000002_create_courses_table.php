<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 100)->unique('uq_courses_slug');
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->text('description_ar');
            $table->text('description_en');
            $table->string('cover_image_url', 500);
            $table->bigInteger('bundle_price_cents')->default(1000);
            $table->integer('bundle_promotional_tickets')->default(15);
            $table->string('display_price_label', 50)->default('13,000 IQD');
            $table->boolean('is_active')->default(true)->index('idx_courses_active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
