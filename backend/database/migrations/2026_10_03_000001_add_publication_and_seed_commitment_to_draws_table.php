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
        Schema::table('draws', function (Blueprint $table) {
            $table->boolean('is_published')->default(1)->after('status');
            $table->timestamp('published_at')->nullable()->after('is_published');
            $table->foreignUuid('published_by_user_id')->nullable()->after('published_at')->constrained('users')->nullOnDelete();
            $table->char('server_seed_hash', 64)->nullable()->after('published_by_user_id');
            $table->text('server_seed_encrypted')->nullable()->after('server_seed_hash');
            $table->timestamp('seed_committed_at')->nullable()->after('server_seed_encrypted');
            $table->char('server_seed_revealed', 64)->nullable()->after('seed_committed_at');
            $table->timestamp('seed_revealed_at')->nullable()->after('server_seed_revealed');

            $table->index(['is_published', 'status', 'tier'], 'idx_draws_published_status_tier');
        });

        DB::statement('ALTER TABLE draws ADD CONSTRAINT chk_draws_draft_is_upcoming CHECK (is_published = 1 OR status = "upcoming")');
        DB::statement('ALTER TABLE draws ADD CONSTRAINT chk_draws_seed_atomic CHECK ((server_seed_hash IS NULL AND server_seed_encrypted IS NULL AND seed_committed_at IS NULL) OR (server_seed_hash IS NOT NULL AND server_seed_encrypted IS NOT NULL AND seed_committed_at IS NOT NULL))');
        DB::statement('ALTER TABLE draws ADD CONSTRAINT chk_draws_seed_hash_len CHECK (server_seed_hash IS NULL OR CHAR_LENGTH(server_seed_hash) = 64)');
        DB::statement('ALTER TABLE draws ADD CONSTRAINT chk_draws_reveal_requires_commit CHECK (server_seed_revealed IS NULL OR server_seed_hash IS NOT NULL)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('draws', function (Blueprint $table) {
            $table->dropIndex('idx_draws_published_status_tier');
            $table->dropForeign(['published_by_user_id']);
            $table->dropColumn([
                'is_published',
                'published_at',
                'published_by_user_id',
                'server_seed_hash',
                'server_seed_encrypted',
                'seed_committed_at',
                'server_seed_revealed',
                'seed_revealed_at',
            ]);
        });
    }
};
