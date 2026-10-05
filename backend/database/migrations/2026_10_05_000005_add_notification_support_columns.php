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
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('recovery_notification_sent_at')->nullable()->after('status');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->unsignedInteger('content_version')->default(1)->after('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('recovery_notification_sent_at');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('content_version');
        });
    }
};
