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
            ['name' => 'Gaza', 'code' => 'GAZ'],
            ['name' => 'Inhambane', 'code' => 'INH'],
            ['name' => 'Sofala', 'code' => 'SOF'],
            ['name' => 'Manica', 'code' => 'MAN'],
            ['name' => 'Tete', 'code' => 'TET'],
            ['name' => 'Zambezia', 'code' => 'ZAM'],
            ['name' => 'Nampula', 'code' => 'NAM'],
            ['name' => 'Cabo Delgado', 'code' => 'CAB'],
            ['name' => 'Niassa', 'code' => 'NIA'],
        ] as $province) {
            Province::updateOrCreate(
                ['code' => $province['code']],
                ['name' => $province['name'], 'status' => 'ACTIVE']
            );
        }
    }
}
