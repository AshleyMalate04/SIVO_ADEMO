<?php

namespace App\Http\Controllers\Api;

use App\Events\ParticipacaoActualizada;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\VoteConfirmRequest;
use App\Http\Requests\Api\VoteReceiptLookupRequest;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\ElectionVoter;
use App\Models\Member;
use App\Models\VoteReceipt;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Services\VotingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class VotingController extends Controller
{
    public function __construct(
        private readonly VotingService $votingService,
        private readonly NotificationService $notificationService,
    ) {}

    public function elections(Request $request): JsonResponse
    {
        $member = $this->memberForUser($request);

        if (! $member) {
            return ApiResponse::success([], 'Nenhuma eleição autorizada encontrada para este eleitor.');
        }

        $authorizedVoters = ElectionVoter::query()
            ->where('member_id', $member->id)
            ->where('status', 'AUTHORIZED')
            ->get()
            ->keyBy('election_id');

        $elections = Election::with(['organ', 'position', 'delegation'])
            ->whereIn('id', $authorizedVoters->keys())
            ->orderByDesc('starts_at')
            ->get()
            ->map(function (Election $election) use ($authorizedVoters, $member) {
                $voter = $authorizedVoters->get($election->id);
                $hasVoted = (bool) ($voter?->has_voted ?? false);

                $election->setAttribute('can_vote', $this->isVotingOpen($election) && ! $hasVoted);
                $election->setAttribute('is_authorized_voter', true);
                $election->setAttribute('has_voted', $hasVoted);
                $election->setAttribute('participated', $hasVoted);
                $election->setAttribute('voted_at', $voter?->voted_at);
                $election->setAttribute('member_id', $member->id);

                return $election;
            });

        return ApiResponse::success($elections, 'Eleições autorizadas listadas com sucesso.');
    }

    public function ballot(Request $request, int|string $id): JsonResponse
    {
        $election = Election::with(['organ', 'position', 'delegation'])->findOrFail($id);
        $member = $this->memberForUser($request);

        $voter = $member
            ? ElectionVoter::where('election_id', $id)
                ->where('member_id', $member->id)
                ->where('status', 'AUTHORIZED')
                ->first()
            : null;

        if (! $voter) {
            abort(403, 'Você não foi seleccionado como eleitor desta eleição.');
        }

        return ApiResponse::success([
            'election' => $election,
            'member_id' => $member?->id,
            'is_authorized_voter' => true,
            'has_voted' => (bool) $voter->has_voted,
            'can_vote' => $this->isVotingOpen($election) && ! $voter->has_voted,
            'candidates' => Candidate::with('member.delegation')
                ->where('election_id', $id)
                ->where('status', 'APPROVED')
                ->get(),
        ], 'Boletim de voto obtido com sucesso.');
    }

    public function confirm(VoteConfirmRequest $request, int|string $id): JsonResponse
    {
        $data = $request->validated();
        $member = $this->memberForUser($request);

        if (! $member) {
            throw ValidationException::withMessages(['member_id' => 'Não foi possível localizar o membro associado a este eleitor.']);
        }

        $isBlank = (bool) ($data['is_blank'] ?? false);
        $result = $this->votingService->cast(
            $member,
            (int) $id,
            isset($data['candidate_id']) ? (int) $data['candidate_id'] : null,
            $isBlank,
        );

        $vote = $result['vote'];
        $receipt = $result['receipt'];
        $election = $result['election'];

        // Não relacionar o registo de auditoria com o ID do voto ou a escolha.
        AuditService::record($request, 'VOTO_CONFIRMADO', 'Election', $election->id, [
            'election_id' => $election->id,
        ]);
        event(new ParticipacaoActualizada($election->fresh()));
        $this->notificationService->notifyVoteConfirmed($request->user(), $election, $receipt->public_code);

        return ApiResponse::success(['vote' => $vote, 'receipt' => $receipt], 'Voto registado com sucesso.', 201);
    }

    public function receipt(VoteReceiptLookupRequest $request, int|string $id): JsonResponse
    {
        $member = $this->memberForUser($request);

        if (! $member) {
            abort(404, 'Eleitor não encontrado.');
        }

        $voter = ElectionVoter::where('election_id', $id)->where('member_id', $member->id)->firstOrFail();

        return ApiResponse::success(
            VoteReceipt::where('election_id', $id)->where('voter_hash', $voter->voter_hash)->firstOrFail(),
            'Comprovativo obtido com sucesso.'
        );
    }

    private function memberForUser(Request $request): ?Member
    {
        return $request->user()?->linkedMember();
    }

    private function isVotingOpen(Election $election): bool
    {
        $now = now();

        return $election->status === 'EM_VOTACAO'
            && ! $now->lt($election->starts_at)
            && $now->lt($election->ends_at);
    }
}
