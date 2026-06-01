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

        $checks = [
            'province' => ['province_status_check', "'ACTIVE','INACTIVE','SUSPENDED'"],
            'distrit' => ['distrit_status_check', "'ACTIVE','INACTIVE','SUSPENDED'"],
            'delegations' => ['delegations_status_check', "'ACTIVE','INACTIVE','SUSPENDED'"],
            'organs' => ['organs_status_check', "'ACTIVE','INACTIVE','SUSPENDED'"],
            'positions' => ['positions_status_check', "'ACTIVE','INACTIVE','SUSPENDED'"],
            'members' => ['members_status_check', "'ACTIVE','INACTIVE','SUSPENDED'"],
            'users' => ['users_status_check', "'ACTIVE','INACTIVE','SUSPENDED','BLOCKED'"],
            'elections' => ['elections_status_check', "'PROGRAMADA','EM_VOTACAO','CONCLUIDA','RESULTADOS_PUBLICADOS','SUSPENDED'"],
            'candidates' => ['candidates_status_check', "'PENDING','APPROVED','REJECTED','SUSPENDED'"],
            'election_voters' => ['election_voters_status_check', "'AUTHORIZED','REMOVED','SUSPENDED'"],
        ];

        foreach ($checks as $table => [$constraint, $values]) {
            $this->replaceCheck($driver, $table, $constraint, "status IN ($values)");
        }

        if (DB::getSchemaBuilder()->hasTable('election_team') && DB::getSchemaBuilder()->hasColumn('election_team', 'status')) {
            $this->replaceCheck($driver, 'election_team', 'election_team_status_check', "status IN ('AUTHORIZED','REMOVED','SUSPENDED')");
        }

        if (DB::getSchemaBuilder()->hasTable('physical_vote_totals') && DB::getSchemaBuilder()->hasColumn('physical_vote_totals', 'status')) {
            $this->replaceCheck($driver, 'physical_vote_totals', 'physical_vote_totals_status_check', "status IN ('PENDING','APPROVED','REJECTED','SUSPENDED')");
        }
    }

    public function down(): void
    {
        // Keep the broader status vocabulary to avoid breaking existing records.
    }

    private function replaceCheck(string $driver, string $table, string $constraint, string $expression): void
    {
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS {$constraint}");
            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$constraint} CHECK ({$expression})");
            return;
        }

        if ($driver === 'mysql') {
            try {
                DB::statement("ALTER TABLE {$table} DROP CHECK {$constraint}");
            } catch (Throwable) {
                // Constraint may not exist in local databases.
            }
            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$constraint} CHECK ({$expression})");
        }
    }
};
