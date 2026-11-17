<?php

namespace App\Services;

use App\Events\EleicaoEstadoActualizado;
use App\Models\Election;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ElectionStatusSyncService
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function sync(): int
    {
        $now = Carbon::now(config('app.timezone', 'Africa/Maputo'));
        $updated = 0;

        $electionIds = Election::query()
            ->where(function ($query) use ($now): void {
                $query
                    ->where(function ($query) use ($now): void {
                        $query->where('status', 'PROGRAMADA')->where('starts_at', '<=', $now);
                    })
                    ->orWhere('status', 'EM_VOTACAO');
            })
            ->pluck('id');

        foreach ($electionIds as $electionId) {
            $result = DB::transaction(function () use ($electionId, $now): ?array {
                // Rele o estado sob bloqueio para nao reverter uma alteracao concorrente.
                $election = Election::query()->lockForUpdate()->find($electionId);

                if (! $election || ! in_array($election->status, ['PROGRAMADA', 'EM_VOTACAO'], true)) {
                    return null;
                }

                $startsAt = $election->starts_at ? Carbon::parse($election->starts_at, config('app.timezone', 'Africa/Maputo')) : null;
                $endsAt = $election->ends_at ? Carbon::parse($election->ends_at, config('app.timezone', 'Africa/Maputo')) : null;

                $status = match (true) {
                    $startsAt && $now->lt($startsAt) => 'PROGRAMADA',
                    $endsAt && $now->gte($endsAt) => 'CONCLUIDA',
                    $startsAt && $endsAt && $now->between($startsAt, $endsAt) => 'EM_VOTACAO',
                    default => $election->status,
                };

                $previous = $election->status;
                if ($status !== $election->status) {
                    $election->forceFill(['status' => $status])->save();
                    AuditService::system($status === 'CONCLUIDA' ? 'CONCLUIDA' : 'ALTERACAO_AUTOMATICA_DE_ESTADO_DE_ELEICAO', 'Election', $election->id, [
                        'election_id' => $election->id,
                        'previous_status' => $previous,
                        'status' => $status,
                    ]);
                }

                return [$election->fresh(), $previous, $startsAt, $endsAt, $status !== $previous];
            }, 5);

            if (! $result) {
                continue;
            }

            [$election, $previous, $startsAt, $endsAt, $changed] = $result;

            if ($changed) {
                $this->notificationService->notifyElectionStatus($election, $election->status);
                event(new EleicaoEstadoActualizado($election, $previous));
                $updated++;
            }

            if ($election->status === 'EM_VOTACAO' && $startsAt && $endsAt && $this->shouldNotifyEndingSoon($startsAt, $endsAt, $now)) {
                $this->notificationService->notifyElectionEndingSoon($election);
            }
        }

        return $updated;
    }

    private function shouldNotifyEndingSoon(Carbon $startsAt, Carbon $endsAt, Carbon $now): bool
    {
        $durationInMinutes = max(1, (int) $startsAt->diffInMinutes($endsAt));
        $warningMinutes = $durationInMinutes > 30 ? 30 : 15;

        return $now->between($endsAt->copy()->subMinutes($warningMinutes), $endsAt);
    }
}
