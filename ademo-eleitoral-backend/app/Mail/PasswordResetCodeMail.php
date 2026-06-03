<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetCodeMail extends Mailable implements ShouldQueue
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
        public string $code,
        public string $resetUrl,
    ) {
        $this->onQueue('mail');
    }

    public function build(): static
    {
        return $this
            ->subject('Código de verificação para redefinir palavra-passe - ADEMO')
            ->view('emails.password-reset-code')
            ->text('emails.password-reset-code-text')
            ->with([
                'name' => $this->user->name,
                'code' => $this->code,
                'resetUrl' => $this->resetUrl,
            ]);
    }
}
