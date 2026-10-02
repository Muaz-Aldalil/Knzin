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
        Schema::create('admin_capabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('capability', 64);
            $table->string('status', 20)->default('active'); // active, revoked
            $table->string('provisioning_source', 32)->default('delegated_admin'); // bootstrap, delegated_admin
            $table->timestamp('granted_at')->useCurrent();
            $table->foreignUuid('granted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignUuid('revoked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('revocation_reason', 255)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'capability'], 'uq_user_admin_capability');
            $table->index(['capability', 'status', 'revoked_at'], 'idx_admin_cap_active');
            $table->index(['capability', 'user_id'], 'idx_admin_cap_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_capabilities');
    }
};
