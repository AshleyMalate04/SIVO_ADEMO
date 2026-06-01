<?php

namespace Database\Seeders;

use App\Models\Election;
use App\Models\ElectionTeam;
use App\Models\User;
use Illuminate\Database\Seeder;

class ElectionTeamSeeder extends Seeder
{
    public function run(): void
    {
        $election = Election::where('title', 'Eleicao para Presidente da Mesa da Assembleia')->firstOrFail();

        foreach ([
            ['access_code' => 'COM-0001', 'role_in_election' => 'COMMISSION'],
            ['access_code' => 'FIS-0001', 'role_in_election' => 'FISCAL'],
        ] as $teamMember) {
            $user = User::where('access_code', $teamMember['access_code'])->firstOrFail();

            ElectionTeam::updateOrCreate(
                ['election_id' => $election->id, 'user_id' => $user->id],
                ['role_in_election' => $teamMember['role_in_election']]
            );
        }
    }
}
