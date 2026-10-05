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
        Schema::create('course_mission_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained('courses')->cascadeOnDelete();
            $table->timestamp('last_reminded_at');
            $table->timestamps();

            $table->unique(['user_id', 'course_id'], 'uq_mission_reminders_user_course');
            $table->index('last_reminded_at', 'idx_mission_reminders_cooldown');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_mission_reminders');
    }
};
