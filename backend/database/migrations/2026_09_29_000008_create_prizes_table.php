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
        Schema::create('prizes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('draw_id')->constrained('draws')->cascadeOnDelete()->index('idx_prizes_draw');
            $table->string('title_ar', 150);
            $table->string('title_en', 150);
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->enum('category', ['cash', 'merchandise']);
            $table->unsignedBigInteger('valuation_usd_cents');
            $table->string('display_iqd_label', 50);
            $table->string('image_url', 500);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prizes');
    }
};
