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
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete()->index('idx_progress_user');
            $table->foreignUuid('course_id')->constrained('courses')->cascadeOnDelete()->index('idx_progress_course');
            $table->foreignUuid('course_part_id')->constrained('course_parts')->cascadeOnDelete()->index('idx_progress_part');
            $table->unsignedInteger('watch_seconds')->default(0);
            $table->unsignedTinyInteger('percent_complete')->default(0);
            $table->boolean('is_completed')->default(false)->index('idx_progress_completed');
            $table->timestamp('last_watched_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_part_id'], 'uq_progress_user_part');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};
