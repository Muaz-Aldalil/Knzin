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
        Schema::create('admin_broadcasts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('admin_user_id')->constrained('users')->cascadeOnDelete()->index('idx_admin_broadcasts_admin');
            $table->string('title_ar', 255);
            $table->string('title_en', 255);
            $table->text('body_ar');
            $table->text('body_en');
            $table->json('channels');
            $table->integer('sent_count')->default(0);
            $table->timestamps();

            $table->index('created_at', 'idx_admin_broadcasts_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_broadcasts');
    }
};
