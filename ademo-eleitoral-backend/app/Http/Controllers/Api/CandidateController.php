<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\CandidateRequest;
use App\Http\Requests\Api\CandidateStatusRequest;
use App\Models\Candidate;
use App\Models\Election;
use Illuminate\Database\Eloquent\Model;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateController extends CrudController
{
    protected string $model = Candidate::class;

    protected ?string $requestClass = CandidateRequest::class;

    protected array $with = ['election.organ', 'member.delegation', 'position'];

    protected array $searchable = ['biography', 'proposal'];

    // public function byElection(int|string $id): JsonResponse
    // {
    //     Election::findOrFail($id);

    //     return ApiResponse::success(
    //         Candidate::with(['member.delegation', 'position'])->where('election_id', $id)->get(),
    //         'Candidatos listados com sucesso.'
    //     );
    // }

    public function byElection(int|string $id): JsonResponse
{
    Election::query()
        ->select('id')
        ->whereKey($id)
        ->firstOrFail();

    $candidates = Candidate::query()
        ->select([
            'id',
            'election_id',
            'member_id',
            'position_id',
            'biography',
            'proposal',
            'photo_path',
            'document_path',
            'status',
        ])
        ->with([
            'member:id,name,delegation_id,status',
            'member.delegation:id,name',
            'position:id,name',
        ])
        ->where('election_id', $id)
        ->whereHas('member', function ($query): void {
            $query->where('status', 'ACTIVE');
        })
        ->where('status', '!=', 'REJECTED')
        ->orderBy('id')
        ->get();

    return ApiResponse::success($candidates, 'Candidatos listados com sucesso.');
}

    public function index(Request $request): JsonResponse
{
    $query = Candidate::query()
        ->select([
            'id',
            'election_id',
            'member_id',
            'position_id',
            'biography',
            'proposal',
            'photo_path',
            'document_path',
            'status',
            'created_at',
        ])
        ->with([
            'election:id,title,organ_id,position_id,delegation_id,status',
            'election.organ:id,name',
            'election.position:id,name',
            'election.delegation:id,name',
            'member:id,name,delegation_id,status',
            'member.delegation:id,name',
            'position:id,name',
        ])
        ->whereHas('member', function ($query): void {
            $query->where('status', 'ACTIVE');
        })
        ->where('status', '!=', 'REJECTED');

    $user = $request->user();

    if ($user && ($user->isCommission() || $user->isFiscal())) {
        $query->whereHas('election.team', function ($team) use ($user): void {
            $team->where('user_id', $user->id)
                ->where('status', 'AUTHORIZED');
        });
    }

    if ($request->filled('election_id')) {
        $query->where('election_id', $request->integer('election_id'));
    }

    if ($request->filled('status')) {
        $query->where('status', $request->string('status')->toString());
    }

    if ($request->filled('q')) {
        $term = '%'.$request->string('q')->toString().'%';

        $query->where(function ($query) use ($term): void {
            $query->where('biography', 'like', $term)
                ->orWhere('proposal', 'like', $term)
                ->orWhereHas('member', fn ($member) => $member->where('name', 'like', $term))
                ->orWhereHas('election', fn ($election) => $election->where('title', 'like', $term))
                ->orWhereHas('position', fn ($position) => $position->where('name', 'like', $term));
        });
    }

    $query->orderByDesc('id');

    $perPage = min((int) $request->integer('per_page', 100), 100);

    return ApiResponse::success($query->paginate($perPage), 'Candidatos listados com sucesso.');
}

    public function storeForElection(CandidateRequest $request, int|string $id): JsonResponse
    {
        $election = Election::findOrFail($id);
        if ($election->status !== 'PROGRAMADA') {
            return ApiResponse::error('So pode registar candidato em eleicoes programadas.', 422);
        }

        $data = $this->prepareCandidateFiles($request, $request->validated());
        $data['election_id'] = $id;
        $data['status'] = $data['status'] ?? 'APPROVED';
        $candidate = Candidate::create($data);
        AuditService::record($request, 'SELECCAO_DE_CANDIDATO', 'Candidate', $candidate->id, [
            'election_id' => (int) $id,
            'member_id' => $candidate->member_id,
            'status' => $candidate->status,
        ]);

        return ApiResponse::success($candidate->load($this->with), 'Candidato criado com sucesso.', 201);
    }

    protected function prepareData(array $data, ?Model $record = null): array
    {
        $data = $this->prepareCandidateFiles(request(), $data, $record);

        if ($record === null) {
            $data['status'] = $data['status'] ?? 'APPROVED';
        }

        return $data;
    }

    private function prepareCandidateFiles($request, array $data, ?Model $record = null): array
    {
        unset($data['photo_file'], $data['document_file']);

        if ($request->hasFile('photo_file')) {
            $data['photo_path'] = $request->file('photo_file')->store('candidates/photos', 'public');
        } elseif (! array_key_exists('photo_path', $data) && $record) {
            $data['photo_path'] = $record->photo_path;
        }

        if ($request->hasFile('document_file')) {
            $data['document_path'] = $request->file('document_file')->store('candidates/documents', 'public');
        } elseif (! array_key_exists('document_path', $data) && $record) {
            $data['document_path'] = $record->document_path;
        }

        return $data;
    }

    public function updateStatus(CandidateStatusRequest $request, int|string $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);
        $candidate->update($request->validated());
        $action = match ($candidate->status) {
            'REJECTED' => 'ELIMINADA',
            'SUSPENDED' => 'SUSPENSA',
            default => 'CANDIDATO_ACTUALIZADO',
        };

        AuditService::record($request, $action, 'Candidate', $candidate->id, [
            'election_id' => $candidate->election_id,
            'status' => $candidate->status,
        ]);

        return ApiResponse::success($candidate->load($this->with), 'Estado do candidato actualizado com sucesso.');
    }
}
