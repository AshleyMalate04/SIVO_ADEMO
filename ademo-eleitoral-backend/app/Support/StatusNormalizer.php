<?php

namespace App\Support;

class StatusNormalizer
{
    public static function normalize(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $status = strtoupper(trim($value));
        $status = str_replace([' ', '-'], '_', $status);
        $status = strtr($status, [
            'Á' => 'A', 'À' => 'A', 'Â' => 'A', 'Ã' => 'A',
            'É' => 'E', 'Ê' => 'E',
            'Í' => 'I',
            'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O',
            'Ú' => 'U',
            'Ç' => 'C',
        ]);

        return match ($status) {
            'ACTIVO', 'ATIVO', 'ACTIVA', 'ATIVA', 'ACTIVE' => 'ACTIVE',
            'INACTIVO', 'INATIVO', 'INACTIVA', 'INATIVA', 'DESACTIVADO', 'DESATIVADO', 'DESACTIVADA', 'DESATIVADA', 'INACTIVE' => 'INACTIVE',
            'SUSPENSO', 'SUSPENSA', 'SUSPENDED', 'BLOCKED', 'BLOQUEADO', 'BLOQUEADA' => 'SUSPENDED',
            'AUTORIZADO', 'AUTORIZADA', 'AUTHORIZED' => 'AUTHORIZED',
            'REMOVIDO', 'REMOVIDA', 'REMOVED' => 'REMOVED',
            'APROVADO', 'APROVADA', 'APPROVED' => 'APPROVED',
            'REJEITADO', 'REJEITADA', 'REJECTED' => 'REJECTED',
            'PROGRAMADA', 'PROGRAMADO' => 'PROGRAMADA',
            'EM_VOTACAO', 'EM_VOTAÇÃO', 'VOTACAO', 'VOTAÇÃO', 'ABERTA' => 'EM_VOTACAO',
            'CONCLUIDA', 'CONCLUÍDA', 'FECHADA' => 'CONCLUIDA',
            'RESULTADOS_PUBLICADOS', 'PUBLICADA', 'PUBLICADO' => 'RESULTADOS_PUBLICADOS',
            default => $status,
        };
    }
}
