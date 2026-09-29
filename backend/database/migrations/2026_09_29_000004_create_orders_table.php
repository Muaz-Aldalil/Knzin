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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number', 32)->unique('uq_orders_number');
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete()->index('idx_orders_user');
            $table->bigInteger('total_amount_cents');
            $table->char('currency', 3)->default('USD');
            $table->decimal('exchange_rate', 10, 4)->default(1.3100);
            $table->bigInteger('paid_amount_gateway');
            $table->string('display_price_label', 50);
            $table->integer('promotional_tickets_granted')->default(1);
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('idempotency_key', 64)->unique('uq_orders_idempotency');
            $table->boolean('legal_terms_agreed');
            $table->string('terms_agreed_ip', 45);
            $table->timestamp('terms_agreed_at')->useCurrent();
            $table->json('quiz_answers')->nullable();
            $table->timestamp('quiz_completed_at')->nullable();
            $table->timestamp('expires_at')->useCurrent();
            $table->timestamps();

            $table->index(['status', 'expires_at'], 'idx_orders_status_expires');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
