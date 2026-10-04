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
        Schema::create('payment_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('gateway', 32);
            $table->string('event_type', 64)->nullable();
            $table->string('idempotency_key', 128)->unique();
            $table->json('payload');
            $table->json('headers')->nullable();
            $table->boolean('signature_verified')->default(false);
            $table->boolean('processed')->default(false);
            $table->text('error_message')->nullable();
            $table->string('ip_hash', 64);
            $table->timestamps();

            $table->index(['gateway', 'processed'], 'idx_payment_webhooks_gateway_processed');
            $table->index('created_at', 'idx_payment_webhooks_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_webhooks');
    }
};
