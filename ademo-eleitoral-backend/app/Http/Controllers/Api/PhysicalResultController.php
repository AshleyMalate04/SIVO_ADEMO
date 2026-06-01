<?php

namespace App\Http\Controllers\Api;

use App\Events\ParticipacaoActualizada;
use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\ElectionTeam;
use App\Models\PhysicalVoteTotal;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PhysicalResultController extends Controller
{
    public function show(int|string $id): JsonResponse
    {
        $election = Election::with(['physicalVoteTotals.candidate.member', 'candidates.member'])->findOrFail($id);

        return ApiResponse::success([
            'election' => $election,
            'totals' => $election->physicalVoteTotals,
        ], 'Resultados presenciais listados com sucesso.');
    }

    public function store(Request $request, int|string $id): JsonResponse
    {
        $election = Election::with('candidates')->findOrFail($id);
        $this->ensureCanManage($request, $election);
        $this->ensureElectionIsConcluded($election);

        $data = $request->validate([
            'totals' => ['required', 'array', 'min:1'],
            'totals.*.candidate_id' => ['nullable', 'integer', Rule::exists('candidates', 'id')->where('election_id', $election->id)],
            'totals.*.votes' => ['required', 'integer', 'min:0'],
        ]);

        $records = collect($data['totals'])->map(function (array $total) use ($election, $request) {
            return PhysicalVoteTotal::updateOrCreate(
                [
                    'election_id' => $election->id,
                    'candidate_id' => $total['candidate_id'] ?? null,
                ],
                [
                    'votes' => $total['votes'],
                    'status' => 'PENDING',
                    'registered_by' => $request->user()?->id,
                    'approved_by' => null,
                    'approved_at' => null,
                ],
            )->load('candidate.member');
        });
        AuditService::record($request, 'RESULTADOS_PRESENCIAIS_REGISTADOS', 'Election', $election->id, [
            'election_id' => $election->id,
            'totals_count' => $records->count(),
        ]);
        event(new ParticipacaoActualizada($election->fresh()));

        return ApiResponse::success($records, 'Resultados presenciais guardados para aprovação.', 201);
    }

    public function approve(Request $request, int|string $id): JsonResponse
    {
        $election = Election::findOrFail($id);
        $this->ensureCanManage($request, $election);
        $this->ensureElectionIsConcluded($election);

        PhysicalVoteTotal::where('election_id', $id)->update([
            'status' => 'APPROVED',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        AuditService::record($request, 'RESULTADOS_PRESENCIAIS_APROVADOS', 'Election', $election->id, [
            'election_id' => $election->id,
        ]);
        event(new ParticipacaoActualizada($election->fresh()));

        return ApiResponse::success(
            PhysicalVoteTotal::with('candidate.member')->where('election_id', $id)->get(),
            'Resultados presenciais aprovados com sucesso.',
        );
    }

    private function ensureCanManage(Request $request, Election $election): void
    {
        $user = $request->user();

        if (! $user || $user->isAdmin()) {
            return;
        }

        $isTeamMember = ElectionTeam::query()
            ->where('election_id', $election->id)
            ->where('user_id', $user->id)
            ->where('status', 'AUTHORIZED')
            ->exists();

        if (! $isTeamMember) {
            abort(403, 'Você não foi seleccionado para gerir esta eleição.');
        }
    }

    private function ensureElectionIsConcluded(Election $election): void
    {
        if ($election->status !== 'CONCLUIDA') {
            throw ValidationException::withMessages([
                'status' => 'Os resultados presenciais só podem ser registados depois da eleição estar concluída.',
            ]);
        }
    }
}
