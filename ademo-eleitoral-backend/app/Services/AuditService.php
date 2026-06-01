<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Throwable;

class AuditService
{
    public static function record(Request $request, string $action, string $entity, int|string|null $entityId = null, array $details = []): void
    {
        try {
            AuditLog::create([
                'election_id' => $details['election_id'] ?? null,
                'user_id' => $request->user()?->id,
                'action' => $action,
                'entity' => $entity,
                'entity_id' => $entityId,
                'details' => $details === [] ? null : $details,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 1000),
            ]);
        } catch (Throwable) {
            // A auditoria nao deve impedir a operacao principal.
        }
    }

    public static function modelAction(Request $request, string $action, Model $record, array $details = []): void
    {
        self::record($request, $action, class_basename($record), $record->getKey(), $details);
    }

    public static function system(string $action, string $entity, int|string|null $entityId = null, array $details = []): void
    {
        try {
            AuditLog::create([
                'election_id' => $details['election_id'] ?? null,
                'user_id' => null,
                'action' => $action,
                'entity' => $entity,
                'entity_id' => $entityId,
                'details' => $details === [] ? null : $details,
                'ip' => null,
                'user_agent' => 'system',
            ]);
        } catch (Throwable) {
            // A auditoria nao deve impedir a operacao principal.
        }
    }
}
