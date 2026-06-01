<?php

namespace Database\Seeders;

use App\Models\Organ;
use Illuminate\Database\Seeder;

class OrganSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Mesa da Assembleia Geral', 'description' => 'Orgao deliberativo da ADEMO'],
            ['name' => 'Conselho de Direccao', 'description' => 'Orgao executivo da ADEMO'],
            ['name' => 'Conselho Fiscal', 'description' => 'Orgao de fiscalizacao'],
        ] as $organ) {
            Organ::updateOrCreate(
                ['name' => $organ['name']],
                ['description' => $organ['description'], 'status' => 'ACTIVE']
            );
        }
    }
}
