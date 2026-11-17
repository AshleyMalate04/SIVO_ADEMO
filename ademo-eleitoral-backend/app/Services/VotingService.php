<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\ElectionVoter;
use App\Models\Member;
use App\Models\Vote;
use App\Models\VoteReceipt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VotingService
{
    /**
     * @return array{vote: Vote, receipt: VoteReceipt, election: Election}
     */
    public function cast(Member $member, int $electionId, ?int $candidateId, bool $isBlank): array
    {
        return DB::transaction(function () use ($member, $electionId, $candidateId, $isBlank): array {
            $election = Election::query()
                ->whereKey($electionId)
                ->sharedLock()
                ->firstOrFail();

            $now = now();
            if ($election->status !== 'EM_VOTACAO' || $now->lt($election->starts_at) || ! $now->lt($election->ends_at)) {
                throw ValidationException::withMessages([
                    'election' => 'Esta eleição não está aberta para votação.',
                ]);
            }

            if ($isBlank && ! $election->allow_blank_vote) {
                throw ValidationException::withMessages([
                    'is_blank' => 'Esta eleição não permite voto em branco.',
                ]);
            }

            if (! $isBlank && ! $candidateId) {
                throw ValidationException::withMessages([
                    'candidate_id' => 'Escolha um candidato ou vote em branco.',
                ]);
            }

            // Pedidos simultâneos do mesmo eleitor ficam serializados aqui.
            $voter = ElectionVoter::query()
                ->where('election_id', $electionId)
                ->where('member_id', $member->id)
                ->where('status', 'AUTHORIZED')
                ->lockForUpdate()
                ->first();

            if (! $voter) {
                throw ValidationException::withMessages([
                    'member_id' => 'Este eleitor não está autorizado a votar nesta eleição.',
                ]);
            }

            if ($voter->has_voted) {
                throw ValidationException::withMessages([
                    'member_id' => 'Este eleitor já votou nesta eleição.',
                ]);
            }

            if (! $isBlank) {
                $candidate = Candidate::query()
                    ->whereKey($candidateId)
                    ->where('election_id', $electionId)
                    ->where('status', 'APPROVED')
                    ->sharedLock()
                    ->first();

                if (! $candidate) {
                    throw ValidationException::withMessages([
                        'candidate_id' => 'O candidato selecionado não pertence a esta eleição ou não está aprovado.',
                    ]);
                }
            }

            $vote = Vote::create([
                'election_id' => $electionId,
                'candidate_id' => $isBlank ? null : $candidateId,
                'is_blank' => $isBlank,
                'proof_hash' => hash('sha256', Str::uuid().'|'.bin2hex(random_bytes(32))),
            ]);

            $voter->update([
                'has_voted' => true,
                'voted_at' => $now,
            ]);

            $receipt = VoteReceipt::create([
                'election_id' => $electionId,
                'voter_hash' => $voter->voter_hash,
                'public_code' => strtoupper(Str::random(20)),
            ]);

            return compact('vote', 'receipt', 'election');
        }, 5);
    }
}
