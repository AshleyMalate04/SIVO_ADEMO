<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('election_team', function (Blueprint $table): void {
            if (! Schema::hasColumn('election_team', 'status')) {
                $table->string('status', 20)->default('AUTHORIZED')->after('role_in_election');
            }
        });
    }

    public function down(): void
    {
        Schema::table('election_team', function (Blueprint $table): void {
            if (Schema::hasColumn('election_team', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
