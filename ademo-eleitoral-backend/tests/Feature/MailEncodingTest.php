<?php

namespace Tests\Feature;

use App\Mail\InitialAccessMail;
use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MailEncodingTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_emails_preserve_portuguese_characters_in_subject_and_bodies(): void
    {
        $user = User::create([
            'name' => 'Utilizador de teste',
            'access_code' => 'TESTE-1',
            'email' => 'test@example.test',
            'password' => 'temporary-password',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);
        $mailer = Mail::mailer('array');

        $mailer->to($user->email)->send(new InitialAccessMail($user, 'temporary-password', 'https://example.test/login'));
        $mailer->to($user->email)->send(new PasswordResetCodeMail($user, '123456', 'https://example.test/reset'));

        $messages = $mailer->getSymfonyTransport()->messages();
        $this->assertCount(2, $messages);

        foreach ($messages as $sent) {
            $email = $sent->getOriginalMessage();
            $this->assertTrue(mb_check_encoding($email->getSubject(), 'UTF-8'));
            $this->assertTrue(mb_check_encoding($email->getTextBody(), 'UTF-8'));
            $this->assertTrue(mb_check_encoding($email->getHtmlBody(), 'UTF-8'));
            $this->assertStringContainsString('charset=utf-8', strtolower($email->toString()));
            $this->assertStringContainsString('Olá', $email->getTextBody());
        }

        $this->assertStringContainsString('à plataforma', $messages[0]->getOriginalMessage()->getSubject());
        $this->assertStringContainsString('Código de verificação', $messages[1]->getOriginalMessage()->getSubject());
    }
}
