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
        Schema::table('users', function (Blueprint $table) {
            $table->string('learner_code', 16)->nullable()->after('email');
        });

        // Crockford Base32 alphabet (excluding I, L, O, U)
        $alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        $existingCodes = [];

        DB::table('users')->orderBy('id')->chunk(100, function ($users) use ($alphabet, &$existingCodes) {
            foreach ($users as $user) {
                do {
                    $randomChars = '';
                    $bytes = random_bytes(6);
                    for ($i = 0; $i < 6; $i++) {
                        $randomChars .= $alphabet[ord($bytes[$i]) % 32];
                    }
                    $candidate = 'LRN-' . $randomChars;
                } while (isset($existingCodes[$candidate]));

                $existingCodes[$candidate] = true;

                DB::table('users')->where('id', $user->id)->update([
                    'learner_code' => $candidate,
                ]);
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('learner_code', 16)->nullable(false)->change();
            $table->unique('learner_code', 'uq_users_learner_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('uq_users_learner_code');
            $table->dropColumn('learner_code');
        });
    }
};
