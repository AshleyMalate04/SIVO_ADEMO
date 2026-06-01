<?php

namespace Database\Seeders;

use App\Models\Distrit;
use App\Models\Province;
use Illuminate\Database\Seeder;

class DistritSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['province' => 'MPT', 'name' => 'KaMpfumo', 'code' => 'KMF'],
            ['province' => 'MPT', 'name' => 'Nlhamankulu', 'code' => 'NLH'],
            ['province' => 'MPM', 'name' => 'Matola', 'code' => 'MAT'],
            ['province' => 'GAZ', 'name' => 'Xai-Xai', 'code' => 'XXA'],
            ['province' => 'INH', 'name' => 'Inhambane', 'code' => 'INH-D'],
            ['province' => 'SOF', 'name' => 'Beira', 'code' => 'BEI'],
            ['province' => 'MAN', 'name' => 'Chimoio', 'code' => 'CHI'],
            ['province' => 'TET', 'name' => 'Tete', 'code' => 'TET-D'],
            ['province' => 'ZAM', 'name' => 'Quelimane', 'code' => 'QUE'],
            ['province' => 'NAM', 'name' => 'Nampula', 'code' => 'NAM-D'],
            ['province' => 'CAB', 'name' => 'Pemba', 'code' => 'PEM'],
            ['province' => 'NIA', 'name' => 'Lichinga', 'code' => 'LIC'],
        ] as $district) {
            $province = Province::where('code', $district['province'])->firstOrFail();

            Distrit::updateOrCreate(
                ['code' => $district['code']],
                [
                    'province_id' => $province->id,
                    'name' => $district['name'],
                    'status' => 'ACTIVE',
                ]
            );
        }
    }
}
