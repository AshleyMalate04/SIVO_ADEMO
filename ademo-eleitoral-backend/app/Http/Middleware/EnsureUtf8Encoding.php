<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUtf8Encoding
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept-Charset', 'UTF-8');

        /** @var Response $response */
        $response = $next($request);
        $contentType = (string) $response->headers->get('Content-Type', '');

        if ($contentType === '') {
            $response->headers->set('Content-Type', 'text/html; charset=UTF-8');
        } elseif (! str_contains(strtolower($contentType), 'charset=')) {
            $response->headers->set('Content-Type', $contentType.'; charset=UTF-8');
        }

        return $response;
    }
}
