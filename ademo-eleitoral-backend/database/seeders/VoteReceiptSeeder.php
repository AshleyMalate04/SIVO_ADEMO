<?php

namespace Database\Seeders;

use App\Models\Election;
use App\Models\ElectionVoter;
use App\Models\Member;
use App\Models\VoteReceipt;
use Illuminate\Database\Seeder;

class VoteReceiptSeeder extends Seeder
{
    public function run(): void
    {
        $election = Election::where('title', 'Eleicao para Presidente da Mesa da Assembleia')->firstOrFail();
        $member = Member::where('member_code', 'MEM-003')->firstOrFail();
        $voter = ElectionVoter::where('election_id', $election->id)->where('member_id', $member->id)->firstOrFail();

        VoteReceipt::updateOrCreate(
            ['public_code' => 'REC-0001'],
            [
                'election_id' => $election->id,
                'voter_hash' => $voter->voter_hash,
            ]
        );
    }
}
