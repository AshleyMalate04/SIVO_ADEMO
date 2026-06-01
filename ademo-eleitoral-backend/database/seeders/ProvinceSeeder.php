<?php

namespace Database\Seeders;

use App\Models\Province;
use Illuminate\Database\Seeder;

class ProvinceSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Maputo Cidade', 'code' => 'MPT'],
            ['name' => 'Maputo Provincia', 'code' => 'MPM'],
            ['name' => 'Niassa', 'code' => 'NIA'],
            ['name' => 'Cabo Delgado', 'code' => 'CAB'],
            ['name' => 'Nampula', 'code' => 'NAM'],
            ['name' => 'Zambezia', 'code' => 'ZAM'],
            ['name' => 'Tete', 'code' => 'TET'],
            ['name' => 'Manica', 'code' => 'MAN'],
            ['name' => 'Sofala', 'code' => 'SOF'],
            ['name' => 'Inhambane', 'code' => 'INH'],
            ['name' => 'Gaza', 'code' => 'GAZ'],
        ] as $province) {
            Province::updateOrCreate(
                ['code' => $province['code']],
                ['name' => $province['name'], 'status' => 'ACTIVE']
            );
        }
    }
}
