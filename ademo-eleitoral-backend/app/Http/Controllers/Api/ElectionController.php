<?php

namespace App\Http\Controllers\Api;

use App\Events\EleicaoEstadoActualizado;
use App\Http\Requests\Api\ElectionRequest;
use App\Http\Requests\Api\ElectionStatusRequest;
use App\Http\Requests\Api\ElectionTeamRequest;
use App\Http\Requests\Api\ElectionTeamStatusRequest;
use App\Models\Election;
use App\Models\ElectionTeam;
use App\Models\ElectionVoter;
use App\Models\Position;
use App\Models\Organ;
use App\Models\Delegation;
use App\Services\AuditService;
use App\Services\ElectionStatusSyncService;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use App\Support\StatusNormalizer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ElectionController extends CrudController
{
    protected string $model = Election::class;

    protected ?string $requestClass = ElectionRequest::class;

    protected array $with = ['organ', 'position', 'delegation', 'parentElection', 'creator', 'team.user', 'team.user.delegation'];

    protected array $searchable = ['title', 'description'];

    public function __construct(private readonly ElectionStatusSyncService $statusSyncService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $formRequest = ElectionRequest::createFrom($request);
        $formRequest->setContainer(app());
        $formRequest->setRedirector(app('redirect'));
        $formRequest->setUserResolver($request->getUserResolver());
        $formRequest->setRouteResolver($request->getRouteResolver());
        $formRequest->validateResolved();
        $this->validateDependenciesAreActive($formRequest->validated());
        $this->ensureNoOpenElectionConflict($formRequest->validated());

        $election = Election::create($this->prepareData($formRequest->validated()));
        $user = $request->user();

        if ($user) {
            ElectionTeam::updateOrCreate(
                ['election_id' => $election->id, 'user_id' => $user->id],
                ['role_in_election' => $user->isFiscal() ? 'FISCAL' : 'COMISSAO', 'status' => 'AUTHORIZED'],
            );
        }
        AuditService::record($request, 'CRIACAO_DE_ELEICAO', 'Election', $election->id, [
            'election_id' => $election->id,
        ]);

        return ApiResponse::success($election->load($this->with), 'Eleicao criada com sucesso.', 201);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $election = Election::findOrFail($id);

        if (in_array($election->status, ['EM_VOTACAO', 'CONCLUIDA', 'RESULTADOS_PUBLICADOS'], true)) {
            return ApiResponse::error('Esta eleição já não pode ser editada pelo estado actual.', 422);
        }

        $formRequest = ElectionRequest::createFrom($request);
        $formRequest->setContainer(app());
        $formRequest->setRedirector(app('redirect'));
        $formRequest->setUserResolver($request->getUserResolver());
        $formRequest->setRouteResolver($request->getRouteResolver());
        $formRequest->validateResolved();
        $data = $formRequest->validated();
        $this->validateDependenciesAreActive($data);
        $this->ensureNoOpenElectionConflict($data, (int) $id);

        $election->update($this->prepareData($data, $election));
        AuditService::record($request, 'ACTUALIZACAO_DE_ELEICAO', 'Election', $election->id, [
            'election_id' => $election->id,
        ]);

        return ApiResponse::success($election->fresh($this->with), 'Registo actualizado com sucesso.');
    }

    public function index(Request $request): JsonResponse
    {
        $this->statusSyncService->sync();

        $query = Election::query();

        $relations = $this->requestedRelations($request);
        if ($relations !== []) {
            $query->with($relations);
        }

        $user = $request->user();
        if ($user && $user->isVoter()) {
            $member = $user->linkedMember();
            $voters = $member
                ? ElectionVoter::where('member_id', $member->id)->where('status', 'AUTHORIZED')->get()->keyBy('election_id')
                : collect();

            $query->whereIn('id', $voters->keys());

            // O eleitor não deve receber a equipa da eleição, mesmo que o frontend peça include=team.
            $query->with(['organ', 'position', 'delegation']);
        } elseif ($user && ($user->isCommission() || $user->isFiscal())) {
            $query->whereHas('team', fn ($team) => $team->where('user_id', $user->id));
        }

        if ($request->filled('status')) {
            $query->where('status', StatusNormalizer::normalize($request->string('status')->toString()));
        }

        if ($request->filled('delegation_id')) {
            $query->where('delegation_id', $request->integer('delegation_id'));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function ($query) use ($term): void {
                $query->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term);
            });
        }

        $sortBy = $request->string('sort_by', 'id')->toString();
        $sortDirection = $request->string('sort_direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDirection);

        $perPage = min((int) $request->integer('per_page', 15), 100);

        $records = $query->paginate($perPage);

        if ($user && $user->isVoter()) {
            $member = $user->linkedMember();
            $voters = $member
                ? ElectionVoter::where('member_id', $member->id)->where('status', 'AUTHORIZED')->get()->keyBy('election_id')
                : collect();

            $records->getCollection()->transform(function (Election $election) use ($voters, $member) {
                $voter = $voters->get($election->id);
                $hasVoted = (bool) ($voter?->has_voted ?? false);
                $election->setAttribute('is_authorized_voter', true);
                $election->setAttribute('member_id', $member?->id);
                $election->setAttribute('has_voted', $hasVoted);
                $election->setAttribute('participated', $hasVoted);
                $election->setAttribute('can_vote', $election->status === 'EM_VOTACAO' && ! $hasVoted);
                unset($election->team);

                return $election;
            });
        }

        return ApiResponse::success($records, 'Registos listados com sucesso.');
    }

    public function show(Request $request, int|string $id): JsonResponse
    {
        $this->statusSyncService->sync();

        $user = $request->user();

        if ($user && $user->isVoter()) {
            $member = $user->linkedMember();
            $voter = $member
                ? ElectionVoter::where('election_id', $id)
                    ->where('member_id', $member->id)
                    ->where('status', 'AUTHORIZED')
                    ->first()
                : null;

            if (! $voter) {
                abort(403, 'Você não está autorizado a consultar esta eleição.');
            }

            $election = Election::with(['organ', 'position', 'delegation'])->findOrFail($id);
            $hasVoted = (bool) $voter->has_voted;
            $election->setAttribute('is_authorized_voter', true);
            $election->setAttribute('member_id', $member?->id);
            $election->setAttribute('has_voted', $hasVoted);
            $election->setAttribute('participated', $hasVoted);
            $election->setAttribute('can_vote', $election->status === 'EM_VOTACAO' && ! $hasVoted);

            return ApiResponse::success($election, 'Registo encontrado com sucesso.');
        }

        $query = Election::query()->with($this->requestedRelations($request));

        if ($user && ($user->isCommission() || $user->isFiscal())) {
            $query->whereHas('team', fn ($team) => $team->where('user_id', $user->id));
        }

        return ApiResponse::success($query->findOrFail($id), 'Registo encontrado com sucesso.');
    }

    protected function prepareData(array $data, ?Model $record = null): array
    {
        if (array_key_exists('starts_at', $data)) {
            $data['starts_at'] = $this->normalizeLocalDateTime($data['starts_at']);
        }

        if (array_key_exists('ends_at', $data)) {
            $data['ends_at'] = $this->normalizeLocalDateTime($data['ends_at']);
        }

        if ($record === null) {
            $data['created_by'] = request()->user()?->id;
            $data['status'] = 'PROGRAMADA';
        }

        return $data;
    }

    public function updateStatus(ElectionStatusRequest $request, int|string $id): JsonResponse
    {
        $election = Election::findOrFail($id);
        $user = $request->user();

        if ($user && ! $user->isAdmin() && $user->isCommission()) {
            $isTeamMember = ElectionTeam::query()
                ->where('election_id', $election->id)
                ->where('user_id', $user->id)
                ->where('status', 'AUTHORIZED')
                ->exists();

            if (! $isTeamMember) {
                abort(403, 'Você não foi seleccionado para gerir esta eleição.');
            }
        }

        $previousStatus = $election->status;
        $payload = $request->validated();
        if (isset($payload['status'])) {
            $payload['status'] = StatusNormalizer::normalize($payload['status']);
        }

        $election->update($payload);
        $fresh = $election->fresh($this->with);

        AuditService::record($request, $fresh->status === 'CONCLUIDA' ? 'CONCLUIDA' : 'ALTERACAO_DE_ESTADO_DE_ELEICAO', 'Election', $fresh->id, [
            'election_id' => $fresh->id,
            'previous_status' => $previousStatus,
            'status' => $fresh->status,
        ]);

        app(NotificationService::class)->notifyElectionStatus($fresh, $fresh->status);
        event(new EleicaoEstadoActualizado($fresh, $previousStatus));

        return ApiResponse::success($fresh, 'Estado da eleição actualizado com sucesso.');
    }

    public function team(ElectionTeamRequest $request, int|string $id): JsonResponse
    {
        $election = Election::findOrFail($id);
        if ($election->status !== 'PROGRAMADA') {
            return ApiResponse::error('So pode definir equipa em eleicoes programadas.', 422);
        }

        $users = collect($request->validated('users'));
        $currentUser = $request->user();

        if ($currentUser && $users->doesntContain(fn (array $user) => (int) $user['user_id'] === (int) $currentUser->id)) {
            $users->push([
                'user_id' => $currentUser->id,
                'role_in_election' => $currentUser->isFiscal() ? 'FISCAL' : 'COMISSAO',
            ]);
        }

        $selectedIds = $users->pluck('user_id')->map(fn ($value) => (int) $value)->all();
        ElectionTeam::where('election_id', $id)
            ->whereNotIn('user_id', $selectedIds)
            ->update(['status' => 'REMOVED']);

        $team = $users->map(fn (array $user) => ElectionTeam::updateOrCreate(
            ['election_id' => $id, 'user_id' => $user['user_id']],
            [
                'role_in_election' => $user['role_in_election'],
                'status' => 'AUTHORIZED',
            ],
        )->load('user'));
        AuditService::record($request, 'EQUIPA_DE_ELEICAO_ACTUALIZADA', 'Election', $election->id, [
            'election_id' => $election->id,
            'users' => $selectedIds,
        ]);

        return ApiResponse::success([
            'election' => $election->load($this->with),
            'team' => $team,
        ], 'Equipa da eleicao definida com sucesso.', 201);
    }

    public function updateTeamStatus(ElectionTeamStatusRequest $request, int|string $id, int|string $userId): JsonResponse
    {
        $member = ElectionTeam::where('election_id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $member->update($request->validated());
        $action = match ($member->status) {
            'REMOVED' => 'ELIMINADA',
            'SUSPENDED' => 'SUSPENSA',
            default => 'ACTIVADA',
        };

        AuditService::record($request, $action, 'ElectionTeam', $member->id, [
            'election_id' => (int) $id,
            'user_id' => (int) $userId,
            'status' => $member->status,
        ]);

        return ApiResponse::success($member->load('user'), 'Estado do membro da equipa actualizado com sucesso.');
    }

    public function secondRound(int|string $id): JsonResponse
    {
        $election = Election::findOrFail($id);

        $secondRound = $election->replicate([
            'status',
            'round_number',
            'parent_election_id',
            'starts_at',
            'ends_at',
        ]);
        $secondRound->parent_election_id = $election->id;
        $secondRound->round_number = 2;
        $secondRound->status = 'PROGRAMADA';
        $secondRound->starts_at = Carbon::now(config('app.timezone', 'Africa/Maputo'))->addDay()->format('Y-m-d H:i:s');
        $secondRound->ends_at = Carbon::now(config('app.timezone', 'Africa/Maputo'))->addDays(2)->format('Y-m-d H:i:s');
        $secondRound->title = $election->title.' - Segunda volta';
        $secondRound->save();

        return ApiResponse::success($secondRound->load($this->with), 'Segunda volta criada com sucesso.', 201);
    }

    private function normalizeLocalDateTime(mixed $value): string
    {
        $text = trim((string) $value);
        $text = str_replace('T', ' ', $text);

        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $text)) {
            return $text.':00';
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $text)) {
            return $text;
        }

        return Carbon::parse($value, config('app.timezone', 'Africa/Maputo'))->format('Y-m-d H:i:s');
    }

    private function ensureNoOpenElectionConflict(array $data, ?int $ignoreElectionId = null): void
    {
        $query = Election::query()
            ->where('organ_id', $data['organ_id'] ?? null)
            ->where('position_id', $data['position_id'] ?? null)
            ->where('delegation_id', $data['delegation_id'] ?? null)
            ->whereNotIn('status', ['CONCLUIDA', 'RESULTADOS_PUBLICADOS']);

        if ($ignoreElectionId) {
            $query->where('id', '!=', $ignoreElectionId);
        }

        if ($query->exists()) {
            abort(ApiResponse::error('Já existe uma eleição aberta para o mesmo órgão, cargo e delegação.', 422));
        }
    }

    private function validateDependenciesAreActive(array $data): void
    {
        if (! Organ::where('id', $data['organ_id'] ?? null)->where('status', 'ACTIVE')->exists()) {
            abort(ApiResponse::error('O órgão seleccionado está inactivo.', 422));
        }
        if (! Position::where('id', $data['position_id'] ?? null)->where('status', 'ACTIVE')->exists()) {
            abort(ApiResponse::error('O cargo seleccionado está inactivo.', 422));
        }
        if (array_key_exists('delegation_id', $data) && $data['delegation_id'] !== null) {
            if (! Delegation::where('id', $data['delegation_id'])->where('status', 'ACTIVE')->exists()) {
                abort(ApiResponse::error('A delegação seleccionada está inactiva.', 422));
            }
        }
    }
}
