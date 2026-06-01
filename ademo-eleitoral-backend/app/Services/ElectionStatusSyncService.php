<?php

namespace App\Services;

use App\Events\EleicaoEstadoActualizado;
use App\Models\Election;
use Illuminate\Support\Carbon;

class ElectionStatusSyncService
{
    public function __construct(private readonly NotificationService $notificationService)
    {
    }

    public function sync(): int
    {
        $now = Carbon::now(config('app.timezone', 'Africa/Maputo'));
        $updated = 0;

        Election::query()
            ->where('status', '!=', 'RESULTADOS_PUBLICADOS')
            ->get()
            ->each(function (Election $election) use ($now, &$updated): void {
                $startsAt = $election->starts_at ? Carbon::parse($election->starts_at, config('app.timezone', 'Africa/Maputo')) : null;
                $endsAt = $election->ends_at ? Carbon::parse($election->ends_at, config('app.timezone', 'Africa/Maputo')) : null;

                $status = match (true) {
                    $startsAt && $now->lt($startsAt) => 'PROGRAMADA',
                    $endsAt && $now->gte($endsAt) => 'CONCLUIDA',
                    $startsAt && $endsAt && $now->between($startsAt, $endsAt) => 'EM_VOTACAO',
                    default => $election->status,
                };

                if ($status !== $election->status) {
                    $previous = $election->status;
                    $election->forceFill(['status' => $status])->save();
                    AuditService::system($status === 'CONCLUIDA' ? 'CONCLUIDA' : 'ALTERACAO_AUTOMATICA_DE_ESTADO_DE_ELEICAO', 'Election', $election->id, [
                        'election_id' => $election->id,
                        'previous_status' => $previous,
                        'status' => $status,
                    ]);
                    $this->notificationService->notifyElectionStatus($election->fresh(), $status);
                    event(new EleicaoEstadoActualizado($election->fresh(), $previous));
                    $updated++;
                }

                if ($status === 'EM_VOTACAO' && $endsAt && $now->between($endsAt->copy()->subHours(2), $endsAt)) {
                    $this->notificationService->notifyElectionEndingSoon($election);
                }
            });

        return $updated;
    }
}
