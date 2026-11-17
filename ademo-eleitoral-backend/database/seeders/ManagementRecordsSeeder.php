<?php

namespace Database\Seeders;

use App\Models\Delegation;
use App\Models\Distrit;
use App\Models\Member;
use App\Models\Organ;
use App\Models\Position;
use App\Models\Province;
use App\Models\User;
use App\Services\AccessNotificationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/** Adds sample management records to an existing local database. */
class ManagementRecordsSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('Os registos de demonstração não podem ser inseridos em produção.');
        }

        DB::transaction(function (): void {
            $delegations = [];

            foreach (['MPT', 'MPM', 'NIA', 'CAB', 'NAM', 'ZAM'] as $code) {
                $province = Province::where('code', $code)->firstOrFail();
                $district = Distrit::where('province_id', $province->id)->orderBy('id')->firstOrFail();

                $delegations[] = Delegation::firstOrCreate(
                    ['name' => 'Delegação Demonstrativa de '.$province->name],
                    [
                        'province_id' => $province->id,
                        'district_id' => $district->id,
                        'address' => 'Sede da delegação em '.$district->name,
                        'status' => 'ACTIVE',
                    ],
                );
            }

            $organNames = [
                'Órgão Eleitoral de Demonstração',
                'Conselho Consultivo de Demonstração',
                'Comissão Provincial de Demonstração',
                'Comissão Distrital de Demonstração',
                'Conselho de Supervisão de Demonstração',
                'Mesa de Votação de Demonstração',
            ];
            $positionNames = ['Presidente', 'Vice-Presidente', 'Secretário', 'Tesoureiro', 'Vogal', 'Coordenador de Fiscalização'];

            foreach ($organNames as $index => $organName) {
                $organ = Organ::firstOrCreate(
                    ['name' => $organName],
                    ['description' => 'Órgão para demonstração dos cargos eleitorais.', 'status' => 'ACTIVE'],
                );

                Position::firstOrCreate(
                    ['organ_id' => $organ->id, 'name' => $positionNames[$index]],
                    ['description' => 'Cargo de demonstração.', 'status' => 'ACTIVE'],
                );
            }

            $registrar = User::where('role', 'ADMIN')->value('id');

            foreach (range(1, 6) as $index) {
                $delegation = $delegations[$index - 1];

                foreach ([
                    ['role' => 'COMISSAO', 'prefix' => 'COM', 'name' => 'MEMBRO DA COMISSÃO', 'phone' => '86'],
                    ['role' => 'FISCAL', 'prefix' => 'FIS', 'name' => 'FISCAL DEMONSTRATIVO', 'phone' => '87'],
                ] as $staff) {
                    $user = User::firstOrCreate(
                        ['access_code' => sprintf('DEMO-%s-%04d', $staff['prefix'], $index)],
                        [
                            'name' => sprintf('%s %02d', $staff['name'], $index),
                            'email' => sprintf('demo.%s%02d@ademo.test', strtolower($staff['prefix']), $index),
                            'phone' => sprintf('%s%07d', $staff['phone'], 4000000 + $index),
                            'password' => AccessNotificationService::generateInitialPassword(),
                            'role' => $staff['role'],
                            'status' => 'ACTIVE',
                            'delegation_id' => $delegation->id,
                        ],
                    );

                    $this->restoreInitialPasswordForDemoAccount($user);
                    $registrar ??= $user->id;
                }

                $member = Member::firstOrCreate(
                    ['member_code' => sprintf('DEMO-MEM-%04d', $index)],
                    [
                        'name' => sprintf('MEMBRO DEMONSTRATIVO %02d', $index),
                        'phone' => sprintf('85%07d', 4000000 + $index),
                        'email' => sprintf('demo.membro%02d@ademo.test', $index),
                        'bi_number' => sprintf('%011dA', 4000000 + $index),
                        'delegation_id' => $delegation->id,
                        'status' => 'ACTIVE',
                        'registered_at' => now()->toDateString(),
                        'registered_by' => $registrar,
                    ],
                );

                $voter = User::firstOrCreate(
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

                $this->restoreInitialPasswordForDemoAccount($voter);
            }
        });
    }

    private function restoreInitialPasswordForDemoAccount(User $user): void
    {
        $initialPassword = AccessNotificationService::generateInitialPassword();

        if ($user->password_changed_at === null && ! Hash::check($initialPassword, $user->password)) {
            $user->forceFill(['password' => $initialPassword])->save();
        }
    }
}
