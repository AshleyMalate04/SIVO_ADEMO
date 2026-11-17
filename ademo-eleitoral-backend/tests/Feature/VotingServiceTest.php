<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Services\VotingService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class VotingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_voter_cannot_cast_a_second_vote(): void
    {
        [$member, $electionId, $candidateId] = $this->votingScenario();
        $service = app(VotingService::class);

        $result = $service->cast($member, $electionId, $candidateId, false);

        $this->assertDatabaseCount('votes', 1);
        $this->assertDatabaseCount('vote_receipts', 1);
        $this->assertDatabaseHas('election_voters', [
            'election_id' => $electionId,
            'member_id' => $member->id,
            'has_voted' => true,
        ]);
        $this->assertSame($candidateId, $result['vote']->candidate_id);

        try {
            $service->cast($member, $electionId, $candidateId, false);
            $this->fail('O segundo voto deveria ter sido rejeitado.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('member_id', $exception->errors());
        }

        $this->assertDatabaseCount('votes', 1);
        $this->assertDatabaseCount('vote_receipts', 1);
    }

    public function test_blank_vote_is_rejected_when_the_election_disallows_it(): void
    {
        [$member, $electionId] = $this->votingScenario();

        $this->expectException(ValidationException::class);

        app(VotingService::class)->cast($member, $electionId, null, true);
    }

    public function test_database_rejects_a_second_receipt_for_the_same_voter_and_election(): void
    {
        [$member, $electionId, $candidateId] = $this->votingScenario();
        $result = app(VotingService::class)->cast($member, $electionId, $candidateId, false);

        $this->expectException(QueryException::class);

        DB::table('vote_receipts')->insert([
            'election_id' => $electionId,
            'voter_hash' => $result['receipt']->voter_hash,
            'public_code' => 'DUPLICATE-RECEIPT',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array{Member, int, int}
     */
    private function votingScenario(): array
    {
        $now = now();
        $userId = DB::table('users')->insertGetId([
            'name' => 'Administrador',
            'access_code' => 'ADMIN-TEST',
            'email' => 'admin-test@example.test',
            'password' => bcrypt('password'),
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $provinceId = DB::table('province')->insertGetId([
            'name' => 'Maputo',
            'code' => 'MP',
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $districtId = DB::table('distrit')->insertGetId([
            'province_id' => $provinceId,
            'name' => 'KaMpfumo',
            'code' => 'KMP',
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $delegationId = DB::table('delegations')->insertGetId([
            'name' => 'Delegação de teste',
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $organId = DB::table('organs')->insertGetId([
            'name' => 'Órgão de teste',
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $positionId = DB::table('positions')->insertGetId([
            'organ_id' => $organId,
            'name' => 'Cargo de teste',
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $memberId = DB::table('members')->insertGetId([
            'member_code' => 'MEMBER-TEST',
            'name' => 'Eleitor de teste',
            'delegation_id' => $delegationId,
            'status' => 'ACTIVE',
            'registered_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $candidateMemberId = DB::table('members')->insertGetId([
            'member_code' => 'CANDIDATE-TEST',
            'name' => 'Candidato de teste',
            'delegation_id' => $delegationId,
            'status' => 'ACTIVE',
            'registered_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $electionId = DB::table('elections')->insertGetId([
            'title' => 'Eleição de teste',
            'organ_id' => $organId,
            'position_id' => $positionId,
            'delegation_id' => $delegationId,
            'round_number' => 1,
            'starts_at' => $now->copy()->subMinute(),
            'ends_at' => $now->copy()->addHour(),
            'allow_blank_vote' => false,
            'status' => 'EM_VOTACAO',
            'created_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $candidateId = DB::table('candidates')->insertGetId([
            'election_id' => $electionId,
            'member_id' => $candidateMemberId,
            'position_id' => $positionId,
            'biography' => 'Biografia',
            'proposal' => 'Proposta',
            'status' => 'APPROVED',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('election_voters')->insert([
            'election_id' => $electionId,
            'member_id' => $memberId,
            'delegation_id' => $delegationId,
            'status' => 'AUTHORIZED',
            'has_voted' => false,
            'voter_hash' => hash('sha256', 'voter-test'),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return [Member::findOrFail($memberId), $electionId, $candidateId];
    }
}
