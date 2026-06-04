<?php

$frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');
$extraOrigins = array_filter(array_map(
    static fn (string $origin): string => rtrim(trim($origin), '/'),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
));

return [
    'paths' => ['api/*', 'auth/*', 'sanctum/csrf-cookie', 'candidate-photos/*', 'candidate-documents/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter([
        $frontendUrl,
        ...$extraOrigins,
    ])),

    'allowed_origins_patterns' => [
        '/^https:\/\/[a-z0-9-]+\.vercel\.app$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
