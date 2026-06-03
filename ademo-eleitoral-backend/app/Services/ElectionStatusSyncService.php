<?php

namespace App\Services;

use App\Events\EleicaoEstadoActualizado;
use App\Models\Election;
use Illuminate\Support\Carbon;

class ElectionStatusSyncService
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function sync(): int
    {
        $now = Carbon::now(config('app.timezone', 'Africa/Maputo'));
        $updated = 0;

        Election::query()
            ->where(function ($query) use ($now): void {
                $query
                    ->where(function ($query) use ($now): void {
                        $query->where('status', 'PROGRAMADA')->where('starts_at', '<=', $now);
                    })
                    ->orWhere('status', 'EM_VOTACAO');
            })
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

                if ($status === 'EM_VOTACAO' && $startsAt && $endsAt && $this->shouldNotifyEndingSoon($startsAt, $endsAt, $now)) {
                    $this->notificationService->notifyElectionEndingSoon($election);
                }
            });

        return $updated;
    }

    private function shouldNotifyEndingSoon(Carbon $startsAt, Carbon $endsAt, Carbon $now): bool
    {
        $durationInMinutes = max(1, (int) $startsAt->diffInMinutes($endsAt));
        $warningMinutes = $durationInMinutes > 30 ? 30 : 15;

        return $now->between($endsAt->copy()->subMinutes($warningMinutes), $endsAt);
    }
}
