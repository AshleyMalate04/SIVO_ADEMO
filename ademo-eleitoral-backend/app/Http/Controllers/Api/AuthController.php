<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('access_code', $request->access_code)->first();

        if (! $user || ! $this->passwordMatches($request->password, $user)) {
            return ApiResponse::error('Código de acesso ou palavra-passe inválidos.', 401);
        }

        if ($user->status !== 'ACTIVE') {
            return ApiResponse::error('A conta encontra-se inactiva ou bloqueada.', 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken('ademo-auth-token')->plainTextToken;
        $user->update(['last_login_at' => now()]);
        AuditService::record($request, 'LOGIN', 'User', $user->id);

        return ApiResponse::success([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'access_code' => $user->access_code,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'must_change_password' => $user->password_changed_at === null,
                ],
                'role' => $user->role,
                'redirect_to' => $this->redirectByRole($user->role),
                'menu' => $this->menuByRole($user->role),
            ],
            'Autenticação realizada com sucesso.'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        AuditService::record($request, 'LOGOUT', 'User', $request->user()?->id);
        $request->user()?->currentAccessToken()?->delete();

        return ApiResponse::success(null, 'Sessão terminada.');
    }

    public function logoutAll(Request $request): JsonResponse
    {
        AuditService::record($request, 'LOGOUT_ALL', 'User', $request->user()?->id);
        $request->user()?->tokens()->delete();

        return ApiResponse::success(null, 'Todas as sessões foram terminadas.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success($request->user()->load('delegation', 'setting'), 'Utilizador autenticado obtido com sucesso.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return ApiResponse::error('Não encontramos uma conta activa com este email.', 404);
        }

        if (! $user->isActive()) {
            return ApiResponse::error('A conta encontra-se inactiva ou bloqueada.', 403);
        }

        $code = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        $resetUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/verificar-codigo?email=' . urlencode($user->email) . '&code=' . urlencode($code);

        Mail::html($this->passwordResetEmailHtml($user->name, $code, $resetUrl), function ($message) use ($user): void {
            $message
                ->from(config('mail.from.address'), config('mail.from.name'))
                ->to($user->email, $user->name)
                ->subject('Código de verificação para redefinir palavra-passe - ADEMO');
        });

        return ApiResponse::success(
            [
                'email' => $user->email,
                'expires_in_minutes' => 15,
                'reset_url' => $resetUrl,
            ],
            'Enviamos um código de 6 dígitos para o email informado.'
        );
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ]);

        $token = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();

        if (! $token || ! $this->validResetCode($validated['code'], $token)) {
            return ApiResponse::error('Código inválido ou expirado.', 422);
        }

        return ApiResponse::success(
            ['email' => $validated['email']],
            'Código confirmado. Pode criar uma nova palavra-passe.'
        );
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = User::where('email', $validated['email'])->first();
        $token = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();

        if (! $user || ! $token || ! $this->validResetCode($validated['code'], $token)) {
            return ApiResponse::error('Código inválido ou expirado.', 422);
        }

        $user->forceFill([
            'password' => $validated['password'],
            'password_changed_at' => now(),
        ])->save();
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return ApiResponse::success(null, 'Senha actualizada com sucesso.');
    }

    private function passwordResetEmailHtml(string $name, string $code, string $resetUrl): string
    {
        $safeName = e($name);
        $safeCode = e($code);
        $safeResetUrl = e($resetUrl);

        return <<<HTML
<!doctype html>
<html lang="pt">
<body style="margin:0;background:#f5f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
    <div style="background:#ffffff;border:1px solid #e5e9f2;border-radius:8px;padding:28px;">
      <p style="margin:0 0 18px;">Olá, {$safeName}</p>

      <p style="margin:0 0 18px;">Recebemos um pedido para redefinir a sua palavra-passe no sistema eleitoral ADEMO.</p>

      <p style="margin:0 0 18px;">Utilize o código de verificação abaixo para confirmar a sua identidade:</p>

      <p style="margin:0 0 18px;font-size:18px;">Código de verificação: <strong style="font-size:24px;letter-spacing:3px;">{$safeCode}</strong></p>

      <p style="margin:0 0 18px;">Este código é válido por apenas 15 minutos.</p>

      <p style="margin:0 0 18px;">Também pode redefinir a sua palavra-passe através do link abaixo:</p>

      <p style="margin:0 0 22px;">
        <a href="{$safeResetUrl}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-weight:700;">Redefinir palavra-passe</a>
      </p>

      <p style="margin:0 0 18px;">Por motivos de segurança, o link e o código expiram após 15 minutos.</p>

      <p style="margin:0 0 18px;">Caso não tenha solicitado esta alteração, ignore este email.</p>

      <p style="margin:0;">Atenciosamente,<br>Equipa ADEMO Eleitoral</p>
    </div>
  </div>
</body>
</html>
HTML;
    }

    private function validResetCode(string $code, object $token): bool
    {
        if (! $token->created_at || now()->diffInMinutes(Carbon::parse($token->created_at)) > 15) {
            return false;
        }

        return Hash::check($code, $token->token);
    }

    private function passwordMatches(string $plainPassword, User $user): bool
    {
        try {
            return Hash::check($plainPassword, $user->password);
        } catch (RuntimeException) {
            if (! hash_equals((string) $user->password, $plainPassword)) {
                return false;
            }

            $user->forceFill([
                'password' => $plainPassword,
                'password_changed_at' => now(),
            ])->save();

            return true;
        }
    }

    private function redirectByRole(string $role): string
    {
        return match ($role) {
            'ADMIN', 'COMMISSION', 'COMISSAO', 'FISCAL' => '/dashboard',
            'VOTER', 'ELEITOR' => '/portal-eleitor/votacoes',
            default => '/login',
        };
    }

    private function menuByRole(string $role): array
    {
        return match ($role) {
            'ADMIN' => [
                'dashboard',
                'delegations',
                'organs',
                'members',
                'users',
                'portal',
                'candidates',
                'voters',
                'results',
                'audit',
                'settings',
            ],
            'COMMISSION', 'COMISSAO' => [
                'dashboard',
                'members',
                'elections',
                'candidates',
                'voters',
                'results',
                'settings',
            ],
            'FISCAL' => [
                'dashboard',
                'elections',
                'candidates',
                'voters',
                'results',
                'audit',
                'settings',
            ],
            'VOTER', 'ELEITOR' => [
                'elections',
                'results',
                'notifications',
                'settings',
            ],
            default => [],
        };
    }
}
