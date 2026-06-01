<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, mixed ...$roles): Response
    {
        $user = $request->user();
        $allowedRoles = collect($roles)
            ->flatMap(fn (string $role) => $this->roleAliases($role))
            ->unique()
            ->values()
            ->all();

        if (! $user || ($allowedRoles !== [] && ! in_array($user->role, $allowedRoles, true))) {
            return ApiResponse::error('Nao tem permissao para executar esta accao.', 403);
        }

        return $next($request);
    }

    private function roleAliases(string $role): array
    {
        return match ($role) {
            'COMMISSION', 'COMISSAO' => ['COMMISSION', 'COMISSAO'],
            'VOTER', 'ELEITOR' => ['VOTER', 'ELEITOR'],
            'ADMIN' => ['ADMIN'],
            'FISCAL' => ['FISCAL'],
            default => [$role],
        };
    }
}
