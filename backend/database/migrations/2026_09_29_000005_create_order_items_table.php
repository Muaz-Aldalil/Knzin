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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete()->index('idx_order_items_order');
            $table->foreignUuid('course_id')->constrained('courses')->restrictOnDelete()->index('idx_order_items_course');
            $table->foreignUuid('course_part_id')->nullable()->constrained('course_parts')->restrictOnDelete();
            $table->enum('item_type', ['bundle', 'part']);
            $table->bigInteger('price_cents');
            $table->integer('promotional_tickets_granted');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
