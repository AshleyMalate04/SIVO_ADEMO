<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\ElectionVoterRequest;
use App\Http\Requests\Api\ElectionVoterStatusRequest;
use App\Models\Election;
use App\Models\ElectionVoter;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ElectionVoterController extends CrudController
{
    protected string $model = ElectionVoter::class;

    protected array $with = ['election', 'member', 'delegation'];

    public function byElection(int|string $id): JsonResponse
    {
        return ApiResponse::success(
            ElectionVoter::with(['election', 'member.delegation', 'delegation'])
                ->where('election_id', $id)
                ->get(),
            'Eleitores listados com sucesso.'
        );
    }

    public function storeForElection(ElectionVoterRequest $request, int|string $id): JsonResponse
    {
        $election = Election::findOrFail($id);
        if ($election->status !== 'PROGRAMADA') {
            return ApiResponse::error('So pode adicionar eleitores em eleicoes programadas.', 422);
        }

        $data = $request->validated();
        $voters = new Collection();

        foreach (array_unique($data['member_ids']) as $memberId) {
            $voters->push(ElectionVoter::updateOrCreate(
                ['election_id' => $id, 'member_id' => $memberId],
                [
                    'delegation_id' => $data['delegation_id'] ?? null,
                    'status' => 'AUTHORIZED',
                    'voter_hash' => hash('sha256', $id.'|'.$memberId.'|'.Str::uuid()),
                ]
            )->load(['member', 'delegation']));
        }
        AuditService::record($request, 'ELEITORES_AUTORIZADOS', 'Election', $id, [
            'election_id' => (int) $id,
            'member_ids' => array_values(array_unique($data['member_ids'])),
        ]);

        return ApiResponse::success($voters, 'Eleitores adicionados com sucesso.', 201);
    }

    public function destroyByMember(\Illuminate\Http\Request $request, int|string $id, int|string $memberId): JsonResponse
    {
        $voter = ElectionVoter::where('election_id', $id)->where('member_id', $memberId)->firstOrFail();
        $voter->update(['status' => 'REMOVED']);
        AuditService::record($request, 'ELEITOR_REMOVIDO', 'ElectionVoter', $voter->id, [
            'election_id' => (int) $id,
            'member_id' => (int) $memberId,
        ]);

        return ApiResponse::success($voter, 'Eleitor removido com sucesso.');
    }

    public function updateStatus(ElectionVoterStatusRequest $request, int|string $id, int|string $memberId): JsonResponse
    {
        $voter = ElectionVoter::where('election_id', $id)->where('member_id', $memberId)->firstOrFail();
        $voter->update($request->validated());

        AuditService::record($request, $voter->status === 'SUSPENDED' ? 'SUSPENSA' : 'ELEITOR_ACTUALIZADO', 'ElectionVoter', $voter->id, [
            'election_id' => (int) $id,
            'member_id' => (int) $memberId,
            'status' => $voter->status,
        ]);

        return ApiResponse::success($voter, 'Estado do eleitor actualizado com sucesso.');
    }

    public function credentials(int|string $id): JsonResponse
    {
        $count = ElectionVoter::where('election_id', $id)->where('status', 'AUTHORIZED')->count();

        return ApiResponse::success([
            'message' => 'Credenciais prontas para emissão.',
            'authorized_voters' => $count,
        ], 'Credenciais geradas com sucesso.');
    }
}
