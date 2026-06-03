<?php

namespace App\Services;

use App\Mail\InitialAccessMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class AccessNotificationService
{
    public const DEFAULT_PASSWORD = '12345678';

    public static function notifyInitialAccess(User $user): bool
    {
        if (! $user->email) {
            return false;
        }

        try {
            Mail::to($user->email, $user->name)->queue(new InitialAccessMail($user));

            return true;
        } catch (Throwable $exception) {
            Log::warning('Falha ao colocar credenciais iniciais na fila de email.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }
}
