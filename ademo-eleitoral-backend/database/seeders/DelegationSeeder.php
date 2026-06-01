<?php

namespace Database\Seeders;

use App\Models\Delegation;
use App\Models\Distrit;
use App\Models\Province;
use Illuminate\Database\Seeder;

class DelegationSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Delegacao de Maputo', 'province' => 'MPT', 'district' => 'KMF', 'address' => 'Cidade de Maputo'],
            ['name' => 'Delegacao da Matola', 'province' => 'MPM', 'district' => 'MAT', 'address' => 'Cidade da Matola'],
            ['name' => 'Delegacao de Gaza', 'province' => 'GAZ', 'district' => 'XXA', 'address' => 'Cidade de Xai-Xai'],
        ] as $delegation) {
            $province = Province::where('code', $delegation['province'])->firstOrFail();
            $district = Distrit::where('code', $delegation['district'])->firstOrFail();

            Delegation::updateOrCreate(
                ['name' => $delegation['name']],
                [
                    'province_id' => $province->id,
                    'district_id' => $district->id,
                    'address' => $delegation['address'],
                    'status' => 'ACTIVE',
                ]
            );
        }
    }
}
