<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Support\ApiResponse;
use App\Support\StatusNormalizer;
use Illuminate\Database\QueryException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

abstract class CrudController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    /** @var array<int, string> */
    protected array $with = [];

    /** @var array<int, string> */
    protected array $searchable = [];

    /** @var class-string<FormRequest>|null */
    protected ?string $requestClass = null;

    /**
     * @var array<string, array<int, string>>
     */
    private static array $tableColumns = [];

    public function index(Request $request): JsonResponse
    {
        $query = $this->model::query();

        $relations = $this->requestedRelations($request);
        if ($relations !== []) {
            $query->with($relations);
        }

        if (Schema::hasColumn((new $this->model)->getTable(), 'status')) {
            if ($request->filled('status')) {
                $query->where('status', StatusNormalizer::normalize($request->string('status')->toString()));
            } elseif (! $request->boolean('show_inactive')) {
                $query->where('status', '!=', 'INACTIVE');
            }
        }

        if ($request->filled('q') && $this->searchable !== []) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function ($query) use ($term): void {
                foreach ($this->searchable as $column) {
                    $query->orWhere($column, 'like', $term);
                }
            });
        }

        $sortBy = $this->safeSortColumn($request->string('sort_by', 'id')->toString());
        $sortDirection = $request->string('sort_direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDirection);

        $perPage = min((int) $request->integer('per_page', 15), 100);

        return ApiResponse::success($query->paginate($perPage), 'Registos listados com sucesso.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->prepareData($this->validated($request));
        $record = $this->model::create($data);
        AuditService::modelAction($request, $this->auditAction('CREATE', $record), $record, $this->auditDetailsForCreate($record));

        return ApiResponse::success($record->load($this->with), 'Registo criado com sucesso.', 201);
    }

    public function show(Request $request, int|string $id): JsonResponse
    {
        $record = $this->model::query()
            ->with($this->requestedRelations($request))
            ->findOrFail($id);

        return ApiResponse::success($record, 'Registo encontrado com sucesso.');
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $record = $this->model::findOrFail($id);
        $data = $this->prepareData($this->validated($request), $record);

        $record->update($data);
        AuditService::modelAction($request, $this->auditAction('UPDATE', $record), $record, $this->auditDetailsForUpdate($record, $data));

        return ApiResponse::success($record->fresh($this->with), 'Registo actualizado com sucesso.');
    }

    public function destroy(Request $request, int|string $id): JsonResponse
    {
        $record = $this->model::findOrFail($id);

        try {
            DB::transaction(function () use ($request, $record): void {
                AuditService::modelAction($request, $this->auditAction('DELETE', $record), $record, $this->auditDetailsForDelete($record));
                $record->delete();
            });
        } catch (QueryException) {
            return ApiResponse::error(
                'Nao e possivel eliminar este registo porque existem dados associados. Remova primeiro as dependencias ou suspenda o registo.',
                422,
            );
        }

        return ApiResponse::success(null, 'Registo eliminado com sucesso.');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function prepareData(array $data, ?Model $record = null): array
    {
        return $data;
    }

    /**
     * @return array<int, string>
     */
    protected function requestedRelations(Request $request): array
    {
        if (! $request->filled('include')) {
            return $this->with;
        }

        $requested = array_map('trim', explode(',', $request->string('include')->toString()));

        return array_values(array_intersect($requested, $this->with));
    }

    protected function ensureBlankVoteRules(bool $isBlank, mixed $candidateId): void
    {
        if (($isBlank && $candidateId !== null) || (! $isBlank && $candidateId === null)) {
            throw ValidationException::withMessages([
                'candidate_id' => 'candidate_id deve ser nulo apenas quando is_blank for true.',
            ]);
        }
    }

    protected function auditAction(string $action, Model $record): string
    {
        $entity = class_basename($record);

        if ($action === 'DELETE') {
            return 'ELIMINADO';
        }

        return match ([$action, $entity]) {
            ['CREATE', 'Member'] => 'REGISTO_DE_MEMBRO',
            ['CREATE', 'Election'] => 'CRIACAO_DE_ELEICAO',
            ['CREATE', 'Candidate'] => 'SELECCAO_DE_CANDIDATO',
            default => $action,
        };
    }

    /**
     * @return array<string, mixed>
     */
    protected function auditDetailsForCreate(Model $record): array
    {
        return [
            'record_name' => $this->recordDisplayName($record),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function auditDetailsForUpdate(Model $record, array $data): array
    {
        return [
            'record_name' => $this->recordDisplayName($record),
            'fields' => array_keys($data),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function auditDetailsForDelete(Model $record): array
    {
        return [
            'record_name' => $this->recordDisplayName($record),
            'status' => $record->getAttribute('status'),
            'snapshot' => $record->attributesToArray(),
        ];
    }

    protected function recordDisplayName(Model $record): string
    {
        foreach (['name', 'title', 'member_code', 'access_code', 'email', 'description'] as $attribute) {
            $value = $record->getAttribute($attribute);
            if ($value !== null && $value !== '') {
                return (string) $value;
            }
        }

        return class_basename($record).' #'.$record->getKey();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        if ($this->requestClass === null) {
            return $request->all();
        }

        /** @var FormRequest $formRequest */
        $formRequest = $this->requestClass::createFrom($request);
        $formRequest->setContainer(app());
        $formRequest->setRedirector(app('redirect'));
        $formRequest->setUserResolver($request->getUserResolver());
        $formRequest->setRouteResolver($request->getRouteResolver());
        $formRequest->validateResolved();

        return $formRequest->validated();
    }

    private function safeSortColumn(string $column): string
    {
        $model = new $this->model;
        $table = $model->getTable();

        self::$tableColumns[$table] ??= Schema::getColumnListing($table);

        return in_array($column, self::$tableColumns[$table], true) ? $column : $model->getKeyName();
    }
}
