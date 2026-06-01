<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['access_code' => 'ADM-0001'],
            [
                'name' => 'Administrador Geral',
                'email' => 'admin@ademo.org.mz',
                'phone' => '840000000',
                'password' => '12345678',
                'role' => 'ADMIN',
                'status' => 'ACTIVE',
                'delegation_id' => null,
            ]
        );
    }
}
