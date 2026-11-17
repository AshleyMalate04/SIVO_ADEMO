<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\DelegationRequest;
use App\Models\Delegation;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DelegationController extends CrudController
{
    protected string $model = Delegation::class;

    protected ?string $requestClass = DelegationRequest::class;

    protected array $with = ['province', 'district'];

    protected array $searchable = ['name', 'address'];

    public function update(Request $request, int|string $id): JsonResponse
    {
        $delegation = Delegation::findOrFail($id);
        $isStatusActivation = $request->input('status') === 'ACTIVE' && count($request->all()) === 1;

        if ($delegation->status !== 'ACTIVE' && ! $isStatusActivation) {
            return ApiResponse::error('Nao e possivel editar uma delegacao desactivada.', 422);
        }

        return parent::update($request, $id);
    }

}
