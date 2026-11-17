<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->password_changed_at === null
            && ! $request->is('api/settings/password')) {
            return ApiResponse::error(
                'Defina uma palavra-passe pessoal antes de continuar.',
                403,
                ['code' => 'PASSWORD_CHANGE_REQUIRED']
            );
        }

        return $next($request);
    }
}
