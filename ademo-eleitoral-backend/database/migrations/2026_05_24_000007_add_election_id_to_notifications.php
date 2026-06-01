<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            if (! Schema::hasColumn('notifications', 'election_id')) {
                $table->foreignId('election_id')->nullable()->after('user_id')->constrained('elections')->nullOnDelete()->cascadeOnUpdate();
            }
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            if (Schema::hasColumn('notifications', 'election_id')) {
                $table->dropConstrainedForeignId('election_id');
            }
        });
    }
};
