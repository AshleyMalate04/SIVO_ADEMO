<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\UserRequest;
use App\Http\Requests\Api\UserStatusRequest;
use App\Models\User;
use App\Services\AccessNotificationService;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends CrudController
{
    protected string $model = User::class;

    protected ?string $requestClass = UserRequest::class;

    protected array $with = ['delegation'];

    protected array $searchable = ['name', 'access_code', 'email', 'phone'];

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with($this->requestedRelations($request));

        if (! $request->user()?->isAdmin()) {
            $query->whereIn('role', ['COMISSAO', 'COMMISSION', 'FISCAL']);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function ($query) use ($term): void {
                $query->where('name', 'like', $term)
                    ->orWhere('access_code', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('phone', 'like', $term);
            });
        }

        $sortBy = $request->string('sort_by', 'id')->toString();
        $sortDirection = $request->string('sort_direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $perPage = min((int) $request->integer('per_page', 15), 100);

        return ApiResponse::success($query->orderBy($sortBy, $sortDirection)->paginate($perPage), 'Registos listados com sucesso.');
    }

    protected function prepareData(array $data, ?Model $record = null): array
    {
        if ($record === null) {
            $data['password'] = $data['password'] ?? AccessNotificationService::DEFAULT_PASSWORD;
            $data['status'] = $data['status'] ?? 'ACTIVE';
        }

        return $data;
    }

    public function store(Request $request): JsonResponse
    {
        $response = parent::store($request);
        $payload = $response->getData(true);
        $userId = $payload['data']['id'] ?? null;

        if ($userId) {
            $user = User::find($userId);
            if ($user) {
                $emailSent = AccessNotificationService::notifyInitialAccess($user);
                AuditService::record($request, 'CREDENCIAIS_INICIAIS_ENVIADAS', 'User', $user->id, [
                    'email_sent' => $emailSent,
                    'email_available' => (bool) $user->email,
                    'access_code' => $user->access_code,
                    'role' => $user->role,
                ]);
            }
        }

        return $response;
    }

    public function updateStatus(UserStatusRequest $request, int|string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update($request->validated());
        $action = match ($user->status) {
            'ACTIVE' => 'ACTIVADA',
            'INACTIVE' => 'ELIMINADA',
            'SUSPENDED', 'BLOCKED' => 'SUSPENSA',
            default => 'UTILIZADOR_ACTUALIZADO',
        };

        AuditService::modelAction($request, $action, $user, [
            'status' => $user->status,
        ]);

        return ApiResponse::success($user->load('delegation'), 'Estado do utilizador actualizado com sucesso.');
    }
}
