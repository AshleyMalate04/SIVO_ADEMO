<?php

namespace App\Services;

use App\Events\NotificacaoCriada;
use App\Jobs\SendElectionAudienceNotificationJob;
use App\Jobs\SendRoleNotificationJob;
use App\Jobs\SendUserNotificationJob;
use App\Models\Election;
use App\Models\ElectionTeam;
use App\Models\Member;
use App\Models\Notification;
use App\Models\User;
use App\Notifications\AdemoEmailNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotificationService
{
    public function notifyUser(User $user, string $title, string $message, string $type = 'INFO', ?Election $election = null): bool
    {
        if (! $user->isActive()) {
            return false;
        }

        SendUserNotificationJob::dispatch($user->id, $this->payload($title, $message, $type, $election));

        return true;
    }

    /**
     * @param  array{title:string,message:string,type:string,election_id?:int|null,action_url?:string|null}  $payload
     */
    public function deliverToUser(User $user, array $payload): ?Notification
    {
        if (! $user->isActive()) {
            return null;
        }

        $query = Notification::query()
            ->where('user_id', $user->id)
            ->where('title', $payload['title'])
            ->where('message', $payload['message']);

        array_key_exists('election_id', $payload) && $payload['election_id'] !== null
            ? $query->where('election_id', $payload['election_id'])
            : $query->whereNull('election_id');

        if ($query->exists()) {
            return null;
        }

        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => $payload['title'],
            'message' => $payload['message'],
            'type' => $payload['type'],
            'election_id' => $payload['election_id'] ?? null,
        ]);

        event(new NotificacaoCriada($notification));

        try {
            $user->notify(new AdemoEmailNotification($payload));
        } catch (Throwable $exception) {
            Log::warning('Falha ao colocar notificacao por email na fila.', [
                'user_id' => $user->id,
                'notification_id' => $notification->id,
                'error' => $exception->getMessage(),
            ]);
        }

        return $notification;
    }

    public function notifyElectionAudience(Election $election, string $title, string $message, string $type = 'ELECTION'): int
    {
        if ($this->hasElectionNotification($election->id, $title, $message)) {
            return 0;
        }

        SendElectionAudienceNotificationJob::dispatch($election->id, $this->payload($title, $message, $type, $election));

        return $this->eligibleUsersForElectionQuery($election->id)->count();
    }

    public function notifyAdminsAboutElectionCreated(Election $election): int
    {
        SendRoleNotificationJob::dispatch(['ADMIN'], $this->payload(
            'Nova eleição criada',
            "A eleição \"{$election->title}\" foi criada e aguarda acompanhamento administrativo.",
            'ELECTION',
            $election,
        ));

        return User::query()->where('role', 'ADMIN')->where('status', 'ACTIVE')->count();
    }

    public function notifyElectionStatus(Election $election, string $status): int
    {
        $title = match ($status) {
            'EM_VOTACAO' => 'Eleição iniciada',
            'CONCLUIDA' => 'Eleição concluída',
            'RESULTADOS_PUBLICADOS' => 'Resultados publicados',
            default => 'Estado da eleição actualizado',
        };

        $message = match ($status) {
            'EM_VOTACAO' => "A eleição \"{$election->title}\" iniciou e já está disponível para os eleitores autorizados.",
            'CONCLUIDA' => "A eleição \"{$election->title}\" foi concluída e aguarda apuramento/publicação dos resultados.",
            'RESULTADOS_PUBLICADOS' => "Os resultados finais da eleição \"{$election->title}\" foram publicados.",
            default => "A eleição \"{$election->title}\" teve o estado actualizado para {$status}.",
        };

        return $this->notifyElectionAudience($election, $title, $message, 'ELECTION');
    }

    public function notifyElectionEndingSoon(Election $election): int
    {
        $startsAt = Carbon::parse($election->starts_at, config('app.timezone', 'Africa/Maputo'));
        $endsAt = Carbon::parse($election->ends_at, config('app.timezone', 'Africa/Maputo'));
        $durationInMinutes = max(1, (int) $startsAt->diffInMinutes($endsAt));
        $warningMinutes = $durationInMinutes > 30 ? 30 : 15;

        return $this->notifyElectionAudience(
            $election,
            'Votação prestes a terminar',
            "A eleição \"{$election->title}\" termina dentro de aproximadamente {$warningMinutes} minutos.",
            'WARNING',
        );
    }

    public function notifyPasswordChanged(User $user): bool
    {
        return $this->notifyUser(
            $user,
            'Palavra-passe alterada',
            'A sua palavra-passe foi alterada com sucesso. Caso não reconheça esta alteração, contacte a administração imediatamente.',
            'SYSTEM',
        );
    }

    public function notifyVoteConfirmed(User $user, Election $election, string $receiptCode): bool
    {
        return $this->notifyUser(
            $user,
            'Voto confirmado',
            "O seu voto na eleição \"{$election->title}\" foi registado com sucesso. Código do comprovativo: {$receiptCode}.",
            'ELECTION',
            $election,
        );
    }

    /**
     * @param  array{title:string,message:string,type:string,election_id?:int|null,action_url?:string|null}  $payload
     */
    public function dispatchElectionAudienceUsers(int $electionId, array $payload): void
    {
        $this->eligibleUsersForElectionQuery($electionId)
            ->select('users.id')
            ->chunkById(500, function ($users) use ($payload): void {
                foreach ($users as $user) {
                    SendUserNotificationJob::dispatch($user->id, $payload);
                }
            }, 'users.id', 'id');
    }

    /**
     * @param  array<int, string>  $roles
     * @param  array{title:string,message:string,type:string,election_id?:int|null,action_url?:string|null}  $payload
     */
    public function dispatchUsersByRole(array $roles, array $payload): void
    {
        User::query()
            ->whereIn('role', $roles)
            ->where('status', 'ACTIVE')
            ->select('id')
            ->chunkById(500, function ($users) use ($payload): void {
                foreach ($users as $user) {
                    SendUserNotificationJob::dispatch($user->id, $payload);
                }
            });
    }

    public function eligibleUsersForElectionQuery(int $electionId): Builder
    {
        return User::query()
            ->where('status', 'ACTIVE')
            ->where(function (Builder $query) use ($electionId): void {
                $query
                    ->whereIn('access_code', $this->authorizedMemberColumnQuery($electionId, 'member_code'))
                    ->orWhereIn('email', $this->authorizedMemberColumnQuery($electionId, 'email'))
                    ->orWhereIn('phone', $this->authorizedMemberColumnQuery($electionId, 'phone'))
                    ->orWhereIn('id', ElectionTeam::query()
                        ->select('user_id')
                        ->where('election_id', $electionId)
                        ->where('status', 'AUTHORIZED'));
            });
    }

    private function authorizedMemberColumnQuery(int $electionId, string $column): Builder
    {
        return Member::query()
            ->select("members.{$column}")
            ->join('election_voters', 'election_voters.member_id', '=', 'members.id')
            ->where('election_voters.election_id', $electionId)
            ->where('election_voters.status', 'AUTHORIZED')
            ->whereNotNull("members.{$column}");
    }

    /**
     * @return array{title:string,message:string,type:string,election_id?:int|null,action_url?:string|null}
     */
    private function payload(string $title, string $message, string $type, ?Election $election = null): array
    {
        return [
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'election_id' => $election?->id,
            'action_url' => $this->actionUrl($election),
        ];
    }

    private function actionUrl(?Election $election = null): string
    {
        $baseUrl = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');

        if (! $election) {
            return "{$baseUrl}/notificacoes";
        }

        return "{$baseUrl}/portal-eleitor/votacoes/{$election->id}";
    }

    private function hasElectionNotification(int $electionId, string $title, string $message): bool
    {
        return Notification::query()
            ->where('election_id', $electionId)
            ->where('title', $title)
            ->where('message', $message)
            ->exists();
    }
}
