<?php

namespace App\Http\Controllers\Api;

use App\Events\EleicaoEstadoActualizado;
use App\Events\ResultadoPublicado;
use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\ElectionVoter;
use App\Models\ElectionTeam;
use App\Models\Member;
use App\Models\PhysicalVoteTotal;
use App\Models\Vote;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use App\Support\StatusNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ResultController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Election::with(['organ', 'position', 'delegation'])
            ->whereIn('status', ['PROGRAMADA', 'EM_VOTACAO', 'CONCLUIDA', 'RESULTADOS_PUBLICADOS']);

        $user = $request->user();

        if ($request->filled('status')) {
            $query->where('status', StatusNormalizer::normalize($request->string('status')->toString()));
        }

        if ($user && ! $user->isAdmin() && ($user->isCommission() || $user->isFiscal())) {
            $teamElectionIds = ElectionTeam::query()
                ->where('user_id', $user->id)
                ->where('status', 'AUTHORIZED')
                ->pluck('election_id');

            $query->whereIn('id', $teamElectionIds);
        }

        if ($user?->isVoter()) {
            $member = $this->memberForUser($request);

            if (! $member) {
                return ApiResponse::success([], 'Nenhuma eleição autorizada encontrada para este eleitor.');
            }

            $voters = ElectionVoter::query()
                ->where('member_id', $member->id)
                ->where('status', 'AUTHORIZED')
                ->get()
                ->keyBy('election_id');

            $query->whereIn('id', $voters->keys());

            $results = $query->orderByDesc('starts_at')->get()->filter(function (Election $election) use ($voters) {
                $voter = $voters->get($election->id);

                return (bool) ($voter?->has_voted ?? false) || $election->status === 'RESULTADOS_PUBLICADOS';
            })->values()->map(function (Election $election) use ($voters, $member) {
                $voter = $voters->get($election->id);
                $election->setAttribute('is_authorized_voter', true);
                $election->setAttribute('member_id', $member->id);
                $election->setAttribute('has_voted', (bool) ($voter?->has_voted ?? false));
                $election->setAttribute('participated', (bool) ($voter?->has_voted ?? false));
                $election->setAttribute('voted_at', $voter?->voted_at);

                return $election;
            });

            return ApiResponse::success($results, 'Resultados autorizados listados com sucesso.');
        }

        return ApiResponse::success($query->orderByDesc('starts_at')->get(), 'Resultados listados com sucesso.');
    }

    public function show(Request $request, int|string $electionId): JsonResponse
    {
        $election = Election::with(['candidates.member.delegation', 'candidates.position', 'position', 'organ', 'delegation'])->findOrFail($electionId);

        $user = $request->user();

        // if ($user && ! $user->isAdmin() && ($user->isCommission() || $user->isFiscal())) {
        //     $teamElectionIds = ElectionTeam::query()
        //         ->where('user_id', $user->id)
        //         ->where('status', 'AUTHORIZED')
        //         ->pluck('election_id');

        //     $query->whereIn('id', $teamElectionIds);
        // }
        if ($user && ! $user->isAdmin() && ($user->isCommission() || $user->isFiscal())) {
    if (! $this->userCanManageElection($user->id, $electionId)) {
        abort(403, 'Você não foi seleccionado para gerir esta eleição.');
    }
}

        if ($user?->isVoter()) {
            $member = $this->memberForUser($request);
            $voter = $member
                ? ElectionVoter::where('election_id', $electionId)
                    ->where('member_id', $member->id)
                    ->where('status', 'AUTHORIZED')
                    ->first()
                : null;

            if (! $voter) {
                abort(403, 'Você não está autorizado a consultar resultados desta eleição.');
            }

            if (! $voter->has_voted && $election->status !== 'RESULTADOS_PUBLICADOS') {
                abort(403, 'Os resultados desta eleição ficam disponíveis após votar ou depois da publicação final.');
            }
        }

        $onlineBlankVotes = Vote::where('election_id', $electionId)->where('is_blank', true)->count();
        $onlineValidVotes = Vote::where('election_id', $electionId)->where('is_blank', false)->count();
        $physicalBlankVotes = PhysicalVoteTotal::where('election_id', $electionId)
            ->whereNull('candidate_id')
            ->where('status', 'APPROVED')
            ->sum('votes');
        $physicalValidVotes = PhysicalVoteTotal::where('election_id', $electionId)
            ->whereNotNull('candidate_id')
            ->where('status', 'APPROVED')
            ->sum('votes');

        $candidateResults = $election->candidates->map(function ($candidate) {
            $onlineVotes = Vote::where('candidate_id', $candidate->id)->where('is_blank', false)->count();
            $physicalVotes = PhysicalVoteTotal::where('candidate_id', $candidate->id)
                ->where('status', 'APPROVED')
                ->sum('votes');

            return [
                'candidate' => $candidate,
                'online_votes' => $onlineVotes,
                'physical_votes' => $physicalVotes,
                'votes' => $onlineVotes + $physicalVotes,
            ];
        });

        return ApiResponse::success([
            'election' => $election,
            'blank_votes' => $onlineBlankVotes + $physicalBlankVotes,
            'online_votes' => $onlineValidVotes,
            'physical_votes' => $physicalValidVotes,
            'total_votes' => $onlineValidVotes + $physicalValidVotes + $onlineBlankVotes + $physicalBlankVotes,
            'candidates' => $candidateResults,
        ], 'Resultado detalhado obtido com sucesso.');
    }

    public function publish(Request $request, int|string $electionId): JsonResponse
    {
        $election = Election::findOrFail($electionId);

        $user = $request->user();
        if ($user && ! $user->isAdmin() && ($user->isCommission() || $user->isFiscal()) && ! $this->userCanManageElection($user->id, $electionId)) {
            abort(403, 'Você não foi seleccionado para gerir esta eleição.');
        }

        if ($election->status !== 'CONCLUIDA') {
            throw ValidationException::withMessages([
                'status' => 'Só é possível publicar resultados depois da eleição estar concluída.',
            ]);
        }

        $hasPendingPhysicalResults = PhysicalVoteTotal::where('election_id', $electionId)
            ->where('status', 'PENDING')
            ->exists();

        if ($hasPendingPhysicalResults) {
            throw ValidationException::withMessages([
                'physical_results' => 'Existem resultados presenciais por aprovar antes da publicação.',
            ]);
        }

        $previousStatus = $election->status;

        $election->update([
            'status' => 'RESULTADOS_PUBLICADOS',
            'results_status' => 'PUBLISHED',
            'results_published_at' => now(),
            'results_published_by' => $request->user()?->id,
        ]);
        AuditService::record($request, 'RESULTADOS_PUBLICADOS', 'Election', $election->id, [
            'election_id' => $election->id,
        ]);
        $this->notificationService->notifyElectionStatus($election->fresh(), 'RESULTADOS_PUBLICADOS');
        $fresh = $election->fresh(['organ', 'position', 'delegation']);
        event(new ResultadoPublicado($fresh));
        event(new EleicaoEstadoActualizado($fresh, $previousStatus));

        return ApiResponse::success($fresh, 'Resultado publicado com sucesso.');
    }

    private function userCanManageElection(int $userId, int|string $electionId): bool
    {
        return ElectionTeam::query()
            ->where('election_id', $electionId)
            ->where('user_id', $userId)
            ->where('status', 'AUTHORIZED')
            ->exists();
    }

    private function memberForUser(Request $request): ?Member
    {
        return $request->user()?->linkedMember();
    }
}
