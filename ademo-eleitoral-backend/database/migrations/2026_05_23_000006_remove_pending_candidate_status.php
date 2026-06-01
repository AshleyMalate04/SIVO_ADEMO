<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('candidates')->where('status', 'PENDING')->update(['status' => 'APPROVED']);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check');
            DB::statement("ALTER TABLE candidates ALTER COLUMN status SET DEFAULT 'APPROVED'");
            DB::statement("ALTER TABLE candidates ADD CONSTRAINT candidates_status_check CHECK (status IN ('APPROVED','REJECTED','SUSPENDED'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check');
            DB::statement("ALTER TABLE candidates ALTER COLUMN status SET DEFAULT 'PENDING'");
            DB::statement("ALTER TABLE candidates ADD CONSTRAINT candidates_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','SUSPENDED'))");
        }
    }
};
