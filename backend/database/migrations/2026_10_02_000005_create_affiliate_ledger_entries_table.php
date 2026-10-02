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
        Schema::create('affiliate_ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->restrictOnDelete();
            $table->foreignId('payout_id')->nullable()->constrained('affiliate_payouts')->restrictOnDelete();
            $table->string('entry_type', 32); // sales_commission, co_prize_credit, payout_debit, reversal_debit
            $table->bigInteger('amount_cents');
            $table->char('currency', 3)->default('USD');
            $table->string('status', 24)->default('pending'); // pending, available, cleared, cancelled
            $table->string('funding_source', 32)->default('commercial_operations'); // commercial_operations, marketing_pool
            $table->json('metadata')->nullable();
            $table->timestamp('matures_at')->nullable();
            $table->string('idempotency_key', 128)->unique();
            $table->timestamps();

            $table->index(['order_id', 'entry_type'], 'idx_affiliate_ledger_order_type');
            $table->index(['user_id', 'status', 'matures_at'], 'idx_affiliate_ledger_user_status_matures');
            $table->index(['user_id', 'created_at'], 'idx_affiliate_ledger_user_created');
            $table->index('payout_id', 'idx_affiliate_ledger_payout');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliate_ledger_entries');
    }
};
