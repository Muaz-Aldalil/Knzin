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
        Schema::create('promotional_awards', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('recipient_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('draw_id')->nullable()->constrained('draws')->restrictOnDelete();
            $table->string('award_title', 150);
            $table->text('award_details')->nullable();
            $table->unsignedBigInteger('valuation_usd_cents')->nullable();
            $table->string('reason', 500);
            $table->foreignUuid('awarded_by_admin_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['recipient_user_id', 'created_at'], 'idx_promo_awards_recipient');
            $table->index('draw_id', 'idx_promo_awards_draw');
        });

        DB::statement('ALTER TABLE promotional_awards ADD CONSTRAINT chk_promo_awards_valuation_non_negative CHECK (valuation_usd_cents IS NULL OR valuation_usd_cents >= 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotional_awards');
    }
};
