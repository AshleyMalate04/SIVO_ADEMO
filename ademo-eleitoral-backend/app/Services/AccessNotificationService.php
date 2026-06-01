<?php

namespace App\Services;

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
            Mail::html(self::initialAccessEmailHtml($user), function ($message) use ($user): void {
                $message
                    ->from(config('mail.from.address'), config('mail.from.name'))
                    ->to($user->email, $user->name)
                    ->subject('Dados de acesso à plataforma ADEMO Eleitoral');
            });

            return true;
        } catch (Throwable $exception) {
            Log::warning('Falha ao enviar credenciais iniciais por email.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    private static function initialAccessEmailHtml(User $user): string
    {
        $safeName = e($user->name);
        $safeCode = e($user->access_code);
        $safePassword = e(self::DEFAULT_PASSWORD);
        $loginUrl = e(rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/login');

        return <<<HTML
<!doctype html>
<html lang="pt">
<body style="margin:0;background:#f5f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
    <div style="background:#ffffff;border:1px solid #e5e9f2;border-radius:12px;padding:28px;">
      <p style="margin:0 0 18px;">Olá, {$safeName}</p>
      <p style="margin:0 0 18px;">A sua conta foi criada na plataforma ADEMO Eleitoral.</p>
      <p style="margin:0 0 10px;">Utilize os dados abaixo para a primeira sessão:</p>
      <p style="margin:0 0 8px;"><strong>Código de acesso:</strong> {$safeCode}</p>
      <p style="margin:0 0 18px;"><strong>Palavra-passe inicial:</strong> {$safePassword}</p>
      <p style="margin:0 0 18px;">Após entrar, aceda às configurações para alterar a sua palavra-passe.</p>
      <p style="margin:0 0 22px;"><a href="{$loginUrl}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Aceder à plataforma</a></p>
      <p style="margin:0;">Atenciosamente,<br>Equipa ADEMO Eleitoral</p>
    </div>
  </div>
</body>
</html>
HTML;
    }
}
