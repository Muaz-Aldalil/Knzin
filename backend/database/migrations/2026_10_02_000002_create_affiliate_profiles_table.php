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
        Schema::create('affiliate_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('custom_slug', 64)->nullable()->unique();
            $table->string('default_payout_method', 32)->nullable();
            $table->text('payout_details')->nullable();
            $table->string('status', 24)->default('active');
            $table->timestamps();

            $table->index('status', 'idx_affiliate_profiles_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliate_profiles');
    }
};
