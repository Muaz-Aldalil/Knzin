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
        Schema::table('affiliate_payouts', function (Blueprint $table) {
            $table->string('receipt_path', 255)->nullable()->after('admin_reference_number');
            $table->char('receipt_sha256', 64)->nullable()->after('receipt_path');

            $table->index('admin_reference_number', 'idx_affiliate_payouts_admin_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('affiliate_payouts', function (Blueprint $table) {
            $table->dropIndex('idx_affiliate_payouts_admin_reference');
            $table->dropColumn(['receipt_path', 'receipt_sha256']);
        });
    }
};
