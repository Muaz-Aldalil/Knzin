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
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique('uq_notification_preferences_user')->constrained('users')->cascadeOnDelete();
            $table->boolean('course_announcements')->default(true);
            $table->boolean('prize_draw_promotions')->default(true);
            $table->boolean('admin_broadcasts')->default(true);
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
