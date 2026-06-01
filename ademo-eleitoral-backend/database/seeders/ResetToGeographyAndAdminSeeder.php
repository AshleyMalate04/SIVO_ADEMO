<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetToGeographyAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        $tables = [
            'personal_access_tokens',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'settings',
            'notifications',
            'audit_logs',
            'vote_receipts',
            'votes',
            'physical_vote_totals',
            'election_voters',
            'candidates',
            'election_team',
            'elections',
            'members',
            'positions',
            'organs',
            'delegations',
            'users',
            'distrit',
            'province',
        ];

        $existingTables = array_values(array_filter(
            $tables,
            static fn (string $table): bool => Schema::hasTable($table)
        ));

        if ($existingTables !== []) {
            DB::statement('TRUNCATE TABLE '.implode(', ', array_map(
                static fn (string $table): string => DB::getQueryGrammar()->wrapTable($table),
                $existingTables
            )).' RESTART IDENTITY CASCADE');
        }

        $this->call([
            ProvinceSeeder::class,
            DistritSeeder::class,
            UserSeeder::class,
        ]);
    }
}
