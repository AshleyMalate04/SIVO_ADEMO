<?php

namespace Database\Seeders;

use App\Models\Election;
use App\Models\ElectionVoter;
use App\Models\Member;
use Illuminate\Database\Seeder;

class ElectionVoterSeeder extends Seeder
{
    public function run(): void
    {
        $election = Election::where('title', 'Eleicao para Presidente da Mesa da Assembleia')->firstOrFail();

        foreach (['MEM-001', 'MEM-002', 'MEM-003'] as $memberCode) {
            $member = Member::where('member_code', $memberCode)->firstOrFail();

            ElectionVoter::updateOrCreate(
                ['election_id' => $election->id, 'member_id' => $member->id],
                [
                    'delegation_id' => $member->delegation_id,
                    'status' => 'AUTHORIZED',
                    'has_voted' => $memberCode === 'MEM-003',
                    'voted_at' => $memberCode === 'MEM-003' ? now() : null,
                    'voter_hash' => hash('sha256', $election->id.'|'.$member->member_code),
                ]
            );
        }
    }
}
