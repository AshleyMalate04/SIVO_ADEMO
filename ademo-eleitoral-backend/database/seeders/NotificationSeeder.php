<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('access_code', 'ELE-0001')->firstOrFail();

        Notification::updateOrCreate(
            ['user_id' => $user->id, 'title' => 'Eleicao disponivel'],
            [
                'message' => 'A eleicao para Presidente da Mesa da Assembleia esta aberta.',
                'type' => 'ELECTION',
                'read_at' => null,
            ]
        );
    }
}
