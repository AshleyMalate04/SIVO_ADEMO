<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','BLOCKED'))");
        } elseif ($driver === 'mysql') {
            try {
                DB::statement('ALTER TABLE users DROP CHECK users_status_check');
            } catch (Throwable) {
                // Constraint may not exist in local databases.
            }
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','BLOCKED'))");
        }

        DB::table('users')->where('status', 'BLOCKED')->update(['status' => 'SUSPENDED']);
    }

    public function down(): void
    {
        DB::table('users')->where('status', 'SUSPENDED')->update(['status' => 'BLOCKED']);
    }
};
