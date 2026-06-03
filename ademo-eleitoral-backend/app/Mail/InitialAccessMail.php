<?php

namespace App\Mail;

use App\Models\User;
use App\Services\AccessNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InitialAccessMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    /**
     * @var array<int, int>
     */
    public array $backoff = [60, 300, 900];

    public function __construct(public User $user)
    {
        $this->onQueue('mail');
    }

    public function build(): static
    {
        $loginUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/').'/login';

        return $this
            ->subject('Dados de acesso à plataforma ADEMO Eleitoral')
            ->view('emails.initial-access')
            ->text('emails.initial-access-text')
            ->with([
                'name' => $this->user->name,
                'accessCode' => $this->user->access_code,
                'initialPassword' => AccessNotificationService::DEFAULT_PASSWORD,
                'loginUrl' => $loginUrl,
            ]);
    }
}
