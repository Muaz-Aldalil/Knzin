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
        Schema::table('courses', function (Blueprint $table) {
            $table->json('outcomes')->nullable()->after('display_price_label');
            $table->text('curriculum_summary_ar')->nullable()->after('outcomes');
            $table->text('curriculum_summary_en')->nullable()->after('curriculum_summary_ar');
        });

        Schema::table('course_parts', function (Blueprint $table) {
            $table->boolean('is_free')->default(false)->after('part_promotional_tickets');
            $table->string('video_url', 500)->nullable()->after('duration_minutes');
            $table->string('pdf_url', 500)->nullable()->after('video_url');
            $table->string('pdf_title_ar', 255)->nullable()->after('pdf_url');
            $table->string('pdf_title_en', 255)->nullable()->after('pdf_title_ar');
        });

        // Initialize existing part 1 modules as free preview to match canonical behavior
        DB::table('course_parts')->where('part_number', 1)->update(['is_free' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_parts', function (Blueprint $table) {
            $table->dropColumn([
                'is_free',
                'video_url',
                'pdf_url',
                'pdf_title_ar',
                'pdf_title_en',
            ]);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'outcomes',
                'curriculum_summary_ar',
                'curriculum_summary_en',
            ]);
        });
    }
};
