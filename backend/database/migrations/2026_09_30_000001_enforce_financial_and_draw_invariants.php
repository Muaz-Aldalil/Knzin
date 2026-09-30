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
        // 1. Enforce unsigned monetary types and check constraints on courses
        Schema::table('courses', function (Blueprint $table) {
            $table->unsignedBigInteger('bundle_price_cents')->default(1000)->change();
            $table->unsignedInteger('bundle_promotional_tickets')->default(15)->change();
        });
        DB::statement('ALTER TABLE courses ADD CONSTRAINT chk_courses_bundle_price_non_negative CHECK (bundle_price_cents >= 0)');
        DB::statement('ALTER TABLE courses ADD CONSTRAINT chk_courses_tickets_non_negative CHECK (bundle_promotional_tickets >= 0)');

        // 2. Enforce unsigned monetary types and check constraints on course_parts
        Schema::table('course_parts', function (Blueprint $table) {
            $table->unsignedBigInteger('part_price_cents')->default(200)->change();
            $table->unsignedInteger('part_promotional_tickets')->default(1)->change();
        });
        DB::statement('ALTER TABLE course_parts ADD CONSTRAINT chk_course_parts_price_non_negative CHECK (part_price_cents >= 0)');
        DB::statement('ALTER TABLE course_parts ADD CONSTRAINT chk_course_parts_tickets_non_negative CHECK (part_promotional_tickets >= 0)');

        // 3. Enforce unsigned monetary types and check constraints on orders
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('total_amount_cents')->change();
            $table->unsignedBigInteger('paid_amount_gateway')->change();
            $table->unsignedInteger('promotional_tickets_granted')->default(1)->change();
        });
        DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_total_non_negative CHECK (total_amount_cents >= 0)');
        DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_paid_non_negative CHECK (paid_amount_gateway >= 0)');
        DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_tickets_non_negative CHECK (promotional_tickets_granted >= 0)');

        // 4. Enforce unsigned monetary types and check constraints on order_items
        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('price_cents')->change();
            $table->unsignedInteger('promotional_tickets_granted')->change();
        });
        DB::statement('ALTER TABLE order_items ADD CONSTRAINT chk_order_items_price_non_negative CHECK (price_cents >= 0)');
        DB::statement('ALTER TABLE order_items ADD CONSTRAINT chk_order_items_tickets_non_negative CHECK (promotional_tickets_granted >= 0)');

        // 5. Enhance draw_winners relational invariants (DEF-03C)
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->foreignUuid('prize_id')->nullable()->after('draw_id')->constrained('prizes')->nullOnDelete();
            $table->unique('draw_id', 'uq_draw_winners_draw_id');
            $table->unique('winning_ticket_serial', 'uq_draw_winners_serial');
        });

        // Backfill existing draw_winners.prize_id from matching prizes table
        DB::statement('
            UPDATE draw_winners dw
            JOIN prizes p ON p.draw_id = dw.draw_id
            SET dw.prize_id = p.id
            WHERE dw.prize_id IS NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert draw_winners constraints
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->dropUnique('uq_draw_winners_draw_id');
            $table->dropUnique('uq_draw_winners_serial');
            $table->dropForeign(['prize_id']);
            $table->dropColumn('prize_id');
        });

        // 2. Revert check constraints
        DB::statement('ALTER TABLE order_items DROP CONSTRAINT chk_order_items_tickets_non_negative');
        DB::statement('ALTER TABLE order_items DROP CONSTRAINT chk_order_items_price_non_negative');
        DB::statement('ALTER TABLE orders DROP CONSTRAINT chk_orders_tickets_non_negative');
        DB::statement('ALTER TABLE orders DROP CONSTRAINT chk_orders_paid_non_negative');
        DB::statement('ALTER TABLE orders DROP CONSTRAINT chk_orders_total_non_negative');
        DB::statement('ALTER TABLE course_parts DROP CONSTRAINT chk_course_parts_tickets_non_negative');
        DB::statement('ALTER TABLE course_parts DROP CONSTRAINT chk_course_parts_price_non_negative');
        DB::statement('ALTER TABLE courses DROP CONSTRAINT chk_courses_tickets_non_negative');
        DB::statement('ALTER TABLE courses DROP CONSTRAINT chk_courses_bundle_price_non_negative');

        // 3. Revert column types to signed integers
        Schema::table('order_items', function (Blueprint $table) {
            $table->bigInteger('price_cents')->change();
            $table->integer('promotional_tickets_granted')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->bigInteger('total_amount_cents')->change();
            $table->bigInteger('paid_amount_gateway')->change();
            $table->integer('promotional_tickets_granted')->default(1)->change();
        });

        Schema::table('course_parts', function (Blueprint $table) {
            $table->bigInteger('part_price_cents')->default(200)->change();
            $table->integer('part_promotional_tickets')->default(1)->change();
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->bigInteger('bundle_price_cents')->default(1000)->change();
            $table->integer('bundle_promotional_tickets')->default(15)->change();
        });
    }
};
