<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\ProvinceRequest;
use App\Models\Province;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProvinceController extends CrudController
{
    protected string $model = Province::class;

    protected ?string $requestClass = ProvinceRequest::class;

    protected array $with = ['districts', 'delegations'];

    protected array $searchable = ['name', 'code'];

    public function index(Request $request): JsonResponse
    {
        if (! $request->filled('status')) {
            $request->merge(['status' => 'ACTIVE']);
        }

        return parent::index($request);
    }

    public function districts(int|string $id): JsonResponse
    {
        $province = Province::with(['districts' => fn ($query) => $query->where('status', 'ACTIVE')])->findOrFail($id);

        return ApiResponse::success($province->districts, 'Distritos listados com sucesso.');
    }
}
