<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            ProvinceSeeder::class,
            DistritSeeder::class,
            DelegationSeeder::class,
            OrganSeeder::class,
            PositionSeeder::class,
            UserSeeder::class,
            MemberSeeder::class,
            ElectionSeeder::class,
            ElectionTeamSeeder::class,
            CandidateSeeder::class,
            ElectionVoterSeeder::class,
            VoteSeeder::class,
            VoteReceiptSeeder::class,
            AuditLogSeeder::class,
            NotificationSeeder::class,
            SettingSeeder::class,
        ]);
    }
}
