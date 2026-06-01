<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    private const JSON_OPTIONS = JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE;

    public static function success(mixed $data = null, string $message = 'Operação realizada com sucesso.', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status, [], self::JSON_OPTIONS);
    }

    public static function error(string $message = 'Ocorreu um erro.', int $status = 400, mixed $errors = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status, [], self::JSON_OPTIONS);
    }
}
