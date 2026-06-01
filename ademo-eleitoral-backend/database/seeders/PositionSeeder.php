<?php

namespace Database\Seeders;

use App\Models\Organ;
use App\Models\Position;
use Illuminate\Database\Seeder;

class PositionSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['organ' => 'Mesa da Assembleia Geral', 'name' => 'Presidente da Mesa da Assembleia'],
            ['organ' => 'Mesa da Assembleia Geral', 'name' => 'Vice-Presidente da Mesa'],
            ['organ' => 'Conselho de Direccao', 'name' => 'Presidente do Conselho de Direccao'],
            ['organ' => 'Conselho Fiscal', 'name' => 'Presidente do Conselho Fiscal'],
        ] as $position) {
            $organ = Organ::where('name', $position['organ'])->firstOrFail();

            Position::updateOrCreate(
                ['organ_id' => $organ->id, 'name' => $position['name']],
                ['description' => null, 'status' => 'ACTIVE']
            );
        }
    }
}
