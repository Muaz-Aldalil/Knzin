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
        Schema::create('referral_attributions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('order_id')->unique()->constrained('orders')->restrictOnDelete();
            $table->foreignUuid('referrer_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('buyer_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('referral_code', 32);
            $table->string('campaign_tag', 64)->nullable();
            $table->unsignedInteger('commission_rate_bps')->default(2500);
            $table->string('attribution_type', 32)->default('cookie');
            $table->char('ip_hash', 64)->nullable();
            $table->char('user_agent_hash', 64)->nullable();
            $table->timestamps();

            $table->index(['referrer_user_id', 'created_at'], 'idx_ref_attr_referrer_date');
            $table->index(['referral_code', 'campaign_tag'], 'idx_ref_attr_code_campaign');
            $table->index('buyer_user_id', 'idx_ref_attr_buyer');
        });

        DB::statement('ALTER TABLE referral_attributions ADD CONSTRAINT chk_ref_attr_anti_self_referral CHECK (referrer_user_id != buyer_user_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_attributions');
    }
};
