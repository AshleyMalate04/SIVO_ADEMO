<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Member;
use App\Models\Position;
use Illuminate\Database\Seeder;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $election = Election::where('title', 'Eleicao para Presidente da Mesa da Assembleia')->firstOrFail();
        $position = Position::where('name', 'Presidente da Mesa da Assembleia')->firstOrFail();

        foreach ([
            ['member_code' => 'MEM-001', 'biography' => 'Membro fundador da ADEMO.', 'proposal' => 'Fortalecer a participacao dos membros.'],
            ['member_code' => 'MEM-002', 'biography' => 'Activista social.', 'proposal' => 'Melhorar a comunicacao institucional.'],
        ] as $candidate) {
            $member = Member::where('member_code', $candidate['member_code'])->firstOrFail();

            Candidate::updateOrCreate(
                ['election_id' => $election->id, 'member_id' => $member->id],
                [
                    'position_id' => $position->id,
                    'biography' => $candidate['biography'],
                    'proposal' => $candidate['proposal'],
                    'photo_path' => null,
                    'document_path' => null,
                    'status' => 'APPROVED',
                ]
            );
        }
    }
}
