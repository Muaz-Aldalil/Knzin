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
        // 1. Orders table: speed up user order history, ticket reconciliation, and pending recovery
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_orders_user_status');
        });

        // 2. Draws table: optimize active countdown lookups and tier intervals
        Schema::table('draws', function (Blueprint $table) {
            $table->index(['tier', 'status', 'starts_at'], 'idx_draws_tier_status_starts');
        });

        // 3. Lesson Progress table: speed up student course progress summaries and mission evaluation
        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->index(['user_id', 'course_id', 'is_completed'], 'idx_progress_user_course_completed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_user_status');
        });

        Schema::table('draws', function (Blueprint $table) {
            $table->dropIndex('idx_draws_tier_status_starts');
        });

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropIndex('idx_progress_user_course_completed');
        });
    }
};
