<?php

namespace Database\Seeders;

use App\Models\Delegation;
use App\Models\Member;
use Illuminate\Database\Seeder;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $delegation = Delegation::where('name', 'Delegacao de Maputo')->firstOrFail();

        foreach ([
            ['member_code' => 'MEM-001', 'name' => 'Maria Antonio', 'phone' => '840000001', 'email' => 'maria@example.com', 'bi_number' => '110100000000A'],
            ['member_code' => 'MEM-002', 'name' => 'Joao Mucavele', 'phone' => '840000002', 'email' => 'joao@example.com', 'bi_number' => '110100000001B'],
            ['member_code' => 'MEM-003', 'name' => 'Ana Chissano', 'phone' => '840000003', 'email' => 'ana@example.com', 'bi_number' => '110100000002C'],
        ] as $member) {
            Member::updateOrCreate(
                ['member_code' => $member['member_code']],
                [
                    'name' => $member['name'],
                    'phone' => $member['phone'],
                    'email' => $member['email'],
                    'bi_number' => $member['bi_number'],
                    'delegation_id' => $delegation->id,
                    'status' => 'ACTIVE',
                    'registered_at' => now()->toDateString(),
                ]
            );
        }
    }
}
