<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class UserSeeder extends Seeder
{
    public const LOCAL_INITIAL_PASSWORD = 'ChangeMe-Local-Only!';

    public function run(): void
    {
        if (User::where('access_code', 'ADM-0001')->exists()) {
            return;
        }

        $initialPassword = (string) env('ADMIN_INITIAL_PASSWORD', '');

        if ($initialPassword === '') {
            if (app()->isProduction()) {
                throw new RuntimeException('ADMIN_INITIAL_PASSWORD deve ser definida antes de executar o seeder em produção.');
            }

            $initialPassword = self::LOCAL_INITIAL_PASSWORD;
        }

        User::firstOrCreate(
            ['access_code' => 'ADM-0001'],
            [
                'name' => 'Administrador Geral',
                'email' => 'wendymalate05@gmail.com',
                'phone' => '840000000',
                'password' => $initialPassword,
                'role' => 'ADMIN',
                'status' => 'ACTIVE',
                'delegation_id' => null,
            ]
        );
    }
}
