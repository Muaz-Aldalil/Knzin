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
        Schema::create('approval_records', function (Blueprint $table) {
            $table->id();
            $table->string('approval_id', 64)->unique();
            $table->string('approval_type', 32); // kyc, draw_integrity
            $table->string('subject_type', 64);  // user, draw
            $table->string('subject_id', 64);    // winner user_id, draw_id
            $table->string('status', 32)->default('pending'); // pending, approved, rejected, revoked, superseded
            $table->timestamp('approved_at')->nullable();
            $table->string('approved_by', 64)->nullable();
            $table->string('source', 64);        // compliance_kyc_subsystem, draw_audit_engine
            $table->unsignedInteger('version')->default(1);
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoked_by', 64)->nullable();
            $table->string('revocation_reason', 255)->nullable();
            $table->timestamp('superseded_at')->nullable();
            $table->string('superseded_by_approval_id', 64)->nullable();
            $table->timestamps();

            $table->unique(['approval_type', 'subject_type', 'subject_id', 'version'], 'uq_approval_version');
            $table->index(['approval_type', 'subject_id', 'version'], 'idx_approval_lookup');
            $table->index(['approval_type', 'status', 'revoked_at'], 'idx_approval_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_records');
    }
};
