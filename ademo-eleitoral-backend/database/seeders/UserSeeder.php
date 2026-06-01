<?php

namespace Database\Seeders;

use App\Models\Delegation;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $delegation = Delegation::where('name', 'Delegacao de Maputo')->first();

        foreach ([
            ['access_code' => 'ADM-0001', 'name' => 'Administrador Geral', 'email' => 'admin@ademo.org.mz', 'role' => 'ADMIN'],
            ['access_code' => 'COM-0001', 'name' => 'Comissao Eleitoral', 'email' => 'comissao@ademo.org.mz', 'role' => 'COMMISSION'],
            ['access_code' => 'FIS-0001', 'name' => 'Fiscal Geral', 'email' => 'fiscal@ademo.org.mz', 'role' => 'FISCAL'],
            ['access_code' => 'ELE-0001', 'name' => 'Eleitor Teste', 'email' => 'eleitor@ademo.org.mz', 'role' => 'VOTER'],
        ] as $user) {
            User::updateOrCreate(
                ['access_code' => $user['access_code']],
                [
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'phone' => '840000000',
                    'password' => '12345678',
                    'role' => $user['role'],
                    'status' => 'ACTIVE',
                    'delegation_id' => $delegation?->id,
                ]
            );
        }
    }
}
