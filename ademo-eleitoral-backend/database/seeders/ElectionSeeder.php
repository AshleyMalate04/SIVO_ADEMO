<?php

namespace Database\Seeders;

use App\Models\Election;
use App\Models\Organ;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Seeder;

class ElectionSeeder extends Seeder
{
    public function run(): void
    {
        $organ = Organ::where('name', 'Mesa da Assembleia Geral')->firstOrFail();
        $position = Position::where('name', 'Presidente da Mesa da Assembleia')->firstOrFail();
        $creator = User::where('access_code', 'COM-0001')->firstOrFail();

        $firstRound = Election::updateOrCreate(
            ['title' => 'Eleicao para Presidente da Mesa da Assembleia', 'round_number' => 1],
            [
                'organ_id' => $organ->id,
                'position_id' => $position->id,
                'delegation_id' => null,
                'parent_election_id' => null,
                'starts_at' => now()->addDay()->setTime(8, 0),
                'ends_at' => now()->addDay()->setTime(17, 0),
                'description' => 'Eleicao geral da ADEMO',
                'allow_blank_vote' => true,
                'status' => 'EM_VOTACAO',
                'created_by' => $creator->id,
            ]
        );

        Election::updateOrCreate(
            ['title' => 'Segunda volta - Presidente da Mesa da Assembleia', 'round_number' => 2],
            [
                'organ_id' => $organ->id,
                'position_id' => $position->id,
                'delegation_id' => null,
                'parent_election_id' => $firstRound->id,
                'starts_at' => now()->addDays(7)->setTime(8, 0),
                'ends_at' => now()->addDays(7)->setTime(17, 0),
                'description' => 'Segunda volta por empate',
                'allow_blank_vote' => true,
                'status' => 'PROGRAMADA',
                'created_by' => $creator->id,
            ]
        );
    }
}
