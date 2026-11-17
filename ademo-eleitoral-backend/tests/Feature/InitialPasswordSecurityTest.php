<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InitialPasswordSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_password_only_allows_the_user_to_define_a_personal_password(): void
    {
        $user = User::create([
            'name' => 'Utilizador inicial',
            'access_code' => 'INITIAL-USER',
            'email' => 'initial@example.test',
            'password' => '12345678',
            'role' => 'FISCAL',
            'status' => 'ACTIVE',
            'password_changed_at' => null,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/settings')
            ->assertForbidden()
            ->assertJsonPath('errors.code', 'PASSWORD_CHANGE_REQUIRED');

        $this->putJson('/api/settings/password', [
            'current_password' => 'incorrect-password',
            'password' => '12345678',
            'password_confirmation' => '12345678',
        ])->assertUnprocessable();

        $this->assertNull($user->fresh()->password_changed_at);
        $this->getJson('/api/settings')->assertForbidden();

        $this->putJson('/api/settings/password', [
            'current_password' => '12345678',
            'password' => 'nova-palavra-passe-987',
            'password_confirmation' => 'nova-palavra-passe-987',
        ])->assertOk()
            ->assertJsonPath('data.must_change_password', false);

        $user->refresh();
        $this->assertNotNull($user->password_changed_at);
        $this->assertTrue(Hash::check('nova-palavra-passe-987', $user->password));
    }
}
