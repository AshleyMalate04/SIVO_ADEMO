<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\OrganRequest;
use App\Http\Requests\Api\PositionRequest;
use App\Models\Organ;
use App\Models\Position;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $organ = Organ::findOrFail($id);
        $organ->update(['status' => 'INACTIVE']);
        Position::where('organ_id', $id)->update(['status' => 'INACTIVE']);
        AuditService::modelAction($request, 'HIDE', $organ, ['status' => 'INACTIVE']);

        return ApiResponse::success($organ->load('positions'), 'Orgao eliminado com sucesso.');
    }
}
