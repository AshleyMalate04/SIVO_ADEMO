<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_update_personal_data_without_changing_access_permissions(): void
    {
        $user = User::create([
            'name' => 'Nome Original',
            'access_code' => 'PROFILE-TEST',
            'email' => 'original@example.test',
            'phone' => '840000001',
            'password' => 'password123',
            'role' => 'FISCAL',
            'status' => 'ACTIVE',
            'password_changed_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/settings/profile', [
            'name' => 'Nome Actualizado',
            'email' => 'actualizado@example.test',
            'phone' => '+258850000001',
            'role' => 'ADMIN',
            'access_code' => 'ALTERADO',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Nome Actualizado')
            ->assertJsonPath('data.email', 'actualizado@example.test')
            ->assertJsonPath('data.role', 'FISCAL')
            ->assertJsonPath('data.access_code', 'PROFILE-TEST');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nome Actualizado',
            'email' => 'actualizado@example.test',
            'phone' => '+258850000001',
            'role' => 'FISCAL',
            'access_code' => 'PROFILE-TEST',
        ]);
    }
}
