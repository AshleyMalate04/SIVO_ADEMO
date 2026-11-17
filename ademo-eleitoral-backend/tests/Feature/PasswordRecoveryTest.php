<?php

namespace Tests\Feature;

use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordRecoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_recovery_is_rejected_for_an_unregistered_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'nao-registado@example.test',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Este email não está associado a uma conta activa no sistema.');

        Mail::assertNothingSent();
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'nao-registado@example.test',
        ]);
    }

    public function test_recovery_is_accepted_for_an_active_registered_email(): void
    {
        Mail::fake();
        $user = User::create([
            'name' => 'Utilizador Registado',
            'access_code' => 'REC-0001',
            'email' => 'registado@example.test',
            'phone' => '840000010',
            'password' => '12345678',
            'role' => 'FISCAL',
            'status' => 'ACTIVE',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'REGISTADO@example.test',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.expires_in_minutes', 15);

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);
        Mail::assertQueued(PasswordResetCodeMail::class, fn (PasswordResetCodeMail $mail) => $mail->hasTo($user->email));
    }
}
