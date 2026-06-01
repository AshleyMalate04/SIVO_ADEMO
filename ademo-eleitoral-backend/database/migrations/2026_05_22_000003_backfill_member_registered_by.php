<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('members', 'registered_by')) {
            return;
        }

        $fallbackUserId = DB::table('users')
            ->where('role', 'ADMIN')
            ->orderBy('id')
            ->value('id') ?? DB::table('users')->orderBy('id')->value('id');

        if (! $fallbackUserId) {
            return;
        }

        DB::table('members')
            ->whereNull('registered_by')
            ->update(['registered_by' => $fallbackUserId]);
    }

    public function down(): void
    {
        // Backfill only; no destructive rollback.
    }
};
