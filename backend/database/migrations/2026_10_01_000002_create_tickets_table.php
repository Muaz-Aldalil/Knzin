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
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->restrictOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained('order_items')->nullOnDelete();
            $table->unsignedTinyInteger('order_ticket_index');
            $table->string('serial_number', 24);
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamps();

            $table->unique('serial_number', 'uq_tickets_serial_number');
            $table->unique(['order_id', 'order_ticket_index'], 'uq_order_ticket_index');
            $table->index(['user_id', 'issued_at'], 'idx_tickets_user_issued');
            $table->index('order_id', 'idx_tickets_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
