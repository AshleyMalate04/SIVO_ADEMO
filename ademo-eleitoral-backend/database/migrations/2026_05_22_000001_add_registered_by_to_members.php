<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table): void {
            if (! Schema::hasColumn('members', 'registered_by')) {
                $table->foreignId('registered_by')->nullable()->after('registered_at')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table): void {
            if (Schema::hasColumn('members', 'registered_by')) {
                $table->dropConstrainedForeignId('registered_by');
            }
        });
    }
};
