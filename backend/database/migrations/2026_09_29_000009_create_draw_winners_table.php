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
        Schema::create('draw_winners', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('draw_id')->constrained('draws')->restrictOnDelete()->index('idx_draw_winners_draw');
            $table->string('winning_ticket_serial', 50)->index('idx_draw_winners_serial');
            $table->string('winner_masked_name', 100);
            $table->string('winner_governorate', 100);
            $table->boolean('prize_delivered')->default(false);
            $table->string('stream_recording_url', 500)->nullable();
            $table->dateTime('drawn_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draw_winners');
    }
};
