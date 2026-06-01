<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->status !== 'ACTIVE') {
            return ApiResponse::error('Utilizador inactivo ou bloqueado.', 403);
        }

        return $next($request);
    }
}
