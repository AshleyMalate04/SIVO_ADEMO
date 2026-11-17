<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\Delegation;
use App\Models\Distrit;
use App\Models\Election;
use App\Models\ElectionTeam;
use App\Models\ElectionVoter;
use App\Models\Member;
use App\Models\Notification;
use App\Models\Organ;
use App\Models\PhysicalVoteTotal;
use App\Models\Position;
use App\Models\Province;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vote;
use App\Models\VoteReceipt;
use App\Services\AccessNotificationService;
use Illuminate\Database\Seeder;

/**
 * Development records for every operational table shown by the application.
 * At least eight records per management table and six users of each staff
 * role make pagination and responsive cards testable after a fresh seed.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $delegations = $this->createDelegations();
        $users = $this->createUsers($delegations);
        $organs = $this->createOrgans();
        $positions = $this->createPositions($organs);
        $members = $this->createMembers($delegations, $users[0]);
        $elections = $this->createElections($organs, $positions, $delegations, $users[0]);

        foreach ($elections as $index => $election) {
            $member = $members[$index];
            $user = $users[$index];

            $candidate = Candidate::updateOrCreate(
                ['election_id' => $election->id, 'member_id' => $member->id],
                [
                    'position_id' => $positions[$index]->id,
                    'biography' => 'Membro activo com experiencia associativa.',
                    'proposal' => 'Reforcar a participacao e a transparencia.',
                    'status' => 'APPROVED',
                ],
            );

            ElectionTeam::updateOrCreate(
                ['election_id' => $election->id, 'user_id' => $user->id],
                ['role_in_election' => $user->role === 'FISCAL' ? 'FISCAL' : 'COMMISSION', 'status' => 'AUTHORIZED'],
            );

            $voter = ElectionVoter::updateOrCreate(
                ['election_id' => $election->id, 'member_id' => $member->id],
                [
                    'delegation_id' => $member->delegation_id,
                    'status' => 'AUTHORIZED',
                    'voting_mode' => 'ONLINE',
                    'has_voted' => $index < 3,
                    'voted_at' => $index < 3 ? now()->subHours($index + 1) : null,
                    'voter_hash' => hash('sha256', 'demo-voter-'.$election->id.'-'.$member->id),
                ],
            );

            Vote::updateOrCreate(
                ['proof_hash' => hash('sha256', 'demo-vote-'.$election->id.'-'.$member->id)],
                [
                    'election_id' => $election->id,
                    'candidate_id' => $candidate->id,
                    'is_blank' => false,
                    'vote_origin' => 'ONLINE',
                ],
            );

            VoteReceipt::updateOrCreate(
                ['public_code' => sprintf('REC-%04d', $index + 1)],
                ['election_id' => $election->id, 'voter_hash' => $voter->voter_hash],
            );

            PhysicalVoteTotal::updateOrCreate(
                ['election_id' => $election->id, 'candidate_id' => $candidate->id],
                [
                    'votes' => 10 + $index,
                    'status' => 'PENDING',
                    'registered_by' => $users[0]->id,
                ],
            );

            AuditLog::updateOrCreate(
                ['action' => 'DEMO_ELECTION_CREATED', 'entity' => 'Election', 'entity_id' => $election->id],
                [
                    'election_id' => $election->id,
                    'user_id' => $users[0]->id,
                    'details' => ['title' => $election->title],
                    'ip' => '127.0.0.1',
                    'user_agent' => 'DemoDataSeeder',
                ],
            );

            Notification::updateOrCreate(
                ['user_id' => $user->id, 'title' => sprintf('Eleicao demonstrativa %02d', $index)],
                [
                    'election_id' => $election->id,
                    'message' => 'Existe uma eleicao de demonstracao associada ao seu perfil.',
                    'type' => 'ELECTION',
                    'read_at' => null,
                ],
            );
        }

        User::query()->each(static function (User $user): void {
            Setting::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'theme' => 'LIGHT',
                    'high_contrast' => false,
                    'font_size' => 'MEDIUM',
                    'email_notifications' => true,
                    'system_notifications' => true,
                    'whatsapp_notifications' => false,
                ],
            );
        });
    }

    private function createDelegations(): array
    {
        $records = [];
        foreach (Province::query()->orderBy('id')->take(8)->get() as $index => $province) {
            $district = Distrit::query()->where('province_id', $province->id)->orderBy('id')->firstOrFail();
            $records[] = Delegation::updateOrCreate(
                ['name' => 'Delegacao '.$province->name],
                [
                    'province_id' => $province->id,
                    'district_id' => $district->id,
                    'address' => 'Sede provincial de '.$province->name,
                    'status' => 'ACTIVE',
                ],
            );
        }

        return $records;
    }

    private function createUsers(array $delegations): array
    {
        $records = [];
        foreach (range(1, 12) as $index) {
            $role = $index % 2 === 0 ? 'FISCAL' : 'COMISSAO';
            $prefix = $role === 'FISCAL' ? 'FIS' : 'COM';
            $records[] = User::firstOrCreate(
                ['access_code' => sprintf('%s-%04d', $prefix, (int) ceil($index / 2))],
                [
                    'name' => sprintf('UTILIZADOR DEMO %02d', $index),
                    'email' => sprintf('demo.user%02d@ademo.test', $index),
                    'phone' => sprintf('84%07d', 1000000 + $index),
                    'password' => AccessNotificationService::generateInitialPassword(),
                    'role' => $role,
                    'status' => 'ACTIVE',
                    'delegation_id' => $delegations[($index - 1) % count($delegations)]->id,
                ],
            );
        }

        return $records;
    }

    private function createOrgans(): array
    {
        $names = ['Assembleia Geral', 'Conselho de Direccao', 'Conselho Fiscal', 'Conselho Consultivo', 'Comite Nacional', 'Comite Provincial', 'Comite Distrital', 'Mesa Eleitoral'];

        return array_map(static fn (string $name): Organ => Organ::updateOrCreate(
            ['name' => $name],
            ['description' => 'Orgao demonstrativo da ADEMO.', 'status' => 'ACTIVE'],
        ), $names);
    }

    private function createPositions(array $organs): array
    {
        return array_map(static fn (Organ $organ): Position => Position::updateOrCreate(
            ['organ_id' => $organ->id, 'name' => 'Presidente de '.$organ->name],
            ['description' => 'Cargo demonstrativo.', 'status' => 'ACTIVE'],
        ), $organs);
    }

    private function createMembers(array $delegations, User $registrar): array
    {
        return array_map(static function (int $index) use ($delegations, $registrar): Member {
            $member = Member::updateOrCreate(
                ['member_code' => sprintf('MEM-%04d', $index)],
                [
                    'name' => sprintf('MEMBRO DEMO %02d', $index),
                    'phone' => sprintf('85%07d', 1000000 + $index),
                    'email' => sprintf('membro%02d@ademo.test', $index),
                    'bi_number' => sprintf('%011dA', $index),
                    'delegation_id' => $delegations[$index - 1]->id,
                    'status' => 'ACTIVE',
                    'registered_at' => now()->toDateString(),
                    'registered_by' => $registrar->id,
                ],
            );

            User::firstOrCreate(
                ['access_code' => $member->member_code],
                [
                    'name' => $member->name,
                    'email' => $member->email,
                    'phone' => $member->phone,
                    'password' => AccessNotificationService::generateInitialPassword(),
                    'role' => 'ELEITOR',
                    'status' => 'ACTIVE',
                    'delegation_id' => $member->delegation_id,
                ],
            );

            return $member;
        }, range(1, 8));
    }

    private function createElections(array $organs, array $positions, array $delegations, User $creator): array
    {
        $statuses = ['PROGRAMADA', 'EM_VOTACAO', 'CONCLUIDA', 'RESULTADOS_PUBLICADOS'];

        return array_map(static fn (int $index): Election => Election::updateOrCreate(
            ['title' => sprintf('Eleicao demonstrativa %02d', $index), 'round_number' => 1],
            [
                'organ_id' => $organs[$index - 1]->id,
                'position_id' => $positions[$index - 1]->id,
                'delegation_id' => $delegations[$index - 1]->id,
                'starts_at' => now()->addDays($index)->setTime(8, 0),
                'ends_at' => now()->addDays($index)->setTime(17, 0),
                'description' => 'Eleicao criada para demonstracao e testes visuais.',
                'allow_blank_vote' => true,
                'status' => $statuses[($index - 1) % count($statuses)],
                'created_by' => $creator->id,
            ],
        ), range(1, 8));
    }
}
