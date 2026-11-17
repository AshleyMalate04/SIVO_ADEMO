<?php

namespace App\Mail;

use App\Models\User;
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

    public function __construct(
        public User $user,
        public string $initialPassword,
        public string $loginUrl,
    ) {
        $this->onQueue('mail');
    }

    public function build(): static
    {
        return $this
            ->from((string) config('mail.from.address'), (string) config('mail.from.name'))
            ->subject('Dados de acesso à plataforma ADEMO Eleitoral')
            ->view('emails.initial-access')
            ->text('emails.initial-access-text')
            ->with([
                'name' => $this->user->name,
                'accessCode' => $this->user->access_code,
                'initialPassword' => $this->initialPassword,
                'loginUrl' => $this->loginUrl,
            ]);
    }
}
