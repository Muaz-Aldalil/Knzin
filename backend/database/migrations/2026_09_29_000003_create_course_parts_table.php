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
        Schema::create('course_parts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('course_id')->constrained('courses')->cascadeOnDelete()->index('idx_parts_course');
            $table->unsignedTinyInteger('part_number');
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->text('syllabus_ar');
            $table->text('syllabus_en');
            $table->bigInteger('part_price_cents')->default(200);
            $table->integer('part_promotional_tickets')->default(1);
            $table->string('display_price_label', 50)->default('2,000 IQD');
            $table->json('resource_types');
            $table->unsignedInteger('duration_minutes')->default(45);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['course_id', 'part_number'], 'uq_parts_course_part');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_parts');
    }
};
