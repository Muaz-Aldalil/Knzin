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
        Schema::create('affiliate_payouts', function (Blueprint $table) {
            $table->id();
            $table->string('payout_number', 32)->unique();
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->unsignedBigInteger('threshold_cents_at_request');
            $table->unsignedBigInteger('amount_iqd');
            $table->string('payout_method', 32);
            $table->text('recipient_details');
            $table->string('status', 24)->default('requested');
            $table->string('admin_reference_number', 128)->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignUuid('processed_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status'], 'idx_affiliate_payouts_user_status');
        });

        DB::statement('ALTER TABLE affiliate_payouts ADD CONSTRAINT chk_affiliate_payouts_positive_amount CHECK (amount_cents > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliate_payouts');
    }
};
