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
use App\Models\Vote;
use App\Models\VoteReceipt;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VotingController extends Controller
{
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

                $election->setAttribute('can_vote', $election->status === 'EM_VOTACAO' && ! $hasVoted);
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
            'can_vote' => $election->status === 'EM_VOTACAO' && ! $voter->has_voted,
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

        $election = Election::findOrFail($id);
        if ($election->status !== 'EM_VOTACAO') {
            throw ValidationException::withMessages(['election' => 'Esta eleição não está aberta para votação.']);
        }

        $isBlank = (bool) ($data['is_blank'] ?? false);

        if (! $isBlank && empty($data['candidate_id'])) {
            throw ValidationException::withMessages(['candidate_id' => 'Escolha um candidato ou vote em branco.']);
        }

        if (! $isBlank) {
            $candidateExists = Candidate::where('id', $data['candidate_id'])
                ->where('election_id', $id)
                ->where('status', 'APPROVED')
                ->exists();

            if (! $candidateExists) {
                throw ValidationException::withMessages(['candidate_id' => 'O candidato seleccionado não pertence a esta eleição ou não está aprovado.']);
            }
        }

        $voter = ElectionVoter::where('election_id', $id)
            ->where('member_id', $member->id)
            ->where('status', 'AUTHORIZED')
            ->firstOrFail();

        if ($voter->has_voted) {
            throw ValidationException::withMessages(['member_id' => 'Este eleitor já votou nesta eleição.']);
        }

        $vote = Vote::create([
            'election_id' => $id,
            'candidate_id' => $isBlank ? null : $data['candidate_id'],
            'is_blank' => $isBlank,
            'proof_hash' => hash('sha256', $id.'|'.$voter->voter_hash.'|'.Str::uuid()),
        ]);

        $voter->update(['has_voted' => true, 'voted_at' => now()]);

        $receipt = VoteReceipt::create([
            'election_id' => $id,
            'voter_hash' => $voter->voter_hash,
            'public_code' => strtoupper(Str::random(12)),
        ]);
        AuditService::record($request, 'VOTOU', 'Vote', $vote->id, [
            'election_id' => (int) $id,
            'member_id' => $voter->member_id,
            'is_blank' => $isBlank,
        ]);
        event(new ParticipacaoActualizada(Election::findOrFail($id)));
        app(NotificationService::class)->notifyVoteConfirmed($request->user(), $election, $receipt->public_code);

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
}
