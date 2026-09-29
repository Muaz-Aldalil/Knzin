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
        Schema::create('draws', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('tier', ['hourly', 'daily', 'monthly']);
            $table->enum('execution_type', ['automated_electronic', 'live_broadcast'])->default('automated_electronic');
            $table->string('title_ar', 150);
            $table->string('title_en', 150);
            $table->enum('status', ['upcoming', 'active', 'locked', 'completed'])->default('upcoming');
            $table->dateTime('starts_at')->index('idx_draws_starts_at');
            $table->dateTime('ends_at')->index('idx_draws_ends_at');
            $table->string('broadcast_url', 255)->nullable();
            $table->unsignedInteger('total_eligible_tickets')->default(0);
            $table->timestamps();

            $table->index(['status', 'tier'], 'idx_draws_status_tier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draws');
    }
};
