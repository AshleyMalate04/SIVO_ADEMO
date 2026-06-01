<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Vote;
use Illuminate\Database\Seeder;

class VoteSeeder extends Seeder
{
    public function run(): void
    {
        $election = Election::where('title', 'Eleicao para Presidente da Mesa da Assembleia')->firstOrFail();
        $candidate = Candidate::where('election_id', $election->id)->firstOrFail();

        Vote::updateOrCreate(
            ['proof_hash' => hash('sha256', 'proof|'.$election->id.'|MEM-003')],
            [
                'election_id' => $election->id,
                'candidate_id' => $candidate->id,
                'is_blank' => false,
            ]
        );
    }
}
