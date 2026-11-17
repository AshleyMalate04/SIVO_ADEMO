<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\OrganRequest;
use App\Http\Requests\Api\PositionRequest;
use App\Models\Organ;
use App\Models\Position;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganController extends CrudController
{
    protected string $model = Organ::class;

    protected ?string $requestClass = OrganRequest::class;

    protected array $with = ['positions'];

    protected array $searchable = ['name', 'description'];

    public function update(Request $request, int|string $id): JsonResponse
    {
        $organ = Organ::findOrFail($id);
        $isStatusActivation = $request->input('status') === 'ACTIVE' && count($request->all()) === 1;

        if ($organ->status !== 'ACTIVE' && ! $isStatusActivation) {
            return ApiResponse::error('Nao e possivel editar um orgao desactivado.', 422);
        }

        return parent::update($request, $id);
    }

    public function positions(int|string $id): JsonResponse
    {
        $organ = Organ::with(['positions' => fn ($query) => $query->where('status', 'ACTIVE')])->findOrFail($id);

        return ApiResponse::success($organ->positions, 'Cargos listados com sucesso.');
    }

    public function storePosition(PositionRequest $request, int|string $id): JsonResponse
    {
        Organ::findOrFail($id);

        $data = $request->validated();
        $data['organ_id'] = $id;

        return ApiResponse::success(Position::create($data)->load('organ'), 'Cargo criado com sucesso.', 201);
    }

    public function destroy(Request $request, int|string $id): JsonResponse
    {
        $organ = Organ::with('positions')->findOrFail($id);

        try {
            DB::transaction(function () use ($request, $organ): void {
                foreach ($organ->positions as $position) {
                    AuditService::modelAction($request, 'ELIMINADO', $position, [
                        'record_name' => $position->name,
                        'status' => $position->status,
                        'snapshot' => $position->attributesToArray(),
                    ]);
                    $position->delete();
                }

                AuditService::modelAction($request, 'ELIMINADO', $organ, [
                    'record_name' => $organ->name,
                    'status' => $organ->status,
                    'snapshot' => $organ->attributesToArray(),
                ]);
                $organ->delete();
            });
        } catch (QueryException) {
            return ApiResponse::error(
                'Nao e possivel eliminar este orgao porque existem eleicoes, candidatos ou cargos associados.',
                422,
            );
        }

        return ApiResponse::success(null, 'Orgao eliminado com sucesso.');
    }
}
