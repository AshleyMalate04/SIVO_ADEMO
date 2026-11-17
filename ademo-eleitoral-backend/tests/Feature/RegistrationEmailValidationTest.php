<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegistrationEmailValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_is_required_when_registering_operational_users_and_members(): void
    {
        $now = now();
        $provinceId = DB::table('province')->insertGetId([
            'name' => 'Maputo',
            'code' => 'MP',
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $delegationId = DB::table('delegations')->insertGetId([
            'name' => 'Delegacao de teste',
            'province_id' => $provinceId,
            'district_id' => null,
            'status' => 'ACTIVE',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $admin = User::create([
            'name' => 'Administrador de teste',
            'access_code' => 'ADMIN-EMAIL',
            'email' => 'admin-email@example.test',
            'phone' => '840000001',
            'password' => 'password123',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'password_changed_at' => $now,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/users', [
            'name' => 'Fiscal de Teste',
            'access_code' => 'FIS-EMAIL',
            'phone' => '840000002',
            'role' => 'FISCAL',
            'delegation_id' => $delegationId,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->postJson('/api/members', [
            'name' => 'Membro de Teste',
            'member_code' => 'MEM-EMAIL',
            'phone' => '840000003',
            'bi_number' => '12345678901A',
            'delegation_id' => $delegationId,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }
}
