<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InitialAccessMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function build(): static
    {
        $loginUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/login';

        return $this
            ->subject('Dados de acesso à plataforma ADEMO Eleitoral')
            ->view('emails.initial-access')
            ->text('emails.initial-access-text')
            ->with([
                'name' => $this->user->name,
                'accessCode' => $this->user->access_code,
                'initialPassword' => \App\Services\AccessNotificationService::DEFAULT_PASSWORD,
                'loginUrl' => $loginUrl,
            ]);
    }
}
