<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')
                ->constrained('orders')
                ->onDelete('restrict')
                ->cascadeOnUpdate();

            $table->string('gateway', 32);
            $table->string('gateway_transaction_id', 128)->nullable();
            $table->unsignedBigInteger('amount_iqd');
            $table->string('currency', 3)->default('IQD');
            $table->string('status', 32)->default('initiated');
            $table->text('checkout_url')->nullable();
            $table->json('gateway_response')->nullable();
            $table->unsignedSmallInteger('attempt_number')->default(1);
            $table->timestamp('expires_at');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['gateway', 'gateway_transaction_id'], 'uq_payment_txns_gateway_txn');
            $table->index(['order_id', 'status'], 'idx_payment_txns_order_status');
            $table->index(['status', 'created_at'], 'idx_payment_txns_status_created');
        });

        // Non-negative positive amount invariant
        DB::statement('ALTER TABLE payment_transactions ADD CONSTRAINT chk_payment_txns_amount_positive CHECK (amount_iqd > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
