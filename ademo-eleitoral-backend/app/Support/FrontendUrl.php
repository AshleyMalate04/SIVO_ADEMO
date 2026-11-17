<?php

namespace App\Support;

use Illuminate\Http\Request;

class FrontendUrl
{
    public static function base(?Request $request = null): string
    {
        $request ??= request();

        foreach (self::requestCandidates($request) as $candidate) {
            $url = self::normalise($candidate);

            if ($url !== null && ! self::isLoopback($url)) {
                return $url;
            }
        }

        return rtrim((string) config('app.frontend_url', config('app.url')), '/');
    }

    public static function to(string $path, ?Request $request = null): string
    {
        return self::base($request).'/'.ltrim($path, '/');
    }

    /**
     * @return array<int, string|null>
     */
    private static function requestCandidates(Request $request): array
    {
        $forwardedHost = $request->headers->get('x-forwarded-host');
        $forwardedProto = $request->headers->get('x-forwarded-proto', 'https');
        $origin = $request->headers->get('origin');
        $referer = $request->headers->get('referer');

        return [
            $origin,
            $referer ? self::originFromUrl($referer) : null,
            $forwardedHost ? "{$forwardedProto}://{$forwardedHost}" : null,
            $request->getSchemeAndHttpHost(),
        ];
    }

    private static function normalise(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $parts = parse_url(trim($url));

        if (! isset($parts['scheme'], $parts['host']) || ! in_array($parts['scheme'], ['http', 'https'], true)) {
            return null;
        }

        $port = isset($parts['port']) ? ":{$parts['port']}" : '';

        return "{$parts['scheme']}://{$parts['host']}{$port}";
    }

    private static function originFromUrl(string $url): ?string
    {
        $parts = parse_url($url);

        if (! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $port = isset($parts['port']) ? ":{$parts['port']}" : '';

        return "{$parts['scheme']}://{$parts['host']}{$port}";
    }

    private static function isLoopback(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);

        return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }
}
