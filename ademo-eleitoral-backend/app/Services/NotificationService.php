<?php

namespace App\Services;

use App\Events\NotificacaoCriada;
use App\Models\Election;
use App\Models\ElectionTeam;
use App\Models\ElectionVoter;
use App\Models\Member;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    public function notifyUser(User $user, string $title, string $message, string $type = 'INFO', ?Election $election = null): ?Notification
    {
        if (! $user->isActive()) {
            return null;
        }

        $exists = Notification::query()
            ->where('user_id', $user->id)
            ->where('title', $title)
            ->where('message', $message)
            ->exists();

        if ($exists) {
            return null;
        }

        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'election_id' => $election?->id,
        ]);

        event(new NotificacaoCriada($notification));

        return $notification;
    }

    public function notifyElectionAudience(Election $election, string $title, string $message, string $type = 'ELECTION'): int
    {
        $users = $this->usersForElection($election);
        $created = 0;

        foreach ($users as $user) {
            if ($this->notifyUser($user, $title, $message, $type, $election)) {
                $created++;
            }
        }

        return $created;
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
            default => "A eleição \"{$election->title}\" teve o estado actualizado.",
        };

        return $this->notifyElectionAudience($election, $title, $message, 'ELECTION');
    }

    public function notifyElectionEndingSoon(Election $election): int
    {
        return $this->notifyElectionAudience(
            $election,
            'Votação prestes a terminar',
            "A eleição \"{$election->title}\" termina dentro de aproximadamente 2 horas.",
            'WARNING',
        );
    }

    private function usersForElection(Election $election): Collection
    {
        $members = ElectionVoter::query()
            ->where('election_id', $election->id)
            ->where('status', 'AUTHORIZED')
            ->with('member:id,member_code,email,phone')
            ->get()
            ->pluck('member')
            ->filter();

        $memberCodes = $members->pluck('member_code')->filter()->values();
        $memberEmails = $members->pluck('email')->filter()->values();
        $memberPhones = $members->pluck('phone')->filter()->values();

        $teamUserIds = ElectionTeam::query()
            ->where('election_id', $election->id)
            ->where('status', 'AUTHORIZED')
            ->pluck('user_id');

        return User::query()
            ->where(function ($query) use ($memberCodes, $memberEmails, $memberPhones, $teamUserIds): void {
                if ($memberCodes->isNotEmpty()) {
                    $query->orWhereIn('access_code', $memberCodes->all());
                }
                if ($memberEmails->isNotEmpty()) {
                    $query->orWhereIn('email', $memberEmails->all());
                }
                if ($memberPhones->isNotEmpty()) {
                    $query->orWhereIn('phone', $memberPhones->all());
                }
                if ($teamUserIds->isNotEmpty()) {
                    $query->orWhereIn('id', $teamUserIds->all());
                }
            })
            ->where('status', 'ACTIVE')
            ->get();
    }
}
