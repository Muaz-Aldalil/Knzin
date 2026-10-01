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
        Schema::create('course_entitlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('course_id')->constrained('courses')->restrictOnDelete();
            $table->foreignUuid('course_part_id')->nullable()->constrained('course_parts')->restrictOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->restrictOnDelete();
            $table->string('status', 20)->default('active');
            $table->string('scope_key', 36)->virtualAs("COALESCE(course_part_id, 'BUNDLE')");
            $table->string('active_scope_key', 36)->nullable()->virtualAs("IF(status = 'active', COALESCE(course_part_id, 'BUNDLE'), NULL)");
            $table->foreignUuid('superseded_by_entitlement_id')->nullable()->constrained('course_entitlements')->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'course_id', 'active_scope_key'], 'uq_user_course_active_scope');
            $table->index(['user_id', 'course_id', 'status'], 'idx_entitlements_user_lookup');
            $table->index('order_id', 'idx_entitlements_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_entitlements');
    }
};
