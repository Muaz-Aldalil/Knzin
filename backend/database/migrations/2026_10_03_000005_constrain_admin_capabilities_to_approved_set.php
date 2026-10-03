<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE admin_capabilities ADD CONSTRAINT chk_admin_capabilities_approved_set CHECK (capability IN ('manage_admin_capabilities','manage_platform_settings','adjudicate_affiliate_coprize','issue_kyc_approval','issue_draw_audit_approval','settle_affiliate_payout'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE admin_capabilities DROP CONSTRAINT chk_admin_capabilities_approved_set");
    }
};
