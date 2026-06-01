<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Election;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $election = Election::where('title', 'Eleicao para Presidente da Mesa da Assembleia')->firstOrFail();
        $user = User::where('access_code', 'COM-0001')->firstOrFail();

        AuditLog::updateOrCreate(
            ['action' => 'ELECTION_CREATED', 'entity' => 'elections', 'entity_id' => $election->id],
            [
                'election_id' => $election->id,
                'user_id' => $user->id,
                'details' => ['title' => $election->title],
                'ip' => '127.0.0.1',
                'user_agent' => 'Seeder',
            ]
        );
    }
}
