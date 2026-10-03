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
        Schema::create('admin_activity_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->char('request_id', 36);
            $table->foreignUuid('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('capability_used', 64)->nullable();
            $table->string('action', 64);
            $table->string('target_type', 64)->nullable();
            $table->string('target_id', 64)->nullable();
            $table->string('outcome', 16);
            $table->string('reason_code', 64)->nullable();
            $table->string('administrative_justification', 500)->nullable();
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->char('ip_hash', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at', 'idx_aal_created');
            $table->index(['actor_user_id', 'created_at'], 'idx_aal_actor_created');
            $table->index(['action', 'created_at'], 'idx_aal_action_created');
            $table->index(['target_type', 'target_id'], 'idx_aal_target');
            $table->index(['outcome', 'created_at'], 'idx_aal_outcome_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_activity_logs');
    }
};
