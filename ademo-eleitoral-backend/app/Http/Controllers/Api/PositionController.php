<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\PositionRequest;
use App\Models\Position;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PositionController extends CrudController
{
    protected string $model = Position::class;

    protected ?string $requestClass = PositionRequest::class;

    protected array $with = ['organ'];

    protected array $searchable = ['name', 'description'];

    public function destroy(Request $request, int|string $id): JsonResponse
    {
        $position = Position::findOrFail($id);
        $position->update(['status' => 'INACTIVE']);
        AuditService::modelAction($request, 'HIDE', $position, ['status' => 'INACTIVE']);

        return ApiResponse::success($position->load('organ'), 'Cargo eliminado com sucesso.');
    }
}
